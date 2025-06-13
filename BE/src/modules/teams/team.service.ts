import { Repository, In, Not } from 'typeorm';
import { AppDataSource } from '../../db/data-source.ts';
import { Teams } from './team.entity.ts';
import { Players } from '../players/player.entity.ts';
import { Seasons } from '../seasons/season.entity.ts';
import { Games } from '../games/game.entity.ts';
import { MissingFieldError } from '../../errors/MissingFieldError.ts';
import { MultipleGamesNotFoundError } from '../../errors/MultipleGamesNotFoundError.ts';
import { MultiplePlayersNotFoundError } from '../../errors/MultiplePlayersNotFoundError.ts';
import { DuplicateError } from '../../errors/DuplicateError.ts';
import { NotFoundError } from '../../errors/NotFoundError.ts';

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
    async createTeam
    (
        name: string,
        seasonId: number,
        placement?: string,
        playerIds?: number[],
        gameIds?: number[]
    ): Promise<Teams>
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

        // Set the team name
        newTeam.name = name;

        // Associate it with the fetched season
        newTeam.season = season;

        // Only override placement if one was provided
        if (placement !== undefined)
        {
            // Trim whitespace at ends but preserve internal spaces
            newTeam.placement = placement.trim();
        }

        // Add players relationships
        if (playerIds && playerIds.length > 0)
        {
            const players = await this.playerRepository.findByIds(playerIds);

            // Identify missing players
            const foundPlayerIds   = players.map(player => player.id);
            const missingPlayerIds = playerIds.filter(id => !foundPlayerIds.includes(id));

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
            const foundGameIds   = games.map(game => game.id);
            const missingGameIds = gameIds.filter(id => !foundGameIds.includes(id));

            // Throw a single error listing all missing games
            if (missingGameIds.length > 0)
            {
                throw new MultipleGamesNotFoundError(missingGameIds);
            }

            newTeam.games = games;
        }

        // Persist and return
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
    
        try {
            const teams = await this.teamRepository.find({
                where: { name },
                relations: ["season", "players", "games", "games.stats"],
            });
    
            if (teams.length === 0) {
                throw new NotFoundError(`No teams found with name: ${name}`);
            }
    
            return teams;
        } catch (error) {
            console.error('Error in getTeamsByName service:', error);
            throw new Error('Database error occurred');
        }
    }    


    /**
     * Create multiple teams
     */
    async createMultipleTeams(teamsData: { name: string; seasonId: number; placement?: string; playerIds?: number[]; gameIds?: number[]; }[]): Promise<Teams[]>
    {
        const createdTeams: Teams[] = [];

        for (const data of teamsData)
        {
            const team = await this.createTeam(data.name, data.seasonId, data.placement, data.playerIds, data.gameIds);
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
     * Update an existing team
     */
    async updateTeam(id: number, data: { name?: string; seasonId?: number; placement?: string; playerIds?: number[]; gameIds?: number[]; }): Promise<Teams>
    {
        // Fetch the existing team
        const existingTeam = await this.teamRepository.findOneBy({ id });
        if (!existingTeam)
        {
            throw new NotFoundError(`Team with ID:${id} not found`);
        }

        // Update name if provided
        if (data.name !== undefined)
        {
            existingTeam.name = data.name;
        }

        // Update season if provided
        if (data.seasonId !== undefined)
        {
            const season = await this.seasonRepository.findOneBy({ id: data.seasonId });
            if (!season)
            {
                throw new NotFoundError(`Season with ID:${data.seasonId} not found`);
            }
            existingTeam.season = season;
        }

        // Update placement if provided
        if (data.placement !== undefined)
        {
            existingTeam.placement = data.placement.trim();
        }

        // Update players relationships if provided
        if (data.playerIds)
        {
            const players = await this.playerRepository.findByIds(data.playerIds);

            // Identify missing players
            const foundPlayerIds   = players.map(player => player.id);
            const missingPlayerIds = data.playerIds.filter(id => !foundPlayerIds.includes(id));

            // Throw a single error listing all missing players
            if (missingPlayerIds.length > 0)
            {
                throw new MultiplePlayersNotFoundError(missingPlayerIds);
            }

            existingTeam.players = players;
        }

        // Update games relationships if provided
        if (data.gameIds)
        {
            const games = await this.gameRepository.findByIds(data.gameIds);

            // Identify missing games
            const foundGameIds   = games.map(game => game.id);
            const missingGameIds = data.gameIds.filter(id => !foundGameIds.includes(id));

            // Throw a single error listing all missing games
            if (missingGameIds.length > 0)
            {
                throw new MultipleGamesNotFoundError(missingGameIds);
            }

            existingTeam.games = games;
        }

        return this.teamRepository.save(existingTeam);
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
