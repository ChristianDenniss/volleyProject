import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from "typeorm";

export class AddLogoToTeamsAndCreateMatches1712345678911 implements MigrationInterface {
    name = 'AddLogoToTeamsAndCreateMatches1712345678911'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add logo column to teams table
        await queryRunner.query(`
            ALTER TABLE "teams" 
            ADD COLUMN IF NOT EXISTS "logoUrl" varchar;
        `);

        // Create matches table
        await queryRunner.createTable(new Table({
            name: "matches",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "matchNumber",
                    type: "varchar"
                },
                {
                    name: "status",
                    type: "enum",
                    enum: ["scheduled", "completed"],
                    default: "'scheduled'"
                },
                {
                    name: "round",
                    type: "varchar"
                },
                {
                    name: "date",
                    type: "timestamp"
                },
                {
                    name: "team1Score",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "team2Score",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "set1Score",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "set2Score",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "set3Score",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "set4Score",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "set5Score",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "challongeMatchId",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "challongeTournamentId",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "challongeRound",
                    type: "integer",
                    isNullable: true
                },
                {
                    name: "tags",
                    type: "text",
                    isNullable: true
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
                },
                {
                    name: "seasonId",
                    type: "int"
                }
            ]
        }));

        // Create matches_teams join table
        await queryRunner.createTable(new Table({
            name: "matches_teams",
            columns: [
                {
                    name: "matchesId",
                    type: "int"
                },
                {
                    name: "teamsId",
                    type: "int"
                }
            ]
        }));

        // Add foreign key for matches.seasonId -> seasons.id
        await queryRunner.createForeignKey("matches", new TableForeignKey({
            columnNames: ["seasonId"],
            referencedColumnNames: ["id"],
            referencedTableName: "seasons",
            onDelete: "CASCADE"
        }));

        // Add foreign keys for matches_teams join table
        await queryRunner.createForeignKey("matches_teams", new TableForeignKey({
            columnNames: ["matchesId"],
            referencedColumnNames: ["id"],
            referencedTableName: "matches",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("matches_teams", new TableForeignKey({
            columnNames: ["teamsId"],
            referencedColumnNames: ["id"],
            referencedTableName: "teams",
            onDelete: "CASCADE"
        }));

        // Add unique constraint to ensure each match can only have each team once
        await queryRunner.query(`
            ALTER TABLE "matches_teams" 
            ADD CONSTRAINT "UQ_matches_teams_unique" 
            UNIQUE ("matchesId", "teamsId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("matches_teams", "FK_matches_teams_teamsId");
        await queryRunner.dropForeignKey("matches_teams", "FK_matches_teams_matchesId");
        await queryRunner.dropForeignKey("matches", "FK_matches_seasonId");
        await queryRunner.dropTable("matches_teams");
        await queryRunner.dropTable("matches");
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN IF EXISTS "logoUrl"`);
    }
} 