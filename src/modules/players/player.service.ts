import { Not, Repository, In } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Players } from './player.entity.js';
import { Teams } from '../teams/team.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

export class PlayerService 
{
    private playerRepository: Repository<Players>;
    private teamRepository: Repository<Teams>;

    constructor() 
    {
        this.playerRepository = AppDataSource.getRepository(Players);
        this.teamRepository = AppDataSource.getRepository(Teams);
    }

    /**
     * Create a new player with validation
     */
    async createPlayer(name: string, position: string, teamId: number): Promise<Players> 
    {
        // Validation
        if (!name) throw new MissingFieldError("Player name");
        if (!position) throw new MissingFieldError("Position");
        if (!teamId) throw new MissingFieldError("Team ID");

        // Fetch the team
        const team = await this.teamRepository.findOneBy({ id: teamId });
        if (!team) throw new NotFoundError(`Team with ID ${teamId} not found`);

        // Create new player
        const newPlayer = new Players();
        newPlayer.name = name;
        newPlayer.position = position;
        newPlayer.teams = [team]; // Associate player with team via the many-to-many relation

        return this.playerRepository.save(newPlayer);
    }

    /**
     * Create a new player using team name with validation, including duplicate check
     */
    async createPlayerByName(name: string, position: string, teamName: string): Promise<Players> 
    {
        if (!name) throw new MissingFieldError("Player name");
        if (!position) throw new MissingFieldError("Position");
        if (!teamName) throw new MissingFieldError("Team Name");

        // Fetch the team by name
        const team = await this.teamRepository.findOne({ where: { name: teamName } });
        if (!team) throw new NotFoundError(`Team "${teamName}" not found`);

        // Check if a player with the same name already exists on the same team
        const existingPlayer = await this.playerRepository.findOne({
            where: { name: name, teams: { id: team.id } },
        });

        if (existingPlayer) {
            throw new Error(`Player with name "${name}" already exists on team "${teamName}"`);
        }

        // Create new player
        const newPlayer = new Players();
        newPlayer.name = name;
        newPlayer.position = position;
        newPlayer.teams = [team]; // Associate player with team via the many-to-many relation

        return this.playerRepository.save(newPlayer);
    }

    /**
     * Get the list of team names or IDs associated with a player by their name
     */
    async getTeamsByPlayerName(playerName: string): Promise<string[]> 
    {
        if (!playerName) throw new MissingFieldError("Player name");

        // Find the player by name with related teams
        const player = await this.playerRepository.findOne({
            where: { name: playerName },
            relations: ["teams"], // Fetch related teams
        });

        if (!player) throw new NotFoundError(`Player with name "${playerName}" not found`);

        // Extract and return the team names or IDs
        const teamNames = player.teams.map(team => team.name); // If you want names
        // const teamIds = player.teams.map(team => team.id); // If you want IDs

        return teamNames; // or return teamIds for IDs
    }


    /**
     * Get all players
     */
    async getAllPlayers(): Promise<Players[]> 
    {
        return this.playerRepository.find({
            relations: ["teams", "stats"], // Fetch related teams and stats
        });
    }

    /**
     * Get player by ID with validation
     */
    async getPlayerById(id: number): Promise<Players> 
    {
        if (!id) throw new MissingFieldError("Player ID");

        const player = await this.playerRepository.findOne({
            where: { id },
            relations: ["teams", "stats"], // Fetch related teams and stats
        });

        if (!player) throw new NotFoundError(`Player with ID ${id} not found`);

        return player;
    }

    /**
     * Update a player with validation
     */
    async updatePlayer(
        id: number, 
        name?: string, 
        jerseyNumber?: number, 
        position?: string, 
        teamIds?: number[] // Updated to accept multiple team IDs
    ): Promise<Players> {
        if (!id) throw new MissingFieldError("Player ID");

        const player = await this.playerRepository.findOne({
            where: { id },
            relations: ["teams", "stats"],
        });

        if (!player) throw new NotFoundError(`Player with ID ${id} not found`);

        if (name) player.name = name;
        
        if (position) player.position = position;

        if (teamIds && teamIds.length > 0) 
        {
            // Fetch teams by their IDs
            const teams = await this.teamRepository.findBy({ id: In(teamIds) });
            if (teams.length !== teamIds.length) 
                throw new NotFoundError(`One or more teams not found for the provided IDs`);

            player.teams = teams; // Update the many-to-many relationship with teams
        }

        return this.playerRepository.save(player);
    }

    /**
     * Delete a player with validation
     */
    async deletePlayer(id: number): Promise<void> 
    {
        if (!id) throw new MissingFieldError("Player ID");

        const player = await this.playerRepository.findOne({
            where: { id },
            relations: ["teams", "stats"],
        });

        if (!player) throw new NotFoundError(`Player with ID ${id} not found`);

        await this.playerRepository.remove(player);
    }

