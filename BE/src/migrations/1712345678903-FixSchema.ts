import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class FixSchema1712345678903 implements MigrationInterface {
    name = 'FixSchema1712345678903'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, check what tables exist
        const existingTables = await queryRunner.getTables();
        console.log('Existing tables:', existingTables.map(t => t.name));

        // Create tables if they don't exist
        if (!existingTables.find(t => t.name === 'teams')) {
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
        }

        if (!existingTables.find(t => t.name === 'seasons')) {
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
        }

        if (!existingTables.find(t => t.name === 'games')) {
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
        }

        // Create join tables if they don't exist
        if (!existingTables.find(t => t.name === 'teams_games')) {
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
        }

        if (!existingTables.find(t => t.name === 'teams_players')) {
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

        // Add foreign keys
        const teamsGamesTable = await queryRunner.getTable("teams_games");
        if (teamsGamesTable) {
            const foreignKeys = teamsGamesTable.foreignKeys;
            if (!foreignKeys.find(fk => fk.columnNames.includes("teamsId"))) {
                await queryRunner.createForeignKey("teams_games", new TableForeignKey({
                    columnNames: ["teamsId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "teams",
                    onDelete: "CASCADE"
                }));
            }
            if (!foreignKeys.find(fk => fk.columnNames.includes("gamesId"))) {
                await queryRunner.createForeignKey("teams_games", new TableForeignKey({
                    columnNames: ["gamesId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "games",
                    onDelete: "CASCADE"
                }));
            }
        }

        const teamsPlayersTable = await queryRunner.getTable("teams_players");
        if (teamsPlayersTable) {
            const foreignKeys = teamsPlayersTable.foreignKeys;
            if (!foreignKeys.find(fk => fk.columnNames.includes("teamsId"))) {
                await queryRunner.createForeignKey("teams_players", new TableForeignKey({
                    columnNames: ["teamsId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "teams",
                    onDelete: "CASCADE"
                }));
            }
            if (!foreignKeys.find(fk => fk.columnNames.includes("playersId"))) {
                await queryRunner.createForeignKey("teams_players", new TableForeignKey({
                    columnNames: ["playersId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "players",
                    onDelete: "CASCADE"
                }));
            }
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