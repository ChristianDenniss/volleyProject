import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamLogosToMatches1712345678915 implements MigrationInterface {
    name = 'AddTeamLogosToMatches1712345678915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add team1LogoUrl column to matches table
        await queryRunner.query(`ALTER TABLE "matches" ADD "team1LogoUrl" character varying`);
        
        // Add team2LogoUrl column to matches table
        await queryRunner.query(`ALTER TABLE "matches" ADD "team2LogoUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove team2LogoUrl column
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team2LogoUrl"`);
        
        // Remove team1LogoUrl column
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "team1LogoUrl"`);
    }
} 