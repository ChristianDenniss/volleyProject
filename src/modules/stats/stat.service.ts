import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source';
import { Stats } from './stat.entity';
import { Players } from '../players/player.entity';
import { Games } from '../games/game.entity';

export class StatService {
    private statRepository: Repository<Stats>;
    private playerRepository: Repository<Players>;
    private gameRepository: Repository<Games>;

    constructor() {
        this.statRepository = AppDataSource.getRepository(Stats);
        this.playerRepository = AppDataSource.getRepository(Players);
        this.gameRepository = AppDataSource.getRepository(Games);
    }

    /**
     * Create a new stat entry with validation
     */
    async createStat(
        points: number,
        assists: number,
        blocks: number,
        digs: number,
        aces: number,
        playerId: number,
        gameId: number
    ): Promise<Stats> {
        // Validation for required fields
        if (points === undefined) throw new Error("Points is required");
        if (assists === undefined) throw new Error("Assists is required");
        if (blocks === undefined) throw new Error("Blocks is required");
        if (digs === undefined) throw new Error("Digs is required");
        if (aces === undefined) throw new Error("Aces is required");
        if (!playerId) throw new Error("Player ID is required");
        if (!gameId) throw new Error("Game ID is required");

        // Validate stats are non-negative
        if (points < 0) throw new Error("Points cannot be negative");
        if (assists < 0) throw new Error("Assists cannot be negative");
        if (blocks < 0) throw new Error("Blocks cannot be negative");
        if (digs < 0) throw new Error("Digs cannot be negative");
        if (aces < 0) throw new Error("Aces cannot be negative");

        // Fetch player and game
        const player = await this.playerRepository.findOne({
            where: { id: playerId },
            relations: ["team"]
        });
        
        if (!player) throw new Error("Player not found");

        const game = await this.gameRepository.findOne({
            where: { id: gameId },
            relations: ["teams"]
        });
        
        if (!game) throw new Error("Game not found");

        // Check if player's team is part of the game
        const playerTeamId = player.team.id;
        const gameTeamIds = game.teams.map(team => team.id);
        
        if (!gameTeamIds.includes(playerTeamId)) {
            throw new Error("Player's team is not part of this game");
        }

        // Check if stat already exists for this player and game
        const existingStat = await this.statRepository.findOne({
            where: {
                player: { id: playerId },
                game: { id: gameId }
            }
        });

        if (existingStat) {
            throw new Error("Stats already exist for this player in this game");
        }

        // Create new stat entry
        const newStat = new Stats();
        newStat.points = points;
        newStat.assists = assists;
        newStat.blocks = blocks;
        newStat.digs = digs;
        newStat.aces = aces;
        newStat.player = player;
        newStat.game = game;

        return this.statRepository.save(newStat);
    }

    /**
     * Get all stats
     */
    async getAllStats(): Promise<Stats[]> {
        return this.statRepository.find({
            relations: ["player", "game"],
        });
    }

    /**
     * Get stat by ID with validation
     */
    async getStatById(id: number): Promise<Stats> {
        if (!id) throw new Error("Stat ID is required");

        const stat = await this.statRepository.findOne({
            where: { id },
            relations: ["player", "game"],
        });

        if (!stat) throw new Error("Stat not found");

        return stat;
    }

    /**
     * Update a stat entry with validation
     */
    async updateStat(
        id: number,
        points?: number,
        assists?: number,
        blocks?: number,
        digs?: number,
        aces?: number,
        playerId?: number,
        gameId?: number
    ): Promise<Stats> {
        if (!id) throw new Error("Stat ID is required");

        const stat = await this.statRepository.findOne({
            where: { id },
            relations: ["player", "game"],
        });

        if (!stat) throw new Error("Stat not found");

        // Validate stats are non-negative if provided
        if (points !== undefined) {
            if (points < 0) throw new Error("Points cannot be negative");
            stat.points = points;
        }
        
        if (assists !== undefined) {
            if (assists < 0) throw new Error("Assists cannot be negative");
            stat.assists = assists;
        }
        
        if (blocks !== undefined) {
            if (blocks < 0) throw new Error("Blocks cannot be negative");
            stat.blocks = blocks;
        }
        
        if (digs !== undefined) {
            if (digs < 0) throw new Error("Digs cannot be negative");
            stat.digs = digs;
        }
        
        if (aces !== undefined) {
            if (aces < 0) throw new Error("Aces cannot be negative");
            stat.aces = aces;
        }

        // Handle player change
        if (playerId) {
            const player = await this.playerRepository.findOne({
                where: { id: playerId },
                relations: ["team"]
            });
            
            if (!player) throw new Error("Player not found");
            
            // If game is not changing, check if player's team is part of the existing game
            if (!gameId) {
                const gameTeamIds = stat.game.teams.map(team => team.id);
                if (!gameTeamIds.includes(player.team.id)) {
                    throw new Error("Player's team is not part of this game");
                }
            }
            
            stat.player = player;
        }

        // Handle game change
        if (gameId) {
            const game = await this.gameRepository.findOne({
                where: { id: gameId },
                relations: ["teams"]
            });
            
            if (!game) throw new Error("Game not found");
            
            // If player is not changing, check if existing player's team is part of the new game
            if (!playerId) {
                const playerTeamId = stat.player.team.id;
                const gameTeamIds = game.teams.map(team => team.id);
                if (!gameTeamIds.includes(playerTeamId)) {
                    throw new Error("Player's team is not part of this game");
                }
            }
            // If both player and game are changing, check if new player's team is part of new game
            else {
                const player = await this.playerRepository.findOne({
                    where: { id: playerId },
                    relations: ["team"]
                });
                
                if (player) {
                    const playerTeamId = player.team.id;
                    const gameTeamIds = game.teams.map(team => team.id);
                    if (!gameTeamIds.includes(playerTeamId)) {
                        throw new Error("Player's team is not part of this game");
                    }
                }
            }
            
            // Check if stat already exists for this player and game
            if (playerId || gameId) {
                const checkPlayerId = playerId || stat.player.id;
                const checkGameId = gameId || stat.game.id;
                
                const existingStat = await this.statRepository.findOne({
                    where: {
                        player: { id: checkPlayerId },
                        game: { id: checkGameId },
                        id: { $ne: id } as any // Not the current stat
                    }
                });

                if (existingStat) {
                    throw new Error("Stats already exist for this player in this game");
                }
            }
            
            stat.game = game;
        }

        return this.statRepository.save(stat);
    }

    /**
     * Delete a stat entry with validation
     */
    async deleteStat(id: number): Promise<void> {
        if (!id) throw new Error("Stat ID is required");

        const stat = await this.statRepository.findOne({
            where: { id },
        });

        if (!stat) throw new Error("Stat not found");

        await this.statRepository.remove(stat);
    }

    /**
     * Get stats by player ID with validation
     */
    async getStatsByPlayerId(playerId: number): Promise<Stats[]> {
        if (!playerId) throw new Error("Player ID is required");

        // Check if player exists
        const player = await this.playerRepository.findOneBy({ id: playerId });
        if (!player) throw new Error("Player not found");

        return this.statRepository.find({
            where: { player: { id: playerId } },
            relations: ["game"],
        });
    }

    /**
     * Get stats by game ID with validation
     */
    async getStatsByGameId(gameId: number): Promise<Stats[]> {
        if (!gameId) throw new Error("Game ID is required");

        // Check if game exists
        const game = await this.gameRepository.findOneBy({ id: gameId });
        if (!game) throw new Error("Game not found");

        return this.statRepository.find({
            where: { game: { id: gameId } },
            relations: ["player"],
        });
    }
}