import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Stats } from './stat.entity.js';
import { Players } from '../players/player.entity.js';
import { Games } from '../games/game.entity.js';
import { Teams } from '../teams/team.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NegativeStatError } from '../../errors/NegativeStatError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { DuplicateError } from '../../errors/DuplicateError.js';
import { In } from "typeorm";

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
        if (spikingErrors === undefined) throw new MissingFieldError("Spiking Errors");
        if (apeKills === undefined) throw new MissingFieldError("Ape kills");
        if (apeAttempts === undefined) throw new MissingFieldError("Ape attempts");
        if (spikeKills === undefined) throw new MissingFieldError("Spike kills ");
        if (spikeAttempts === undefined) throw new MissingFieldError("Spike attempts");
        if (assists === undefined) throw new MissingFieldError("Assists");
        if (blocks === undefined) throw new MissingFieldError("Block");
        if (digs === undefined) throw new MissingFieldError("Digs");
        if (blockFollows === undefined) throw new MissingFieldError("Block follows");
        if (aces === undefined) throw new MissingFieldError("Aces");
        if (miscErrors === undefined) throw new MissingFieldError("Misc errors");
        if (!playerId) throw new MissingFieldError("Player ID is required");
        if (!gameId) throw new MissingFieldError("Game ID is required");

        // Validate stats are non-negative
        if (spikingErrors < 0) throw new NegativeStatError("Spiking errors");
        if (apeKills < 0) throw new NegativeStatError("Ape kills");
        if (apeAttempts < 0) throw new NegativeStatError("Ape attempts");
        if (spikeKills < 0) throw new NegativeStatError("Spike kills");
        if (spikeAttempts < 0) throw new NegativeStatError("Spike attempts");
        if (assists < 0) throw new NegativeStatError("Assists");
        if (blocks < 0) throw new NegativeStatError("Blocks");
        if (digs < 0) throw new NegativeStatError("Digs");
        if (blockFollows < 0) throw new NegativeStatError("Block follows");
        if (aces < 0) throw new NegativeStatError("Aces");
        if (miscErrors < 0) throw new NegativeStatError("Misc errors");

        // Fetch player and game
        const player = await this.playerRepository.findOne({
            where: { id: playerId },
            relations: ["team"]
        });
        
        if (!player) throw new NotFoundError(`Player with ID: ${playerId} not found`);

        const game = await this.gameRepository.findOne({
            where: { id: gameId },
            relations: ["teams"]
        });
        
        if (!game) throw new NotFoundError(`Game with ID: ${gameId} not found`);

        // Check if player's team is part of the game
        const playerTeamId = player.team.id;
        const gameTeamIds = game.teams.map(team => team.id);
        
        if (!gameTeamIds.includes(playerTeamId)) {
            throw new ConflictError(`Player teams id; ${playerTeamId}, does not belong to the teams in the game; ${gameTeamIds}`);
        }

        // Check if stat already exists for this player and game
        const existingStat = await this.statRepository.findOne({
            where: {
                player: { id: playerId },
                game: { id: gameId }
            }
        });

        if (existingStat) {
            throw new DuplicateError("Stats");
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
        if (!id) throw new MissingFieldError("Stat ID");

        const stat = await this.statRepository.findOne({
            where: { id },
            relations: ["player", "game"],
        });

        if (!stat) throw new MissingFieldError("Stat");

        // Validate stats are non-negative if provided
        if (spikingErrors !== undefined) {
            if (spikingErrors < 0) throw new NegativeStatError("Spiking");
            stat.spikingErrors = spikingErrors;
        }

        if (apeKills !== undefined) {
            if (apeKills < 0) throw new NegativeStatError("Ape kills");
            stat.apeKills = apeKills;
        }

        if (apeAttempts !== undefined) {
            if (apeAttempts < 0) throw new NegativeStatError("Ape attempts");
            stat.apeAttempts = apeAttempts;
        }

        if (spikeKills !== undefined) {
            if (spikeKills < 0) throw new NegativeStatError("Spike kills");
            stat.spikeKills = spikeKills;
        }

        if (spikeAttempts !== undefined) {
            if (spikeAttempts < 0) throw new NegativeStatError("Spike attempts");
            stat.spikeAttempts = spikeAttempts;
        }

        if (assists !== undefined) {
            if (assists < 0) throw new NegativeStatError("Assists");
            stat.assists = assists;
        }

        if (blocks !== undefined) {
            if (blocks < 0) throw new NegativeStatError("Blocks");
            stat.blocks = blocks;
        }

        if (digs !== undefined) {
            if (digs < 0) throw new NegativeStatError("Digs");
            stat.digs = digs;
        }

        if (blockFollows !== undefined) {
            if (blockFollows < 0) throw new NegativeStatError("Block follows");
            stat.blockFollows = blockFollows;
        }

        if (aces !== undefined) {
            if (aces < 0) throw new NegativeStatError("Aces");
            stat.aces = aces;
        }

        if (miscErrors !== undefined) {
            if (miscErrors < 0) throw new NegativeStatError("Misc errors");
            stat.miscErrors = miscErrors;
        }

        // Handle player change
        if (playerId) {
            const player = await this.playerRepository.findOne({
                where: { id: playerId },
                relations: ["team"]
            });

            if (!player) throw new NotFoundError(`Player with ID: ${playerId} not found`);

            // If game is not changing, check if player's team is part of the existing game
            if (!gameId) {
                // Use find() to directly check if the player's team is in the game's teams
                const isTeamInGame = stat.game.teams.some((team: Teams) => team.id === player.team.id);
                
                if (!isTeamInGame) {
                    const gameTeamIds = stat.game.teams.map((team: Teams) => team.id); // Only used for error message
                    throw new ConflictError(`Player teams id; ${player.team.id}, does not belong to the teams in the game; ${gameTeamIds}`);
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

            if (!game) throw new NotFoundError(`Game with ID: ${gameId} not found`);

            // If player is not changing, check if existing player's team is part of the new game
            if (!playerId) {
                const playerTeamId = stat.player.team.id;
                const gameTeamIds = game.teams.map(team => team.id);
                if (!gameTeamIds.includes(playerTeamId)) 
                {
                    throw new ConflictError(`Player teams id; ${playerTeamId}, does not belong to the teams in the game; ${gameTeamIds}`);
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

        if (!player) throw new NotFoundError(`Player with ID: ${playerId} not found`);

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

        if (!stat) throw new NotFoundError(`Stat with ID:${id} not found`);
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

        if (!stat) throw new NotFoundError(`Stat with ID:${id} not found`); 

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

        if (!game) throw new NotFoundError(`Game with ID:${gameId} not found`);

        return this.statRepository.find({
            where: { game: { id: gameId } },
            relations: ['player'], // Assuming stats are related to the player as well
        });
    }
}
