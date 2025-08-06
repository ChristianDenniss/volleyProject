import { Repository, In } from 'typeorm';
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

export class TeamService {
    private teamRepository: Repository<Teams>;
    private playerRepository: Repository<Players>;
    private seasonRepository: Repository<Seasons>;
    private gameRepository: Repository<Games>;

    constructor() {
        this.teamRepository = AppDataSource.getRepository(Teams);
        this.playerRepository = AppDataSource.getRepository(Players);
        this.seasonRepository = AppDataSource.getRepository(Seasons);
        this.gameRepository = AppDataSource.getRepository(Games);
    }

    /**
     * Create a new team with validation
     */
    async createTeam(teamData: CreateTeamDto): Promise<Teams> {
        const { name, seasonNumber, placement, playerIds, gameIds, logoUrl } = teamData;

        // Validation for missing name
        if (!name) {
            throw new MissingFieldError("Team name");
        }

        // Validation for missing seasonNumber
        if (!seasonNumber) {
            throw new MissingFieldError("season number");
        }

        // Fetch the season to associate with the team
        const season = await this.seasonRepository.findOne({
            where: { seasonNumber },
            relations: ["teams"]
        });
        if (!season) {
            throw new NotFoundError(`Season with number:${seasonNumber} not found`);
        }

        // Check for existing team with the same name and seasonNumber
        const existingTeam = await this.teamRepository.findOne({
            where: { name, season: { seasonNumber } }
        });

        if (existingTeam) {
            throw new DuplicateError(`A team with the name "${name}" already exists in season number: ${seasonNumber}.`);
        }

        // Create a new team
        const newTeam = new Teams();
        newTeam.name = name;
        newTeam.season = season;

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

        const teams = await this.teamRepository.find({
            where: { name },
            relations: [
                "season",
                "players",
                "players.stats",
                "players.stats.game",
                "games",
                "games.stats",
                "games.season"
            ]
        });

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
     * Get all teams
     */
    async getAllTeams(): Promise<Teams[]> {
        return this.teamRepository.find({
            relations: [
                "season",
                "players",
                "players.stats",
                "players.stats.game",
                "games",
                "games.stats",
                "games.season"
            ]
        });
    }
    /**
     * Get all teams without relations / minimal data
     */
    async getSkinnyAllTeams(): Promise<Teams[]> {
        return this.teamRepository.find({
            relations: [
                "season"
            ]
        });
    }

    /**
     * Get all teams without relations / minimal data (players, season)
     */
    async getMediumAllTeams(): Promise<Teams[]> {
        return this.teamRepository.find({
            relations: [
                "season", "players"
            ]
        });
    }

    /**
     * Get team by ID with validation
     */
    async getTeamById(id: number): Promise<Teams> {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: [
                "season",
                "players",
                "players.stats",
                "players.stats.game",
                "games",
                "games.stats",
                "games.season"
            ]
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
                "players",
                "players.stats",
                "players.stats.game",
                "games",
                "games.stats",
                "games.season"
            ]
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
