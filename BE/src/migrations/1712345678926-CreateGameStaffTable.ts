import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGameStaffTable1712345678926 implements MigrationInterface {
    name = "CreateGameStaffTable1712345678926";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "game_staff" (
                "id" SERIAL NOT NULL,
                "gameId" integer NOT NULL,
                "userId" integer NOT NULL,
                "role" character varying NOT NULL,
                CONSTRAINT "PK_game_staff" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_game_staff_game_user_role" UNIQUE ("gameId", "userId", "role"),
                CONSTRAINT "CHK_game_staff_role" CHECK ("role" IN ('referee', 'streamer', 'commentator'))
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_game_staff_userId" ON "game_staff" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_game_staff_gameId" ON "game_staff" ("gameId")
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "game_staff" ADD CONSTRAINT "FK_game_staff_gameId"
                FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "game_staff" ADD CONSTRAINT "FK_game_staff_userId"
                FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_staff" DROP CONSTRAINT IF EXISTS "FK_game_staff_userId"`);
        await queryRunner.query(`ALTER TABLE "game_staff" DROP CONSTRAINT IF EXISTS "FK_game_staff_gameId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "game_staff"`);
    }
}
