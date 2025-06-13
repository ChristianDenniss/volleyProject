import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source.ts';
import { Stats } from './stat.entity.ts';
import { Players } from '../players/player.entity.ts';
import { Games } from '../games/game.entity.ts';
import { MissingFieldError } from '../../errors/MissingFieldError.ts';
import { NegativeStatError } from '../../errors/NegativeStatError.ts';
import { NotFoundError } from '../../errors/NotFoundError.ts';
import { ConflictError } from '../../errors/ConflictError.ts';
import { DuplicateError } from '../../errors/DuplicateError.ts';

export class StatService
{
    private statRepository: Repository<Stats>;
    private playerRepository: Repository<Players>;
    private gameRepository: Repository<Games>;

    constructor()
    {
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

        // new: setting errors count
        settingErrors: number,

        blocks: number,
        digs: number,
        blockFollows: number,
        aces: number,

        // new: serving errors count
        servingErrors: number,

        miscErrors: number,
        playerId: number,
        gameId: number
    ): Promise<Stats>
    {
        // Validation for required fields
        if (spikingErrors === undefined) throw new MissingFieldError("Spiking Errors");
        if (apeKills === undefined)      throw new MissingFieldError("Ape kills");
        if (apeAttempts === undefined)   throw new MissingFieldError("Ape attempts");
        if (spikeKills === undefined)    throw new MissingFieldError("Spike kills");
        if (spikeAttempts === undefined) throw new MissingFieldError("Spike attempts");
        if (assists === undefined)       throw new MissingFieldError("Assists");
        if (settingErrors === undefined) throw new MissingFieldError("Setting errors");
        if (blocks === undefined)        throw new MissingFieldError("Blocks");
        if (digs === undefined)          throw new MissingFieldError("Digs");
        if (blockFollows === undefined)  throw new MissingFieldError("Block follows");
        if (aces === undefined)          throw new MissingFieldError("Aces");
        if (servingErrors === undefined) throw new MissingFieldError("Serving errors");
        if (miscErrors === undefined)    throw new MissingFieldError("Misc errors");
        if (!playerId)                   throw new MissingFieldError("Player ID is required");
        if (!gameId)                     throw new MissingFieldError("Game ID is required");

        // Validate stats are non-negative
        if (spikingErrors < 0) throw new NegativeStatError("Spiking errors");
        if (apeKills < 0)      throw new NegativeStatError("Ape kills");
        if (apeAttempts < 0)   throw new NegativeStatError("Ape attempts");
        if (spikeKills < 0)    throw new NegativeStatError("Spike kills");
        if (spikeAttempts < 0) throw new NegativeStatError("Spike attempts");
        if (assists < 0)       throw new NegativeStatError("Assists");
        if (settingErrors < 0) throw new NegativeStatError("Setting errors");
        if (blocks < 0)        throw new NegativeStatError("Blocks");
        if (digs < 0)          throw new NegativeStatError("Digs");
        if (blockFollows < 0)  throw new NegativeStatError("Block follows");
        if (aces < 0)          throw new NegativeStatError("Aces");
        if (servingErrors < 0) throw new NegativeStatError("Serving errors");
        if (miscErrors < 0)    throw new NegativeStatError("Misc errors");

        // Fetch player and game
        const player = await this.playerRepository.findOne({
            where: { id: playerId },
            relations: ["teams"]
        });

        if (!player) throw new NotFoundError(`Player with ID: ${playerId} not found`);

        const game = await this.gameRepository.findOne({
            where: { id: gameId },
            relations: ["teams"]
        });

        if (!game) throw new NotFoundError(`Game with ID: ${gameId} not found`);

        // Check if player's teams are part of the game
        const playerTeamIds = player.teams.map(team => team.id);
        const gameTeamIds   = game.teams.map(team => team.id);
        const teamConflict  = playerTeamIds.some(teamId => gameTeamIds.includes(teamId));

        if (!teamConflict)
        {
            throw new ConflictError(
                `Player's teams ${playerTeamIds} do not belong to the teams in the game ${gameTeamIds}`
            );
        }

        // Check if stat already exists for this player and game
        const existingStat = await this.statRepository.findOne({
            where: {
                player: { id: playerId },
                game:   { id: gameId }
            }
        });

        if (existingStat)
        {
            throw new DuplicateError("Stats");
        }

        // Create new stat entry
        const newStat = new Stats();
        newStat.spikingErrors  = spikingErrors;
        newStat.apeKills       = apeKills;
        newStat.apeAttempts    = apeAttempts;
        newStat.spikeKills     = spikeKills;
        newStat.spikeAttempts  = spikeAttempts;
        newStat.assists        = assists;
        newStat.settingErrors  = settingErrors;
        newStat.blocks         = blocks;
        newStat.digs           = digs;
        newStat.blockFollows   = blockFollows;
        newStat.aces           = aces;
        newStat.servingErrors  = servingErrors;
        newStat.miscErrors     = miscErrors;
        newStat.player         = player;
        newStat.game           = game;

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

        // new: setting errors
        settingErrors?: number,

        blocks?: number,
        digs?: number,
        blockFollows?: number,
        aces?: number,

        // new: serving errors
        servingErrors?: number,

        miscErrors?: number,
        playerId?: number,
        gameId?: number
    ): Promise<Stats>
    {
        if (!id) throw new MissingFieldError("Stat ID");

        const stat = await this.statRepository.findOne({
            where: { id },
            relations: ["player", "game"]
        });

        if (!stat) throw new NotFoundError(`Stat with ID: ${id} not found`);

        // Validate and assign provided fields
        if (spikingErrors !== undefined)
        {
            if (spikingErrors < 0) throw new NegativeStatError("Spiking errors");
            stat.spikingErrors = spikingErrors;
        }

        if (apeKills !== undefined)
        {
            if (apeKills < 0) throw new NegativeStatError("Ape kills");
            stat.apeKills = apeKills;
        }

        if (apeAttempts !== undefined)
        {
            if (apeAttempts < 0) throw new NegativeStatError("Ape attempts");
            stat.apeAttempts = apeAttempts;
        }

        if (spikeKills !== undefined)
        {
            if (spikeKills < 0) throw new NegativeStatError("Spike kills");
            stat.spikeKills = spikeKills;
        }

        if (spikeAttempts !== undefined)
        {
            if (spikeAttempts < 0) throw new NegativeStatError("Spike attempts");
            stat.spikeAttempts = spikeAttempts;
        }

        if (assists !== undefined)
        {
            if (assists < 0) throw new NegativeStatError("Assists");
            stat.assists = assists;
        }

        if (settingErrors !== undefined)
        {
            if (settingErrors < 0) throw new NegativeStatError("Setting errors");
            stat.settingErrors = settingErrors;
        }

        if (blocks !== undefined)
        {
            if (blocks < 0) throw new NegativeStatError("Blocks");
            stat.blocks = blocks;
        }

        if (digs !== undefined)
        {
            if (digs < 0) throw new NegativeStatError("Digs");
            stat.digs = digs;
        }

        if (blockFollows !== undefined)
        {
            if (blockFollows < 0) throw new NegativeStatError("Block follows");
            stat.blockFollows = blockFollows;
        }

        if (aces !== undefined)
        {
            if (aces < 0) throw new NegativeStatError("Aces");
            stat.aces = aces;
        }

        if (servingErrors !== undefined)
        {
            if (servingErrors < 0) throw new NegativeStatError("Serving errors");
            stat.servingErrors = servingErrors;
        }

        if (miscErrors !== undefined)
        {
            if (miscErrors < 0) throw new NegativeStatError("Misc errors");
            stat.miscErrors = miscErrors;
        }

        // Handle player change
        if (playerId)
        {
            const player = await this.playerRepository.findOne({
                where: { id: playerId },
                relations: ["teams"]
            });

            if (!player) throw new NotFoundError(`Player with ID: ${playerId} not found`);

            // If gameId not being changed, ensure team match
            if (!gameId)
            {
                const isTeamInGame = stat.game.teams.some(
                    team => player.teams.some(pTeam => pTeam.id === team.id)
                );

                if (!isTeamInGame)
                {
                    const gameTeamIds = stat.game.teams.map(team => team.id);
                    throw new ConflictError(
                        `Player's teams ${player.teams.map(t => t.id)} ` +
                        `do not belong to the teams in the game ${gameTeamIds}`
                    );
                }
            }

            stat.player = player;
        }

        // Handle game change
        if (gameId)
        {
            const game = await this.gameRepository.findOne({
                where: { id: gameId },
                relations: ["teams"]
            });

            if (!game) throw new NotFoundError(`Game with ID: ${gameId} not found`);

            const gameTeamIds   = game.teams.map(team => team.id);
            const playerTeamIds = stat.player.teams.map(team => team.id);
            const validTeam     = playerTeamIds.some(id => gameTeamIds.includes(id));

            if (!validTeam)
            {
                throw new ConflictError(`Player's teams do not match the teams in the game.`);
            }

            stat.game = game;
        }

        return this.statRepository.save(stat);
    }

