ALTER TABLE `teams` ADD `description` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_teams_players` (
	`team_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	`role` text,
	PRIMARY KEY(`team_id`, `player_id`),
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "teams_players_role_check" CHECK("__new_teams_players"."role" is null or "__new_teams_players"."role" in ('C', 'VC', 'CC'))
);
--> statement-breakpoint
INSERT INTO `__new_teams_players`("team_id", "player_id", "role") SELECT "team_id", "player_id", NULL FROM `teams_players`;--> statement-breakpoint
DROP TABLE `teams_players`;--> statement-breakpoint
ALTER TABLE `__new_teams_players` RENAME TO `teams_players`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `teams_players_player_id_idx` ON `teams_players` (`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `teams_players_team_role_idx` ON `teams_players` (`team_id`,`role`);
