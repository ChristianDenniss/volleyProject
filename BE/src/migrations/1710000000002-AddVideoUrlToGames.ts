import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVideoUrlToGames1710000000002 implements MigrationInterface {
    name = 'AddVideoUrlToGames1710000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games" 
            ADD COLUMN "videoUrl" character varying DEFAULT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games" 
            DROP COLUMN "videoUrl"
        `);
    }
} 