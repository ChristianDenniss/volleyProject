import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTagsToMatches1712345678912 implements MigrationInterface {
    name = 'AddTagsToMatches1712345678912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("matches", new TableColumn({
            name: "tags",
            type: "text",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("matches", "tags");
    }
} 