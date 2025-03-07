import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsersTable1712345678901 implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void>
    {
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "username", type: "varchar", isUnique: true },
                    { name: "email", type: "varchar", isUnique: true },
                    { name: "password", type: "varchar" },
                    { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" }
                ]
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void>
    {
        await queryRunner.dropTable("users");
    }
}
