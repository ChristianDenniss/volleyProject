import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source';
import { Teams } from './team.entity';
import { Players } from '../players/player.entity';
import { Seasons } from '../seasons/season.entity';
import { Games } from '../games/game.entity';
import { MissingFieldError } from '../../errors/MissingFieldError';
import { MultipleGamesNotFoundError } from '../../errors/MultipleGamesNotFoundError';
import { MultiplePlayersNotFoundError } from '../../errors/MultiplePlayersNotFoundError';
import { DuplicateError } from '../../errors/DuplicateError';
import { NotFoundError } from '../../errors/NotFoundError';

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

        // Add players and games relationships
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
     * Delete a team with validation
     */
    async deleteTeam(id: number): Promise<void> {
        if (!id) {
            throw new MissingFieldError("Team ID");
        }

        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ["season", "players", "games"],
        });

        if (!team) {
            throw new NotFoundError(`Team with ID: ${id} not found`);
        }

        await this.teamRepository.remove(team);
    }

    /**
     * Get teams by season ID with validation
     */
    async getTeamsBySeasonId(seasonId: number): Promise<Teams[]> {
        if (!seasonId) 
        {
            throw new MissingFieldError(`${seasonId}`);
        }

        // Check if season exists
        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) 
        {
            throw new NotFoundError(`Season with ID:${seasonId} not found`);
        }

        const teams = await this.teamRepository.find({
            where: { season: { id: seasonId } },
            relations: ["players", "games"],
        });

        return teams;
    }
}