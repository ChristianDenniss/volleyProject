DROP TABLE IF EXISTS `uploads`;--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'awaiting' NOT NULL,
	`staging_key` text NOT NULL,
	`key` text,
	`hash` text,
	`filename` text NOT NULL,
	`declared_mime` text NOT NULL,
	`mime` text,
	`declared_bytes` integer NOT NULL,
	`bytes` integer,
	`width` integer,
	`height` integer,
	`variants` text DEFAULT '[]' NOT NULL,
	`error` text,
	`uploaded_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "uploads_status_check" CHECK("uploads"."status" in ('awaiting', 'processing', 'ready', 'failed')),
	CONSTRAINT "uploads_declared_bytes_check" CHECK("uploads"."declared_bytes" > 0)
);--> statement-breakpoint
CREATE UNIQUE INDEX `uploads_stagingKey_unique` ON `uploads` (`staging_key`);--> statement-breakpoint
CREATE INDEX `uploads_uploaded_by_idx` ON `uploads` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `uploads_status_idx` ON `uploads` (`status`);--> statement-breakpoint
CREATE INDEX `uploads_hash_idx` ON `uploads` (`hash`);
