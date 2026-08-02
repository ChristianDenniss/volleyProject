import { Request, Response, NextFunction } from 'express';
import { AwardService, AwardFilters, AWARD_SORT_FIELDS, AWARD_DEFAULT_SORT } from './award.service.js';
import { CreateAwardDto, CreateMultipleAwardsDto, UpdateAwardDto } from './awards.schema.js';
import { parsePagination, parseSort, toPaginatedResult } from '../../utils/pagination.js';
import { parseRegionQuery } from '../../utils/regionQuery.js';
import { RegionService } from '../regions/region.service.js';

const AWARDS_DEFAULT_LIMIT = 10;

export class AwardController {
    private awardService: AwardService;
    private regionService: RegionService;

    constructor(awardService: AwardService) {
        this.awardService = awardService;
        this.regionService = new RegionService();
    }

    createAward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const awardData: CreateAwardDto = req.body;
            const savedAward = await this.awardService.createAward(awardData);
            res.status(201).json(savedAward);
        } catch (error) {
            next(error);
        }
    };

    createMultipleAwards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const awardsData: CreateMultipleAwardsDto = req.body;
            const savedAwards = await this.awardService.createMultipleAwards(awardsData);
            res.status(201).json(savedAwards);
        } catch (error) {
            next(error);
        }
    };

    getAwards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, AWARDS_DEFAULT_LIMIT);
            const sort = parseSort(req.query, AWARD_SORT_FIELDS, AWARD_DEFAULT_SORT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.awardService.findAllAwards(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getSkinnyAwards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, AWARDS_DEFAULT_LIMIT);
            const sort = parseSort(req.query, AWARD_SORT_FIELDS, AWARD_DEFAULT_SORT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.awardService.findSkinnyAllAwards(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    private async parseFilters(req: Request): Promise<AwardFilters> {
        const { search, seasonNumber, type } = req.query;
        const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
        const regionId = await this.regionService.resolveRegionId(regionFilter);
        return {
            search: typeof search === 'string' && search.length > 0 ? search : undefined,
            seasonNumber: seasonNumber ? Number(seasonNumber) : undefined,
            type: typeof type === 'string' && type.length > 0 ? type : undefined,
            regionId,
        };
    }

    getAwardById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const award = await this.awardService.findAwardById(parseInt(id));
            res.json(award);
        } catch (error) {
            next(error);
        }
    };

    getAwardsByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { type } = req.params;
            const pagination = parsePagination(req.query, AWARDS_DEFAULT_LIMIT);
            const [data, total] = await this.awardService.findAwardsByType(type, pagination);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getAwardsBySeason = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { seasonNumber } = req.params;
            const pagination = parsePagination(req.query, AWARDS_DEFAULT_LIMIT);
            const [data, total] = await this.awardService.findAwardsBySeason(parseInt(seasonNumber), pagination);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    updateAward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const awardData: UpdateAwardDto = req.body;
            const updatedAward = await this.awardService.updateAward(parseInt(id), awardData);
            res.json(updatedAward);
        } catch (error) {
            next(error);
        }
    };

    deleteAward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            await this.awardService.removeAward(parseInt(id));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    createAwardWithPlayerNames = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { description, type, seasonId, playerName, imageUrl } = req.body;

            if (!description || !type || !seasonId || !playerName) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const savedAward = await this.awardService.createAwardWithPlayerNames(
                description,
                type,
                seasonId,
                playerName,
                imageUrl
            );

            res.status(201).json(savedAward);
        } catch (error) {
            next(error);
        }
    };

    getAwardsByPlayerId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const playerId = parseInt(req.params.playerId);

            if (isNaN(playerId)) {
                res.status(400).json({ error: 'Invalid player ID' });
                return;
            }

            const pagination = parsePagination(req.query, AWARDS_DEFAULT_LIMIT);
            const [data, total] = await this.awardService.getAwardsByPlayerId(playerId, pagination);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };
}
