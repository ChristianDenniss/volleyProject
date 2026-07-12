import { Repository, In, ILike, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Teams } from './team.entity.js';
import { Players } from '../players/player.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import { Games } from '../games/game.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { MultipleGamesNotFoundError } from '../../errors/MultipleGamesNotFoundError.js';
import { MultiplePlayersNotFoundError } from '../../errors/MultiplePlayersNotFoundError.js';
import { DuplicateError } from '../../errors/DuplicateError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { CreateTeamDto, UpdateTeamDto, CreateMultipleTeamsDto } from './teams.schema.js';
import { PaginationParams, SortParams } from '../../utils/pagination.js';
import { RegionService } from '../regions/region.service.js';
import { RegionCode } from '../regions/region.entity.js';

export interface TeamFilters {
    search?: string;
    seasonId?: number;
    regionId?: number;
    placement?: string;
}

export const TEAM_SORT_FIELDS = ['name', 'placement'] as const;
export type TeamSortField = typeof TEAM_SORT_FIELDS[number];
export const TEAM_DEFAULT_SORT: TeamSortField = 'name';

// Curated placement rank, mirrored from the FE's placementOrder list - determines ORDER BY
// when sorting by placement (plain alphabetical would put "1st Place" after "Top 16").
const PLACEMENT_ORDER = [
    '1st Place',
    '2nd Place',
    '3rd Place',
    'Top 4',
    'Top 6',
    'Top 8',
    'Top 12',
    'Top 16',
    'TBD',
    'Didnt make playoffs',
    'G.O.A.T.',
];

// Team placements sometimes carry a "(D#)" division suffix (e.g. "Top 8 (D2)"); both filtering
// and curated-order sorting need to compare/rank the normalized value, not the raw column.
const NORMALIZE_PLACEMENT_SQL = `regexp_replace(team.placement, '\\s*\\([Dd]\\d\\)$', '')`;

function placementRankCaseExpr(): string {
    const whens = PLACEMENT_ORDER
        .map((p, i) => `WHEN ${NORMALIZE_PLACEMENT_SQL} = '${p.replace(/'/g, "''")}' THEN ${i}`)
        .join(' ');
    return `CASE ${whens} ELSE ${PLACEMENT_ORDER.length} END`;
}

export class TeamService {
    private teamRepository: Repository<Teams>;
    private playerRepository: Repository<Players>;
    private seasonRepository: Repository<Seasons>;
    private gameRepository: Repository<Games>;
    private regionService: RegionService;

    constructor() {
        this.teamRepository = AppDataSource.getRepository(Teams);
        this.playerRepository = AppDataSource.getRepository(Players);
        this.seasonRepository = AppDataSource.getRepository(Seasons);
        this.gameRepository = AppDataSource.getRepository(Games);
        this.regionService = new RegionService();
    }

    private async resolveRegionId(regionId?: number, regionCode?: string): Promise<number> {
        if (regionId) {
            const region = await this.regionService.getRegionById(regionId);
            if (!region) throw new NotFoundError(`Region with ID ${regionId} not found`);
            return region.id;
        }
        if (regionCode) {
            const region = await this.regionService.requireRegionByCode(regionCode as RegionCode);
            return region.id;
        }
        const na = await this.regionService.requireRegionByCode('na');
        return na.id;
    }

    /**
     * Create a new team with validation
     */
    async createTeam(teamData: CreateTeamDto): Promise<Teams> {
        const { name, seasonNumber, placement, playerIds, gameIds, logoUrl, regionId, region } = teamData;

        // Validation for missing name
        if (!name) {
            throw new MissingFieldError("Team name");
        }

        // Validation for missing seasonNumber
        if (!seasonNumber) {
            throw new MissingFieldError("season number");
        }

        // Fetch the season to associate with the team
        const resolvedRegionId = await this.resolveRegionId(regionId, region);

        const season = await this.seasonRepository.findOne({
            where: { seasonNumber, regionId: resolvedRegionId },
            relations: ["teams"]
        });
        if (!season) {
            throw new NotFoundError(`Season ${seasonNumber} not found in this region`);
        }

        const existingTeam = await this.teamRepository.findOne({
            where: { name, season: { seasonNumber, regionId: resolvedRegionId } }
        });

        if (existingTeam) {
            throw new DuplicateError(`A team with the name "${name}" already exists in season number: ${seasonNumber}.`);
        }

        // Create a new team
        const newTeam = new Teams();
        newTeam.name = name;
        newTeam.season = season;
        newTeam.regionId = season.regionId;

        // Only override placement if one was provided
        if (placement !== undefined) {
            newTeam.placement = placement.trim();
        }

        // Set logo URL if provided
        if (logoUrl !== undefined) {
            newTeam.logoUrl = logoUrl;
        }

        // Add players relationships
        if (playerIds && playerIds.length > 0) {
            const players = await this.playerRepository.find({
                where: { id: In(playerIds) },
                relations: ["teams", "teams.season"]
            });

            // Identify missing players
            const foundPlayerIds = players.map(player => player.id);
            const missingPlayerIds = playerIds.filter(id => !foundPlayerIds.includes(id));

            if (missingPlayerIds.length > 0) {
                throw new MultiplePlayersNotFoundError(missingPlayerIds);
            }

            newTeam.players = players;
        }

        // Add games relationships
        if (gameIds && gameIds.length > 0) {
            const games = await this.gameRepository.find({
                where: { id: In(gameIds) },
                relations: ["teams", "season"]
            });

            // Identify missing games
            const foundGameIds = games.map(game => game.id);
            const missingGameIds = gameIds.filter(id => !foundGameIds.includes(id));

            if (missingGameIds.length > 0) {
                throw new MultipleGamesNotFoundError(missingGameIds);
            }

            newTeam.games = games;
        }

        return this.teamRepository.save(newTeam);
    }

