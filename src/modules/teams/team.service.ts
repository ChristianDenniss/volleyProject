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
    async createTeam(name: string, seasonId: number, playerIds?: number[], gameIds?: number[]): Promise<Teams> 
    {
        // Validation for missing name
        if (!name) 
        {
            throw new MissingFieldError("Team name");
        }

        // Validation for missing seasonId
        if (!seasonId) 
        {
            throw new MissingFieldError("season ID");
        }

        // Fetch the season to associate with the team
        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) 
        {
            throw new NotFoundError(`Season with ID:${seasonId} not found`);
        }

        // Check for existing team with the same name and seasonId
        const existingTeam = await this.teamRepository.findOne({
            where: { name, season: { id: seasonId } }
        });

        if (existingTeam) 
        {
            throw new DuplicateError(`A team with the name "${name}" already exists in season ID: ${seasonId}.`);
        }

        // Create a new team
        const newTeam = new Teams();
        newTeam.name = name;
        newTeam.season = season;

        // Add players relationships
        if (playerIds && playerIds.length > 0) 
        {
            const players = await this.playerRepository.findByIds(playerIds);

            // Identify missing players
            const foundPlayerIds = players.map(player => player.id);
            const missingPlayerIds = playerIds.filter(playerId => !foundPlayerIds.includes(playerId));

            // Throw a single error listing all missing players
            if (missingPlayerIds.length > 0) 
            {
                throw new MultiplePlayersNotFoundError(missingPlayerIds);
            }

            newTeam.players = players;
        }

        // Add games relationships
        if (gameIds && gameIds.length > 0) 
        {
            const games = await this.gameRepository.findByIds(gameIds);

            // Identify missing games
            const foundGameIds = games.map(game => game.id);
            const missingGameIds = gameIds.filter(gameId => !foundGameIds.includes(gameId));

            // Throw a single error listing all missing games
            if (missingGameIds.length > 0) 
            {
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

    /**
     * Create multiple teams
     */
    async createMultipleTeams(teamsData: { name: string, seasonId: number, playerIds?: number[], gameIds?: number[] }[]): Promise<Teams[]> {
        // Validation for each team
        teamsData.forEach(teamData => {
            if (!teamData.name) throw new MissingFieldError("Team name");
            if (!teamData.seasonId) throw new MissingFieldError("Season ID");
        });

        // Fetch all the seasons
        const seasonIds = teamsData.map(team => team.seasonId);
        const seasons = await this.seasonRepository.findBy({ id: In(seasonIds) });

        // Create the teams
        const newTeams = await Promise.all(teamsData.map(async (data) => {
            const season = seasons.find(season => season.id === data.seasonId);
            if (!season) throw new NotFoundError(`Season with ID ${data.seasonId} not found`);

            // Check for existing team with the same name and seasonId
            const existingTeam = await this.teamRepository.findOne({
                where: { name: data.name, season: { id: data.seasonId } }
            });
            if (existingTeam) {
                throw new DuplicateError(`A team with the name "${data.name}" already exists in season ID: ${data.seasonId}.`);
            }

            const newTeam = new Teams();
            newTeam.name = data.name;
            newTeam.season = season;

            // Add players to the team
            if (data.playerIds && data.playerIds.length > 0) {
                const players = await this.playerRepository.findByIds(data.playerIds);
                const foundPlayerIds = players.map(player => player.id);
                const missingPlayerIds = data.playerIds.filter(playerId => !foundPlayerIds.includes(playerId));

                if (missingPlayerIds.length > 0) {
                    throw new MultiplePlayersNotFoundError(missingPlayerIds);
                }

                newTeam.players = players;
            }

            // Add games to the team
            if (data.gameIds && data.gameIds.length > 0) {
                const games = await this.gameRepository.findByIds(data.gameIds);
                const foundGameIds = games.map(game => game.id);
                const missingGameIds = data.gameIds.filter(gameId => !foundGameIds.includes(gameId));

                if (missingGameIds.length > 0) {
                    throw new MultipleGamesNotFoundError(missingGameIds);
                }

                newTeam.games = games;
            }

            return newTeam;
        }));

        // Save all new teams at once
        return this.teamRepository.save(newTeams);
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
            relations: ["season", "players", "games"],
        });
    }

    /**
     * Get team by ID with validation
     */
    async getTeamById(id: number): Promise<Teams> {
        if (!id) {
            throw new MissingFieldError("Team ID");
        }

        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ["season", "players", "games"],
        });

        if (!team) {
            throw new NotFoundError(`Team with ID:${id} not found`);
        }

        return team;
    }

    /**
     * Get all teams by season ID
     */
    async getTeamsBySeasonId(seasonId: number): Promise<Teams[]> {
        // Validate seasonId
        if (!seasonId) {
            throw new MissingFieldError("Season ID");
        }
        
        
        
        // Find teams by seasonId
        const teams = await this.teamRepository.find({
            where: { season: { id: seasonId } },
            relations: ["season", "players", "games"],  // Load related entities
        });

        // If no teams are found, throw a NotFoundError
        if (!teams || teams.length === 0) {
            throw new NotFoundError(`No teams found for season ID: ${seasonId}`);
        }

        return teams;
    }


    /**
     * Update a team with validation
     */
    async updateTeam(
        id: number, 
        name?: string, 
        seasonId?: number, 
        playerIds?: number[], 
        gameIds?: number[]
    ): Promise<Teams> 
    {
        if (!id) 
        {
            throw new MissingFieldError("Team ID");
        }

        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ["season", "players", "games"],
        });

        if (!team) 
        {
            throw new NotFoundError(`Team with ID:${id} not found`);
        }

        // Update team name
        if (name) 
        {
            team.name = name;
        }

        // Update season
        if (seasonId) 
        {
            const season = await this.seasonRepository.findOneBy({ id: seasonId });
            if (!season) 
            {
                throw new NotFoundError(`Season with ID:${seasonId} not found`);
            }
            team.season = season;
        }

        // Update players
        if (playerIds && playerIds.length > 0) 
        {
            const players = await this.playerRepository.findByIds(playerIds);
            const foundPlayerIds = players.map(player => player.id);
            const missingPlayerIds = playerIds.filter(playerId => !foundPlayerIds.includes(playerId));

            if (missingPlayerIds.length > 0) 
            {
                throw new MultiplePlayersNotFoundError(missingPlayerIds);
            }

            team.players = players;
        }

        // Update games
        if (gameIds && gameIds.length > 0) 
        {
            const games = await this.gameRepository.findByIds(gameIds);
            const foundGameIds = games.map(game => game.id);
            const missingGameIds = gameIds.filter(gameId => !foundGameIds.includes(gameId));

            if (missingGameIds.length > 0) 
            {
                throw new MultipleGamesNotFoundError(missingGameIds);
            }

            team.games = games;
        }

        return this.teamRepository.save(team);
    }

    /**
     * Delete a team
     */
    async deleteTeam(id: number): Promise<void> 
    {
        if (!id) 
        {
            throw new MissingFieldError("Team ID");
        }

        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ["players", "games"],
        });

        if (!team) 
        {
            throw new NotFoundError(`Team with ID:${id} not found`);
        }

        await this.teamRepository.remove(team);
    }
    
}
