import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class SyncSchema1712345678902 implements MigrationInterface {
    name = 'SyncSchema1712345678902'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create tables if they don't exist
        await this.createTables(queryRunner);
        
        // Add foreign keys
        await this.addForeignKeys(queryRunner);
        
        // Add missing columns
        await this.addMissingColumns(queryRunner);
    }

    private async createTables(queryRunner: QueryRunner): Promise<void> {
        // Teams table
        await queryRunner.createTable(new Table({
            name: "teams",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "name",
                    type: "varchar"
                },
                {
                    name: "placement",
                    type: "varchar",
                    default: "'Didnt make playoffs'"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);

        // Seasons table
        await queryRunner.createTable(new Table({
            name: "seasons",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "seasonNumber",
                    type: "int"
                },
                {
                    name: "theme",
                    type: "varchar",
                    default: "'None'"
                },
                {
                    name: "image",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "startDate",
                    type: "timestamp"
                },
                {
                    name: "endDate",
                    type: "timestamp"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);

        // Games table
        await queryRunner.createTable(new Table({
            name: "games",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "team1Score",
                    type: "int"
                },
                {
                    name: "team2Score",
                    type: "int"
                },
                {
                    name: "date",
                    type: "timestamp"
                },
                {
                    name: "name",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "videoUrl",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "stage",
                    type: "varchar",
                    default: "'Winners Bracket; Round of 16'"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);

        // Create join tables for many-to-many relationships
        await queryRunner.createTable(new Table({
            name: "teams_games",
            columns: [
                {
                    name: "teamsId",
                    type: "int"
                },
                {
                    name: "gamesId",
                    type: "int"
                }
            ]
        }), true);

        await queryRunner.createTable(new Table({
            name: "teams_players",
            columns: [
                {
                    name: "teamsId",
                    type: "int"
                },
                {
                    name: "playersId",
                    type: "int"
                }
            ]
        }), true);
    }

    private async addForeignKeys(queryRunner: QueryRunner): Promise<void> {
        // Add foreign keys for teams_games
        await queryRunner.createForeignKey("teams_games", new TableForeignKey({
            columnNames: ["teamsId"],
            referencedColumnNames: ["id"],
            referencedTableName: "teams",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("teams_games", new TableForeignKey({
            columnNames: ["gamesId"],
            referencedColumnNames: ["id"],
            referencedTableName: "games",
            onDelete: "CASCADE"
        }));

        // Add foreign keys for teams_players
        await queryRunner.createForeignKey("teams_players", new TableForeignKey({
            columnNames: ["teamsId"],
            referencedColumnNames: ["id"],
            referencedTableName: "teams",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("teams_players", new TableForeignKey({
            columnNames: ["playersId"],
            referencedColumnNames: ["id"],
            referencedTableName: "players",
            onDelete: "CASCADE"
        }));
    }

    private async addMissingColumns(queryRunner: QueryRunner): Promise<void> {
        // Add any missing columns to existing tables
        const tables = await queryRunner.getTables();
        
        for (const table of tables) {
            console.log(`Checking table: ${table.name}`);
            const columns = table.columns.map(col => col.name);
            console.log(`Existing columns: ${columns.join(', ')}`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.dropTable("teams_players");
        await queryRunner.dropTable("teams_games");
        await queryRunner.dropTable("games");
        await queryRunner.dropTable("seasons");
        await queryRunner.dropTable("teams");
    }
} 