    /**
     * Get all stats for a given player and game
     */
    async getStatsByPlayerAndGame(playerId: number, gameId: number): Promise<Stats[]>
    {
        const player = await this.playerRepository.findOne({
            where: { id: playerId },
            relations: ["teams"]
        });

        if (!player) throw new NotFoundError(`Player with ID: ${playerId} not found`);

        const game = await this.gameRepository.findOne({
            where: { id: gameId },
            relations: ["teams"]
        });

        if (!game) throw new NotFoundError(`Game with ID: ${gameId} not found`);

        return this.statRepository.find({
            where: {
                player: { id: playerId },
                game:   { id: gameId }
            }
        });
    }

    /**
     * Get a stat by its ID
     */
    async getStatById(id: number): Promise<Stats>
    {
        const stat = await this.statRepository.findOne({
            where: { id },
            relations: ["player", "game"]
        });

        if (!stat) throw new NotFoundError(`Stat with ID: ${id} not found`);

        return stat;
    }

    /**
     * Get all stats
     */
    async getAllStats(): Promise<Stats[]>
    {
        return this.statRepository.find({
            relations: ["player", "game"]
        });
    }

    /**
     * Get stats for a given player
     */
    async getStatsByPlayerId(playerId: number): Promise<Stats[]>
    {
        return this.statRepository.find({
            where: { player: { id: playerId } },
            relations: ["game"]
        });
    }

