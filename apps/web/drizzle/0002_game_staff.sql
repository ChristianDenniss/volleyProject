CREATE TABLE `game_staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role` text NOT NULL,
	`game_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "game_staff_role_check" CHECK("game_staff"."role" in ('streamed', 'reffed', 'commentated'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_staff_game_role_idx` ON `game_staff` (`game_id`,`role`);--> statement-breakpoint
CREATE INDEX `game_staff_user_id_idx` ON `game_staff` (`user_id`);