import { Repository, In, ILike, FindOptionsWhere, EntityManager } from 'typeorm';
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
import { ConflictError } from '../../errors/ConflictError.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { CreateTeamDto, UpdateTeamDto, CreateMultipleTeamsDto } from './teams.schema.js';
import { PaginationParams, SortParams } from '../../utils/pagination.js';
import { RegionService } from '../regions/region.service.js';
import { RegionCode } from '../regions/region.entity.js';
import { User } from '../user/user.entity.js';
import { UserService } from '../user/user.service.js';
import { normalizeRobloxUsername } from '../../middleware/authValidation.js';

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
    async createTeam(teamData: CreateTeamDto, manager?: EntityManager): Promise<Teams> {
        const teamRepository = manager ? manager.getRepository(Teams) : this.teamRepository;
        const playerRepository = manager ? manager.getRepository(Players) : this.playerRepository;
        const seasonRepository = manager ? manager.getRepository(Seasons) : this.seasonRepository;
        const gameRepository = manager ? manager.getRepository(Games) : this.gameRepository;

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

        const season = await seasonRepository.findOne({
            where: { seasonNumber, regionId: resolvedRegionId },
            relations: ["teams"]
        });
        if (!season) {
            throw new NotFoundError(`Season ${seasonNumber} not found in this region`);
        }

        const existingTeam = await teamRepository.findOne({
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
            const players = await playerRepository.find({
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
            const games = await gameRepository.find({
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

        return teamRepository.save(newTeam);
    }

    /**
     * Get players for a team by name
     */
    async getTeamPlayersByName(name: string, pagination: PaginationParams): Promise<[Players[], number] | null> {
        const team = await this.teamRepository.findOne({
            where: { name },
        });

        if (!team) {
            return null;
        }

        return this.playerRepository.findAndCount({
            where: { teams: { id: team.id } },
            skip: pagination.skip,
            take: pagination.take,
        });
    }

    async getTeamsByName(name: string, pagination: PaginationParams): Promise<[Teams[], number]> {
        if (!name) {
            throw new MissingFieldError("Team name");
        }

        const lookupName = decodeURIComponent(name).replace(/-/g, " ").trim();

        const [teams, total] = await this.teamRepository
            .createQueryBuilder("team")
            .leftJoinAndSelect("team.season", "season")
            .leftJoinAndSelect("team.players", "players")
            .leftJoinAndSelect("players.stats", "playerStats")
            .leftJoinAndSelect("playerStats.game", "playerStatsGame")
            .leftJoinAndSelect("team.games", "games")
            .leftJoinAndSelect("games.stats", "gameStats")
            .leftJoinAndSelect("games.season", "gameSeason")
            .where("LOWER(team.name) = LOWER(:name)", { name: lookupName })
            .skip(pagination.skip)
            .take(pagination.take)
            .getManyAndCount();

        if (total === 0) {
            throw new NotFoundError(`No teams found with name: ${name}`);
        }

        return [teams, total];
    }

    /**
     * Create multiple teams
     */
    async createMultipleTeams(teamsData: CreateMultipleTeamsDto): Promise<Teams[]> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const createdTeams: Teams[] = [];

            for (const data of teamsData) {
                createdTeams.push(await this.createTeam(data, queryRunner.manager));
            }

            await queryRunner.commitTransaction();
            return createdTeams;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get players for a team by team ID
     */
    async getTeamPlayers(teamId: number, pagination: PaginationParams): Promise<[Players[], number]> {
        const team = await this.teamRepository.findOneBy({ id: teamId });

        if (!team) {
            throw new NotFoundError(`Team with ID ${teamId} not found`);
        }

        return this.playerRepository.findAndCount({
            where: { teams: { id: teamId } },
            skip: pagination.skip,
            take: pagination.take,
        });
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
    async getTeamsBySeasonId(seasonId: number, pagination: PaginationParams): Promise<[Teams[], number]> {
        if (!seasonId) {
            throw new MissingFieldError("Season ID");
        }

        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) {
            throw new NotFoundError(`Season with ID ${seasonId} not found`);
        }

        return this.teamRepository.findAndCount({
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
            relationLoadStrategy: 'query',
            skip: pagination.skip,
            take: pagination.take,
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

    async getTeamForStaff(id: number): Promise<Teams> {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ["season", "players", "captainUser", "viceCaptainUser", "courtCaptainUser", "region"],
        });
        if (!team) throw new NotFoundError(`Team with ID ${id} not found`);
        return team;
    }

    canStaffEdit(team: Teams, userId: number): {
        allowed: boolean;
        role: "captain" | "vice_captain" | "court_captain" | null;
        reason?: string;
    } {
        if (!team.season?.captainEditEnabled) {
            return { allowed: false, role: null, reason: "Captain editing is disabled for this season" };
        }
        if (!team.captainEditEnabled) {
            return { allowed: false, role: null, reason: "Captain editing is disabled for this team" };
        }
        if (team.captainUserId === userId) return { allowed: true, role: "captain" };
        if (team.viceCaptainUserId === userId) return { allowed: true, role: "vice_captain" };
        if (team.courtCaptainUserId === userId) return { allowed: true, role: "court_captain" };
        return { allowed: false, role: null, reason: "You are not staff on this team" };
    }

    private async assertLinkedRosterUser(team: Teams, userId: number): Promise<User> {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user?.robloxUsername) {
            throw new ConflictError("Target user must have a linked Roblox account");
        }
        const onRoster = (team.players || []).some(
            (p) => p.robloxUsername === user.robloxUsername || p.userId === userId
        );
        if (!onRoster) {
            throw new ConflictError("Target user must be on the team roster with a linked Roblox account");
        }
        return user;
    }

    async staffUpdateTeam(
        teamId: number,
        actorId: number,
        body: {
            name?: string;
            hexColor?: string | null;
            brickColor?: string | null;
            logoUrl?: string | null;
            roster?: { discord: string; roblox: string }[];
            captainUserId?: number | null;
            viceCaptainUserId?: number | null;
            courtCaptainUserId?: number | null;
        }
    ): Promise<Teams> {
        const team = await this.getTeamForStaff(teamId);
        const gate = this.canStaffEdit(team, actorId);
        if (!gate.allowed || !gate.role) {
            throw new UnauthorizedError(gate.reason || "Forbidden");
        }

        const role = gate.role;

        if (body.name !== undefined) {
            if (role !== "captain") throw new UnauthorizedError("Only the captain can rename the team");
            const clash = await this.teamRepository.findOne({
                where: { name: body.name.trim(), regionId: team.regionId, season: { id: team.season.id } },
            });
            if (clash && clash.id !== team.id) {
                throw new ConflictError(`A team named "${body.name}" already exists in this season`);
            }
            team.name = body.name.trim();
        }

        if (body.hexColor !== undefined || body.brickColor !== undefined || body.logoUrl !== undefined) {
            if (body.hexColor !== undefined) team.hexColor = body.hexColor;
            if (body.brickColor !== undefined) team.brickColor = body.brickColor;
            if (body.logoUrl !== undefined) team.logoUrl = body.logoUrl ?? undefined;
        }

        if (body.roster !== undefined) {
            if (body.roster.length < 10) throw new ConflictError("Roster must have at least 10 players");
            const players: Players[] = [];
            for (const entry of body.roster) {
                const roblox = normalizeRobloxUsername(entry.roblox);
                const existing = await this.playerRepository.findOne({
                    where: { robloxUsername: roblox },
                    relations: ["teams", "teams.season"],
                });
                if (existing?.teams?.some((t) => t.season?.id === team.season.id && t.id !== team.id)) {
                    throw new ConflictError(`Player ${roblox} is already on another team this season`);
                }
                let player = existing;
                if (!player) {
                    player = new Players();
                    player.name = roblox;
                    player.robloxUsername = roblox;
                    player.discordUsername = entry.discord.trim();
                    player.position = "N/A";
                    player.teams = [];
                } else {
                    player.discordUsername = entry.discord.trim();
                }
                players.push(await this.playerRepository.save(player));
            }
            team.players = players;
        }

        const userService = new UserService();

        if (body.captainUserId !== undefined) {
            if (role !== "captain") throw new UnauthorizedError("Only the captain can transfer captaincy");
            if (body.captainUserId != null) {
                await this.assertLinkedRosterUser(team, body.captainUserId);
                team.captainUserId = body.captainUserId;
                await userService.promoteRoleIfUser(body.captainUserId, "captain", actorId);
            }
        }

        if (body.viceCaptainUserId !== undefined) {
            if (role !== "captain") throw new UnauthorizedError("Only the captain can assign vice captain");
            if (body.viceCaptainUserId != null) {
                await this.assertLinkedRosterUser(team, body.viceCaptainUserId);
                team.viceCaptainUserId = body.viceCaptainUserId;
                await userService.promoteRoleIfUser(body.viceCaptainUserId, "vice_captain", actorId);
            } else {
                team.viceCaptainUserId = null;
            }
        }

        if (body.courtCaptainUserId !== undefined) {
            if (role !== "captain" && role !== "vice_captain") {
                throw new UnauthorizedError("Only captain or vice captain can assign court captain");
            }
            if (body.courtCaptainUserId != null) {
                await this.assertLinkedRosterUser(team, body.courtCaptainUserId);
                team.courtCaptainUserId = body.courtCaptainUserId;
                await userService.promoteRoleIfUser(body.courtCaptainUserId, "court_captain", actorId);
            } else {
                team.courtCaptainUserId = null;
            }
        }

        await this.teamRepository.save(team);
        return this.getTeamForStaff(teamId);
    }

    async adminPatchTeamFlags(
        teamId: number,
        body: {
            captainEditEnabled?: boolean;
            hexColor?: string | null;
            brickColor?: string | null;
            captainUserId?: number | null;
            viceCaptainUserId?: number | null;
            courtCaptainUserId?: number | null;
        }
    ): Promise<Teams> {
        const team = await this.getTeamForStaff(teamId);
        if (body.captainEditEnabled !== undefined) team.captainEditEnabled = body.captainEditEnabled;
        if (body.hexColor !== undefined) team.hexColor = body.hexColor;
        if (body.brickColor !== undefined) team.brickColor = body.brickColor;
        if (body.captainUserId !== undefined) team.captainUserId = body.captainUserId;
        if (body.viceCaptainUserId !== undefined) team.viceCaptainUserId = body.viceCaptainUserId;
        if (body.courtCaptainUserId !== undefined) team.courtCaptainUserId = body.courtCaptainUserId;
        await this.teamRepository.save(team);
        return this.getTeamForStaff(teamId);
    }

    enrichTeamWithCanEdit(team: Teams, userId?: number) {
        if (!userId) return { ...team, captainCanEdit: false, staffRole: null };
        const gate = this.canStaffEdit(team, userId);
        return { ...team, captainCanEdit: gate.allowed, staffRole: gate.role };
    }
}
