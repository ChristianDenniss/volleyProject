import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyMatchesTeams1712345678913 implements MigrationInterface {
    name = 'SimplifyMatchesTeams1712345678913'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the matches_teams join table
        await queryRunner.query(`DROP TABLE IF EXISTS "matches_teams"`);
        
        // Add team name columns to matches table
        await queryRunner.query(`ALTER TABLE "matches" ADD "team1Name" character varying`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "team2Name" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove team name columns
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team2Name"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team1Name"`);
        
        // Recreate the matches_teams join table
        await queryRunner.query(`CREATE TABLE "matches_teams" ("matchesId" integer NOT NULL, "teamsId" integer NOT NULL, CONSTRAINT "UQ_matches_teams_unique" UNIQUE ("matchesId", "teamsId"))`);
        await queryRunner.query(`ALTER TABLE "matches_teams" ADD CONSTRAINT "FK_5158327e24c6e29e9d2144d0b9b" FOREIGN KEY ("matchesId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches_teams" ADD CONSTRAINT "FK_200c5a21dd735d2f334bbb0aba3" FOREIGN KEY ("teamsId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
} 