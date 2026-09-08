CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_account_idx` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `article_likes` (
	`article_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`article_id`, `user_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_likes_user_id_idx` ON `article_likes` (`user_id`);--> statement-breakpoint
CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`image_url` text NOT NULL,
	`approved` integer,
	`likes` integer DEFAULT 0 NOT NULL,
	`author_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `articles_author_id_idx` ON `articles` (`author_id`);--> statement-breakpoint
CREATE TABLE `awards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text DEFAULT 'MVP' NOT NULL,
	`description` text NOT NULL,
	`image_url` text,
	`season_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "awards_type_check" CHECK("awards"."type" in ('MVP', 'Best Spiker', 'Best Server', 'Best Blocker', 'Best Libero', 'Best Setter', 'MIP', 'Best Aper', 'FMVP', 'DPOS', 'Best Receiver', 'LuvLate Award'))
);
--> statement-breakpoint
CREATE INDEX `awards_season_id_idx` ON `awards` (`season_id`);--> statement-breakpoint
CREATE INDEX `awards_type_idx` ON `awards` (`type`);--> statement-breakpoint
CREATE TABLE `awards_players` (
	`award_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	PRIMARY KEY(`award_id`, `player_id`),
	FOREIGN KEY (`award_id`) REFERENCES `awards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `awards_players_player_id_idx` ON `awards_players` (`player_id`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`team1_score` integer DEFAULT 0 NOT NULL,
	`team2_score` integer DEFAULT 0 NOT NULL,
	`date` text NOT NULL,
	`video_url` text,
	`stage` text DEFAULT 'Winners Bracket; Round of 16' NOT NULL,
	`season_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `games_season_id_idx` ON `games` (`season_id`);--> statement-breakpoint
CREATE INDEX `games_date_idx` ON `games` (`date`);--> statement-breakpoint
CREATE TABLE `job_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`requested_by` text,
	`started_at` integer,
	`finished_at` integer,
	`rows_written` integer DEFAULT 0 NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`requested_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "job_runs_status_check" CHECK("job_runs"."status" in ('queued', 'running', 'succeeded', 'failed'))
);
--> statement-breakpoint
CREATE INDEX `job_runs_kind_idx` ON `job_runs` (`kind`);--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_number` text NOT NULL,
	`round` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`phase` text DEFAULT 'qualifiers' NOT NULL,
	`region` text DEFAULT 'na' NOT NULL,
	`date` text NOT NULL,
	`team1_name` text,
	`team2_name` text,
	`team1_logo_url` text,
	`team2_logo_url` text,
	`team1_score` integer,
	`team2_score` integer,
	`set1_score` text,
	`set2_score` text,
	`set3_score` text,
	`set4_score` text,
	`set5_score` text,
	`challonge_match_id` text,
	`challonge_tournament_id` text,
	`challonge_round` integer,
	`tags` text,
	`season_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "matches_status_check" CHECK("matches"."status" in ('scheduled', 'completed')),
	CONSTRAINT "matches_phase_check" CHECK("matches"."phase" in ('qualifiers', 'playoffs')),
	CONSTRAINT "matches_region_check" CHECK("matches"."region" in ('na', 'eu', 'as', 'sa'))
);
--> statement-breakpoint
CREATE INDEX `matches_season_id_idx` ON `matches` (`season_id`);--> statement-breakpoint
CREATE INDEX `matches_round_idx` ON `matches` (`round`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`position` text DEFAULT 'N/A' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_name_idx` ON `players` (`name`);--> statement-breakpoint
CREATE TABLE `records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`metric` text NOT NULL,
	`min_attempts` integer,
	`type` text DEFAULT 'game' NOT NULL,
	`rank` integer NOT NULL,
	`value` real NOT NULL,
	`date` text,
	`season_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	`game_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "records_metric_check" CHECK("records"."metric" in ('spike kills', 'assists', 'ape kills', 'digs', 'block follows', 'blocks', 'aces', 'serve errors', 'misc errors', 'set errors', 'spike errors', 'spike attempts', 'ape attempts', 'total kills', 'total attempts', 'total errors', 'spiking percentage')),
	CONSTRAINT "records_type_check" CHECK("records"."type" in ('game', 'season')),
	CONSTRAINT "records_rank_check" CHECK("records"."rank" between 1 and 10)
);
--> statement-breakpoint
CREATE INDEX `records_season_id_idx` ON `records` (`season_id`);--> statement-breakpoint
CREATE INDEX `records_player_id_idx` ON `records` (`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `records_family_rank_idx` ON `records` (`season_id`,`type`,`metric`,`min_attempts`,`rank`);--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`season_number` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`image` text,
	`theme` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seasons_season_number_idx` ON `seasons` (`season_number`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`impersonated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`game_id` integer NOT NULL,
	`spike_kills` integer DEFAULT 0 NOT NULL,
	`spike_attempts` integer DEFAULT 0 NOT NULL,
	`spiking_errors` integer DEFAULT 0 NOT NULL,
	`ape_kills` integer DEFAULT 0 NOT NULL,
	`ape_attempts` integer DEFAULT 0 NOT NULL,
	`assists` integer DEFAULT 0 NOT NULL,
	`setting_errors` integer DEFAULT 0 NOT NULL,
	`blocks` integer DEFAULT 0 NOT NULL,
	`block_follows` integer DEFAULT 0 NOT NULL,
	`digs` integer DEFAULT 0 NOT NULL,
	`aces` integer DEFAULT 0 NOT NULL,
	`serving_errors` integer DEFAULT 0 NOT NULL,
	`misc_errors` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stats_player_id_idx` ON `stats` (`player_id`);--> statement-breakpoint
CREATE INDEX `stats_game_id_idx` ON `stats` (`game_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `stats_player_game_idx` ON `stats` (`player_id`,`game_id`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`logo_url` text,
	`placement` text DEFAULT 'Didnt make playoffs' NOT NULL,
	`season_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `teams_season_id_idx` ON `teams` (`season_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `teams_name_season_idx` ON `teams` (`name`,`season_id`);--> statement-breakpoint
CREATE TABLE `teams_games` (
	`team_id` integer NOT NULL,
	`game_id` integer NOT NULL,
	PRIMARY KEY(`team_id`, `game_id`),
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `teams_games_game_id_idx` ON `teams_games` (`game_id`);--> statement-breakpoint
CREATE TABLE `teams_players` (
	`team_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	PRIMARY KEY(`team_id`, `player_id`),
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `teams_players_player_id_idx` ON `teams_players` (`player_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'user' NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`ban_reason` text,
	`ban_expires` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);