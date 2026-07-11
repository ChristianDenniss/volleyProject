import { Repository, FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../../db/data-source.js";
import { Seasons } from "./season.entity.js";
import { MissingFieldError } from "../../errors/MissingFieldError.js";
import { DuplicateError } from "../../errors/DuplicateError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { DateError } from "../../errors/DateErrors.js";
import { OutOfBoundsError } from "../../errors/OutOfBoundsError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { PaginationParams } from "../../utils/pagination.js";
import { RegionService } from "../regions/region.service.js";
import { RegionCode } from "../regions/region.entity.js";

export interface SeasonFilters {
    regionId?: number;
}

export class SeasonService
{
    private seasonRepository: Repository<Seasons>;
    private regionService: RegionService;

    constructor()
    {
        this.seasonRepository = AppDataSource.getRepository(Seasons);
        this.regionService = new RegionService();
    }

    private buildWhere(filters: SeasonFilters): FindOptionsWhere<Seasons> {
        const where: FindOptionsWhere<Seasons> = {};
        if (filters.regionId) where.regionId = filters.regionId;
        return where;
    }

    private async resolveRegionId(regionId?: number, regionCode?: RegionCode): Promise<number> {
        if (regionId) {
            const region = await this.regionService.getRegionById(regionId);
            if (!region) throw new NotFoundError(`Region with ID ${regionId} not found`);
            return region.id;
        }
        if (regionCode) {
            const region = await this.regionService.requireRegionByCode(regionCode);
            return region.id;
        }
        const na = await this.regionService.requireRegionByCode('na');
        return na.id;
    }

    async createSeason(
        seasonNumber: number,
        startDate: Date,
        endDate: Date,
        theme: string,
        image?: string,
        regionId?: number,
        regionCode?: RegionCode
    ): Promise<Seasons>
    {
        if (!seasonNumber)   throw new MissingFieldError("Season name");
        if (!startDate)      throw new MissingFieldError("Start date");
        if (!endDate)        throw new MissingFieldError("End date");
        if (!theme)          throw new MissingFieldError("Theme");

        const resolvedRegionId = await this.resolveRegionId(regionId, regionCode);

        const existingSeason = await this.seasonRepository.findOne({
            where: { seasonNumber, regionId: resolvedRegionId }
        });

        if (existingSeason)
        {
            throw new DuplicateError(`Season ${seasonNumber} already exists in this region`);
        }

        const newSeason        = new Seasons();
        newSeason.seasonNumber = seasonNumber;
        newSeason.startDate    = startDate;
        newSeason.endDate      = endDate;
        newSeason.theme        = theme;
        newSeason.regionId     = resolvedRegionId;
        if (image !== undefined)
        {
            newSeason.image = image;
        }

        return this.seasonRepository.save(newSeason);
    }

    async getAllSeasons(pagination: PaginationParams, filters: SeasonFilters = {}): Promise<[Seasons[], number]>
    {
        try {
            console.log('Fetching all seasons...');
            const result = await this.seasonRepository.findAndCount({
                where: this.buildWhere(filters),
                relations: ["teams", "games", "awards", "region"],
                order: { seasonNumber: "DESC" },
                skip: pagination.skip,
                take: pagination.take
            });
            console.log(`Found ${result[1]} seasons`);
            return result;
        } catch (error) {
            console.error('Error in getAllSeasons:', {
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                } : error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async getSkinnyAllSeasons(pagination: PaginationParams, filters: SeasonFilters = {}): Promise<[Seasons[], number]>
    {
        try {
            console.log('Fetching all seasons without relations...');
            const result = await this.seasonRepository.findAndCount({
                where: this.buildWhere(filters),
                relations: ["region"],
                order: { seasonNumber: "DESC" },
                skip: pagination.skip,
                take: pagination.take
            });
            console.log(`Found ${result[1]} seasons`);
            return result;
        } catch (error) {
            console.error('Error in getSkinnyAllSeasons:', {
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                } : error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async getMediumAllSeasons(pagination: PaginationParams, filters: SeasonFilters = {}): Promise<[Seasons[], number]>
    {
        try {
            console.log('Fetching all seasons with medium relations...');
            const result = await this.seasonRepository.findAndCount({
                where: this.buildWhere(filters),
                relations: ["teams", "games", "region"],
                order: { seasonNumber: "DESC" },
                skip: pagination.skip,
                take: pagination.take
            });
            console.log(`Found ${result[1]} seasons`);
            return result;
        } catch (error) {
            console.error('Error in getMediumAllSeasons:', {
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                } : error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async getSeasonById(id: number): Promise<Seasons>
    {
        if (!id) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games", "teams.players", "region"]
        });

        if (!season) throw new NotFoundError(`Season with ID ${id} not found`);

        return season;
    }

    async updateSeason(
        id: number,
        seasonNumber?: number,
        startDate?: Date,
        endDate?: Date,
        theme?: string,
        image?: string
    ): Promise<Seasons>
    {
        if (!id) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"]
        });

        if (!season) throw new NotFoundError(`Season with ID: ${id} not found`);

        if (seasonNumber !== undefined)
        {
            season.seasonNumber = seasonNumber;

            if (seasonNumber < 1 || seasonNumber > 100)
            {
                throw new OutOfBoundsError(
                    `${seasonNumber} is out of bounds (less than 1 or greater than 100)`
                );
            }
        }

        if (startDate !== undefined)
        {
            season.startDate = startDate;
        }

        if (endDate !== undefined)
        {
            season.endDate = endDate;
        }

        if (theme !== undefined)
        {
            if (!theme) throw new MissingFieldError("Theme");
            season.theme = theme;
        }

        if (image !== undefined)
        {
            season.image = image;
        }

        if (season.startDate && season.endDate && season.startDate > season.endDate)
        {
            throw new DateError(season.startDate, season.endDate);
        }

        return this.seasonRepository.save(season);
    }

    async deleteSeason(id: number): Promise<void>
    {
        if (!id) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"]
        });

        if (!season) throw new NotFoundError(`Season with ID ${id} not found`);

        if (
            (season.teams && season.teams.length > 0) ||
            (season.games && season.games.length > 0)
        )
        {
            throw new ConflictError("Cannot delete season with associated teams or games");
        }

        await this.seasonRepository.remove(season);
    }
}

