import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Records } from './records.entity.js';
import { Players } from '../players/player.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import { Stats } from '../stats/stat.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { CreateRecordDto, UpdateRecordDto } from './records.schema.js';

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
            throw new Error("Rank must be between 1 and 10");
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
            throw new Error(`Record already exists for ${recordData.record} (${recordData.type}) at rank ${recordData.rank} in season ${recordData.seasonId}`);
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

        return this.recordRepository.save(newRecord);
    }

    /**
     * Get all records
     */
    async getAllRecords(): Promise<Records[]> {
        return this.recordRepository.find({
            relations: ["player", "season"]
        });
    }

    /**
     * Get records by season
     */
    async getRecordsBySeason(seasonId: number): Promise<Records[]> {
        if (!seasonId) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) throw new NotFoundError(`Season with ID ${seasonId} not found`);

        return this.recordRepository.find({
            where: { season: { id: seasonId } },
            relations: ["player", "season"],
            order: { record: "ASC", rank: "ASC" }
        });
    }

    /**
     * Get records by record type
     */
    async getRecordsByType(recordType: string): Promise<Records[]> {
        if (!recordType) throw new MissingFieldError("Record type");

        return this.recordRepository.find({
            where: { record: recordType },
            relations: ["player", "season"],
            order: { rank: "ASC" }
        });
    }

    /**
     * Get records by player
     */
    async getRecordsByPlayer(playerId: number): Promise<Records[]> {
        if (!playerId) throw new MissingFieldError("Player ID");

        const player = await this.playerRepository.findOneBy({ id: playerId });
        if (!player) throw new NotFoundError(`Player with ID ${playerId} not found`);

        return this.recordRepository.find({
            where: { player: { id: playerId } },
            relations: ["player", "season"],
            order: { record: "ASC", rank: "ASC" }
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
                throw new Error("Rank must be between 1 and 10");
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
        // Get all stats from all seasons with player and game relations
        const stats = await this.statRepository.find({
            relations: ["player", "game", "game.season"],
        });

        if (stats.length === 0) {
            throw new Error("No stats found in the database");
        }

        let recordsCreated = 0;
        const recordTypes = [
            'most spike kills', 'most assists', 'most ape kills', 'most digs', 'most block follows', 
            'most blocks', 'most aces', 'most serve errors', 'most misc errors', 'most set errors', 
            'most spike errors', 'most spike attempts', 'most ape attempts'
        ];

        // Calculate single game records
        for (const recordType of recordTypes) {
            const top10Stats = this.calculateTop10ForRecordType(stats, recordType);
            
            // Clear existing records for this type and game type
            await this.recordRepository.delete({ record: recordType, type: 'game' });

            // Create new records
            for (let i = 0; i < top10Stats.length; i++) {
                const stat = top10Stats[i];
                const newRecord = new Records();
                newRecord.record = recordType;
                newRecord.type = 'game';
                newRecord.rank = i + 1;
                newRecord.value = this.getStatValue(stat, recordType);
                newRecord.date = stat.game.date;
                newRecord.season = stat.game.season;
                newRecord.player = stat.player;
                newRecord.gameId = stat.game.id; // Set the game ID

                await this.recordRepository.save(newRecord);
                recordsCreated++;
            }
        }

        // Calculate aggregated records (total kills, attempts, errors) - game type
        const aggregatedRecordTypes = [
            'most total kills', 'most total attempts', 'most total errors'
        ];

        for (const recordType of aggregatedRecordTypes) {
            const top10Stats = this.calculateTop10ForAggregatedRecordType(stats, recordType);
            
            // Clear existing records for this type and game type
            await this.recordRepository.delete({ record: recordType, type: 'game' });

            // Create new records
            for (let i = 0; i < top10Stats.length; i++) {
                const stat = top10Stats[i];
                const newRecord = new Records();
                newRecord.record = recordType;
                newRecord.type = 'game';
                newRecord.rank = i + 1;
                newRecord.value = this.getAggregatedStatValue(stat, recordType);
                newRecord.date = stat.game.date;
                newRecord.season = stat.game.season;
                newRecord.player = stat.player;
                newRecord.gameId = stat.game.id; // Set the game ID

                await this.recordRepository.save(newRecord);
                recordsCreated++;
            }
        }

        // Calculate season aggregate records (same record types but season type)
        for (const recordType of recordTypes) {
            const top10SeasonStats = this.calculateTop10SeasonStats(stats, recordType);
            
            // Clear existing records for this type and season type
            await this.recordRepository.delete({ record: recordType, type: 'season' });

            // Create new records
            for (let i = 0; i < top10SeasonStats.length; i++) {
                const seasonStat = top10SeasonStats[i];
                const newRecord = new Records();
                newRecord.record = recordType;
                newRecord.type = 'season';
                newRecord.rank = i + 1;
                newRecord.value = this.getSeasonStatValue(seasonStat, recordType);
                newRecord.date = seasonStat.season.startDate;
                newRecord.season = seasonStat.season;
                newRecord.player = seasonStat.player;

                await this.recordRepository.save(newRecord);
                recordsCreated++;
            }
        }

        // Calculate season aggregated records (total kills, attempts, errors) - season type
        for (const recordType of aggregatedRecordTypes) {
            const top10SeasonStats = this.calculateTop10SeasonAggregatedStats(stats, recordType);
            
            // Clear existing records for this type and season type
            await this.recordRepository.delete({ record: recordType, type: 'season' });

            // Create new records
            for (let i = 0; i < top10SeasonStats.length; i++) {
                const seasonStat = top10SeasonStats[i];
                const newRecord = new Records();
                newRecord.record = recordType;
                newRecord.type = 'season';
                newRecord.rank = i + 1;
                newRecord.value = this.getSeasonAggregatedStatValue(seasonStat, recordType);
                newRecord.date = seasonStat.season.startDate;
                newRecord.season = seasonStat.season;
                newRecord.player = seasonStat.player;

                await this.recordRepository.save(newRecord);
                recordsCreated++;
            }
        }



        // Calculate single game total spiking percentage records (10+ to 60+ attempts)
        const singleGamePercentageRecordTypes = [
            'best total spiking % with 10+ attempts', 'best total spiking % with 20+ attempts', 'best total spiking % with 30+ attempts',
            'best total spiking % with 40+ attempts', 'best total spiking % with 50+ attempts', 'best total spiking % with 60+ attempts'
        ];

        for (const recordType of singleGamePercentageRecordTypes) {
            const minAttempts = this.extractMinAttempts(recordType);
            const eligibleStats = stats.filter(stat => this.getTotalAttempts(stat) >= minAttempts);
            
            if (eligibleStats.length > 0) {
                const top10Stats = this.calculateTop10TotalSpikingPercentage(eligibleStats, recordType);
                
                // Clear existing records for this type and game type
                await this.recordRepository.delete({ record: recordType, type: 'game' });

                // Create new records
                for (let i = 0; i < top10Stats.length; i++) {
                    const stat = top10Stats[i];
                    const newRecord = new Records();
                    newRecord.record = recordType;
                    newRecord.type = 'game';
                    newRecord.rank = i + 1;
                    newRecord.value = this.calculateTotalSpikingPercentage(stat);
                    newRecord.date = stat.game.date;
                    newRecord.season = stat.game.season;
                    newRecord.player = stat.player;
                    newRecord.gameId = stat.game.id; // Set the game ID

                    await this.recordRepository.save(newRecord);
                    recordsCreated++;
                }
            }
        }

        // Calculate season total spiking percentage records (60+ to 250+ attempts)
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
            const seasonAggregatedStats = this.aggregateStatsBySeason(stats);
            const eligibleSeasonStats = seasonAggregatedStats.filter(stat => stat.totalAttempts >= minAttempts);
            
            if (eligibleSeasonStats.length > 0) {
                const top10SeasonStats = this.calculateTop10SeasonSpikingPercentage(eligibleSeasonStats, recordType);
                
                // Clear existing records for this type and season type
                await this.recordRepository.delete({ record: recordType, type: 'season' });

                // Create new records
                for (let i = 0; i < top10SeasonStats.length; i++) {
                    const seasonStat = top10SeasonStats[i];
                    const newRecord = new Records();
                    newRecord.record = recordType;
                    newRecord.type = 'season';
                    newRecord.rank = i + 1;
                    newRecord.value = seasonStat.totalSpikingPercentage;
                    newRecord.date = seasonStat.season.startDate;
                    newRecord.season = seasonStat.season;
                    newRecord.player = seasonStat.player;

                    await this.recordRepository.save(newRecord);
                    recordsCreated++;
                }
            }
        }

        return {
            message: `Successfully calculated ${recordsCreated} records across all seasons`,
            recordsCreated
        };
    }

    /**
     * Calculate top 10 stats for a specific record type
     */
    private calculateTop10ForRecordType(stats: Stats[], recordType: string): Stats[] {
        return stats
            .filter(stat => this.getStatValue(stat, recordType) > 0)
            .sort((a, b) => this.getStatValue(b, recordType) - this.getStatValue(a, recordType))
            .slice(0, 10);
    }

    /**
     * Calculate top 10 percentage stats
     */
    private calculateTop10Percentage(stats: Stats[], recordType: string): Stats[] {
        return stats
            .filter(stat => this.calculateSpikePercentage(stat) > 0)
            .sort((a, b) => this.calculateSpikePercentage(b) - this.calculateSpikePercentage(a))
            .slice(0, 10);
    }

    /**
     * Get the appropriate stat value for a record type
     */
    private getStatValue(stat: Stats, recordType: string): number {
        switch (recordType) {
            case 'most spike kills': return stat.spikeKills;
            case 'most assists': return stat.assists;
            case 'most ape kills': return stat.apeKills;
            case 'most digs': return stat.digs;
            case 'most block follows': return stat.blockFollows;
            case 'most blocks': return stat.blocks;
            case 'most aces': return stat.aces;
            case 'most serve errors': return stat.servingErrors;
            case 'most misc errors': return stat.miscErrors;
            case 'most set errors': return stat.settingErrors;
            case 'most spike errors': return stat.spikingErrors;
            case 'most spike attempts': return stat.spikeAttempts;
            case 'most ape attempts': return stat.apeAttempts;
            default: return 0;
        }
    }

    /**
     * Calculate spike percentage
     */
    private calculateSpikePercentage(stat: Stats): number {
        if (stat.spikeAttempts === 0) return 0;
        return (stat.spikeKills / stat.spikeAttempts) * 100;
    }

    /**
     * Extract minimum attempts from record type string
     */
    private extractMinAttempts(recordType: string): number {
        const match = recordType.match(/(\d+)\+ attempts/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Calculate top 10 stats for aggregated record types
     */
    private calculateTop10ForAggregatedRecordType(stats: Stats[], recordType: string): Stats[] {
        return stats
            .filter(stat => this.getAggregatedStatValue(stat, recordType) > 0)
            .sort((a, b) => this.getAggregatedStatValue(b, recordType) - this.getAggregatedStatValue(a, recordType))
            .slice(0, 10);
    }

    /**
     * Get the appropriate aggregated stat value for a record type
     */
    private getAggregatedStatValue(stat: Stats, recordType: string): number {
        switch (recordType) {
            case 'most total kills': return stat.spikeKills + stat.apeKills;
            case 'most total attempts': return stat.spikeAttempts + stat.apeAttempts;
            case 'most total errors': return stat.spikingErrors + stat.servingErrors + stat.settingErrors + stat.miscErrors;
            default: return 0;
        }
    }

    /**
     * Get total attempts (spike + ape)
     */
    private getTotalAttempts(stat: Stats): number {
        return stat.spikeAttempts + stat.apeAttempts;
    }

    /**
     * Calculate top 10 total spiking percentage stats
     */
    private calculateTop10TotalSpikingPercentage(stats: Stats[], recordType: string): Stats[] {
        return stats
            .filter(stat => this.calculateTotalSpikingPercentage(stat) > 0)
            .sort((a, b) => this.calculateTotalSpikingPercentage(b) - this.calculateTotalSpikingPercentage(a))
            .slice(0, 10);
    }

    /**
     * Calculate total spiking percentage (spike kills + ape kills) / (spike attempts + ape attempts)
     */
    private calculateTotalSpikingPercentage(stat: Stats): number {
        const totalAttempts = this.getTotalAttempts(stat);
        if (totalAttempts === 0) return 0;
        const totalKills = stat.spikeKills + stat.apeKills;
        return (totalKills / totalAttempts) * 100;
    }

    /**
     * Aggregate stats by season for each player
     */
    private aggregateStatsBySeason(stats: Stats[]): Array<{
        player: Players;
        season: Seasons;
        totalSpikeKills: number;
        totalApeKills: number;
        totalSpikeAttempts: number;
        totalApeAttempts: number;
        totalAttempts: number;
        totalSpikingPercentage: number;
    }> {
        const seasonAggregates = new Map<string, {
            player: Players;
            season: Seasons;
            totalSpikeKills: number;
            totalApeKills: number;
            totalSpikeAttempts: number;
            totalApeAttempts: number;
        }>();

        // Aggregate stats by player and season
        for (const stat of stats) {
            const key = `${stat.player.id}-${stat.game.season.id}`;
            
            if (!seasonAggregates.has(key)) {
                seasonAggregates.set(key, {
                    player: stat.player,
                    season: stat.game.season,
                    totalSpikeKills: 0,
                    totalApeKills: 0,
                    totalSpikeAttempts: 0,
                    totalApeAttempts: 0,
                });
            }

            const aggregate = seasonAggregates.get(key)!;
            aggregate.totalSpikeKills += stat.spikeKills;
            aggregate.totalApeKills += stat.apeKills;
            aggregate.totalSpikeAttempts += stat.spikeAttempts;
            aggregate.totalApeAttempts += stat.apeAttempts;
        }

        // Convert to array and calculate percentages
        return Array.from(seasonAggregates.values()).map(aggregate => ({
            ...aggregate,
            totalAttempts: aggregate.totalSpikeAttempts + aggregate.totalApeAttempts,
            totalSpikingPercentage: this.calculateSeasonSpikingPercentage(aggregate)
        }));
    }

    /**
     * Calculate season spiking percentage
     */
    private calculateSeasonSpikingPercentage(aggregate: {
        totalSpikeKills: number;
        totalApeKills: number;
        totalSpikeAttempts: number;
        totalApeAttempts: number;
    }): number {
        const totalAttempts = aggregate.totalSpikeAttempts + aggregate.totalApeAttempts;
        if (totalAttempts === 0) return 0;
        const totalKills = aggregate.totalSpikeKills + aggregate.totalApeKills;
        return (totalKills / totalAttempts) * 100;
    }

    /**
     * Calculate top 10 season spiking percentage stats
     */
    private calculateTop10SeasonSpikingPercentage(seasonStats: Array<{
        player: Players;
        season: Seasons;
        totalAttempts: number;
        totalSpikingPercentage: number;
    }>, recordType: string): Array<{
        player: Players;
        season: Seasons;
        totalAttempts: number;
        totalSpikingPercentage: number;
    }> {
        return seasonStats
            .filter(stat => stat.totalSpikingPercentage > 0)
            .sort((a, b) => b.totalSpikingPercentage - a.totalSpikingPercentage)
            .slice(0, 10);
    }

    /**
     * Aggregate stats by season for each player (for regular stats, not just spiking)
     */
    private aggregateStatsBySeasonForRegularStats(stats: Stats[]): Array<{
        player: Players;
        season: Seasons;
        totalSpikeKills: number;
        totalApeKills: number;
        totalAssists: number;
        totalDigs: number;
        totalBlockFollows: number;
        totalBlocks: number;
        totalAces: number;
        totalServingErrors: number;
        totalMiscErrors: number;
        totalSettingErrors: number;
        totalSpikingErrors: number;
        totalSpikeAttempts: number;
        totalApeAttempts: number;
    }> {
        const seasonAggregates = new Map<string, {
            player: Players;
            season: Seasons;
            totalSpikeKills: number;
            totalApeKills: number;
            totalAssists: number;
            totalDigs: number;
            totalBlockFollows: number;
            totalBlocks: number;
            totalAces: number;
            totalServingErrors: number;
            totalMiscErrors: number;
            totalSettingErrors: number;
            totalSpikingErrors: number;
            totalSpikeAttempts: number;
            totalApeAttempts: number;
        }>();

        // Aggregate stats by player and season
        for (const stat of stats) {
            const key = `${stat.player.id}-${stat.game.season.id}`;
            
            if (!seasonAggregates.has(key)) {
                seasonAggregates.set(key, {
                    player: stat.player,
                    season: stat.game.season,
                    totalSpikeKills: 0,
                    totalApeKills: 0,
                    totalAssists: 0,
                    totalDigs: 0,
                    totalBlockFollows: 0,
                    totalBlocks: 0,
                    totalAces: 0,
                    totalServingErrors: 0,
                    totalMiscErrors: 0,
                    totalSettingErrors: 0,
                    totalSpikingErrors: 0,
                    totalSpikeAttempts: 0,
                    totalApeAttempts: 0,
                });
            }

            const aggregate = seasonAggregates.get(key)!;
            aggregate.totalSpikeKills += stat.spikeKills;
            aggregate.totalApeKills += stat.apeKills;
            aggregate.totalAssists += stat.assists;
            aggregate.totalDigs += stat.digs;
            aggregate.totalBlockFollows += stat.blockFollows;
            aggregate.totalBlocks += stat.blocks;
            aggregate.totalAces += stat.aces;
            aggregate.totalServingErrors += stat.servingErrors;
            aggregate.totalMiscErrors += stat.miscErrors;
            aggregate.totalSettingErrors += stat.settingErrors;
            aggregate.totalSpikingErrors += stat.spikingErrors;
            aggregate.totalSpikeAttempts += stat.spikeAttempts;
            aggregate.totalApeAttempts += stat.apeAttempts;
        }

        return Array.from(seasonAggregates.values());
    }

    /**
     * Calculate top 10 season stats for regular record types
     */
    private calculateTop10SeasonStats(stats: Stats[], recordType: string): Array<{
        player: Players;
        season: Seasons;
        totalSpikeKills: number;
        totalApeKills: number;
        totalAssists: number;
        totalDigs: number;
        totalBlockFollows: number;
        totalBlocks: number;
        totalAces: number;
        totalServingErrors: number;
        totalMiscErrors: number;
        totalSettingErrors: number;
        totalSpikingErrors: number;
        totalSpikeAttempts: number;
        totalApeAttempts: number;
    }> {
        const seasonAggregatedStats = this.aggregateStatsBySeasonForRegularStats(stats);
        
        return seasonAggregatedStats
            .filter(stat => this.getSeasonStatValue(stat, recordType) > 0)
            .sort((a, b) => this.getSeasonStatValue(b, recordType) - this.getSeasonStatValue(a, recordType))
            .slice(0, 10);
    }

    /**
     * Get the appropriate season stat value for a record type
     */
    private getSeasonStatValue(seasonStat: {
        totalSpikeKills: number;
        totalApeKills: number;
        totalAssists: number;
        totalDigs: number;
        totalBlockFollows: number;
        totalBlocks: number;
        totalAces: number;
        totalServingErrors: number;
        totalMiscErrors: number;
        totalSettingErrors: number;
        totalSpikingErrors: number;
        totalSpikeAttempts: number;
        totalApeAttempts: number;
    }, recordType: string): number {
        switch (recordType) {
            case 'most spike kills': return seasonStat.totalSpikeKills;
            case 'most assists': return seasonStat.totalAssists;
            case 'most ape kills': return seasonStat.totalApeKills;
            case 'most digs': return seasonStat.totalDigs;
            case 'most block follows': return seasonStat.totalBlockFollows;
            case 'most blocks': return seasonStat.totalBlocks;
            case 'most aces': return seasonStat.totalAces;
            case 'most serve errors': return seasonStat.totalServingErrors;
            case 'most misc errors': return seasonStat.totalMiscErrors;
            case 'most set errors': return seasonStat.totalSettingErrors;
            case 'most spike errors': return seasonStat.totalSpikingErrors;
            case 'most spike attempts': return seasonStat.totalSpikeAttempts;
            case 'most ape attempts': return seasonStat.totalApeAttempts;
            default: return 0;
        }
    }

    /**
     * Calculate top 10 season aggregated stats (total kills, attempts, errors)
     */
    private calculateTop10SeasonAggregatedStats(stats: Stats[], recordType: string): Array<{
        player: Players;
        season: Seasons;
        totalSpikeKills: number;
        totalApeKills: number;
        totalAssists: number;
        totalDigs: number;
        totalBlockFollows: number;
        totalBlocks: number;
        totalAces: number;
        totalServingErrors: number;
        totalMiscErrors: number;
        totalSettingErrors: number;
        totalSpikingErrors: number;
        totalSpikeAttempts: number;
        totalApeAttempts: number;
    }> {
        const seasonAggregatedStats = this.aggregateStatsBySeasonForRegularStats(stats);
        
        return seasonAggregatedStats
            .filter(stat => this.getSeasonAggregatedStatValue(stat, recordType) > 0)
            .sort((a, b) => this.getSeasonAggregatedStatValue(b, recordType) - this.getSeasonAggregatedStatValue(a, recordType))
            .slice(0, 10);
    }

    /**
     * Get the appropriate season aggregated stat value for a record type
     */
    private getSeasonAggregatedStatValue(seasonStat: {
        totalSpikeKills: number;
        totalApeKills: number;
        totalServingErrors: number;
        totalMiscErrors: number;
        totalSettingErrors: number;
        totalSpikingErrors: number;
        totalSpikeAttempts: number;
        totalApeAttempts: number;
    }, recordType: string): number {
        switch (recordType) {
            case 'most total kills': return seasonStat.totalSpikeKills + seasonStat.totalApeKills;
            case 'most total attempts': return seasonStat.totalSpikeAttempts + seasonStat.totalApeAttempts;
            case 'most total errors': return seasonStat.totalSpikingErrors + seasonStat.totalServingErrors + seasonStat.totalSettingErrors + seasonStat.totalMiscErrors;
            default: return 0;
        }
    }
}
