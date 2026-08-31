import { Request, Response, NextFunction } from 'express';
import { StatService, StatFilters } from './stat.service.js';
import { parsePagination, parseSort, toPaginatedResult } from '../../utils/pagination.js';
import { parseRegionQuery } from '../../utils/regionQuery.js';
import { RegionService } from '../regions/region.service.js';
import {
    LEADERBOARD_SORT_FIELDS,
    LEADERBOARD_DEFAULT_SORT,
    LeaderboardStatType,
    LeaderboardView,
    parseLeaderboardFilters,
} from './utils/stat.leaderboard.js';
import { STAGE_ROUND_KEYS, StageRound } from '../games/utils/stageRounds.js';

const STATS_DEFAULT_LIMIT = 25;
const LEADERBOARD_DEFAULT_LIMIT = 25;

export class StatController
{
    private statService: StatService;
    private regionService: RegionService;

    constructor()
    {
        this.statService = new StatService();
        this.regionService = new RegionService();
    }

    createStat = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const savedStat = await this.statService.createStat(req.body);

            res.status(201).json(savedStat);
        }
        catch (error)
        {
            next(error);
        }
    };

    getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const pagination = parsePagination(req.query, STATS_DEFAULT_LIMIT);
            const { search } = req.query;
            const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
            const regionId = await this.regionService.resolveRegionId(regionFilter);
            const filters: StatFilters = {
                search: typeof search === 'string' && search.length > 0 ? search : undefined,
                regionId,
            };
            const [data, total] = await this.statService.getAllStats(pagination, filters);
            res.json(toPaginatedResult(data, total, pagination));
        }
        catch (error)
        {
            next(error);
        }
    };

    getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const pagination = parsePagination(req.query, LEADERBOARD_DEFAULT_LIMIT);
            const sort = parseSort(req.query, LEADERBOARD_SORT_FIELDS, LEADERBOARD_DEFAULT_SORT);

            const viewRaw = typeof req.query.view === 'string' ? req.query.view : 'player';
            const view: LeaderboardView = viewRaw === 'team' ? 'team' : 'player';

            const statTypeRaw = typeof req.query.statType === 'string' ? req.query.statType : 'total';
            const statType: LeaderboardStatType =
                statTypeRaw === 'perGame' || statTypeRaw === 'perSet' ? statTypeRaw : 'total';

            const stageRaw = typeof req.query.stageRound === 'string' ? req.query.stageRound : 'all';
            const stageRound: StageRound = (STAGE_ROUND_KEYS as readonly string[]).includes(stageRaw)
                ? (stageRaw as StageRound)
                : 'all';

            const seasonRaw = req.query.season ?? req.query.seasonNumber;
            const seasonNumber =
                seasonRaw !== undefined && seasonRaw !== '' && Number.isFinite(Number(seasonRaw))
                    ? Number(seasonRaw)
                    : undefined;

            const search =
                typeof req.query.search === 'string' && req.query.search.length > 0
                    ? req.query.search
                    : undefined;

            const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
            const regionId = await this.regionService.resolveRegionId(regionFilter);

            const filters = parseLeaderboardFilters(req.query.filters);

            const [data, total] = await this.statService.getLeaderboard({
                view,
                seasonNumber,
                stageRound,
                statType,
                search,
                regionId,
                sortBy: sort.sortBy,
                sortDir: sort.sortDir,
                filters,
                pagination,
            });

            res.json(toPaginatedResult(data, total, pagination));
        }
        catch (error)
        {
            next(error);
        }
    };

    getStatById = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const { id } = req.params;
            const stat = await this.statService.getStatById(parseInt(id));
            res.json(stat);
        }
        catch (error)
        {
            next(error);
        }
    };

    updateStat = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const { id } = req.params;
            const updatedStat = await this.statService.updateStat(parseInt(id), req.body);

            res.json(updatedStat);
        }
        catch (error)
        {
            next(error);
        }
    };

    deleteStat = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const { id } = req.params;
            await this.statService.deleteStat(parseInt(id));
            res.status(204).send();
        }
        catch (error)
        {
            next(error);
        }
    };

    getStatsByPlayerId = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const { playerId } = req.params;
            const pagination = parsePagination(req.query, STATS_DEFAULT_LIMIT);
            const [data, total] = await this.statService.getStatsByPlayerId(parseInt(playerId), pagination);

            if (data.length === 0)
            {
                res.status(404).json({ message: "No stats found for the specified player" });
                return;
            }

            res.json(toPaginatedResult(data, total, pagination));
        }
        catch (error)
        {
            next(error);
        }
    };

    getStatsByGameId = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const { gameId } = req.params;
            const pagination = parsePagination(req.query, STATS_DEFAULT_LIMIT);
            const [data, total] = await this.statService.getStatsByGameId(parseInt(gameId), pagination);

            if (data.length === 0)
            {
                res.status(404).json({ message: "No stats found for the specified game" });
                return;
            }

            res.json(toPaginatedResult(data, total, pagination));
        }
        catch (error)
        {
            next(error);
        }
    };

    createStatByName = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const savedStat = await this.statService.createStatByUsername(req.body);

            res.status(201).json(savedStat);
        }
        catch (error)
        {
            next(error);
        }
    };

    batchUploadFromCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { gameData, statsData } = req.body;

            if (!gameData || !statsData) {
                res.status(400).json({
                    error: "Missing required fields: gameData and statsData are required"
                });
                return;
            }

            const result = await this.statService.batchUploadFromCSV(gameData, statsData);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    };

    addStatsToExistingGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { gameId, statsData } = req.body;

            if (!gameId || !statsData) {
                res.status(400).json({
                    error: "Missing required fields: gameId and statsData are required"
                });
                return;
            }

            const result = await this.statService.addStatsToExistingGame(gameId, statsData);
            res.status(201).json({ stats: result });
        } catch (error) {
            next(error);
        }
    };
}
