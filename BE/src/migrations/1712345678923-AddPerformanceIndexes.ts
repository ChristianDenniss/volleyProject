import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indexes for FK joins and the hot filter/sort paths used by list, leaderboard,
 * and record-calculation queries. IF NOT EXISTS keeps this safe to re-run.
 */
export class AddPerformanceIndexes1712345678923 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // games: filtered/sorted by region+season constantly, plus stage/status/phase/bracket
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_games_regionId_seasonId_date"
            ON "games" ("regionId", "seasonId", "date")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_games_seasonId_regionId_stage"
            ON "games" ("seasonId", "regionId", "stage")
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_seasonId" ON "games" ("seasonId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_stage" ON "games" ("stage")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_status" ON "games" ("status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_phase" ON "games" ("phase")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_bracket" ON "games" ("bracket")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_winnerTeamId" ON "games" ("winnerTeamId")`);

        // stats: joined to player/game on every stats and leaderboard query
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_stats_playerId" ON "stats" ("playerId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_stats_gameId" ON "stats" ("gameId")`);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_stats_gameId_playerId"
            ON "stats" ("gameId", "playerId")
        `);

        // players: equality + ILIKE name lookups on list/search/trivia
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_players_name" ON "players" ("name")`);

        // records: filtered by season/player/region/game; record+type is the calculateAllRecords delete key
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_records_seasonId" ON "records" ("seasonId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_records_playerId" ON "records" ("playerId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_records_regionId" ON "records" ("regionId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_records_gameId" ON "records" ("gameId")`);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_records_record_type"
            ON "records" ("record", "type")
        `);

        // teams: filtered by region and season on every list/detail query
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teams_regionId" ON "teams" ("regionId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teams_seasonId" ON "teams" ("seasonId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teams_name" ON "teams" ("name")`);

        // seasons: filtered by region
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_seasons_regionId" ON "seasons" ("regionId")`);

        // awards: filtered by season and region
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_awards_seasonId" ON "awards" ("seasonId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_awards_regionId" ON "awards" ("regionId")`);

        // article: approval filter on public listing
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_article_approved" ON "article" ("approved")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_article_authorId" ON "article" ("authorId")`);

        // role audit: lookup by target/actor
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_role_audit_log_targetId" ON "role_audit_log" ("targetId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_role_audit_log_actorId" ON "role_audit_log" ("actorId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_role_audit_log_actorId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_role_audit_log_targetId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_authorId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_approved"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_awards_regionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_awards_seasonId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_seasons_regionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_teams_name"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_teams_seasonId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_teams_regionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_records_record_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_records_gameId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_records_regionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_records_playerId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_records_seasonId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_players_name"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stats_gameId_playerId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stats_gameId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stats_playerId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_winnerTeamId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_bracket"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_phase"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_stage"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_seasonId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_seasonId_regionId_stage"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_regionId_seasonId_date"`);
    }
}
