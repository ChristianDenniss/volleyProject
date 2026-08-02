import { Repository, QueryRunner } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Records } from './records.entity.js';
import { Players } from '../players/player.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import { Stats } from '../stats/stat.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { OutOfBoundsError } from '../../errors/OutOfBoundsError.js';
import { DuplicateError } from '../../errors/DuplicateError.js';
import { CreateRecordDto, UpdateRecordDto } from './records.schema.js';
import { PaginationParams } from '../../utils/pagination.js';

export interface RecordFilters {
    regionId?: number;
    type?: 'game' | 'season';
    recordCategory?: string;
}

interface GameRecordRow {
    playerId: number;
    gameId: number;
    seasonId: number;
    regionId: number;
    gameDate: Date;
    value: string | number;
}

interface SeasonRecordRow {
    playerId: number;
    seasonId: number;
    regionId: number;
    seasonStartDate: Date;
    value: string | number;
}

const GAME_STAT_COLUMNS: Record<string, string> = {
    'most spike kills': 's."spikeKills"',
    'most assists': 's."assists"',
    'most ape kills': 's."apeKills"',
    'most digs': 's."digs"',
    'most block follows': 's."blockFollows"',
    'most blocks': 's."blocks"',
    'most aces': 's."aces"',
    'most serve errors': 's."servingErrors"',
    'most misc errors': 's."miscErrors"',
    'most set errors': 's."settingErrors"',
    'most spike errors': 's."spikingErrors"',
    'most spike attempts': 's."spikeAttempts"',
    'most ape attempts': 's."apeAttempts"',
};

const GAME_AGGREGATED_EXPRESSIONS: Record<string, string> = {
    'most total kills': '(s."spikeKills" + s."apeKills")',
    'most total attempts': '(s."spikeAttempts" + s."apeAttempts")',
    'most total errors': '(s."spikingErrors" + s."servingErrors" + s."settingErrors" + s."miscErrors")',
};

const SEASON_STAT_EXPRESSIONS: Record<string, string> = {
    'most spike kills': 'SUM(s."spikeKills")',
    'most assists': 'SUM(s."assists")',
    'most ape kills': 'SUM(s."apeKills")',
    'most digs': 'SUM(s."digs")',
    'most block follows': 'SUM(s."blockFollows")',
    'most blocks': 'SUM(s."blocks")',
    'most aces': 'SUM(s."aces")',
    'most serve errors': 'SUM(s."servingErrors")',
    'most misc errors': 'SUM(s."miscErrors")',
    'most set errors': 'SUM(s."settingErrors")',
    'most spike errors': 'SUM(s."spikingErrors")',
    'most spike attempts': 'SUM(s."spikeAttempts")',
    'most ape attempts': 'SUM(s."apeAttempts")',
};

const SEASON_AGGREGATED_EXPRESSIONS: Record<string, string> = {
    'most total kills': '(SUM(s."spikeKills") + SUM(s."apeKills"))',
    'most total attempts': '(SUM(s."spikeAttempts") + SUM(s."apeAttempts"))',
    'most total errors': '(SUM(s."spikingErrors") + SUM(s."servingErrors") + SUM(s."settingErrors") + SUM(s."miscErrors"))',
};

const GAME_TOTAL_SPIKING_PCT = `((s."spikeKills" + s."apeKills")::decimal / NULLIF(s."spikeAttempts" + s."apeAttempts", 0)) * 100`;

const SEASON_TOTAL_SPIKING_PCT = `((SUM(s."spikeKills") + SUM(s."apeKills"))::decimal / NULLIF(SUM(s."spikeAttempts") + SUM(s."apeAttempts"), 0)) * 100`;

export class RecordService {
    private recordRepository: Repository<Records>;
    private playerRepository: Repository<Players>;
    private seasonRepository: Repository<Seasons>;
    private statRepository: Repository<Stats>;

    constructor() {
        this.recordRepository = AppDataSource.getRepository(Records);
        this.playerRepository = AppDataSource.getRepository(Players);
        this.seasonRepository = AppDataSource.getRepository(Seasons);
        this.statRepository = AppDataSource.getRepository(Stats);
    }

