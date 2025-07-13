import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateRecordsTable1712345678908 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the enum type for record types
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."records_record_enum" AS ENUM (
                    'most spike kills', 'most assists', 'most ape kills', 'most digs', 'most block follows', 'most blocks', 'most aces', 'most serve errors',
                    'most misc errors', 'most set errors', 'most spike errors', 'most spike attempts', 'most ape attempts', 'most total kills', 
                    'most total attempts', 'most total errors', 'best total spiking % with 10+ attempts', 'best total spiking % with 20+ attempts', 
                    'best total spiking % with 30+ attempts', 'best total spiking % with 40+ attempts', 'best total spiking % with 50+ attempts', 
                    'best total spiking % with 60+ attempts', 'best total spiking % with 70+ attempts', 'best total spiking % with 80+ attempts', 
                    'best total spiking % with 90+ attempts', 'best total spiking % with 100+ attempts', 'best total spiking % with 110+ attempts', 
                    'best total spiking % with 120+ attempts', 'best total spiking % with 130+ attempts', 'best total spiking % with 140+ attempts', 
                    'best total spiking % with 150+ attempts', 'best total spiking % with 160+ attempts', 'best total spiking % with 170+ attempts', 
                    'best total spiking % with 180+ attempts', 'best total spiking % with 190+ attempts', 'best total spiking % with 200+ attempts', 
                    'best total spiking % with 210+ attempts', 'best total spiking % with 220+ attempts', 'best total spiking % with 230+ attempts', 
                    'best total spiking % with 240+ attempts', 'best total spiking % with 250+ attempts'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create the enum type for record types
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."records_type_enum" AS ENUM (
                    'game', 'season'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.createTable(
            new Table({
                name: "records",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "record",
                        type: "public.records_record_enum",
                        isNullable: false,
                    },
                    {
                        name: "type",
                        type: "public.records_type_enum",
                        isNullable: false,
                        default: "'game'",
                    },
                    {
                        name: "rank",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "value",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: "date",
                        type: "date",
                        isNullable: false,
                        default: "'2024-01-01'",
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
                    {
                        name: "seasonId",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "playerId",
                        type: "int",
                        isNullable: false,
                    },

                ],
                foreignKeys: [
                    {
                        columnNames: ["seasonId"],
                        referencedTableName: "seasons",
                        referencedColumnNames: ["id"],
                        onDelete: "CASCADE",
                    },
                    {
                        columnNames: ["playerId"],
                        referencedTableName: "players",
                        referencedColumnNames: ["id"],
                        onDelete: "CASCADE",
                    },

                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("records");
        
        // Drop the enum types
        await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."records_record_enum";
        `);
        await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."records_type_enum";
        `);
    }
} 