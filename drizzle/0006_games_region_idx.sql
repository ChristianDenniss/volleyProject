CREATE INDEX `games_region_idx` ON `games` (`region`);--> statement-breakpoint
CREATE INDEX `games_season_region_idx` ON `games` (`season_id`,`region`);