    /**
     * Get stats for a given game
     */
    async getStatsByGameId(gameId: number): Promise<Stats[]>
    {
        return this.statRepository.find({
            where: { game: { id: gameId } },
            relations: ["player"]
        });
    }

    /**
     * Delete a stat
     */
    async deleteStat(id: number): Promise<void>
    {
        const stat = await this.statRepository.findOne({
            where: { id },
            relations: ["player", "game"]
        });

        if (!stat) throw new NotFoundError(`Stat with ID: ${id} not found`);

        await this.statRepository.remove(stat);
    }

    /**
     * Get stats for all players in a game
     */
    async getStatsByGame(gameId: number): Promise<Stats[]>
    {
        const game = await this.gameRepository.findOne({
            where: { id: gameId },
            relations: ["teams"]
        });

        if (!game) throw new NotFoundError(`Game with ID: ${gameId} not found`);

        return this.statRepository.find({
            where: { game: { id: gameId } }
        });
    }

    /**
     * Create a new stat entry by player username (instead of ID), with validation
     */
    async createStatByUsername
    (
        spikingErrors: number,
        apeKills: number,
        apeAttempts: number,
        spikeKills: number,
        spikeAttempts: number,
        assists: number,

        // new: setting errors count
        settingErrors: number,

        blocks: number,
        digs: number,
        blockFollows: number,
        aces: number,

        // new: serving errors count
        servingErrors: number,

        miscErrors: number,
        username: string,
        gameId: number
    ): Promise<Stats>
    {
        // Required-field validation
        if (spikingErrors === undefined)      throw new MissingFieldError("Spiking Errors");
        if (apeKills === undefined)           throw new MissingFieldError("Ape kills");
        if (apeAttempts === undefined)        throw new MissingFieldError("Ape attempts");
        if (spikeKills === undefined)         throw new MissingFieldError("Spike kills");
        if (spikeAttempts === undefined)      throw new MissingFieldError("Spike attempts");
        if (assists === undefined)            throw new MissingFieldError("Assists");
        if (settingErrors === undefined)      throw new MissingFieldError("Setting errors");
        if (blocks === undefined)             throw new MissingFieldError("Blocks");
        if (digs === undefined)               throw new MissingFieldError("Digs");
        if (blockFollows === undefined)       throw new MissingFieldError("Block follows");
        if (aces === undefined)               throw new MissingFieldError("Aces");
        if (servingErrors === undefined)      throw new MissingFieldError("Serving errors");
        if (miscErrors === undefined)         throw new MissingFieldError("Misc errors");
        if (!username)                        throw new MissingFieldError("Player username");
        if (!gameId)                          throw new MissingFieldError("Game ID");

        // Non-negative validation
        if (spikingErrors < 0) throw new NegativeStatError("Spiking errors");
        if (apeKills < 0)      throw new NegativeStatError("Ape kills");
        if (apeAttempts < 0)   throw new NegativeStatError("Ape attempts");
        if (spikeKills < 0)    throw new NegativeStatError("Spike kills");
        if (spikeAttempts < 0) throw new NegativeStatError("Spike attempts");
        if (assists < 0)       throw new NegativeStatError("Assists");
        if (settingErrors < 0) throw new NegativeStatError("Setting errors");
        if (blocks < 0)        throw new NegativeStatError("Blocks");
        if (digs < 0)          throw new NegativeStatError("Digs");
        if (blockFollows < 0)  throw new NegativeStatError("Block follows");
        if (aces < 0)          throw new NegativeStatError("Aces");
        if (servingErrors < 0) throw new NegativeStatError("Serving errors");
        if (miscErrors < 0)    throw new NegativeStatError("Misc errors");

        // Fetch player by username
        const player = await this.playerRepository.findOne({
            where: { name: username },
            relations: ["teams"]
        });

        if (!player) throw new NotFoundError(`Player with username "${username}" not found`);

        // Fetch game
        const game = await this.gameRepository.findOne({
            where: { id: gameId },
            relations: ["teams"]
        });

        if (!game) throw new NotFoundError(`Game with ID: ${gameId} not found`);

        // Confirm player is on one of the game's teams
        const playerTeamIds = player.teams.map(t => t.id);
        const gameTeamIds   = game.teams.map(t => t.id);

        if (!playerTeamIds.some(id => gameTeamIds.includes(id)))
        {
            throw new ConflictError(
                `Player "${username}" (teams: ${playerTeamIds}) not on any of the game's teams (${gameTeamIds})`
            );
        }

        // Prevent duplicate stats
        const existing = await this.statRepository.findOne({
            where: {
                player: { id: player.id },
                game:   { id: game.id }
            }
        });

        if (existing) throw new DuplicateError("Stats");

        // Create and save
        const stat = new Stats();
        stat.spikingErrors  = spikingErrors;
        stat.apeKills       = apeKills;
        stat.apeAttempts    = apeAttempts;
        stat.spikeKills     = spikeKills;
        stat.spikeAttempts  = spikeAttempts;
        stat.assists        = assists;
        stat.settingErrors  = settingErrors;
        stat.blocks         = blocks;
        stat.digs           = digs;
        stat.blockFollows   = blockFollows;
        stat.aces           = aces;
        stat.servingErrors  = servingErrors;
        stat.miscErrors     = miscErrors;
        stat.player         = player;
        stat.game           = game;

        return this.statRepository.save(stat);
    }
}
