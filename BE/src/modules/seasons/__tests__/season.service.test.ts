import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SeasonService } from '../season.service.js';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { DuplicateError } from '../../../errors/DuplicateError.js';
import { ConflictError } from '../../../errors/ConflictError.js';
import { OutOfBoundsError } from '../../../errors/OutOfBoundsError.js';
import { DateError } from '../../../errors/DateErrors.js';

const mockSeasonRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
};

const mockRegionService = {
    getRegionById: jest.fn(),
    getRegionByCode: jest.fn(),
    requireRegionByCode: jest.fn(),
};

const START = new Date('2025-01-01T00:00:00Z');
const END = new Date('2025-06-01T00:00:00Z');
const PAGINATION = { page: 1, limit: 10, skip: 0, take: 10 };

function season(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        seasonNumber: 5,
        startDate: START,
        endDate: END,
        theme: 'Neon',
        regionId: 1,
        teams: [],
        games: [],
        ...overrides,
    } as any;
}

describe('SeasonService', () => {
    let seasonService: SeasonService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSeasonRepository.save.mockImplementation(async (entity: any) => entity);
        mockRegionService.requireRegionByCode.mockResolvedValue({ id: 1, code: 'na' } as never);

        seasonService = new SeasonService();
        (seasonService as any).seasonRepository = mockSeasonRepository;
        (seasonService as any).regionService = mockRegionService;

        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('createSeason', () => {
        it('throws MissingFieldError without a season number', async () => {
            await expect(seasonService.createSeason(0, START, END, 'Neon')).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without a start date', async () => {
            await expect(seasonService.createSeason(5, undefined as any, END, 'Neon')).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without an end date', async () => {
            await expect(seasonService.createSeason(5, START, undefined as any, 'Neon')).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without a theme', async () => {
            await expect(seasonService.createSeason(5, START, END, '')).rejects.toThrow(MissingFieldError);
        });

        it('defaults to the NA region', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            const created = await seasonService.createSeason(5, START, END, 'Neon');

            expect(mockRegionService.requireRegionByCode).toHaveBeenCalledWith('na');
            expect(created.regionId).toBe(1);
        });

        it('resolves an explicit region id', async () => {
            mockRegionService.getRegionById.mockResolvedValueOnce({ id: 3 } as never);
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            const created = await seasonService.createSeason(5, START, END, 'Neon', undefined, 3);

            expect(created.regionId).toBe(3);
        });

        it('throws NotFoundError for an unknown region id', async () => {
            mockRegionService.getRegionById.mockResolvedValueOnce(null as never);

            await expect(seasonService.createSeason(5, START, END, 'Neon', undefined, 99)).rejects.toThrow(NotFoundError);
        });

        it('resolves a region code when no id is given', async () => {
            mockRegionService.requireRegionByCode.mockResolvedValueOnce({ id: 4, code: 'eu' } as never);
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            const created = await seasonService.createSeason(5, START, END, 'Neon', undefined, undefined, 'eu' as any);

            expect(created.regionId).toBe(4);
        });

        it('throws DuplicateError when that season number already exists in the region', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);

            await expect(seasonService.createSeason(5, START, END, 'Neon')).rejects.toThrow(DuplicateError);
        });

        it('scopes the duplicate check to the resolved region', async () => {
            mockRegionService.getRegionById.mockResolvedValueOnce({ id: 3 } as never);
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            await seasonService.createSeason(5, START, END, 'Neon', undefined, 3);

            expect(mockSeasonRepository.findOne).toHaveBeenCalledWith({
                where: { seasonNumber: 5, regionId: 3 },
            });
        });

        it('stores an image when one is supplied', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            const created = await seasonService.createSeason(5, START, END, 'Neon', 'banner.png');

            expect(created.image).toBe('banner.png');
        });

        it('leaves the image unset when none is supplied', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            const created = await seasonService.createSeason(5, START, END, 'Neon');

            expect(created.image).toBeUndefined();
        });
    });

    describe('getAllSeasons', () => {
        it('returns the newest season first', async () => {
            mockSeasonRepository.findAndCount.mockResolvedValueOnce([[season()], 1] as never);

            await seasonService.getAllSeasons(PAGINATION);

            expect(mockSeasonRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ order: { seasonNumber: 'DESC' } })
            );
        });

        it('filters by region when asked', async () => {
            mockSeasonRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await seasonService.getAllSeasons(PAGINATION, { regionId: 2 });

            expect(mockSeasonRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ where: { regionId: 2 } })
            );
        });

        it('applies no filter when none is given', async () => {
            mockSeasonRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await seasonService.getAllSeasons(PAGINATION);

            expect(mockSeasonRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
        });

        it('rethrows a repository failure', async () => {
            mockSeasonRepository.findAndCount.mockRejectedValueOnce(new Error('db down') as never);

            await expect(seasonService.getAllSeasons(PAGINATION)).rejects.toThrow('db down');
        });
    });

    describe('getSeasonById', () => {
        it('throws MissingFieldError without an id', async () => {
            await expect(seasonService.getSeasonById(0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the season does not exist', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(seasonService.getSeasonById(999)).rejects.toThrow('Season with ID 999 not found');
        });

        it('returns the season', async () => {
            const found = season();
            mockSeasonRepository.findOne.mockResolvedValueOnce(found as never);

            await expect(seasonService.getSeasonById(1)).resolves.toBe(found);
        });
    });

    describe('updateSeason', () => {
        it('throws MissingFieldError without an id', async () => {
            await expect(seasonService.updateSeason(0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError for an unknown season', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(seasonService.updateSeason(999, 6)).rejects.toThrow(NotFoundError);
        });

        it('rejects a season number above 100', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);

            await expect(seasonService.updateSeason(1, 101)).rejects.toThrow(OutOfBoundsError);
        });

        it('rejects a negative season number', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);

            await expect(seasonService.updateSeason(1, -1)).rejects.toThrow(OutOfBoundsError);
        });

        it('accepts the boundary season numbers', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);

            await expect(seasonService.updateSeason(1, 100)).resolves.toMatchObject({ seasonNumber: 100 });
        });

        it('rejects an empty theme', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);

            await expect(seasonService.updateSeason(1, undefined, undefined, undefined, '')).rejects.toThrow(
                MissingFieldError
            );
        });

        it('throws DateError when the start date would fall after the end date', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);

            await expect(
                seasonService.updateSeason(1, undefined, new Date('2025-12-01T00:00:00Z'))
            ).rejects.toThrow(DateError);
        });

        it('accepts a start date that still precedes the end date', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);

            const updated = await seasonService.updateSeason(1, undefined, new Date('2025-02-01T00:00:00Z'));

            expect(updated.startDate).toEqual(new Date('2025-02-01T00:00:00Z'));
        });

        it('toggles the registration and captain-edit flags', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(
                season({ registrationsOpen: false, captainEditEnabled: false }) as never
            );

            const updated = await seasonService.updateSeason(
                1, undefined, undefined, undefined, undefined, undefined, true, true
            );

            expect(updated.registrationsOpen).toBe(true);
            expect(updated.captainEditEnabled).toBe(true);
        });

        it('can clear the team cap by passing null', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season({ maxTeams: 16 }) as never);

            const updated = await seasonService.updateSeason(
                1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, null
            );

            expect(updated.maxTeams).toBeNull();
        });

        it('leaves untouched fields as they were', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season({ theme: 'Neon', image: 'a.png' }) as never);

            const updated = await seasonService.updateSeason(1, 6);

            expect(updated.theme).toBe('Neon');
            expect(updated.image).toBe('a.png');
        });
    });

    describe('deleteSeason', () => {
        it('throws MissingFieldError without an id', async () => {
            await expect(seasonService.deleteSeason(0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError for an unknown season', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(seasonService.deleteSeason(999)).rejects.toThrow(NotFoundError);
        });

        it('refuses to delete a season that still has teams', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season({ teams: [{ id: 1 }] }) as never);

            await expect(seasonService.deleteSeason(1)).rejects.toThrow(ConflictError);
            expect(mockSeasonRepository.remove).not.toHaveBeenCalled();
        });

        it('refuses to delete a season that still has games', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season({ games: [{ id: 1 }] }) as never);

            await expect(seasonService.deleteSeason(1)).rejects.toThrow(ConflictError);
        });

        it('deletes an empty season', async () => {
            const existing = season();
            mockSeasonRepository.findOne.mockResolvedValueOnce(existing as never);

            await seasonService.deleteSeason(1);

            expect(mockSeasonRepository.remove).toHaveBeenCalledWith(existing);
        });
    });
});
