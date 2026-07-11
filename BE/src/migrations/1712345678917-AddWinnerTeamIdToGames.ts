import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWinnerTeamIdToGames1712345678917 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN IF NOT EXISTS "winnerTeamId" integer
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "games"
                ADD CONSTRAINT "FK_games_winnerTeamId"
                FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id")
                ON DELETE SET NULL ON UPDATE CASCADE;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            WITH game_teams AS (
                SELECT
                    tg."gamesId" AS game_id,
                    (array_agg(tg."teamsId" ORDER BY tg."teamsId"))[1] AS team1_id,
                    (array_agg(tg."teamsId" ORDER BY tg."teamsId"))[2] AS team2_id
                FROM "teams_games" tg
                GROUP BY tg."gamesId"
                HAVING COUNT(*) = 2
            )
            UPDATE "games" g
            SET "winnerTeamId" = CASE
                WHEN g."team1Score" IS NULL OR g."team2Score" IS NULL THEN NULL
                WHEN g."team1Score" > g."team2Score" THEN gt.team1_id
                WHEN g."team2Score" > g."team1Score" THEN gt.team2_id
                ELSE NULL
            END
            FROM game_teams gt
            WHERE g.id = gt.game_id
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games" DROP CONSTRAINT IF EXISTS "FK_games_winnerTeamId"
        `);
        await queryRunner.query(`
            ALTER TABLE "games" DROP COLUMN IF EXISTS "winnerTeamId"
        `);
    }
}
