import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Stage is now just the round/depth label (e.g. "Round of 16", "Finals").
 * Winners/losers lives on the bracket column (added in 8920).
 */
export class StripBracketPrefixFromStage1712345678921 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure bracket is populated before we strip the text that encodes it
        await queryRunner.query(`
            UPDATE "games"
            SET "bracket" = 'losers'
            WHERE "bracket" IS NULL
              AND "stage" ILIKE '%Losers Bracket%'
        `);

        await queryRunner.query(`
            UPDATE "games"
            SET "bracket" = 'winners'
            WHERE "bracket" IS NULL
              AND "stage" ILIKE '%Winners Bracket%'
        `);

        // Strip known prefixes from stage
        await queryRunner.query(`
            UPDATE "games"
            SET "stage" = regexp_replace(
                "stage",
                '^(Winners Bracket|Losers Bracket|Single Elimination|Group Stage|Pre-Season|Qualifiers);\\s*',
                '',
                'i'
            )
            WHERE "stage" ~* '^(Winners Bracket|Losers Bracket|Single Elimination|Group Stage|Pre-Season|Qualifiers);\\s*'
        `);

        // "Grand Finals; Bracket Reset" → "Bracket Reset"
        await queryRunner.query(`
            UPDATE "games"
            SET "stage" = 'Bracket Reset'
            WHERE "stage" ILIKE 'Grand Finals; Bracket Reset'
        `);

        await queryRunner.query(`
            ALTER TABLE "games"
            ALTER COLUMN "stage" SET DEFAULT 'Round 1'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Best-effort restore of prefixed stage labels from bracket
        await queryRunner.query(`
            UPDATE "games"
            SET "stage" = 'Winners Bracket; ' || "stage"
            WHERE "bracket" = 'winners'
              AND "stage" NOT ILIKE 'Winners Bracket;%'
        `);

        await queryRunner.query(`
            UPDATE "games"
            SET "stage" = 'Losers Bracket; ' || "stage"
            WHERE "bracket" = 'losers'
              AND "stage" NOT ILIKE 'Losers Bracket;%'
        `);

        await queryRunner.query(`
            UPDATE "games"
            SET "stage" = 'Grand Finals; Bracket Reset'
            WHERE "stage" = 'Bracket Reset'
        `);
    }
}
