ALTER TABLE `players` ADD `roblox_user_id` text;--> statement-breakpoint
ALTER TABLE `players` ADD `user_id` text REFERENCES user(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `players_roblox_user_id_idx` ON `players` (`roblox_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `players_user_id_idx` ON `players` (`user_id`);
