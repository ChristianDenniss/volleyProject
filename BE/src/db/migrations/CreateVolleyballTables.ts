import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateVolleyballTables1712345678902 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Seasons Table
        await queryRunner.createTable(
            new Table({
                name: "seasons",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "name", type: "varchar" },
                    { name: "year", type: "int" },
                    { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP" }
                ]
            })
        );

        // Create Teams Table
        await queryRunner.createTable(
            new Table({
                name: "teams",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "name", type: "varchar" },
                    { name: "seasonId", type: "int", isNullable: true },
                    { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP" }
                ]
            })
        );

        // Add foreign key for Teams to Seasons
        await queryRunner.createForeignKey(
            "teams",
            new TableForeignKey({
                columnNames: ["seasonId"],
                referencedColumnNames: ["id"],
                referencedTableName: "seasons",
                onDelete: "SET NULL"
            })
        );

        // Create Players Table
        await queryRunner.createTable(
            new Table({
                name: "players",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "name", type: "varchar" },
                    { name: "jerseyNumber", type: "int" },
                    { name: "position", type: "varchar" },
                    { name: "teamId", type: "int", isNullable: true },
                    { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP" }
                ]
            })
        );

        // Add foreign key for Players to Teams
        await queryRunner.createForeignKey(
            "players",
            new TableForeignKey({
                columnNames: ["teamId"],
                referencedColumnNames: ["id"],
                referencedTableName: "teams",
                onDelete: "SET NULL"
            })
        );

        // Create Games Table
        await queryRunner.createTable(
            new Table({
                name: "games",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "date", type: "timestamp" },
                    { name: "location", type: "varchar" },
                    { name: "seasonId", type: "int", isNullable: true },
                    { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP" }
                ]
            })
        );

        // Add foreign key for Games to Seasons
        await queryRunner.createForeignKey(
            "games",
            new TableForeignKey({
                columnNames: ["seasonId"],
                referencedColumnNames: ["id"],
                referencedTableName: "seasons",
                onDelete: "SET NULL"
            })
        );

        // Create game_teams junction table for many-to-many relationship
        await queryRunner.createTable(
            new Table({
                name: "games_teams_teams",
                columns: [
                    { name: "gamesId", type: "int" },
                    { name: "teamsId", type: "int" }
                ],
                foreignKeys: [
                    {
                        columnNames: ["gamesId"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "games",
                        onDelete: "CASCADE"
                    },
                    {
                        columnNames: ["teamsId"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "teams",
                        onDelete: "CASCADE"
                    }
                ]
            })
        );

        // Create Stats Table
        await queryRunner.createTable(
            new Table({
                name: "stats",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "points", type: "int" },
                    { name: "assists", type: "int" },
                    { name: "blocks", type: "int" },
                    { name: "digs", type: "int" },
                    { name: "aces", type: "int" },
                    { name: "playerId", type: "int", isNullable: true },
                    { name: "gameId", type: "int", isNullable: true },
                    { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP" }
                ]
            })
        );

        // Add foreign keys for Stats
        await queryRunner.createForeignKey(
            "stats",
            new TableForeignKey({
                columnNames: ["playerId"],
                referencedColumnNames: ["id"],
                referencedTableName: "players",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "stats",
            new TableForeignKey({
                columnNames: ["gameId"],
                referencedColumnNames: ["id"],
                referencedTableName: "games",
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order to avoid foreign key constraints
        await queryRunner.dropTable("stats");
        await queryRunner.dropTable("games_teams_teams");
        await queryRunner.dropTable("games");
        await queryRunner.dropTable("players");
        await queryRunner.dropTable("teams");
        await queryRunner.dropTable("seasons");
    }
}