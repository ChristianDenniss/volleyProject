import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegionsAndScopeEntities1712345678922 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "region" (
                "id" SERIAL NOT NULL,
                "code" character varying NOT NULL,
                "name" character varying NOT NULL,
                "sortOrder" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_region_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_region_code" UNIQUE ("code")
            )
        `);

        await queryRunner.query(`
            INSERT INTO "region" ("code", "name", "sortOrder")
            VALUES ('na', 'North American', 1),
                   ('eu', 'European', 2),
                   ('as', 'Asian', 3)
            ON CONFLICT ("code") DO NOTHING
        `);

        const naRegion: Array<{ id: number }> = await queryRunner.query(
            `SELECT id FROM "region" WHERE code = 'na' LIMIT 1`
        );
        const naRegionId = naRegion[0]?.id;
        if (!naRegionId) {
            throw new Error('Failed to seed NA region');
        }

        await queryRunner.query(`
            ALTER TABLE "seasons"
            ADD COLUMN IF NOT EXISTS "regionId" integer
        `);
        await queryRunner.query(`
            UPDATE "seasons" SET "regionId" = ${naRegionId} WHERE "regionId" IS NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "seasons"
            ALTER COLUMN "regionId" SET NOT NULL
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "seasons"
                ADD CONSTRAINT "FK_seasons_regionId"
                FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE RESTRICT;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seasons_seasonNumber_regionId"
            ON "seasons" ("seasonNumber", "regionId")
        `);

        for (const table of ['teams', 'awards', 'records']) {
            await queryRunner.query(`
                ALTER TABLE "${table}"
                ADD COLUMN IF NOT EXISTS "regionId" integer
            `);
            await queryRunner.query(`
                UPDATE "${table}" t
                SET "regionId" = s."regionId"
                FROM "seasons" s
                WHERE t."seasonId" = s.id AND t."regionId" IS NULL
            `);
            await queryRunner.query(`
                UPDATE "${table}" SET "regionId" = ${naRegionId} WHERE "regionId" IS NULL
            `);
            await queryRunner.query(`
                ALTER TABLE "${table}"
                ALTER COLUMN "regionId" SET NOT NULL
            `);
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "${table}"
                    ADD CONSTRAINT "FK_${table}_regionId"
                    FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE RESTRICT;
                EXCEPTION WHEN duplicate_object THEN null;
                END $$;
            `);
        }

        await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN IF NOT EXISTS "regionId" integer
        `);

        const gamesHasRegionEnum = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'games' AND column_name = 'region'
        `);

        if (gamesHasRegionEnum.length > 0) {
            await queryRunner.query(`
                UPDATE "games" g
                SET "regionId" = r.id
                FROM "region" r
                WHERE g."regionId" IS NULL
                  AND r.code = CASE
                    WHEN g.region::text IN ('sa') THEN 'as'
                    ELSE g.region::text
                  END
            `);
        }

        await queryRunner.query(`
            UPDATE "games" g
            SET "regionId" = s."regionId"
            FROM "seasons" s
            WHERE g."seasonId" = s.id AND g."regionId" IS NULL
        `);
        await queryRunner.query(`
            UPDATE "games" SET "regionId" = ${naRegionId} WHERE "regionId" IS NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "games"
            ALTER COLUMN "regionId" SET NOT NULL
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "games"
                ADD CONSTRAINT "FK_games_regionId"
                FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE RESTRICT;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        if (gamesHasRegionEnum.length > 0) {
            await queryRunner.query(`ALTER TABLE "games" DROP COLUMN IF EXISTS "region"`);
            await queryRunner.query(`DROP TYPE IF EXISTS "games_region_enum"`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "games_region_enum" AS ENUM('na', 'eu', 'as', 'sa');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN IF NOT EXISTS "region" "games_region_enum" NOT NULL DEFAULT 'na'
        `);
        await queryRunner.query(`
            UPDATE "games" g
            SET "region" = r.code::games_region_enum
            FROM "region" r
            WHERE g."regionId" = r.id
        `);

        for (const table of ['games', 'records', 'awards', 'teams', 'seasons']) {
            await queryRunner.query(`
                ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "FK_${table}_regionId"
            `);
            await queryRunner.query(`
                ALTER TABLE "${table}" DROP COLUMN IF EXISTS "regionId"
            `);
        }

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_seasons_seasonNumber_regionId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "region"`);
    }
}
