import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1710000000000 implements MigrationInterface {
    name = 'InitialSchema1710000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Teams table
        await queryRunner.query(`
            CREATE TABLE "teams" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_teams" PRIMARY KEY ("id")
            )
        `);

        // Players table
        await queryRunner.query(`
            CREATE TABLE "players" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "team_id" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_players" PRIMARY KEY ("id"),
                CONSTRAINT "FK_players_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL
            )
        `);

        // Seasons table
        await queryRunner.query(`
            CREATE TABLE "seasons" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "start_date" TIMESTAMP NOT NULL,
                "end_date" TIMESTAMP NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_seasons" PRIMARY KEY ("id")
            )
        `);

        // Games table
        await queryRunner.query(`
            CREATE TABLE "games" (
                "id" SERIAL NOT NULL,
                "home_team_id" integer,
                "away_team_id" integer,
                "season_id" integer,
                "date" TIMESTAMP NOT NULL,
                "home_score" integer,
                "away_score" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_games" PRIMARY KEY ("id"),
                CONSTRAINT "FK_games_home_team" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_games_away_team" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_games_season" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE SET NULL
            )
        `);

        // Stats table
        await queryRunner.query(`
            CREATE TABLE "stats" (
                "id" SERIAL NOT NULL,
                "player_id" integer,
                "game_id" integer,
                "kills" integer DEFAULT 0,
                "assists" integer DEFAULT 0,
                "blocks" integer DEFAULT 0,
                "digs" integer DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_stats" PRIMARY KEY ("id"),
                CONSTRAINT "FK_stats_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_stats_game" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE SET NULL
            )
        `);

        // Users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "username" character varying NOT NULL,
                "password" character varying NOT NULL,
                "role" character varying NOT NULL DEFAULT 'user',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_username" UNIQUE ("username")
            )
        `);

        // Articles table
        await queryRunner.query(`
            CREATE TABLE "articles" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL,
                "content" text NOT NULL,
                "author_id" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_articles" PRIMARY KEY ("id"),
                CONSTRAINT "FK_articles_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        // Awards table
        await queryRunner.query(`
            CREATE TABLE "awards" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "player_id" integer,
                "season_id" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_awards" PRIMARY KEY ("id"),
                CONSTRAINT "FK_awards_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_awards_season" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE SET NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order to handle foreign key constraints
        await queryRunner.query(`DROP TABLE "awards"`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "stats"`);
        await queryRunner.query(`DROP TABLE "games"`);
        await queryRunner.query(`DROP TABLE "seasons"`);
        await queryRunner.query(`DROP TABLE "players"`);
        await queryRunner.query(`DROP TABLE "teams"`);
    }
} 