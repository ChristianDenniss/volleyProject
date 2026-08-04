import { Request, Response, NextFunction } from "express";
import { SeasonService, SeasonFilters } from "./season.service.js";
import { parsePagination, toPaginatedResult } from "../../utils/pagination.js";
import { parseRegionQuery } from "../../utils/regionQuery.js";
import { RegionService } from "../regions/region.service.js";
import { RegionCode } from "../regions/region.entity.js";

const SEASONS_DEFAULT_LIMIT = 10;

export class SeasonController
{
    private seasonService: SeasonService;
    private regionService: RegionService;

    constructor()
    {
        this.seasonService = new SeasonService();
        this.regionService = new RegionService();
    }

    createSeason = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const {
                seasonNumber,
                startDate,
                endDate,
                theme,
                image,
                regionId,
                region,
            } = req.body;

            const savedSeason = await this.seasonService.createSeason(
                seasonNumber,
                new Date(startDate),
                new Date(endDate),
                theme,
                image,
                regionId,
                region as RegionCode | undefined
            );

            res.status(201).json(savedSeason);
        }
        catch (error)
        {
            next(error);
        }
    };

    getAllSeasons = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const pagination = parsePagination(req.query, SEASONS_DEFAULT_LIMIT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.seasonService.getAllSeasons(pagination, filters);
            res.status(200).json(toPaginatedResult(data, total, pagination));
        }
        catch (error)
        {
            next(error);
        }
    };

    getSkinnyAllSeasons = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const pagination = parsePagination(req.query, SEASONS_DEFAULT_LIMIT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.seasonService.getSkinnyAllSeasons(pagination, filters);
            res.status(200).json(toPaginatedResult(data, total, pagination));
        }
        catch (error)
        {
            next(error);
        }
    };

    getMediumAllSeasons = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const pagination = parsePagination(req.query, SEASONS_DEFAULT_LIMIT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.seasonService.getMediumAllSeasons(pagination, filters);
            res.status(200).json(toPaginatedResult(data, total, pagination));
        }
        catch (error)
        {
            next(error);
        }
    };

    getSeasonById = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const id      = Number(req.params.id);
            const season  = await this.seasonService.getSeasonById(id);
            res.status(200).json(season);
        }
        catch (error)
        {
            next(error);
        }
    };

    updateSeason = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const id = Number(req.params.id);
            const {
                seasonNumber,
                startDate,
                endDate,
                theme,
                image,
                registrationsOpen,
                captainEditEnabled,
                maxTeams,
            } = req.body;

            const updated = await this.seasonService.updateSeason(
                id,
                seasonNumber,
                startDate ? new Date(startDate) : undefined,
                endDate   ? new Date(endDate)   : undefined,
                theme,
                image,
                registrationsOpen,
                captainEditEnabled,
                maxTeams
            );

            res.status(200).json(updated);
        }
        catch (error)
        {
            next(error);
        }
    };

    deleteSeason = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const id = Number(req.params.id);
            await this.seasonService.deleteSeason(id);
            res.status(204).send();
        }
        catch (error)
        {
            next(error);
        }
    };

    private async parseFilters(req: Request): Promise<SeasonFilters> {
        const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
        const regionId = await this.regionService.resolveRegionId(regionFilter);
        return { regionId };
    }
}
