import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Region, RegionCode } from './region.entity.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

export interface RegionFilterInput {
    regionId?: number;
    region?: string;
}

export class RegionService {
    private regionRepository: Repository<Region>;
    private cacheByCode: Map<string, Region> | null = null;
    private cacheById: Map<number, Region> | null = null;

    constructor() {
        this.regionRepository = AppDataSource.getRepository(Region);
    }

    private async ensureCache(): Promise<void> {
        if (this.cacheByCode && this.cacheById) return;
        const regions = await this.regionRepository.find({ order: { sortOrder: 'ASC' } });
        this.cacheByCode = new Map(regions.map(r => [r.code, r]));
        this.cacheById = new Map(regions.map(r => [r.id, r]));
    }

    async getAllRegions(): Promise<Region[]> {
        await this.ensureCache();
        return Array.from(this.cacheByCode!.values());
    }

    async getRegionByCode(code: string): Promise<Region | null> {
        await this.ensureCache();
        return this.cacheByCode!.get(code.toLowerCase()) ?? null;
    }

    async getRegionById(id: number): Promise<Region | null> {
        await this.ensureCache();
        return this.cacheById!.get(id) ?? null;
    }

    async resolveRegionId(filter: RegionFilterInput): Promise<number | undefined> {
        if (filter.regionId) {
            const region = await this.getRegionById(filter.regionId);
            if (!region) throw new NotFoundError(`Region with ID ${filter.regionId} not found`);
            return region.id;
        }
        if (filter.region) {
            const region = await this.getRegionByCode(filter.region);
            if (!region) throw new NotFoundError(`Region with code "${filter.region}" not found`);
            return region.id;
        }
        return undefined;
    }

    async requireRegionByCode(code: RegionCode): Promise<Region> {
        const region = await this.getRegionByCode(code);
        if (!region) throw new NotFoundError(`Region with code "${code}" not found`);
        return region;
    }

    invalidateCache(): void {
        this.cacheByCode = null;
        this.cacheById = null;
    }
}
