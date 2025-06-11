import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNameToGames1714190000000 implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void>
    {
        // Add the "name" column (initially allowing nulls to avoid error)
        await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN "name" character varying
        `);

        // Populate the "name" column with your SQL logic
        await queryRunner.query(`
            UPDATE "games"
            SET "name" = CONCAT(
                (SELECT REGEXP_REPLACE(t1.name, '\\s?\\(.*\\)', '')
                 FROM "teams" t1
                 JOIN "teams_games" tg1 ON tg1."teamsId" = t1."id"
                 WHERE tg1."gamesId" = "games"."id" LIMIT 1),
                ' Vs. ',
                (SELECT REGEXP_REPLACE(t2.name, '\\s?\\(.*\\)', '')
                 FROM "teams" t2
                 JOIN "teams_games" tg2 ON tg2."teamsId" = t2."id"
                 WHERE tg2."gamesId" = "games"."id" LIMIT 1 OFFSET 1),
                ' ',
                'S' || (SELECT "seasonNumber" FROM "seasons" WHERE "seasonNumber" = "games"."seasonId" LIMIT 1)
            )
            WHERE EXISTS (
                SELECT 1 FROM "teams_games" tg1 WHERE tg1."gamesId" = "games"."id" LIMIT 1
            ) AND EXISTS (
                SELECT 1 FROM "teams_games" tg2 WHERE tg2."gamesId" = "games"."id" LIMIT 1 OFFSET 1
            );
        `);

        // Now make "name" NOT NULL (after data has been filled)
        await queryRunner.query(`
            ALTER TABLE "games"
            ALTER COLUMN "name" SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void>
    {
        // Rollback: Remove the "name" column if migration is undone
        await queryRunner.query(`
            ALTER TABLE "games"
            DROP COLUMN "name"
        `);
    }
}
