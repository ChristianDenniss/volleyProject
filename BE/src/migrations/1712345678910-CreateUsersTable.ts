import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsersTable1712345678910 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if users table already exists
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user'
            );
        `);

        if (!tableExists[0].exists) {
            await queryRunner.createTable(
                new Table({
                    name: "user",
                    columns: [
                        {
                            name: "id",
                            type: "int",
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: "increment",
                        },
                        {
                            name: "username",
                            type: "varchar",
                            isUnique: true,
                        },
                        {
                            name: "email",
                            type: "varchar",
                            isUnique: true,
                        },
                        {
                            name: "password",
                            type: "varchar",
                        },
                        {
                            name: "role",
                            type: "varchar",
                            default: "'user'",
                        },
                        {
                            name: "createdAt",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP",
                        },
                        {
                            name: "updatedAt",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP",
                        },
                    ],
                }),
                true
            );

            console.log("Users table created successfully");
        } else {
            console.log("Users table already exists");
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("user");
    }
} 