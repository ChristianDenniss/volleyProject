import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class SyncSchema1712345678902 implements MigrationInterface {
    name = 'SyncSchema1712345678902'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get all tables
        const tables = await queryRunner.getTables();
        const tableNames = tables.map(table => table.name);

        // Function to safely add column if it doesn't exist
        const addColumnIfNotExists = async (tableName: string, columnName: string, type: string) => {
            const table = await queryRunner.getTable(tableName);
            if (!table) {
                console.log(`Table ${tableName} does not exist, skipping column ${columnName}`);
                return;
            }

            const columnExists = table.findColumnByName(columnName);
            if (!columnExists) {
                console.log(`Adding column ${columnName} to ${tableName}`);
                await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${type}`);
            } else {
                console.log(`Column ${columnName} already exists in ${tableName}, skipping...`);
            }
        };

        // Sync each entity
        try {
            // Teams
            if (!tableNames.includes('team')) {
                console.log('Creating team table...');
                const teamTable = await queryRunner.getTable('team');
                if (teamTable) {
                    await queryRunner.createTable(teamTable);
                }
            } else {
                await addColumnIfNotExists('team', 'name', 'varchar');
                await addColumnIfNotExists('team', 'createdAt', 'timestamp');
                await addColumnIfNotExists('team', 'updatedAt', 'timestamp');
            }

            // Players
            if (!tableNames.includes('player')) {
                console.log('Creating player table...');
                const playerTable = await queryRunner.getTable('player');
                if (playerTable) {
                    await queryRunner.createTable(playerTable);
                }
            } else {
                await addColumnIfNotExists('player', 'name', 'varchar');
                await addColumnIfNotExists('player', 'number', 'integer');
                await addColumnIfNotExists('player', 'position', 'varchar');
                await addColumnIfNotExists('player', 'teamId', 'integer');
                await addColumnIfNotExists('player', 'createdAt', 'timestamp');
                await addColumnIfNotExists('player', 'updatedAt', 'timestamp');
            }

            // Games
            if (!tableNames.includes('game')) {
                console.log('Creating game table...');
                const gameTable = await queryRunner.getTable('game');
                if (gameTable) {
                    await queryRunner.createTable(gameTable);
                }
            } else {
                await addColumnIfNotExists('game', 'date', 'timestamp');
                await addColumnIfNotExists('game', 'homeTeamId', 'integer');
                await addColumnIfNotExists('game', 'awayTeamId', 'integer');
                await addColumnIfNotExists('game', 'homeScore', 'integer');
                await addColumnIfNotExists('game', 'awayScore', 'integer');
                await addColumnIfNotExists('game', 'seasonId', 'integer');
                await addColumnIfNotExists('game', 'videoUrl', 'varchar');
                await addColumnIfNotExists('game', 'createdAt', 'timestamp');
                await addColumnIfNotExists('game', 'updatedAt', 'timestamp');
            }

            // Seasons
            if (!tableNames.includes('season')) {
                console.log('Creating season table...');
                const seasonTable = await queryRunner.getTable('season');
                if (seasonTable) {
                    await queryRunner.createTable(seasonTable);
                }
            } else {
                await addColumnIfNotExists('season', 'name', 'varchar');
                await addColumnIfNotExists('season', 'startDate', 'timestamp');
                await addColumnIfNotExists('season', 'endDate', 'timestamp');
                await addColumnIfNotExists('season', 'createdAt', 'timestamp');
                await addColumnIfNotExists('season', 'updatedAt', 'timestamp');
            }

            // Stats
            if (!tableNames.includes('stat')) {
                console.log('Creating stat table...');
                const statTable = await queryRunner.getTable('stat');
                if (statTable) {
                    await queryRunner.createTable(statTable);
                }
            } else {
                await addColumnIfNotExists('stat', 'playerId', 'integer');
                await addColumnIfNotExists('stat', 'gameId', 'integer');
                await addColumnIfNotExists('stat', 'kills', 'integer');
                await addColumnIfNotExists('stat', 'assists', 'integer');
                await addColumnIfNotExists('stat', 'digs', 'integer');
                await addColumnIfNotExists('stat', 'blocks', 'integer');
                await addColumnIfNotExists('stat', 'aces', 'integer');
                await addColumnIfNotExists('stat', 'errors', 'integer');
                await addColumnIfNotExists('stat', 'createdAt', 'timestamp');
                await addColumnIfNotExists('stat', 'updatedAt', 'timestamp');
            }

            // Awards
            if (!tableNames.includes('award')) {
                console.log('Creating award table...');
                const awardTable = await queryRunner.getTable('award');
                if (awardTable) {
                    await queryRunner.createTable(awardTable);
                }
            } else {
                await addColumnIfNotExists('award', 'name', 'varchar');
                await addColumnIfNotExists('award', 'description', 'varchar');
                await addColumnIfNotExists('award', 'seasonId', 'integer');
                await addColumnIfNotExists('award', 'createdAt', 'timestamp');
                await addColumnIfNotExists('award', 'updatedAt', 'timestamp');
            }

            // Users
            if (!tableNames.includes('user')) {
                console.log('Creating user table...');
                const userTable = await queryRunner.getTable('user');
                if (userTable) {
                    await queryRunner.createTable(userTable);
                }
            } else {
                await addColumnIfNotExists('user', 'username', 'varchar');
                await addColumnIfNotExists('user', 'email', 'varchar');
                await addColumnIfNotExists('user', 'password', 'varchar');
                await addColumnIfNotExists('user', 'role', 'varchar');
                await addColumnIfNotExists('user', 'createdAt', 'timestamp');
                await addColumnIfNotExists('user', 'updatedAt', 'timestamp');
            }

            // Add foreign key constraints if they don't exist
            const addForeignKeyIfNotExists = async (
                tableName: string,
                columnName: string,
                referencedTable: string,
                referencedColumn: string
            ) => {
                const table = await queryRunner.getTable(tableName);
                if (!table) return;

                const foreignKeyExists = table.foreignKeys.some(
                    fk => fk.columnNames.includes(columnName) && fk.referencedTableName === referencedTable
                );

                if (!foreignKeyExists) {
                    console.log(`Adding foreign key ${columnName} to ${tableName}`);
                    await queryRunner.query(`
                        ALTER TABLE "${tableName}"
                        ADD CONSTRAINT "FK_${tableName}_${columnName}"
                        FOREIGN KEY ("${columnName}")
                        REFERENCES "${referencedTable}"("${referencedColumn}")
                        ON DELETE NO ACTION
                        ON UPDATE NO ACTION
                    `);
                } else {
                    console.log(`Foreign key ${columnName} already exists in ${tableName}, skipping...`);
                }
            };

            // Add foreign keys
            await addForeignKeyIfNotExists('player', 'teamId', 'team', 'id');
            await addForeignKeyIfNotExists('game', 'homeTeamId', 'team', 'id');
            await addForeignKeyIfNotExists('game', 'awayTeamId', 'team', 'id');
            await addForeignKeyIfNotExists('game', 'seasonId', 'season', 'id');
            await addForeignKeyIfNotExists('stat', 'playerId', 'player', 'id');
            await addForeignKeyIfNotExists('stat', 'gameId', 'game', 'id');
            await addForeignKeyIfNotExists('award', 'seasonId', 'season', 'id');

        } catch (error) {
            console.error('Error during schema sync:', error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // This is a sync migration, so we don't need a down method
        // as we don't want to remove any existing columns
    }
} 