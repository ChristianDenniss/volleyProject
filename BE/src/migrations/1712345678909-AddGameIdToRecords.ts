import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGameIdToRecords1712345678909 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add gameId column
        await queryRunner.addColumn(
            "records",
            new TableColumn({
                name: "gameId",
                type: "int",
                isNullable: true, // Nullable because season records won't have a gameId
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop column
        await queryRunner.dropColumn("records", "gameId");
    }
} 