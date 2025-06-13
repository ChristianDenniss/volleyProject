import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1749816949324 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE user WHERE 1=1`) // explode all
        await queryRunner.query(
            `ALTER TABLE user ADD COLUMN displayName VARCHAR(30) NOT NULL DEFAULT "unspecified"`
        )
        await queryRunner.query(
            `ALTER TABLE user ADD COLUMN img VARCHAR(255) NOT NULL DEFAULT ""`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE user DROP COLUMN displayName`)
        await queryRunner.query(`ALTER TABLE user DROP COLUMN img`)
    }

}
