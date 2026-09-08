CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`variants` text NOT NULL,
	`uploaded_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "uploads_mime_check" CHECK("uploads"."mime" in ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
	CONSTRAINT "uploads_bytes_check" CHECK("uploads"."bytes" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uploads_key_unique` ON `uploads` (`key`);--> statement-breakpoint
CREATE INDEX `uploads_uploaded_by_idx` ON `uploads` (`uploaded_by`);