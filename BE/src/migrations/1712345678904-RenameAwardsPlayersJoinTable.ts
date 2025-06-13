import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameAwardsPlayersJoinTable1712345678904 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First check if the table exists
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'awards_players'
            );
        `);

        if (tableExists[0].exists) {
            // Rename the table
            await queryRunner.query(`
                ALTER TABLE "awards_players" 
                RENAME TO "awards_players_players";
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if the new table exists
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'awards_players_players'
            );
        `);

        if (tableExists[0].exists) {
            // Rename back to original
            await queryRunner.query(`
                ALTER TABLE "awards_players_players" 
                RENAME TO "awards_players";
            `);
        }
    }
} 