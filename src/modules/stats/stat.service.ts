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
        spikingErrors: number,
        apeKills: number,
        apeAttempts: number,
        spikeKills: number,
        spikeAttempts: number,
        assists: number,
        blocks: number,
        digs: number,
        blockFollows: number,
        aces: number,
        miscErrors: number,
        playerId: number,
        gameId: number
    ): Promise<Stats> {
        // Validation for required fields
        if (spikingErrors === undefined) throw new Error("Spiking errors is required");
        if (apeKills === undefined) throw new Error("Ape kills is required");
        if (apeAttempts === undefined) throw new Error("Ape attempts is required");
        if (spikeKills === undefined) throw new Error("Spike kills is required");
        if (spikeAttempts === undefined) throw new Error("Spike attempts is required");
        if (assists === undefined) throw new Error("Assists is required");
        if (blocks === undefined) throw new Error("Blocks is required");
        if (digs === undefined) throw new Error("Digs is required");
        if (blockFollows === undefined) throw new Error("Block follows is required");
        if (aces === undefined) throw new Error("Aces is required");
        if (miscErrors === undefined) throw new Error("Misc errors is required");
        if (!playerId) throw new Error("Player ID is required");
        if (!gameId) throw new Error("Game ID is required");

        // Validate stats are non-negative
        if (spikingErrors < 0) throw new Error("Spiking errors cannot be negative");
        if (apeKills < 0) throw new Error("Ape kills cannot be negative");
        if (apeAttempts < 0) throw new Error("Ape attempts cannot be negative");
        if (spikeKills < 0) throw new Error("Spike kills cannot be negative");
        if (spikeAttempts < 0) throw new Error("Spike attempts cannot be negative");
        if (assists < 0) throw new Error("Assists cannot be negative");
        if (blocks < 0) throw new Error("Blocks cannot be negative");
        if (digs < 0) throw new Error("Digs cannot be negative");
        if (blockFollows < 0) throw new Error("Block follows cannot be negative");
        if (aces < 0) throw new Error("Aces cannot be negative");
        if (miscErrors < 0) throw new Error("Misc errors cannot be negative");

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
        newStat.spikingErrors = spikingErrors;
        newStat.apeKills = apeKills;
        newStat.apeAttempts = apeAttempts;
        newStat.spikeKills = spikeKills;
        newStat.spikeAttempts = spikeAttempts;
        newStat.assists = assists;
        newStat.blocks = blocks;
        newStat.digs = digs;
        newStat.blockFollows = blockFollows;
        newStat.aces = aces;
        newStat.miscErrors = miscErrors;
        newStat.player = player;
        newStat.game = game;

        return this.statRepository.save(newStat);
    }

    /**
     * Update a stat entry with validation
     */
    async updateStat(
        id: number,
        spikingErrors?: number,
        apeKills?: number,
        apeAttempts?: number,
        spikeKills?: number,
        spikeAttempts?: number,
        assists?: number,
        blocks?: number,
        digs?: number,
        blockFollows?: number,
        aces?: number,
        miscErrors?: number,
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
        if (spikingErrors !== undefined) {
            if (spikingErrors < 0) throw new Error("Spiking errors cannot be negative");
            stat.spikingErrors = spikingErrors;
        }

        if (apeKills !== undefined) {
            if (apeKills < 0) throw new Error("Ape kills cannot be negative");
            stat.apeKills = apeKills;
        }

        if (apeAttempts !== undefined) {
            if (apeAttempts < 0) throw new Error("Ape attempts cannot be negative");
            stat.apeAttempts = apeAttempts;
        }

        if (spikeKills !== undefined) {
            if (spikeKills < 0) throw new Error("Spike kills cannot be negative");
            stat.spikeKills = spikeKills;
        }

        if (spikeAttempts !== undefined) {
            if (spikeAttempts < 0) throw new Error("Spike attempts cannot be negative");
            stat.spikeAttempts = spikeAttempts;
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

        if (blockFollows !== undefined) {
            if (blockFollows < 0) throw new Error("Block follows cannot be negative");
            stat.blockFollows = blockFollows;
        }

        if (aces !== undefined) {
            if (aces < 0) throw new Error("Aces cannot be negative");
            stat.aces = aces;
        }

        if (miscErrors !== undefined) {
            if (miscErrors < 0) throw new Error("Misc errors cannot be negative");
            stat.miscErrors = miscErrors;
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

            stat.game = game;
        }

        return this.statRepository.save(stat);
    }

    async getStatsByPlayerId(playerId: number): Promise<Stats[]> {
        const player = await this.playerRepository.findOne({
            where: { id: playerId },
            relations: ['team'],
        });

        if (!player) throw new Error('Player not found');

        return this.statRepository.find({
            where: { player: { id: playerId } },
            relations: ['game'], // Assuming stats are related to the game as well
        });
    }


    /**
     * Get stat by ID
     */
    async getStatById(id: number): Promise<Stats> {
        const stat = await this.statRepository.findOne({
            where: { id },
            relations: ['player', 'game'],
        });

        if (!stat) throw new Error('Stat not found');
        return stat;
    }

    /**
     * Get all stats
     */
    async getAllStats(): Promise<Stats[]> {
        return this.statRepository.find({
            relations: ['player', 'game'], // You can adjust relations based on your needs
        });
    }

    /**
     * Delete a stat entry by ID
     */
    async deleteStat(id: number): Promise<void> {
        const stat = await this.statRepository.findOne({
            where: { id },
            relations: ['player', 'game'],
        });

        if (!stat) throw new Error('Stat not found');

        await this.statRepository.remove(stat);
    }

    /**
     * Get stats by game ID
     */
    async getStatsByGameId(gameId: number): Promise<Stats[]> {
        const game = await this.gameRepository.findOne({
            where: { id: gameId },
            relations: ['teams'], // Assuming stats are related to teams
        });

        if (!game) throw new Error('Game not found');

        return this.statRepository.find({
            where: { game: { id: gameId } },
            relations: ['player'], // Assuming stats are related to the player as well
        });
    }
}
