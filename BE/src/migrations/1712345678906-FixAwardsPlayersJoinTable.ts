import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAwardsPlayersJoinTable1712345678906 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing join table if it exists
        await queryRunner.query(`
            DROP TABLE IF EXISTS "awards_players_players";
        `);

        // Create the join table with proper foreign key constraints
        await queryRunner.query(`
            CREATE TABLE "awards_players_players" (
                "awardsId" integer NOT NULL,
                "playersId" integer NOT NULL,
                CONSTRAINT "PK_awards_players_players" PRIMARY KEY ("awardsId", "playersId"),
                CONSTRAINT "FK_awards_players_awards" FOREIGN KEY ("awardsId") 
                    REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_awards_players_players" FOREIGN KEY ("playersId") 
                    REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            );
        `);

        // Create indexes for better performance
        await queryRunner.query(`
            CREATE INDEX "IDX_awards_players_awards" ON "awards_players_players" ("awardsId");
            CREATE INDEX "IDX_awards_players_players" ON "awards_players_players" ("playersId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the join table
        await queryRunner.query(`
            DROP TABLE IF EXISTS "awards_players_players";
        `);
    }
} 