    /**
     * Create a new record with validation
     */
    async createRecord(recordData: CreateRecordDto): Promise<Records> {
        // Validation
        if (!recordData.record) throw new MissingFieldError("Record type");
        if (!recordData.type) throw new MissingFieldError("Record type (game/season)");
        if (!recordData.rank) throw new MissingFieldError("Rank");
        if (recordData.value === undefined) throw new MissingFieldError("Value");
        if (!recordData.seasonId) throw new MissingFieldError("Season ID");
        if (!recordData.playerId) throw new MissingFieldError("Player ID");

        // Validate rank range
        if (recordData.rank < 1 || recordData.rank > 10) {
            throw new OutOfBoundsError("Rank must be between 1 and 10");
        }

        // Fetch the player
        const player = await this.playerRepository.findOneBy({ id: recordData.playerId });
        if (!player) throw new NotFoundError(`Player with ID ${recordData.playerId} not found`);

        // Fetch the season
        const season = await this.seasonRepository.findOneBy({ id: recordData.seasonId });
        if (!season) throw new NotFoundError(`Season with ID ${recordData.seasonId} not found`);



        // Check if a record already exists for this combination
        const existingRecord = await this.recordRepository.findOne({
            where: {
                record: recordData.record,
                type: recordData.type,
                rank: recordData.rank,
                season: { id: recordData.seasonId }
            }
        });

        if (existingRecord) {
            throw new DuplicateError(`Record already exists for ${recordData.record} (${recordData.type}) at rank ${recordData.rank} in season ${recordData.seasonId}`);
        }

        // Create new record
        const newRecord = new Records();
        newRecord.record = recordData.record;
        newRecord.type = recordData.type;
        newRecord.rank = recordData.rank;
        newRecord.value = recordData.value;
        newRecord.date = recordData.date ? new Date(recordData.date) : new Date();
        newRecord.season = season;
        newRecord.player = player;
        newRecord.regionId = season.regionId;

        return this.recordRepository.save(newRecord);
    }

    /**
     * Get all records
     */
    async getAllRecords(pagination: PaginationParams, filters: RecordFilters = {}): Promise<[Records[], number]> {
        const where: { regionId?: number; type?: string; record?: string } = {};
        if (filters.regionId) where.regionId = filters.regionId;
        if (filters.type) where.type = filters.type;
        if (filters.recordCategory) where.record = filters.recordCategory;

        return this.recordRepository.findAndCount({
            where,
            relations: ["player", "season", "region"],
            order: { record: 'ASC', rank: 'ASC' },
            skip: pagination.skip,
            take: pagination.take
        });
    }

    /**
     * Get records by season
     */
    async getRecordsBySeason(seasonId: number, pagination: PaginationParams): Promise<[Records[], number]> {
        if (!seasonId) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) throw new NotFoundError(`Season with ID ${seasonId} not found`);

