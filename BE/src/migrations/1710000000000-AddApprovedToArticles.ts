import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApprovedToArticles1710000000000 implements MigrationInterface {
    name = 'AddApprovedToArticles1710000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "article" ADD "approved" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "approved"`);
    }
} 