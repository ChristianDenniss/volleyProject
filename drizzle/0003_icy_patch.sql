PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`match_number` text,
	`round` text,
	`status` text DEFAULT 'completed' NOT NULL,
	`phase` text DEFAULT 'qualifiers' NOT NULL,
	`region` text DEFAULT 'na' NOT NULL,
	`team1_score` integer,
	`team2_score` integer,
	`set1_score` text,
	`set2_score` text,
	`set3_score` text,
	`set4_score` text,
	`set5_score` text,
	`date` text NOT NULL,
	`video_url` text,
	`stage` text DEFAULT 'Winners Bracket; Round of 16' NOT NULL,
	`season_id` integer,
	`challonge_match_id` text,
	`challonge_tournament_id` text,
	`challonge_round` integer,
	`tags` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "games_status_check" CHECK("__new_games"."status" in ('scheduled', 'completed')),
	CONSTRAINT "games_phase_check" CHECK("__new_games"."phase" in ('qualifiers', 'playoffs')),
	CONSTRAINT "games_region_check" CHECK("__new_games"."region" in ('na', 'eu', 'as', 'sa'))
);
--> statement-breakpoint
INSERT INTO `__new_games`(
	"id", "name", "team1_score", "team2_score", "date", "video_url", "stage", "season_id", "created_at", "updated_at"
) SELECT
	"id", "name", "team1_score", "team2_score", "date", "video_url", "stage", "season_id", "created_at", "updated_at"
FROM `games`;
--> statement-breakpoint
DROP TABLE `games`;
--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;
--> statement-breakpoint
CREATE INDEX `games_season_id_idx` ON `games` (`season_id`);
--> statement-breakpoint
CREATE INDEX `games_date_idx` ON `games` (`date`);
--> statement-breakpoint
CREATE INDEX `games_round_idx` ON `games` (`round`);
--> statement-breakpoint
CREATE TABLE `__new_teams_games` (
	`game_id` integer NOT NULL,
	`slot` integer NOT NULL,
	`team_id` integer NOT NULL,
	PRIMARY KEY(`game_id`, `slot`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "teams_games_slot_check" CHECK("__new_teams_games"."slot" in (1, 2))
);
--> statement-breakpoint
INSERT INTO `__new_teams_games`("game_id", "slot", "team_id")
SELECT
	"game_id",
	ROW_NUMBER() OVER (PARTITION BY "game_id" ORDER BY "team_id"),
	"team_id"
FROM `teams_games`;
--> statement-breakpoint
DROP TABLE `teams_games`;
--> statement-breakpoint
ALTER TABLE `__new_teams_games` RENAME TO `teams_games`;
--> statement-breakpoint
CREATE INDEX `teams_games_team_id_idx` ON `teams_games` (`team_id`);
--> statement-breakpoint
DROP TABLE `matches`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