        return this.recordRepository.findAndCount({
            where: { season: { id: seasonId } },
            relations: ["player", "season"],
            order: { record: "ASC", rank: "ASC" },
            skip: pagination.skip,
            take: pagination.take
        });
    }

    /**
     * Get records by record type
     */
    async getRecordsByType(recordType: string, pagination: PaginationParams): Promise<[Records[], number]> {
        if (!recordType) throw new MissingFieldError("Record type");

        return this.recordRepository.findAndCount({
            where: { record: recordType },
            relations: ["player", "season"],
            order: { rank: "ASC" },
            skip: pagination.skip,
            take: pagination.take
        });
    }

    /**
     * Get records by player
     */
    async getRecordsByPlayer(playerId: number, pagination: PaginationParams): Promise<[Records[], number]> {
        if (!playerId) throw new MissingFieldError("Player ID");

        const player = await this.playerRepository.findOneBy({ id: playerId });
        if (!player) throw new NotFoundError(`Player with ID ${playerId} not found`);

        return this.recordRepository.findAndCount({
            where: { player: { id: playerId } },
            relations: ["player", "season"],
            order: { record: "ASC", rank: "ASC" },
            skip: pagination.skip,
            take: pagination.take
        });
    }

    /**
     * Get record by ID
     */
    async getRecordById(id: number): Promise<Records> {
        if (!id) throw new MissingFieldError("Record ID");

        const record = await this.recordRepository.findOne({
            where: { id },
            relations: ["player", "season"],
        });

        if (!record) throw new NotFoundError(`Record with ID ${id} not found`);

        return record;
    }

    /**
     * Update a record
     */
    async updateRecord(id: number, updateData: UpdateRecordDto): Promise<Records> {
        if (!id) throw new MissingFieldError("Record ID");

        const record = await this.recordRepository.findOne({
            where: { id },
            relations: ["player", "season"],
        });

        if (!record) throw new NotFoundError(`Record with ID ${id} not found`);

        // Update fields if provided
        if (updateData.record !== undefined) record.record = updateData.record;
        if (updateData.type !== undefined) record.type = updateData.type;
        if (updateData.rank !== undefined) {
            if (updateData.rank < 1 || updateData.rank > 10) {
                throw new OutOfBoundsError("Rank must be between 1 and 10");
            }
            record.rank = updateData.rank;
        }
        if (updateData.value !== undefined) record.value = updateData.value;

        // Update relationships if provided
        if (updateData.seasonId) {
            const season = await this.seasonRepository.findOneBy({ id: updateData.seasonId });
            if (!season) throw new NotFoundError(`Season with ID ${updateData.seasonId} not found`);
            record.season = season;
        }

        if (updateData.playerId) {
            const player = await this.playerRepository.findOneBy({ id: updateData.playerId });
            if (!player) throw new NotFoundError(`Player with ID ${updateData.playerId} not found`);
            record.player = player;
        }



        return this.recordRepository.save(record);
    }

    /**
     * Delete a record
     */
    async deleteRecord(id: number): Promise<void> {
        if (!id) throw new MissingFieldError("Record ID");

        const record = await this.recordRepository.findOne({
            where: { id },
            relations: ["player", "season"],
        });

        if (!record) throw new NotFoundError(`Record with ID ${id} not found`);

        await this.recordRepository.remove(record);
    }

    /**
     * Get top 10 records for a specific record type and season
     */
    async getTop10Records(recordType: string, seasonId: number): Promise<Records[]> {
        if (!recordType) throw new MissingFieldError("Record type");
        if (!seasonId) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) throw new NotFoundError(`Season with ID ${seasonId} not found`);

        return this.recordRepository.find({
            where: { record: recordType, season: { id: seasonId } },
            relations: ["player", "season"],
            order: { rank: "ASC" },
            take: 10
        });
    }

    /**
     * Calculate and update all records across all seasons
     */
    async calculateAllRecords(): Promise<{ message: string; recordsCreated: number }> {
        const statCount = await this.statRepository.count();
        if (statCount === 0) {
            throw new NotFoundError("No stats found in the database");
        }

        const qr = AppDataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        let recordsCreated = 0;

        try {
            const recordTypes = [
                'most spike kills', 'most assists', 'most ape kills', 'most digs', 'most block follows',
                'most blocks', 'most aces', 'most serve errors', 'most misc errors', 'most set errors',
                'most spike errors', 'most spike attempts', 'most ape attempts'
            ];

            for (const recordType of recordTypes) {
                const top10 = await this.fetchTop10GameStatRecords(qr, recordType);
                await qr.manager.delete(Records, { record: recordType, type: 'game' });
                const newRecords = top10.map((row, i) => this.buildGameRecord(recordType, i + 1, row));
                if (newRecords.length > 0) {
                    await qr.manager.save(Records, newRecords);
                    recordsCreated += newRecords.length;
                }
            }

            const aggregatedRecordTypes = [
                'most total kills', 'most total attempts', 'most total errors'
            ];

            for (const recordType of aggregatedRecordTypes) {
                const top10 = await this.fetchTop10GameAggregatedRecords(qr, recordType);
                await qr.manager.delete(Records, { record: recordType, type: 'game' });
                const newRecords = top10.map((row, i) => this.buildGameRecord(recordType, i + 1, row));
                if (newRecords.length > 0) {
                    await qr.manager.save(Records, newRecords);
                    recordsCreated += newRecords.length;
                }
            }

            for (const recordType of recordTypes) {
                const top10 = await this.fetchTop10SeasonStatRecords(qr, recordType);
                await qr.manager.delete(Records, { record: recordType, type: 'season' });
                const newRecords = top10.map((row, i) => this.buildSeasonRecord(recordType, i + 1, row));
                if (newRecords.length > 0) {
                    await qr.manager.save(Records, newRecords);
                    recordsCreated += newRecords.length;
                }
            }

            for (const recordType of aggregatedRecordTypes) {
                const top10 = await this.fetchTop10SeasonAggregatedRecords(qr, recordType);
                await qr.manager.delete(Records, { record: recordType, type: 'season' });
                const newRecords = top10.map((row, i) => this.buildSeasonRecord(recordType, i + 1, row));
                if (newRecords.length > 0) {
                    await qr.manager.save(Records, newRecords);
                    recordsCreated += newRecords.length;
                }
            }

            const singleGamePercentageRecordTypes = [
                'best total spiking % with 10+ attempts', 'best total spiking % with 20+ attempts', 'best total spiking % with 30+ attempts',
                'best total spiking % with 40+ attempts', 'best total spiking % with 50+ attempts', 'best total spiking % with 60+ attempts'
            ];

            for (const recordType of singleGamePercentageRecordTypes) {
                const minAttempts = this.extractMinAttempts(recordType);
                const top10 = await this.fetchTop10GameSpikingPercentageRecords(qr, minAttempts);
                if (top10.length === 0) continue;

                await qr.manager.delete(Records, { record: recordType, type: 'game' });
                const newRecords = top10.map((row, i) => this.buildGameRecord(recordType, i + 1, row));
                await qr.manager.save(Records, newRecords);
                recordsCreated += newRecords.length;
            }

            const seasonPercentageRecordTypes = [
                'best total spiking % with 60+ attempts', 'best total spiking % with 70+ attempts', 'best total spiking % with 80+ attempts',
                'best total spiking % with 90+ attempts', 'best total spiking % with 100+ attempts', 'best total spiking % with 110+ attempts',
                'best total spiking % with 120+ attempts', 'best total spiking % with 130+ attempts', 'best total spiking % with 140+ attempts',
                'best total spiking % with 150+ attempts', 'best total spiking % with 160+ attempts', 'best total spiking % with 170+ attempts',
                'best total spiking % with 180+ attempts', 'best total spiking % with 190+ attempts', 'best total spiking % with 200+ attempts',
                'best total spiking % with 210+ attempts', 'best total spiking % with 220+ attempts', 'best total spiking % with 230+ attempts',
                'best total spiking % with 240+ attempts', 'best total spiking % with 250+ attempts'
            ];

            for (const recordType of seasonPercentageRecordTypes) {
                const minAttempts = this.extractMinAttempts(recordType);
                const top10 = await this.fetchTop10SeasonSpikingPercentageRecords(qr, minAttempts);
                if (top10.length === 0) continue;

                await qr.manager.delete(Records, { record: recordType, type: 'season' });
                const newRecords = top10.map((row, i) => this.buildSeasonRecord(recordType, i + 1, row));
                await qr.manager.save(Records, newRecords);
                recordsCreated += newRecords.length;
            }

            await qr.commitTransaction();
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }

        return {
            message: `Successfully calculated ${recordsCreated} records across all seasons`,
            recordsCreated
        };
    }

    private buildGameRecord(recordType: string, rank: number, row: GameRecordRow): Records {
        const record = new Records();
        record.record = recordType;
        record.type = 'game';
        record.rank = rank;
        record.value = Number(row.value);
        record.date = row.gameDate;
        record.seasonId = row.seasonId;
        record.playerId = row.playerId;
        record.regionId = row.regionId;
        record.gameId = row.gameId;
        return record;
    }

    private buildSeasonRecord(recordType: string, rank: number, row: SeasonRecordRow): Records {
        const record = new Records();
        record.record = recordType;
        record.type = 'season';
        record.rank = rank;
        record.value = Number(row.value);
        record.date = row.seasonStartDate;
        record.seasonId = row.seasonId;
        record.playerId = row.playerId;
        record.regionId = row.regionId;
        return record;
    }

    private async fetchTop10GameStatRecords(qr: QueryRunner, recordType: string): Promise<GameRecordRow[]> {
        const column = GAME_STAT_COLUMNS[recordType];
        return qr.manager.query(`
            SELECT s."playerId", s."gameId", g."seasonId", se."regionId", g.date AS "gameDate",
                   ${column} AS value
            FROM stats s
            INNER JOIN games g ON g.id = s."gameId"
            INNER JOIN seasons se ON se.id = g."seasonId"
            WHERE ${column} > 0
            ORDER BY value DESC
            LIMIT 10
        `);
    }

    private async fetchTop10GameAggregatedRecords(qr: QueryRunner, recordType: string): Promise<GameRecordRow[]> {
        const expression = GAME_AGGREGATED_EXPRESSIONS[recordType];
        return qr.manager.query(`
            SELECT s."playerId", s."gameId", g."seasonId", se."regionId", g.date AS "gameDate",
                   ${expression} AS value
            FROM stats s
            INNER JOIN games g ON g.id = s."gameId"
            INNER JOIN seasons se ON se.id = g."seasonId"
            WHERE ${expression} > 0
            ORDER BY value DESC
            LIMIT 10
        `);
    }

    private async fetchTop10SeasonStatRecords(qr: QueryRunner, recordType: string): Promise<SeasonRecordRow[]> {
        const expression = SEASON_STAT_EXPRESSIONS[recordType];
        return qr.manager.query(`
            SELECT s."playerId", g."seasonId", se."regionId", se."startDate" AS "seasonStartDate",
                   ${expression} AS value
            FROM stats s
            INNER JOIN games g ON g.id = s."gameId"
            INNER JOIN seasons se ON se.id = g."seasonId"
            GROUP BY s."playerId", g."seasonId", se."regionId", se."startDate"
            HAVING ${expression} > 0
            ORDER BY value DESC
            LIMIT 10
        `);
    }

    private async fetchTop10SeasonAggregatedRecords(qr: QueryRunner, recordType: string): Promise<SeasonRecordRow[]> {
        const expression = SEASON_AGGREGATED_EXPRESSIONS[recordType];
        return qr.manager.query(`
            SELECT s."playerId", g."seasonId", se."regionId", se."startDate" AS "seasonStartDate",
                   ${expression} AS value
            FROM stats s
            INNER JOIN games g ON g.id = s."gameId"
            INNER JOIN seasons se ON se.id = g."seasonId"
            GROUP BY s."playerId", g."seasonId", se."regionId", se."startDate"
            HAVING ${expression} > 0
            ORDER BY value DESC
            LIMIT 10
        `);
    }

    private async fetchTop10GameSpikingPercentageRecords(qr: QueryRunner, minAttempts: number): Promise<GameRecordRow[]> {
        return qr.manager.query(`
            SELECT s."playerId", s."gameId", g."seasonId", se."regionId", g.date AS "gameDate",
                   ${GAME_TOTAL_SPIKING_PCT} AS value
            FROM stats s
            INNER JOIN games g ON g.id = s."gameId"
            INNER JOIN seasons se ON se.id = g."seasonId"
            WHERE (s."spikeAttempts" + s."apeAttempts") >= $1
              AND (s."spikeKills" + s."apeKills") > 0
            ORDER BY value DESC
            LIMIT 10
        `, [minAttempts]);
    }

    private async fetchTop10SeasonSpikingPercentageRecords(qr: QueryRunner, minAttempts: number): Promise<SeasonRecordRow[]> {
        return qr.manager.query(`
            SELECT s."playerId", g."seasonId", se."regionId", se."startDate" AS "seasonStartDate",
                   ${SEASON_TOTAL_SPIKING_PCT} AS value
            FROM stats s
            INNER JOIN games g ON g.id = s."gameId"
            INNER JOIN seasons se ON se.id = g."seasonId"
            GROUP BY s."playerId", g."seasonId", se."regionId", se."startDate"
            HAVING SUM(s."spikeAttempts") + SUM(s."apeAttempts") >= $1
               AND SUM(s."spikeKills") + SUM(s."apeKills") > 0
            ORDER BY value DESC
            LIMIT 10
        `, [minAttempts]);
    }

    /**
     * Extract minimum attempts from record type string
     */
    private extractMinAttempts(recordType: string): number {
        const match = recordType.match(/(\d+)\+ attempts/);
        return match ? parseInt(match[1]) : 0;
    }
}
