import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1712345678923 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // games: filtered/sorted by region+season constantly, plus individual status/phase/bracket filters
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_games_regionId_seasonId_date"
            ON "games" ("regionId", "seasonId", "date")
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_status" ON "games" ("status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_phase" ON "games" ("phase")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_bracket" ON "games" ("bracket")`);

        // stats: joined to player/game on every stats and leaderboard query
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_stats_playerId" ON "stats" ("playerId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_stats_gameId" ON "stats" ("gameId")`);

        // records: filtered by season/player/region, and record+type is the calculateAllRecords delete key
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_records_seasonId" ON "records" ("seasonId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_records_playerId" ON "records" ("playerId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_records_regionId" ON "records" ("regionId")`);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_records_record_type"
            ON "records" ("record", "type")
        `);

        // teams: filtered by region and season on every list/detail query
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teams_regionId" ON "teams" ("regionId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teams_seasonId" ON "teams" ("seasonId")`);

        // awards: filtered by season and region
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_awards_seasonId" ON "awards" ("seasonId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_awards_regionId" ON "awards" ("regionId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_awards_regionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_awards_seasonId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_teams_seasonId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_teams_regionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_records_record_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_records_regionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_records_playerId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_records_seasonId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stats_gameId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stats_playerId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_bracket"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_phase"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_regionId_seasonId_date"`);
    }
}
