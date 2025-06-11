import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAwardsTable1710000000001 implements MigrationInterface {
    name = 'CreateAwardsTable1710000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create awards table
        await queryRunner.query(`
            CREATE TABLE "awards" (
                "id" SERIAL NOT NULL,
                "description" character varying NOT NULL,
                "type" character varying NOT NULL DEFAULT 'MVP',
                "imageUrl" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "seasonId" integer,
                CONSTRAINT "PK_awards" PRIMARY KEY ("id")
            )
        `);

        // Create awards_players join table for many-to-many relationship
        await queryRunner.query(`
            CREATE TABLE "awards_players" (
                "awardsId" integer NOT NULL,
                "playersId" integer NOT NULL,
                CONSTRAINT "PK_awards_players" PRIMARY KEY ("awardsId", "playersId")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "awards" 
            ADD CONSTRAINT "FK_awards_season" 
            FOREIGN KEY ("seasonId") 
            REFERENCES "seasons"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "awards_players" 
            ADD CONSTRAINT "FK_awards_players_awards" 
            FOREIGN KEY ("awardsId") 
            REFERENCES "awards"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "awards_players" 
            ADD CONSTRAINT "FK_awards_players_players" 
            FOREIGN KEY ("playersId") 
            REFERENCES "players"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_awards_season" ON "awards" ("seasonId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_awards_players_awards" ON "awards_players" ("awardsId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_awards_players_players" ON "awards_players" ("playersId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_awards_players_players"`);
        await queryRunner.query(`DROP INDEX "IDX_awards_players_awards"`);
        await queryRunner.query(`DROP INDEX "IDX_awards_season"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "awards_players" DROP CONSTRAINT "FK_awards_players_players"`);
        await queryRunner.query(`ALTER TABLE "awards_players" DROP CONSTRAINT "FK_awards_players_awards"`);
        await queryRunner.query(`ALTER TABLE "awards" DROP CONSTRAINT "FK_awards_season"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "awards_players"`);
        await queryRunner.query(`DROP TABLE "awards"`);
    }
} 