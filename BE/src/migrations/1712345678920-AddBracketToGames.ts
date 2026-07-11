import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBracketToGames1712345678920 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "games_bracket_enum" AS ENUM('winners', 'losers');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN IF NOT EXISTS "bracket" "games_bracket_enum"
        `);

        await queryRunner.query(`
            UPDATE "games"
            SET "bracket" = 'losers'
            WHERE "stage" ILIKE '%Losers Bracket%'
        `);

        await queryRunner.query(`
            UPDATE "games"
            SET "bracket" = 'winners'
            WHERE "bracket" IS NULL
              AND "stage" ILIKE '%Winners Bracket%'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games" DROP COLUMN IF EXISTS "bracket"
        `);
        await queryRunner.query(`DROP TYPE IF EXISTS "games_bracket_enum"`);
    }
}
