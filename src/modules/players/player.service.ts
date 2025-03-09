import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source';
import { Players } from './player.entity';
import { Teams } from '../teams/team.entity';

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
        if (!name) throw new Error("Player name is required");
        if (!position) throw new Error("Position is required");
        if (!teamId) throw new Error("Team ID is required");

        // Fetch the team
        const team = await this.teamRepository.findOneBy({ id: teamId });
        if (!team) throw new Error("Team not found");

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
        if (!id) throw new Error("Player ID is required");

        const player = await this.playerRepository.findOne({
            where: { id },
            relations: ["team", "stats"],
        });

        if (!player) throw new Error("Player not found");

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
        if (!id) throw new Error("Player ID is required");

        const player = await this.playerRepository.findOne({
            where: { id },
            relations: ["team", "stats"],
        });

        if (!player) throw new Error("Player not found");

        if (name) player.name = name;
        
        if (position) player.position = position;

        if (teamId) {
            const team = await this.teamRepository.findOneBy({ id: teamId });
            if (!team) throw new Error("Team not found");
            player.team = team;
        }

        return this.playerRepository.save(player);
    }

    /**
     * Delete a player with validation
     */
    async deletePlayer(id: number): Promise<void> {
        if (!id) throw new Error("Player ID is required");

        const player = await this.playerRepository.findOne({
            where: { id },
            relations: ["team", "stats"],
        });

        if (!player) throw new Error("Player not found");

        await this.playerRepository.remove(player);
    }

    /**
     * Get players by team ID with validation
     */
    async getPlayersByTeamId(teamId: number): Promise<Players[]> {
        if (!teamId) throw new Error("Team ID is required");

        // Check if team exists
        const team = await this.teamRepository.findOneBy({ id: teamId });
        if (!team) throw new Error("Team not found");

        return this.playerRepository.find({
            where: { team: { id: teamId } },
            relations: ["stats"],
        });
    }
}