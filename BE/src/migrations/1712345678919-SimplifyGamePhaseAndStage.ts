import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyGamePhaseAndStage1712345678919 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TYPE "games_phase_enum" ADD VALUE IF NOT EXISTS 'pre_season';
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        // Qualifier stages stored as "Qualifiers; Round X" → "Round X"
        await queryRunner.query(`
            UPDATE "games"
            SET "stage" = regexp_replace("stage", '^Qualifiers;\\s*', '')
            WHERE "stage" LIKE 'Qualifiers;%'
        `);

        // Pre-season exhibition labels
        await queryRunner.query(`
            UPDATE "games"
            SET "phase" = 'pre_season',
                "stage" = regexp_replace("stage", '^Pre-Season;\\s*', '')
            WHERE "stage" LIKE 'Pre-Season;%'
               OR EXISTS (
                   SELECT 1 FROM unnest(COALESCE(string_to_array("tags", ','), ARRAY[]::text[])) t
                   WHERE lower(trim(t)) IN ('exhibition', 'pre-season', 'preseason')
               )
        `);

        // Backfill stage from legacy round column when missing
        await queryRunner.query(`
            UPDATE "games"
            SET "stage" = "round"
            WHERE ("stage" IS NULL OR btrim("stage") = '')
              AND "round" IS NOT NULL
              AND btrim("round") <> ''
        `);

        // Infer playoffs from bracket-style stage names
        await queryRunner.query(`
            UPDATE "games"
            SET "phase" = 'playoffs'
            WHERE "phase" = 'qualifiers'
              AND (
                "stage" LIKE '%Bracket%'
                OR "stage" LIKE 'Grand Finals%'
                OR "stage" LIKE 'Single Elimination%'
                OR "stage" LIKE '3rd Place%'
              )
        `);

        await queryRunner.query(`
            ALTER TABLE "games"
            DROP COLUMN IF EXISTS "matchNumber",
            DROP COLUMN IF EXISTS "round"
        `);

        await queryRunner.query(`
            ALTER TABLE "games"
            ALTER COLUMN "stage" SET DEFAULT 'Round 1'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN IF NOT EXISTS "matchNumber" varchar,
            ADD COLUMN IF NOT EXISTS "round" varchar
        `);

        await queryRunner.query(`
            UPDATE "games"
            SET "round" = CASE
                WHEN "phase" = 'qualifiers' THEN "stage"
                ELSE NULL
            END
            WHERE "round" IS NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "games"
            ALTER COLUMN "stage" SET DEFAULT 'Winners Bracket; Round of 16'
        `);

        // Note: pre_season enum value cannot be removed safely in PostgreSQL
    }
}