    /**
     * Get players for a team by name
     */
    async getTeamPlayersByName(name: string): Promise<Teams | null> {
        const team = await this.teamRepository.findOne({
            where: { name },
            relations: ["players"],  // Load players for the specific team
        });

        return team;  // Return the team (with players) if found, or null if not found
    }

    async getTeamsByName(name: string): Promise<Teams[]> {
        if (!name) {
            throw new MissingFieldError("Team name");
        }

        const lookupName = decodeURIComponent(name).replace(/-/g, " ").trim();

        const teams = await this.teamRepository
            .createQueryBuilder("team")
            .leftJoinAndSelect("team.season", "season")
            .leftJoinAndSelect("team.players", "players")
            .leftJoinAndSelect("players.stats", "playerStats")
            .leftJoinAndSelect("playerStats.game", "playerStatsGame")
            .leftJoinAndSelect("team.games", "games")
            .leftJoinAndSelect("games.stats", "gameStats")
            .leftJoinAndSelect("games.season", "gameSeason")
            .where("LOWER(team.name) = LOWER(:name)", { name: lookupName })
            .getMany();

        if (teams.length === 0) {
            throw new NotFoundError(`No teams found with name: ${name}`);
        }

        return teams;
    }

    /**
     * Create multiple teams
     */
    async createMultipleTeams(teamsData: CreateMultipleTeamsDto): Promise<Teams[]> {
        const createdTeams: Teams[] = [];

        for (const data of teamsData) {
            const team = await this.createTeam(data);
            createdTeams.push(team);
        }

        return createdTeams;
    }

    /**
     * Get players for a team by team ID
     */
    async getTeamPlayers(teamId: number): Promise<Players[]> {
        const team = await this.teamRepository.findOne({
            where: { id: teamId },
            relations: ["players"],  // Only load players for the specific team
        });

        if (!team) {
            throw new Error("Team not found");
        }

        return team.players; // Return the players associated with the team
    }

    /**
     * Build a TypeORM where clause from team filters (covers the plain-column filters;
     * placement needs a raw expression, so it's applied separately in buildFilteredIdQuery).
     */
    private buildWhere(filters: TeamFilters): FindOptionsWhere<Teams> {
        const where: FindOptionsWhere<Teams> = {};
        if (filters.search) where.name = ILike(`%${filters.search}%`);
        if (filters.seasonId) where.season = { id: filters.seasonId } as any;
        if (filters.regionId) where.regionId = filters.regionId;
        return where;
    }

    /**
     * Resolve the page of team IDs (in the correct filtered/sorted order) via a query builder,
     * since placement filtering/sorting need raw SQL (normalizing the "(D#)" suffix, curated
     * rank order) that plain FindOptionsWhere/order can't express.
     */
    private async getFilteredTeamIdsPage(
        pagination: PaginationParams,
        filters: TeamFilters,
        sort?: SortParams<TeamSortField>
    ): Promise<{ ids: number[]; total: number }> {
        const qb = this.teamRepository.createQueryBuilder('team');
        if (filters.search) qb.andWhere('team.name ILIKE :search', { search: `%${filters.search}%` });
        if (filters.seasonId) qb.andWhere('team.seasonId = :seasonId', { seasonId: filters.seasonId });
        if (filters.regionId) qb.andWhere('team.regionId = :regionId', { regionId: filters.regionId });
        if (filters.placement) qb.andWhere(`${NORMALIZE_PLACEMENT_SQL} = :placement`, { placement: filters.placement });

        const total = await qb.getCount();

        const sortBy = sort?.sortBy ?? TEAM_DEFAULT_SORT;
        const sortDir = sort?.sortDir ?? 'ASC';
        if (sortBy === 'placement') {
            qb.orderBy(placementRankCaseExpr(), sortDir).addOrderBy('team.name', 'ASC');
        } else {
            qb.orderBy('team.name', sortDir);
        }

        const rows = await qb
            .select('team.id', 'id')
            .skip(pagination.skip)
            .take(pagination.take)
            .getRawMany<{ id: number }>();

        return { ids: rows.map(row => row.id), total };
    }

