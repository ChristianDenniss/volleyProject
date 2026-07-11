import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApplicationFormsTable1712345678918 implements MigrationInterface {
    name = "CreateApplicationFormsTable1712345678918";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "application_form" (
                "id" SERIAL NOT NULL,
                "slug" character varying NOT NULL,
                "name" character varying NOT NULL,
                "type" character varying NOT NULL,
                "description" text NOT NULL,
                "url" character varying,
                "status" character varying NOT NULL DEFAULT 'closed',
                "category" character varying NOT NULL,
                "sortOrder" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_application_form_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_application_form_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            INSERT INTO "application_form"
                ("slug", "name", "type", "description", "url", "status", "category", "sortOrder")
            VALUES
                ('staff', 'Staff Application', 'General Staff Position', 'Apply to become a staff member of the Roblox Volleyball League. Help manage the community and ensure smooth operations for each season.', 'https://forms.gle/TgpFMdP8zVmyqKjk6', 'closed', 'staff', 1),
                ('media', 'Media Team Application', 'Content Creation & Streaming', 'Join our media team to create content, stream RVL matches, manage social media, and help promote the league through various platforms.', 'https://forms.gle/L6QFsuztCaJMRQyp8', 'closed', 'media', 2),
                ('referee', 'Referee Application', 'Game Officiating', 'Apply to become a RVL referee and help officiate volleyball matches. Ensure fair play and maintain game rules.', NULL, 'closed', 'game-officials', 3),
                ('moderator', 'Server Moderator Application', 'Community Management', 'Help moderate our Discords community spaces, enforce rules, and maintain a positive environment for all members.', NULL, 'closed', 'management', 4),
                ('game-moderator', 'Game Moderator Application', 'Game Officiating', 'Help moderate Volleyball 4.2s ranked games, police rule violations, and fair play enforcement for the playerbase.', NULL, 'closed', 'game-officials', 5),
                ('stats', 'Stats Team Application', 'Data Management', 'Join our stats team to help track player statistics, game data, and maintain accurate records for RVLs playoffs.', NULL, 'closed', 'management', 6),
                ('host', 'Host Application', 'Event Management', 'Apply to become a host and help organize events in games outside of 4.2, and keep the community engaged by hosting casual pickup matches.', NULL, 'closed', 'management', 7)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "application_form"`);
    }
}
