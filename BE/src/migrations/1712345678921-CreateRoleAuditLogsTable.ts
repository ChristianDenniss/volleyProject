import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateRoleAuditLogsTable1712345678921 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.hasTable("role_audit_log");
        if (tableExists) {
            return;
        }

        await queryRunner.createTable(
            new Table({
                name: "role_audit_log",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    { name: "actorId", type: "int" },
                    { name: "targetId", type: "int" },
                    { name: "oldRole", type: "varchar" },
                    { name: "newRole", type: "varchar" },
                    { name: "ip", type: "varchar", isNullable: true },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("role_audit_log", true);
    }
}
