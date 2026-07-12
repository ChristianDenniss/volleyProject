import { Request, Response } from 'express';
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
} from './stat.leaderboard.js';
import { STAGE_ROUND_KEYS, StageRound } from '../games/stageRounds.js';

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

    // Create a new stat entry
    createStat = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            // pull all stats fields plus new ones
            const
            {
                spikingErrors,
                apeKills,
                apeAttempts,
                spikeKills,
                spikeAttempts,
                assists,

                // new: setting errors
                settingErrors,

                blocks,
                digs,
                blockFollows,
                aces,

                // new: serving errors
                servingErrors,

                miscErrors,
                playerId,
                gameId
            } = req.body;

            // call service with new params in correct order
            const savedStat = await this.statService.createStat(
                spikingErrors,
                apeKills,
                apeAttempts,
                spikeKills,
                spikeAttempts,
                assists,

                // new
                settingErrors,

                blocks,
                digs,
                blockFollows,
                aces,

                // new
                servingErrors,

                miscErrors,
                playerId,
                gameId
            );
            
            res.status(201).json(savedStat);
        }
        catch (error)
        {
            const errorMessage = error instanceof Error ? error.message : "Failed to create stat";
            
            if (
                errorMessage.includes("required") ||
                errorMessage.includes("not found") ||
                errorMessage.includes("cannot be negative") ||
                errorMessage.includes("already exist") ||
                errorMessage.includes("not part of")
            ) {
                res.status(400).json({ error: errorMessage });
            }
            else
            {
                console.error("Error creating stat:", error);
                res.status(500).json({ error: "Failed to create stat" });
            }
        }
    };

    // Get all stats
    getStats = async (req: Request, res: Response): Promise<void> =>
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
            console.error("Error fetching stats:", error);
            res.status(500).json({ error: "Failed to fetch stats" });
        }
    };

    // Aggregated player/team leaderboard
    getLeaderboard = async (req: Request, res: Response): Promise<void> =>
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
            console.error("Error fetching stats leaderboard:", error);
            res.status(500).json({ error: "Failed to fetch stats leaderboard" });
        }
    };

    // Get stat by ID
    getStatById = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const { id } = req.params;
            const stat = await this.statService.getStatById(parseInt(id));
            res.json(stat);
        }
        catch (error)
        {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch stat";
            
            if (errorMessage.includes("not found"))
            {
                res.status(404).json({ error: errorMessage });
            }
            else
            {
                console.error("Error fetching stat by ID:", error);
                res.status(500).json({ error: "Failed to fetch stat" });
            }
        }
    };

    // Update a stat entry
    updateStat = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const { id } = req.params;

            // pull all stats fields plus new ones
            const
            {
                spikingErrors,
                apeKills,
                apeAttempts,
                spikeKills,
                spikeAttempts,
                assists,

                // new: setting errors
                settingErrors,

                blocks,
                digs,
                blockFollows,
                aces,

                // new: serving errors
                servingErrors,

                miscErrors,
                playerId,
                gameId
            } = req.body;

            // call service with new params in correct order
            const updatedStat = await this.statService.updateStat(
                parseInt(id),
                spikingErrors,
                apeKills,
                apeAttempts,
                spikeKills,
                spikeAttempts,
                assists,

                // new
                settingErrors,

                blocks,
                digs,
                blockFollows,
                aces,

                // new
                servingErrors,

                miscErrors,
                playerId,
                gameId
            );

            res.json(updatedStat);
        }
        catch (error)
        {
            const errorMessage = error instanceof Error ? error.message : "Failed to update stat";
            
            if (errorMessage.includes("not found"))
            {
                res.status(404).json({ error: errorMessage });
            }
            else if (
                errorMessage.includes("required") ||
                errorMessage.includes("cannot be negative") ||
                errorMessage.includes("already exist") ||
                errorMessage.includes("not part of")
            ) {
                res.status(400).json({ error: errorMessage });
            }
            else
            {
                console.error("Error updating stat:", error);
                res.status(500).json({ error: "Failed to update stat" });
            }
        }
    };

    // Delete a stat entry
    deleteStat = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const { id } = req.params;
            await this.statService.deleteStat(parseInt(id));
            res.status(204).send();
        }
        catch (error)
        {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete stat";
            
            if (errorMessage.includes("not found"))
            {
                res.status(404).json({ error: errorMessage });
            }
            else
            {
                console.error("Error deleting stat:", error);
                res.status(500).json({ error: "Failed to delete stat" });
            }
        }
    };

    // Get stats by player ID
    getStatsByPlayerId = async (req: Request, res: Response): Promise<void> =>
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
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch stats by player";

            if (errorMessage.includes("not found") || errorMessage.includes("required"))
            {
                res.status(400).json({ error: errorMessage });
            }
            else
            {
                console.error("Error fetching stats by player ID:", error);
                res.status(500).json({ error: "Failed to fetch stats by player" });
            }
        }
    };

    // Get stats by game ID
    getStatsByGameId = async (req: Request, res: Response): Promise<void> =>
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
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch stats by game";

            if (errorMessage.includes("not found") || errorMessage.includes("required"))
            {
                res.status(400).json({ error: errorMessage });
            }
            else
            {
                console.error("Error fetching stats by game ID:", error);
                res.status(500).json({ error: "Failed to fetch stats by game" });
            }
        }
    };

    // Create a new stat entry by player name
    createStatByName = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            // pull stats fields plus playerName and gameId
            const
            {
                spikingErrors,
                apeKills,
                apeAttempts,
                spikeKills,
                spikeAttempts,
                assists,

                // new: setting errors
                settingErrors,

                blocks,
                digs,
                blockFollows,
                aces,

                // new: serving errors
                servingErrors,

                miscErrors,
                playerName,
                gameId
            } = req.body;

            // call service with new params
            const savedStat = await this.statService.createStatByUsername(
                spikingErrors,
                apeKills,
                apeAttempts,
                spikeKills,
                spikeAttempts,
                assists,

                // new
                settingErrors,

                blocks,
                digs,
                blockFollows,
                aces,

                // new
                servingErrors,

                miscErrors,
                playerName,
                gameId
            );

            res.status(201).json(savedStat);
        }
        catch (error)
        {
            const errorMessage = error instanceof Error ? error.message : "Failed to create stat by name";

            if (
                errorMessage.includes("required") ||
                errorMessage.includes("not found") ||
                errorMessage.includes("cannot be negative") ||
                errorMessage.includes("already exist") ||
                errorMessage.includes("not on any")
            )
            {
                res.status(400).json({ error: errorMessage });
            }
            else
            {
                console.error("Error creating stat by name:", error);
                res.status(500).json({ error: "Failed to create stat by name" });
            }
        }
    };

    // Batch upload from CSV data
    batchUploadFromCSV = async (req: Request, res: Response): Promise<void> => {
        try {
            const {
                gameData,
                statsData
            } = req.body;

            // Validate required fields
            if (!gameData || !statsData) {
                res.status(400).json({ 
                    error: "Missing required fields: gameData and statsData are required" 
                });
                return;
            }

            // Call service method to process batch upload
            const result = await this.statService.batchUploadFromCSV(gameData, statsData);
            
            res.status(201).json(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to process batch upload";
            
            if (
                errorMessage.includes("required") ||
                errorMessage.includes("not found") ||
                errorMessage.includes("cannot be negative") ||
                errorMessage.includes("already exist") ||
                errorMessage.includes("invalid") ||
                errorMessage.includes("duplicate")
            ) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error processing batch upload:", error);
                res.status(500).json({ error: "Failed to process batch upload" });
            }
        }
    };

    // Add stats to existing game from CSV data
    addStatsToExistingGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, statsData } = req.body;

            // Validate required fields
            if (!gameId || !statsData) {
                res.status(400).json({ 
                    error: "Missing required fields: gameId and statsData are required" 
                });
                return;
            }

            // Call service method to add stats to existing game
            const result = await this.statService.addStatsToExistingGame(gameId, statsData);
            
            res.status(201).json({ stats: result });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to add stats to existing game";
            const status = (error as any)?.statusCode || (errorMessage.toLowerCase().includes("not found") ? 404 : 400);
            res.status(status).json({ error: errorMessage });
        }
    };
}
