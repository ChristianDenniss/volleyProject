import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTokenVersionToUsers1712345678920 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("user", "tokenVersion");
        if (!hasColumn) {
            await queryRunner.addColumn(
                "user",
                new TableColumn({
                    name: "tokenVersion",
                    type: "int",
                    default: 0,
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("user", "tokenVersion");
        if (hasColumn) {
            await queryRunner.dropColumn("user", "tokenVersion");
        }
    }
}