    /** Re-hydrate full entities for a page of IDs, preserving the order `ids` was given in. */
    private async hydrateTeamsInOrder(ids: number[], relations: string[]): Promise<Teams[]> {
        if (ids.length === 0) return [];
        const teams = await this.teamRepository.find({
            where: { id: In(ids) },
            relations,
            relationLoadStrategy: 'query',
        });
        const byId = new Map(teams.map(team => [team.id, team]));
        return ids.map(id => byId.get(id)).filter((team): team is Teams => team !== undefined);
    }

    /**
     * Get all teams
     */
    async getAllTeams(
        pagination: PaginationParams,
        filters: TeamFilters = {},
        sort?: SortParams<TeamSortField>
    ): Promise<[Teams[], number]> {
        const { ids, total } = await this.getFilteredTeamIdsPage(pagination, filters, sort);
        const teams = await this.hydrateTeamsInOrder(ids, [
            "season",
            "region",
            "players",
            "players.stats",
            "players.stats.game",
            "games",
            "games.stats",
            "games.season"
        ]);
        return [teams, total];
    }
    /**
     * Get all teams without relations / minimal data
     */
    async getSkinnyAllTeams(
        pagination: PaginationParams,
        filters: TeamFilters = {},
        sort?: SortParams<TeamSortField>
    ): Promise<[Teams[], number]> {
        const { ids, total } = await this.getFilteredTeamIdsPage(pagination, filters, sort);
        const teams = await this.hydrateTeamsInOrder(ids, ["season"]);
        return [teams, total];
    }

    /**
     * Get all teams without relations / minimal data (players, season)
     */
    async getMediumAllTeams(
        pagination: PaginationParams,
        filters: TeamFilters = {},
        sort?: SortParams<TeamSortField>
    ): Promise<[Teams[], number]> {
        const { ids, total } = await this.getFilteredTeamIdsPage(pagination, filters, sort);
        const teams = await this.hydrateTeamsInOrder(ids, ["season", "players"]);
        return [teams, total];
    }

    /**
     * Get team by ID with validation
     */
    async getTeamById(id: number): Promise<Teams> {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: [
                "season",
                "region",
                "players",
                "players.stats",
                "players.stats.game",
                "games",
                "games.stats",
                "games.season"
            ],
            relationLoadStrategy: 'query'
        });

        if (!team) {
            throw new NotFoundError(`Team with ID ${id} not found`);
        }

        return team;
    }

    /**
     * Get all teams by season ID
     */
    async getTeamsBySeasonId(seasonId: number): Promise<Teams[]> {
        if (!seasonId) {
            throw new MissingFieldError("Season ID");
        }

        const season = await this.seasonRepository.findOne({
            where: { id: seasonId },
            relations: ["teams"]
        });

        if (!season) {
            throw new NotFoundError(`Season with ID ${seasonId} not found`);
        }

        return this.teamRepository.find({
            where: { season: { id: seasonId } },
            relations: [
                "season",
                "region",
                "players",
                "players.stats",
                "players.stats.game",
                "games",
                "games.stats",
                "games.season"
            ],
            relationLoadStrategy: 'query'
        });
    }

    /**
     * Update an existing team
     */
    async updateTeam(id: number, teamData: UpdateTeamDto): Promise<Teams> {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ["season", "players", "games"]
        });

        if (!team) {
            throw new NotFoundError(`Team with ID ${id} not found`);
        }

        const { name, seasonNumber, placement, playerIds, gameIds, logoUrl } = teamData;

        if (name) team.name = name;
        if (placement !== undefined) team.placement = placement.trim();
        if (logoUrl !== undefined) team.logoUrl = logoUrl;

        if (seasonNumber) {
            const season = await this.seasonRepository.findOne({
                where: { seasonNumber },
                relations: ["teams"]
            });
            if (!season) {
                throw new NotFoundError(`Season with number ${seasonNumber} not found`);
            }
            team.season = season;
        }

        if (playerIds) {
            const players = await this.playerRepository.find({
                where: { id: In(playerIds) },
                relations: ["teams", "teams.season"]
            });
            if (players.length !== playerIds.length) {
                const foundIds = players.map(p => p.id);
                const missingIds = playerIds.filter(id => !foundIds.includes(id));
                throw new MultiplePlayersNotFoundError(missingIds);
            }
            team.players = players;
        }

        if (gameIds) {
            const games = await this.gameRepository.find({
                where: { id: In(gameIds) },
                relations: ["teams", "season"]
            });
            if (games.length !== gameIds.length) {
                const foundIds = games.map(g => g.id);
                const missingIds = gameIds.filter(id => !foundIds.includes(id));
                throw new MultipleGamesNotFoundError(missingIds);
            }
            team.games = games;
        }

        const savedTeam = await this.teamRepository.save(team);
        
        // Return the team with full relations to ensure all fields are included
        return await this.teamRepository.findOne({
            where: { id: savedTeam.id },
            relations: ["season", "players", "games"]
        }) || savedTeam;
    }

    /**
     * Delete a team
     */
    async deleteTeam(id: number): Promise<void> {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ["players", "games"]
        });

        if (!team) {
            throw new NotFoundError(`Team with ID ${id} not found`);
        }

        await this.teamRepository.remove(team);
    }
}
