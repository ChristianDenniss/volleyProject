import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAwardTypeEnum1712345678905 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the enum type if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."awards_type_enum" AS ENUM (
                    'MVP', 
                    'Best Spiker', 
                    'Best Server', 
                    'Best Blocker', 
                    'Best Libero', 
                    'Best Setter', 
                    'MIP', 
                    'Best Aper', 
                    'FMVP', 
                    'DPOS', 
                    'Best Receiver', 
                    'LuvLate Award'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // First remove the default constraint
        await queryRunner.query(`
            ALTER TABLE "awards" 
            ALTER COLUMN "type" DROP DEFAULT;
        `);

        // Then alter the column type
        await queryRunner.query(`
            ALTER TABLE "awards" 
            ALTER COLUMN "type" TYPE "public"."awards_type_enum" 
            USING "type"::"public"."awards_type_enum";
        `);

        // Finally, add back the default value
        await queryRunner.query(`
            ALTER TABLE "awards" 
            ALTER COLUMN "type" SET DEFAULT 'MVP'::"public"."awards_type_enum";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the default constraint
        await queryRunner.query(`
            ALTER TABLE "awards" 
            ALTER COLUMN "type" DROP DEFAULT;
        `);

        // Convert back to text
        await queryRunner.query(`
            ALTER TABLE "awards" 
            ALTER COLUMN "type" TYPE text;
        `);

        // Add back the default value as text
        await queryRunner.query(`
            ALTER TABLE "awards" 
            ALTER COLUMN "type" SET DEFAULT 'MVP';
        `);

        // Drop the enum type
        await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."awards_type_enum";
        `);
    }
} 