import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from "typeorm";

export class FixSchema1712345678903 implements MigrationInterface {
    name = 'FixSchema1712345678903'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, check what tables exist
        const existingTables = await queryRunner.getTables();
        console.log('Existing tables:', existingTables.map(t => t.name));

        // Function to check and update column if needed
        const checkAndUpdateColumn = async (tableName: string, expectedColumn: TableColumn) => {
            const table = await queryRunner.getTable(tableName);
            if (!table) {
                console.log(`Table ${tableName} does not exist, skipping column ${expectedColumn.name}`);
                return;
            }

            const existingColumn = table.findColumnByName(expectedColumn.name);
            if (!existingColumn) {
                console.log(`Column ${expectedColumn.name} missing in ${tableName}, adding it...`);
                await queryRunner.addColumn(tableName, expectedColumn);
                return;
            }

            // Check if column properties match
            const needsUpdate = 
                existingColumn.type !== expectedColumn.type ||
                existingColumn.isNullable !== expectedColumn.isNullable ||
                existingColumn.default !== expectedColumn.default;

            if (needsUpdate) {
                console.log(`Column ${expectedColumn.name} in ${tableName} needs update:`, {
                    current: {
                        type: existingColumn.type,
                        isNullable: existingColumn.isNullable,
                        default: existingColumn.default
                    },
                    expected: {
                        type: expectedColumn.type,
                        isNullable: expectedColumn.isNullable,
                        default: expectedColumn.default
                    }
                });
                await queryRunner.changeColumn(tableName, expectedColumn.name, expectedColumn);
            } else {
                console.log(`Column ${expectedColumn.name} in ${tableName} is up to date`);
            }
        };

        // Define expected columns for each table
        const teamsColumns = [
            new TableColumn({ name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" }),
            new TableColumn({ name: "name", type: "varchar" }),
            new TableColumn({ name: "placement", type: "varchar", default: "'Didnt make playoffs'" }),
            new TableColumn({ name: "createdAt", type: "timestamp", default: "now()" }),
            new TableColumn({ name: "updatedAt", type: "timestamp", default: "now()" })
        ];

        const seasonsColumns = [
            new TableColumn({ name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" }),
            new TableColumn({ name: "seasonNumber", type: "int" }),
            new TableColumn({ name: "theme", type: "varchar", default: "'None'" }),
            new TableColumn({ name: "image", type: "varchar", isNullable: true }),
            new TableColumn({ name: "startDate", type: "timestamp" }),
            new TableColumn({ name: "endDate", type: "timestamp" }),
            new TableColumn({ name: "createdAt", type: "timestamp", default: "now()" }),
            new TableColumn({ name: "updatedAt", type: "timestamp", default: "now()" })
        ];

        const gamesColumns = [
            new TableColumn({ name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" }),
            new TableColumn({ name: "team1Score", type: "int" }),
            new TableColumn({ name: "team2Score", type: "int" }),
            new TableColumn({ name: "date", type: "timestamp" }),
            new TableColumn({ name: "name", type: "varchar", isNullable: true }),
            new TableColumn({ name: "videoUrl", type: "varchar", isNullable: true }),
            new TableColumn({ name: "stage", type: "varchar", default: "'Winners Bracket; Round of 16'" }),
            new TableColumn({ name: "createdAt", type: "timestamp", default: "now()" }),
            new TableColumn({ name: "updatedAt", type: "timestamp", default: "now()" })
        ];

        // Check and update each table's columns
        for (const column of teamsColumns) {
            await checkAndUpdateColumn('teams', column);
        }

        for (const column of seasonsColumns) {
            await checkAndUpdateColumn('seasons', column);
        }

        for (const column of gamesColumns) {
            await checkAndUpdateColumn('games', column);
        }

        // Check and update foreign keys
        const checkForeignKey = async (tableName: string, columnName: string, referencedTable: string) => {
            const table = await queryRunner.getTable(tableName);
            if (!table) {
                console.log(`Table ${tableName} does not exist, skipping foreign key check`);
                return;
            }

            const foreignKeyExists = table.foreignKeys.some(
                fk => fk.columnNames.includes(columnName) && fk.referencedTableName === referencedTable
            );

            if (!foreignKeyExists) {
                console.log(`Adding missing foreign key ${columnName} to ${tableName}`);
                await queryRunner.createForeignKey(tableName, new TableForeignKey({
                    columnNames: [columnName],
                    referencedColumnNames: ["id"],
                    referencedTableName: referencedTable,
                    onDelete: "CASCADE"
                }));
            } else {
                console.log(`Foreign key ${columnName} in ${tableName} is up to date`);
            }
        };

        // Check foreign keys for teams_games
        await checkForeignKey("teams_games", "teamsId", "teams");
        await checkForeignKey("teams_games", "gamesId", "games");

        // Check foreign keys for teams_players
        await checkForeignKey("teams_players", "teamsId", "teams");
        await checkForeignKey("teams_players", "playersId", "players");
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