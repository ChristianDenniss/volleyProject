import { Request, Response, NextFunction } from 'express';
import { PlayerService, PlayerFilters, PLAYER_SORT_FIELDS, PLAYER_DEFAULT_SORT } from './player.service.js';
import { parsePagination, parseSort, toPaginatedResult } from '../../utils/pagination.js';
import { parseRegionQuery } from '../../utils/regionQuery.js';
import { RegionService } from '../regions/region.service.js';

const PLAYERS_DEFAULT_LIMIT = 25;

export class PlayerController {
    private playerService: PlayerService;
    private regionService: RegionService;

    constructor() {
        this.playerService = new PlayerService();
        this.regionService = new RegionService();
    }

    createPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, position, teamId } = req.body;
            const savedPlayer = await this.playerService.createPlayer(
                name,
                position,
                teamId
            );

            res.status(201).json(savedPlayer);
        } catch (error) {
            next(error);
        }
    };

    createPlayerByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, position, teamName } = req.body;

            const savedPlayer = await this.playerService.createPlayerByName(
                name,
                position,
                teamName
            );

            res.status(201).json(savedPlayer);
        } catch (error) {
            next(error);
        }
    };

    getTeamsByPlayerName = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        const { playerName } = req.params;

        try
        {
            const teamNames = await this.playerService.getTeamsByPlayerName(playerName);

            res.status(200).json({
                success: true,
                playerName: playerName,
                teams: teamNames
            });
        }
        catch (error)
        {
            next(error);
        }
    };

    createMultiplePlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const playersData = req.body;

            if (!Array.isArray(playersData)) {
                res.status(400).json({ error: "Request body must be an array of player objects" });
                return;
            }

            const createdPlayers = await this.playerService.createMultiplePlayers(playersData);
            res.status(201).json(createdPlayers);
        } catch (error) {
            next(error);
        }
    };

    createMultiplePlayersByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { seasonId, players: playersData } = req.body;

            const createdPlayers = await this.playerService.createMultiplePlayersByName(seasonId, playersData);
            res.status(201).json(createdPlayers);
        } catch (error) {
            next(error);
        }
    };

    getPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, PLAYERS_DEFAULT_LIMIT, 500);
            const sort = parseSort(req.query, PLAYER_SORT_FIELDS, PLAYER_DEFAULT_SORT, 'ASC');
            const filters = await this.parseFilters(req);
            const [data, total] = await this.playerService.getAllPlayers(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getMediumPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, PLAYERS_DEFAULT_LIMIT);
            const sort = parseSort(req.query, PLAYER_SORT_FIELDS, PLAYER_DEFAULT_SORT, 'ASC');
            const filters = await this.parseFilters(req);
            const [data, total] = await this.playerService.getMediumAllPlayers(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    private async parseFilters(req: Request): Promise<PlayerFilters> {
        const { search, seasonId, position } = req.query;
        const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
        const regionId = await this.regionService.resolveRegionId(regionFilter);
        return {
            search: typeof search === 'string' && search.length > 0 ? search : undefined,
            seasonId: seasonId ? Number(seasonId) : undefined,
            position: typeof position === 'string' && position.length > 0 ? position : undefined,
            regionId,
        };
    }

    getPlayerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
            const regionId = await this.regionService.resolveRegionId(regionFilter);
            const player = await this.playerService.getPlayerById(parseInt(id), regionId);
            res.json(player);
        } catch (error) {
            next(error);
        }
    };

    updatePlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedPlayer = await this.playerService.updatePlayer(
                parseInt(id),
                updateData
            );
            res.json(updatedPlayer);
        } catch (error) {
            next(error);
        }
    };

    deletePlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            await this.playerService.deletePlayer(parseInt(id));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    getPlayersByTeamId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { teamId } = req.params;
            const pagination = parsePagination(req.query, PLAYERS_DEFAULT_LIMIT);
            const [data, total] = await this.playerService.getPlayersByTeamId(parseInt(teamId), pagination);

            if (data.length === 0) {
                res.status(404).json({ message: "No players found for the specified team" });
                return;
            }

            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    mergePlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const { targetId, mergedId } = req.body;
            await this.playerService.mergePlayers(targetId, mergedId);
            res.sendStatus(204);
        }
        catch (error)
        {
            next(error);
        }
    };
}
