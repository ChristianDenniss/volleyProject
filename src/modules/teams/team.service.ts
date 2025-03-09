import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source';
import { Teams } from './team.entity';
import { Players } from '../players/player.entity';
import { Seasons } from '../seasons/season.entity';
import { Games } from '../games/game.entity';

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
    async createTeam(name: string, seasonId: number, playerIds?: number[], gameIds?: number[]): Promise<Teams> {
        // Validation
        if (!name || !seasonId) {
            throw new Error("Team name and season ID are required");
        }

        // Fetch the season to associate with the team
        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) {
            throw new Error("Season not found");
        }

        // Create a new team
        const newTeam = new Teams();
        newTeam.name = name;
        newTeam.season = season;

        // Add players and games relationships
        if (playerIds && playerIds.length > 0) {
            const players = await this.playerRepository.findByIds(playerIds);
            if (players.length !== playerIds.length) {
                throw new Error("Some players were not found");
            }
            newTeam.players = players;
        }

        if (gameIds && gameIds.length > 0) {
            const games = await this.gameRepository.findByIds(gameIds);
            if (games.length !== gameIds.length) {
                throw new Error("Some games were not found");
            }
            newTeam.games = games;
        }

        return this.teamRepository.save(newTeam);
    }

    /**
     * Get all teams
     */
    async getAllTeams(): Promise<Teams[]> {
        return this.teamRepository.find({
            relations: ["season", "players", "games"],
        });
    }

    /**
     * Get team by ID with validation
     */
    async getTeamById(id: number): Promise<Teams> {
        if (!id) {
            throw new Error("Team ID is required");
        }

        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ["season", "players", "games"],
        });

        if (!team) {
            throw new Error("Team not found");
        }

        return team;
    }

    /**
     * Update a team with validation
     */
    async updateTeam(id: number, name?: string, seasonId?: number, playerIds?: number[], gameIds?: number[]): Promise<Teams> {
        if (!id) {
            throw new Error("Team ID is required");
        }

        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ["season", "players", "games"],
        });

        if (!team) {
            throw new Error("Team not found");
        }

        // Update team fields
        if (name) team.name = name;
        
        if (seasonId) {
            const season = await this.seasonRepository.findOneBy({ id: seasonId });
            if (!season) {
                throw new Error("Season not found");
            }
            team.season = season;
        }

        if (playerIds && playerIds.length > 0) {
            const players = await this.playerRepository.findByIds(playerIds);
            if (players.length !== playerIds.length) {
                throw new Error("Some players were not found");
            }
            team.players = players;
        }

        if (gameIds && gameIds.length > 0) {
            const games = await this.gameRepository.findByIds(gameIds);
            if (games.length !== gameIds.length) {
                throw new Error("Some games were not found");
            }
            team.games = games;
        }

        return this.teamRepository.save(team);
    }

    /**
     * Delete a team with validation
     */
    async deleteTeam(id: number): Promise<void> {
        if (!id) {
            throw new Error("Team ID is required");
        }

        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ["season", "players", "games"],
        });

        if (!team) {
            throw new Error("Team not found");
        }

        await this.teamRepository.remove(team);
    }

    /**
     * Get teams by season ID with validation
     */
    async getTeamsBySeasonId(seasonId: number): Promise<Teams[]> {
        if (!seasonId) {
            throw new Error("Season ID is required");
        }

        // Check if season exists
        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) {
            throw new Error("Season not found");
        }

        const teams = await this.teamRepository.find({
            where: { season: { id: seasonId } },
            relations: ["players", "games"],
        });

        return teams;
    }
}