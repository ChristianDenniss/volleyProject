import { Request, Response, NextFunction } from 'express';
import { TeamService, TeamFilters, TEAM_SORT_FIELDS, TEAM_DEFAULT_SORT } from './team.service.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { CreateTeamDto, UpdateTeamDto } from './teams.schema.js';
import { parsePagination, parseSort, toPaginatedResult } from '../../utils/pagination.js';
import { parseRegionQuery } from '../../utils/regionQuery.js';
import { RegionService } from '../regions/region.service.js';

const TEAMS_DEFAULT_LIMIT = 10;
const TEAMS_BY_NAME_DEFAULT_LIMIT = 100;
const TEAM_PLAYERS_DEFAULT_LIMIT = 25;

export class TeamController {
    private teamService: TeamService;
    private regionService: RegionService;

    constructor() {
        this.teamService = new TeamService();
        this.regionService = new RegionService();
    }

    createTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const teamData: CreateTeamDto = req.body;
            const savedTeam = await this.teamService.createTeam(teamData);
            res.status(201).json(savedTeam);
        } catch (error) {
            next(error);
        }
    };

    createMultipleTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const teamsData = req.body;
            const savedTeams = await this.teamService.createMultipleTeams(teamsData);
            res.status(201).json(savedTeams);
        }
        catch (error)
        {
            next(error);
        }
    };

    getTeamPlayersByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name } = req.params;
            const pagination = parsePagination(req.query, TEAM_PLAYERS_DEFAULT_LIMIT);
            const result = await this.teamService.getTeamPlayersByName(name, pagination);

            if (!result) {
                res.status(404).json({ error: "Team not found" });
                return;
            }

            const [data, total] = result;

            if (total === 0) {
                res.status(404).json({ message: `No players found for team with name ${name}` });
                return;
            }

            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getTeamPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { teamId } = req.params;
            const pagination = parsePagination(req.query, TEAM_PLAYERS_DEFAULT_LIMIT);
            const [data, total] = await this.teamService.getTeamPlayers(parseInt(teamId), pagination);

            if (total === 0) {
                res.status(404).json({ message: `No players found for team with ID ${teamId}` });
                return;
            }

            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, TEAMS_DEFAULT_LIMIT);
            const sort = parseSort(req.query, TEAM_SORT_FIELDS, TEAM_DEFAULT_SORT, 'ASC');
            const filters = await this.parseFilters(req);
            const [data, total] = await this.teamService.getAllTeams(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getSkinnyTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, TEAMS_DEFAULT_LIMIT);
            const sort = parseSort(req.query, TEAM_SORT_FIELDS, TEAM_DEFAULT_SORT, 'ASC');
            const filters = await this.parseFilters(req);
            const [data, total] = await this.teamService.getSkinnyAllTeams(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getMediumTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, TEAMS_DEFAULT_LIMIT);
            const sort = parseSort(req.query, TEAM_SORT_FIELDS, TEAM_DEFAULT_SORT, 'ASC');
            const filters = await this.parseFilters(req);
            const [data, total] = await this.teamService.getMediumAllTeams(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    private async parseFilters(req: Request): Promise<TeamFilters> {
        const { search, seasonId, placement } = req.query;
        const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
        const regionId = await this.regionService.resolveRegionId(regionFilter);
        return {
            search: typeof search === 'string' && search.length > 0 ? search : undefined,
            seasonId: seasonId ? Number(seasonId) : undefined,
            placement: typeof placement === 'string' && placement.length > 0 ? placement : undefined,
            regionId,
        };
    }

    getTeamById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const team = await this.teamService.getTeamById(parseInt(id));
            res.json(team);
        } catch (error) {
            next(error);
        }
    };

    updateTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id, 10);
            const { name, seasonNumber, placement, playerIds, gameIds, logoUrl } = req.body;

            const updatedTeam = await this.teamService.updateTeam(
                id,
                { name, seasonNumber, placement, playerIds, gameIds, logoUrl }
            );

            res.json(updatedTeam);
        } catch (error) {
            next(error);
        }
    };

    deleteTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            await this.teamService.deleteTeam(parseInt(id));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    getTeamsByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name } = req.params;

            if (!name) {
                throw new MissingFieldError("Team name is required");
            }

            const pagination = parsePagination(req.query, TEAMS_BY_NAME_DEFAULT_LIMIT);
            const [data, total] = await this.teamService.getTeamsByName(name, pagination);
            res.status(200).json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getTeamsBySeasonId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { seasonId } = req.params;
            const pagination = parsePagination(req.query, TEAMS_DEFAULT_LIMIT);
            const [data, total] = await this.teamService.getTeamsBySeasonId(parseInt(seasonId), pagination);

            if (data.length === 0) {
                res.status(404).json({ message: "No teams found for the specified season" });
                return;
            }

            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };
}
