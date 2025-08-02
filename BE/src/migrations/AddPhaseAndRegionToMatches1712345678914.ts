import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhaseAndRegionToMatches1712345678914 implements MigrationInterface {
    name = 'AddPhaseAndRegionToMatches1712345678914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the phase enum
        await queryRunner.query(`CREATE TYPE "public"."matches_phase_enum" AS ENUM('qualifiers', 'playoffs')`);
        
        // Create the region enum
        await queryRunner.query(`CREATE TYPE "public"."matches_region_enum" AS ENUM('na', 'eu', 'as', 'sa')`);
        
        // Add phase column to matches table
        await queryRunner.query(`ALTER TABLE "matches" ADD "phase" "public"."matches_phase_enum" NOT NULL DEFAULT 'qualifiers'`);
        
        // Add region column to matches table
        await queryRunner.query(`ALTER TABLE "matches" ADD "region" "public"."matches_region_enum" NOT NULL DEFAULT 'na'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove region column
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "region"`);
        
        // Remove phase column
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "phase"`);
        
        // Drop the region enum
        await queryRunner.query(`DROP TYPE "public"."matches_region_enum"`);
        
        // Drop the phase enum
        await queryRunner.query(`DROP TYPE "public"."matches_phase_enum"`);
    }
} 