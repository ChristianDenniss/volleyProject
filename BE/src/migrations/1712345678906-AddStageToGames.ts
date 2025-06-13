import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStageToGames1712345678906 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games" 
            ADD COLUMN IF NOT EXISTS "stage" varchar DEFAULT 'Winners Bracket; Round of 16';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games" 
            DROP COLUMN IF EXISTS "stage";
        `);
    }
} 