    /**
     * Get players by team ID with validation
     */
    async getPlayersByTeamId(teamId: number): Promise<Players[]> 
    {
        if (!teamId) throw new MissingFieldError("Team ID");

        // Check if team exists
        const team = await this.teamRepository.findOneBy({ id: teamId });
        if (!team) throw new NotFoundError(`Team with ID ${teamId} not found`);

        return this.playerRepository.find({
            where: { teams: { id: teamId } },
            relations: ["stats"], // Fetch related stats
        });
    }

    /**
     * Create multiple players at once with validation, including duplicate check
     */
    async createMultiplePlayers(playersData: { name: string, position: string, teamIds: number[] }[]): Promise<Players[]> 
    {
        // Validation for each player
        playersData.forEach(playerData => {
            if (!playerData.name) throw new MissingFieldError("Player name");
            if (!playerData.position) throw new MissingFieldError("Position");
            if (!playerData.teamIds || playerData.teamIds.length === 0) throw new MissingFieldError("Team IDs");
        });

        // Fetch teams by their ids (for batch efficiency)
        const teamIds = playersData.flatMap(playerData => playerData.teamIds);
        const teams = await this.teamRepository.findBy({ id: In(teamIds) });

        // Check for duplicate players (same name, same teams)
        for (const playerData of playersData) {
            const existingPlayer = await this.playerRepository.findOne({
                where: { name: playerData.name, teams: { id: In(playerData.teamIds) } },
            });
            if (existingPlayer) {
                throw new Error(`Player with name "${playerData.name}" already exists on one of the teams`);
            }
        }

        // Create players
        const newPlayers = playersData.map(data => {
            const playerTeams = teams.filter(team => data.teamIds.includes(team.id));

            const newPlayer = new Players();
            newPlayer.name = data.name;
            newPlayer.position = data.position;
            newPlayer.teams = playerTeams; // Associate player with multiple teams

            return newPlayer;
        });

        // Save all new players at once
        return this.playerRepository.save(newPlayers);
    }

    /**
     * Create multiple players at once using team name with validation, including duplicate check
     */
    async createMultiplePlayersByName(playersData: { name: string, position: string, teamNames: string[] }[]): Promise<Players[]> 
    {
        // Log the incoming request data
        console.log('Received players data:', playersData);

        // Validate input
        playersData.forEach(playerData => {
            console.log('Validating player:', playerData);  // Log each player being validated
            
            if (!playerData.name) {
                console.log('Validation failed for player:', playerData.name, ' - Missing name');
                throw new MissingFieldError("Player name");
            } 

            if (!playerData.position) {
                console.log('Validation failed for player:', playerData.name, ' - Missing position');
                throw new MissingFieldError("Position");
            }

            if (!playerData.teamNames || playerData.teamNames.length === 0) {
                console.log('Validation failed for player:', playerData.name, ' - Missing team names');
                throw new MissingFieldError("Team Names");
            }
        });

        // Collect all unique team names
        const allTeamNames = [...new Set(playersData.flatMap(p => p.teamNames))];
        console.log('Unique team names to search:', allTeamNames);

        // Fetch all teams by name
        const allTeams = await this.teamRepository.findBy({ name: In(allTeamNames) });
        console.log('Fetched teams:', allTeams);

        const createdOrUpdatedPlayers: Players[] = [];

        for (const playerData of playersData) 
        {
            console.log('Processing player:', playerData.name);
            
            const playerTeams = allTeams.filter(team => playerData.teamNames.includes(team.name));
            
            // Log the teams that were matched for the player
            console.log('Matched teams for player', playerData.name, ':', playerTeams);

            if (playerTeams.length !== playerData.teamNames.length) 
            {
                console.log('Error: Some teams not found for player:', playerData.name);
                throw new NotFoundError(`One or more teams not found for player "${playerData.name}"`);
            }

            // Check if player already exists
            let player = await this.playerRepository.findOne({
                where: { name: playerData.name },
                relations: ["teams"],
            });
            console.log('Found player:', player ? player.name : 'No player found');

            if (player) 
            {
                // Find which teams are new
                const newTeams = playerTeams.filter(team => 
                    !player.teams.some(existing => existing.id === team.id)
                );
                console.log('New teams to be added to player', playerData.name, ':', newTeams);

                // Skip player if all teams are already assigned
                if (newTeams.length === 0) 
                {
                    console.log('No new teams to add for player:', playerData.name);
                    continue;
                }

                // Add only new teams
                player.teams.push(...newTeams);
                console.log('Updated player with new teams:', playerData.name);
                createdOrUpdatedPlayers.push(await this.playerRepository.save(player));
            } 
            else 
            {
                // Create new player with all teams
                const newPlayer = new Players();
                newPlayer.name = playerData.name;
                newPlayer.position = playerData.position;
                newPlayer.teams = playerTeams;
                console.log('Creating new player:', playerData.name);
                createdOrUpdatedPlayers.push(await this.playerRepository.save(newPlayer));
            }
        }

        // Log the result of the creation or update process
        console.log('Created or updated players:', createdOrUpdatedPlayers);

        return createdOrUpdatedPlayers;
    }

}
