import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indexes added after the initial performance set (8923).
 * Safe if 8923 was already expanded to include these — all use IF NOT EXISTS.
 */
export class AddRemainingPerformanceIndexes1712345678924 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_games_seasonId_regionId_stage"
            ON "games" ("seasonId", "regionId", "stage")
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_seasonId" ON "games" ("seasonId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_stage" ON "games" ("stage")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_winnerTeamId" ON "games" ("winnerTeamId")`);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_stats_gameId_playerId"
            ON "stats" ("gameId", "playerId")
        `);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_players_name" ON "players" ("name")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_records_gameId" ON "records" ("gameId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teams_name" ON "teams" ("name")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_seasons_regionId" ON "seasons" ("regionId")`);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_article_approved" ON "article" ("approved")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_article_authorId" ON "article" ("authorId")`);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_role_audit_log_targetId" ON "role_audit_log" ("targetId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_role_audit_log_actorId" ON "role_audit_log" ("actorId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_role_audit_log_actorId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_role_audit_log_targetId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_authorId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_approved"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_seasons_regionId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_teams_name"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_records_gameId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_players_name"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stats_gameId_playerId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_winnerTeamId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_stage"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_seasonId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_seasonId_regionId_stage"`);
    }
}
