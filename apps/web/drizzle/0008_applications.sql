CREATE INDEX `games_region_idx` ON `games` (`region`);--> statement-breakpoint
CREATE INDEX `games_season_region_idx` ON `games` (`season_id`,`region`);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`url` text,
	`status` text DEFAULT 'closed' NOT NULL,
	`category` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "applications_status_check" CHECK("applications"."status" in ('open', 'closed')),
	CONSTRAINT "applications_category_check" CHECK("applications"."category" in ('staff', 'media', 'game-officials', 'management'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_slug_idx` ON `applications` (`slug`);
--> statement-breakpoint
INSERT INTO `applications` (`slug`, `name`, `type`, `description`, `url`, `status`, `category`, `sort_order`, `created_at`, `updated_at`) VALUES
	('staff', 'Staff application', 'General staff position', 'Apply to become a staff member of the Roblox Volleyball League. Help manage the community and keep each season running.', 'https://forms.gle/TgpFMdP8zVmyqKjk6', 'closed', 'staff', 1, unixepoch() * 1000, unixepoch() * 1000),
	('media', 'Media team application', 'Content creation and streaming', 'Create content, stream RVL matches, manage social media and help promote the league.', 'https://forms.gle/L6QFsuztCaJMRQyp8', 'closed', 'media', 2, unixepoch() * 1000, unixepoch() * 1000),
	('referee', 'Referee application', 'Game officiating', 'Officiate volleyball matches, keep play fair and hold the game to its rules.', NULL, 'closed', 'game-officials', 3, unixepoch() * 1000, unixepoch() * 1000),
	('moderator', 'Server moderator application', 'Community management', 'Moderate our Discord spaces, enforce the rules and keep the environment positive.', NULL, 'closed', 'management', 4, unixepoch() * 1000, unixepoch() * 1000),
	('game-moderator', 'Game moderator application', 'Game officiating', 'Moderate ranked Volleyball 4.2 games, act on rule violations and keep play fair for everyone.', NULL, 'closed', 'game-officials', 5, unixepoch() * 1000, unixepoch() * 1000),
	('stats', 'Stats team application', 'Data management', 'Track player statistics and game data, and keep the records accurate through the playoffs.', NULL, 'closed', 'management', 6, unixepoch() * 1000, unixepoch() * 1000),
	('host', 'Host application', 'Event management', 'Organise events outside Volleyball 4.2 and keep the community active with casual pickup matches.', NULL, 'closed', 'management', 7, unixepoch() * 1000, unixepoch() * 1000);
