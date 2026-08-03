import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeamApplicationPortal1712345678925 implements MigrationInterface {
    name = 'TeamApplicationPortal1712345678925';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "robloxUserId" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "robloxUsername" character varying`);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_robloxUserId"
            ON "user" ("robloxUserId") WHERE "robloxUserId" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_robloxUsername"
            ON "user" ("robloxUsername") WHERE "robloxUsername" IS NOT NULL
        `);

        await queryRunner.query(`ALTER TABLE "seasons" ADD COLUMN IF NOT EXISTS "registrationsOpen" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD COLUMN IF NOT EXISTS "captainEditEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD COLUMN IF NOT EXISTS "maxTeams" integer`);

        await queryRunner.query(`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "hexColor" character varying`);
        await queryRunner.query(`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "brickColor" character varying`);
        await queryRunner.query(`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "captainEditEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "captainUserId" integer`);
        await queryRunner.query(`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "viceCaptainUserId" integer`);
        await queryRunner.query(`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "courtCaptainUserId" integer`);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "teams" ADD CONSTRAINT "FK_teams_captainUserId"
                FOREIGN KEY ("captainUserId") REFERENCES "user"("id") ON DELETE SET NULL;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "teams" ADD CONSTRAINT "FK_teams_viceCaptainUserId"
                FOREIGN KEY ("viceCaptainUserId") REFERENCES "user"("id") ON DELETE SET NULL;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "teams" ADD CONSTRAINT "FK_teams_courtCaptainUserId"
                FOREIGN KEY ("courtCaptainUserId") REFERENCES "user"("id") ON DELETE SET NULL;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "robloxUsername" character varying`);
        await queryRunner.query(`ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "robloxUserId" character varying`);
        await queryRunner.query(`ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "discordUsername" character varying`);
        await queryRunner.query(`ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "userId" integer`);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_players_robloxUsername" ON "players" ("robloxUsername")
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "players" ADD CONSTRAINT "FK_players_userId"
                FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "team_registration" (
                "id" SERIAL NOT NULL,
                "submittedByUserId" integer NOT NULL,
                "regionId" integer NOT NULL,
                "seasonId" integer NOT NULL,
                "teamName" character varying NOT NULL,
                "hexColor" character varying NOT NULL,
                "brickColor" character varying NOT NULL,
                "captainDiscord" character varying NOT NULL,
                "captainRoblox" character varying NOT NULL,
                "viceDiscord" character varying NOT NULL,
                "viceRoblox" character varying NOT NULL,
                "roster" jsonb NOT NULL,
                "agreeCivilScheduling" boolean NOT NULL DEFAULT false,
                "confidentWillParticipate" boolean NOT NULL DEFAULT false,
                "priorLeagueExperience" text,
                "logoJerseyAck" boolean NOT NULL DEFAULT false,
                "status" character varying NOT NULL DEFAULT 'pending',
                "createdTeamId" integer,
                "conflictPayload" jsonb,
                "captainLinkPending" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_team_registration" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_team_registration_region_season"
            ON "team_registration" ("regionId", "seasonId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_team_registration_status"
            ON "team_registration" ("status")
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "team_registration" ADD CONSTRAINT "FK_team_registration_submittedBy"
                FOREIGN KEY ("submittedByUserId") REFERENCES "user"("id") ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "team_registration" ADD CONSTRAINT "FK_team_registration_region"
                FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE RESTRICT;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "team_registration" ADD CONSTRAINT "FK_team_registration_season"
                FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "team_registration" ADD CONSTRAINT "FK_team_registration_createdTeam"
                FOREIGN KEY ("createdTeamId") REFERENCES "teams"("id") ON DELETE SET NULL;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "team_registration"`);
        await queryRunner.query(`ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "FK_players_userId"`);
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN IF EXISTS "userId"`);
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN IF EXISTS "discordUsername"`);
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN IF EXISTS "robloxUserId"`);
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN IF EXISTS "robloxUsername"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "FK_teams_courtCaptainUserId"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "FK_teams_viceCaptainUserId"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "FK_teams_captainUserId"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN IF EXISTS "courtCaptainUserId"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN IF EXISTS "viceCaptainUserId"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN IF EXISTS "captainUserId"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN IF EXISTS "captainEditEnabled"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN IF EXISTS "brickColor"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN IF EXISTS "hexColor"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN IF EXISTS "maxTeams"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN IF EXISTS "captainEditEnabled"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN IF EXISTS "registrationsOpen"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_robloxUsername"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_robloxUserId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "robloxUsername"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "robloxUserId"`);
    }
}
