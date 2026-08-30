import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { RegionService } from '../region.service.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';

const NA = { id: 1, code: 'na', name: 'North America', sortOrder: 1 } as any;
const EU = { id: 2, code: 'eu', name: 'Europe', sortOrder: 2 } as any;

const mockRegionRepository = {
    find: jest.fn(),
};

describe('RegionService', () => {
    let regionService: RegionService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRegionRepository.find.mockResolvedValue([NA, EU] as never);

        regionService = new RegionService();
        (regionService as any).regionRepository = mockRegionRepository;
    });

    describe('caching', () => {
        it('reads the table once and serves later lookups from memory', async () => {
            await regionService.getAllRegions();
            await regionService.getRegionByCode('na');
            await regionService.getRegionById(2);

            expect(mockRegionRepository.find).toHaveBeenCalledTimes(1);
        });

        it('reloads after the cache is invalidated', async () => {
            await regionService.getAllRegions();
            regionService.invalidateCache();
            await regionService.getAllRegions();

            expect(mockRegionRepository.find).toHaveBeenCalledTimes(2);
        });

        it('loads regions in their configured sort order', async () => {
            await regionService.getAllRegions();

            expect(mockRegionRepository.find).toHaveBeenCalledWith({ order: { sortOrder: 'ASC' } });
        });
    });

    describe('getAllRegions', () => {
        it('returns every region', async () => {
            await expect(regionService.getAllRegions()).resolves.toEqual([NA, EU]);
        });

        it('returns an empty list when the table is empty', async () => {
            mockRegionRepository.find.mockResolvedValueOnce([] as never);

            await expect(regionService.getAllRegions()).resolves.toEqual([]);
        });
    });

    describe('getRegionByCode', () => {
        it('finds a region by its code', async () => {
            await expect(regionService.getRegionByCode('eu')).resolves.toBe(EU);
        });

        it('is case-insensitive', async () => {
            await expect(regionService.getRegionByCode('EU')).resolves.toBe(EU);
        });

        it('returns null for an unknown code', async () => {
            await expect(regionService.getRegionByCode('zz')).resolves.toBeNull();
        });
    });

    describe('getRegionById', () => {
        it('finds a region by its id', async () => {
            await expect(regionService.getRegionById(1)).resolves.toBe(NA);
        });

        it('returns null for an unknown id', async () => {
            await expect(regionService.getRegionById(99)).resolves.toBeNull();
        });
    });

    describe('resolveRegionId', () => {
        it('returns undefined when the filter names no region', async () => {
            await expect(regionService.resolveRegionId({})).resolves.toBeUndefined();
        });

        it('resolves an explicit id', async () => {
            await expect(regionService.resolveRegionId({ regionId: 2 })).resolves.toBe(2);
        });

        it('prefers the id when both id and code are given', async () => {
            await expect(regionService.resolveRegionId({ regionId: 1, region: 'eu' })).resolves.toBe(1);
        });

        it('resolves a code', async () => {
            await expect(regionService.resolveRegionId({ region: 'eu' })).resolves.toBe(2);
        });

        it('throws NotFoundError for an unknown id', async () => {
            await expect(regionService.resolveRegionId({ regionId: 99 })).rejects.toThrow(NotFoundError);
        });

        it('throws NotFoundError for an unknown code', async () => {
            await expect(regionService.resolveRegionId({ region: 'zz' })).rejects.toThrow(NotFoundError);
        });
    });

    describe('requireRegionByCode', () => {
        it('returns the region', async () => {
            await expect(regionService.requireRegionByCode('na' as any)).resolves.toBe(NA);
        });

        it('throws NotFoundError rather than returning null', async () => {
            await expect(regionService.requireRegionByCode('zz' as any)).rejects.toThrow(
                'Region with code "zz" not found'
            );
        });
    });
});
