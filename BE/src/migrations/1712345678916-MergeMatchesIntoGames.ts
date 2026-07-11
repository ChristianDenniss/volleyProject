import { MigrationInterface, QueryRunner } from "typeorm";

export class MergeMatchesIntoGames1712345678916 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "games_status_enum" AS ENUM('scheduled', 'completed');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "games_phase_enum" AS ENUM('qualifiers', 'playoffs');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "games_region_enum" AS ENUM('na', 'eu', 'as', 'sa');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`ALTER TABLE "games" ALTER COLUMN "team1Score" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "games" ALTER COLUMN "team2Score" DROP NOT NULL`);

        await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN IF NOT EXISTS "status" "games_status_enum" NOT NULL DEFAULT 'scheduled',
            ADD COLUMN IF NOT EXISTS "matchNumber" varchar,
            ADD COLUMN IF NOT EXISTS "round" varchar,
            ADD COLUMN IF NOT EXISTS "phase" "games_phase_enum" NOT NULL DEFAULT 'qualifiers',
            ADD COLUMN IF NOT EXISTS "region" "games_region_enum" NOT NULL DEFAULT 'na',
            ADD COLUMN IF NOT EXISTS "set1Score" varchar,
            ADD COLUMN IF NOT EXISTS "set2Score" varchar,
            ADD COLUMN IF NOT EXISTS "set3Score" varchar,
            ADD COLUMN IF NOT EXISTS "set4Score" varchar,
            ADD COLUMN IF NOT EXISTS "set5Score" varchar,
            ADD COLUMN IF NOT EXISTS "challongeMatchId" varchar,
            ADD COLUMN IF NOT EXISTS "challongeTournamentId" varchar,
            ADD COLUMN IF NOT EXISTS "challongeRound" int,
            ADD COLUMN IF NOT EXISTS "tags" text
        `);

        await queryRunner.query(`UPDATE "games" SET "status" = 'completed' WHERE "status" = 'scheduled'`);

        const matchesExist = await queryRunner.hasTable('matches');
        if (matchesExist) {
            const matches: Array<{
                id: number;
                matchNumber: string;
                status: string;
                round: string;
                phase: string;
                region: string;
                date: Date;
                team1Score: number | null;
                team2Score: number | null;
                set1Score: string | null;
                set2Score: string | null;
                set3Score: string | null;
                set4Score: string | null;
                set5Score: string | null;
                challongeMatchId: string | null;
                challongeTournamentId: string | null;
                challongeRound: number | null;
                tags: string | null;
                seasonId: number;
                team1Name: string | null;
                team2Name: string | null;
            }> = await queryRunner.query(`SELECT * FROM "matches"`);

            for (const match of matches) {
                if (!match.team1Name || !match.team2Name) continue;

                const teams: Array<{ id: number; name: string }> = await queryRunner.query(
                    `SELECT t.id, t.name FROM "teams" t
                     INNER JOIN "seasons" s ON t."seasonId" = s.id
                     WHERE s.id = $1 AND (LOWER(t.name) = LOWER($2) OR LOWER(t.name) = LOWER($3))`,
                    [match.seasonId, match.team1Name, match.team2Name]
                );

                const team1 = teams.find(t => t.name.toLowerCase() === match.team1Name!.toLowerCase());
                const team2 = teams.find(t => t.name.toLowerCase() === match.team2Name!.toLowerCase());
                if (!team1 || !team2) continue;

                const existing: Array<{ id: number }> = await queryRunner.query(
                    `SELECT g.id FROM "games" g
                     INNER JOIN "teams_games" tg1 ON tg1."gamesId" = g.id AND tg1."teamsId" = $1
                     INNER JOIN "teams_games" tg2 ON tg2."gamesId" = g.id AND tg2."teamsId" = $2
                     WHERE g."seasonId" = $3 AND ($4::varchar IS NULL OR g."round" = $4)
                     LIMIT 1`,
                    [team1.id, team2.id, match.seasonId, match.round]
                );
                if (existing.length > 0) continue;

                if (match.challongeMatchId) {
                    const byChallonge: Array<{ id: number }> = await queryRunner.query(
                        `SELECT id FROM "games" WHERE "challongeMatchId" = $1 AND "seasonId" = $2 LIMIT 1`,
                        [match.challongeMatchId, match.seasonId]
                    );
                    if (byChallonge.length > 0) continue;
                }

                const tagsValue = match.tags ?? null;
                const insertResult: Array<{ id: number }> = await queryRunner.query(
                    `INSERT INTO "games" (
                        "team1Score", "team2Score", "date", "name", "videoUrl", "stage",
                        "status", "matchNumber", "round", "phase", "region",
                        "set1Score", "set2Score", "set3Score", "set4Score", "set5Score",
                        "challongeMatchId", "challongeTournamentId", "challongeRound", "tags",
                        "seasonId", "createdAt", "updatedAt"
                    ) VALUES (
                        $1, $2, $3, $4, NULL, $5,
                        $6, $7, $8, $9, $10,
                        $11, $12, $13, $14, $15,
                        $16, $17, $18, $19,
                        $20, NOW(), NOW()
                    ) RETURNING id`,
                    [
                        match.team1Score,
                        match.team2Score,
                        match.date,
                        `${match.team1Name} vs ${match.team2Name}`,
                        match.round ? `Qualifiers; ${match.round}` : 'Qualifiers',
                        match.status === 'completed' ? 'completed' : 'scheduled',
                        match.matchNumber,
                        match.round,
                        match.phase ?? 'qualifiers',
                        match.region ?? 'na',
                        match.set1Score,
                        match.set2Score,
                        match.set3Score,
                        match.set4Score,
                        match.set5Score,
                        match.challongeMatchId,
                        match.challongeTournamentId,
                        match.challongeRound,
                        tagsValue,
                        match.seasonId,
                    ]
                );

                const gameId = insertResult[0]?.id;
                if (!gameId) continue;

                await queryRunner.query(
                    `INSERT INTO "teams_games" ("teamsId", "gamesId") VALUES ($1, $2), ($3, $2)`,
                    [team1.id, gameId, team2.id]
                );
            }

            await queryRunner.query(`DROP TABLE IF EXISTS "matches"`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games"
            DROP COLUMN IF EXISTS "status",
            DROP COLUMN IF EXISTS "matchNumber",
            DROP COLUMN IF EXISTS "round",
            DROP COLUMN IF EXISTS "phase",
            DROP COLUMN IF EXISTS "region",
            DROP COLUMN IF EXISTS "set1Score",
            DROP COLUMN IF EXISTS "set2Score",
            DROP COLUMN IF EXISTS "set3Score",
            DROP COLUMN IF EXISTS "set4Score",
            DROP COLUMN IF EXISTS "set5Score",
            DROP COLUMN IF EXISTS "challongeMatchId",
            DROP COLUMN IF EXISTS "challongeTournamentId",
            DROP COLUMN IF EXISTS "challongeRound",
            DROP COLUMN IF EXISTS "tags"
        `);

        await queryRunner.query(`ALTER TABLE "games" ALTER COLUMN "team1Score" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "games" ALTER COLUMN "team2Score" SET NOT NULL`);

        await queryRunner.query(`DROP TYPE IF EXISTS "games_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "games_phase_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "games_region_enum"`);
    }
}
