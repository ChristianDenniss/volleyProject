import { Not, Repository, In } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Players } from './player.entity.js';
import { Teams } from '../teams/team.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

export class PlayerService {
    private playerRepository: Repository<Players>;
    private teamRepository: Repository<Teams>;

    constructor() {
        this.playerRepository = AppDataSource.getRepository(Players);
        this.teamRepository = AppDataSource.getRepository(Teams);
    }

    /**
     * Create a new player with validation
     */
    async createPlayer(name: string, position: string, teamId: number): Promise<Players> {
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
        newPlayer.team = team;

        return this.playerRepository.save(newPlayer);
    }

    /**
     * Get all players
     */
    async getAllPlayers(): Promise<Players[]> {
        return this.playerRepository.find({
            relations: ["team", "stats"],
        });
    }

    /**
     * Get player by ID with validation
     */
    async getPlayerById(id: number): Promise<Players> {
        if (!id) throw new MissingFieldError("Player ID");

        const player = await this.playerRepository.findOne({
            where: { id },
            relations: ["team", "stats"],
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
        teamId?: number
    ): Promise<Players> {
        if (!id) throw new MissingFieldError("Player ID");

        const player = await this.playerRepository.findOne({
            where: { id },
            relations: ["team", "stats"],
        });

        if (!player) throw new NotFoundError(`Player with ID ${id} not found`);

        if (name) player.name = name;
        
        if (position) player.position = position;

        if (teamId) {
            const team = await this.teamRepository.findOneBy({ id: teamId });
            if (!team) throw new NotFoundError(`Team with ID ${teamId} not found`);
            player.team = team;
        }

        return this.playerRepository.save(player);
    }

    /**
     * Delete a player with validation
     */
    async deletePlayer(id: number): Promise<void> {
        if (!id) throw new MissingFieldError("Player ID");

        const player = await this.playerRepository.findOne({
            where: { id },
            relations: ["team", "stats"],
        });

        if (!player) throw new NotFoundError(`Player with ID ${id} not found`);

        await this.playerRepository.remove(player);
    }

    /**
     * Get players by team ID with validation
     */
    async getPlayersByTeamId(teamId: number): Promise<Players[]> {
        if (!teamId) throw new MissingFieldError("Team ID");

        // Check if team exists
        const team = await this.teamRepository.findOneBy({ id: teamId });
        if (!team) throw new NotFoundError(`Team with ID ${teamId} not found`);

        return this.playerRepository.find({
            where: { team: { id: teamId } },
            relations: ["stats"],
        });
    }

    /**
 * Create multiple players at once with validation
 */
async createMultiplePlayers(playersData: { name: string, position: string, teamId: number }[]): Promise<Players[]> {
    // Validation for each player
    playersData.forEach(playerData => {
        if (!playerData.name) throw new MissingFieldError("Player name");
        if (!playerData.position) throw new MissingFieldError("Position");
        if (!playerData.teamId) throw new MissingFieldError("Team ID");
    });

    // Fetch teams by their ids (for batch efficiency)
    const teamIds = playersData.map(playerData => playerData.teamId);
    const teams = await this.teamRepository.findBy({ id: In(teamIds) });

    // Create players
    const newPlayers = playersData.map(data => {
        const team = teams.find(team => team.id === data.teamId);
        if (!team) throw new NotFoundError(`Team with ID ${data.teamId} not found`);

        const newPlayer = new Players();
        newPlayer.name = data.name;
        newPlayer.position = data.position;
        newPlayer.team = team;
        
        return newPlayer;
    });

    // Save all new players at once
    return this.playerRepository.save(newPlayers);
}

}