CREATE TABLE `pulse_source_signal` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text NOT NULL,
	`title` text NOT NULL,
	`official_source_url` text NOT NULL,
	`published_at` integer NOT NULL,
	`fetched_at` integer NOT NULL,
	`content_hash` text NOT NULL,
	`raw_r2_key` text NOT NULL,
	`tier` text NOT NULL,
	`jurisdiction` text NOT NULL,
	`signal_type` text DEFAULT 'anticipated_pulse' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`linked_pulse_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`linked_pulse_id`) REFERENCES `pulse`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pulse_signal_source_external_hash` ON `pulse_source_signal` (`source_id`,`external_id`,`content_hash`);--> statement-breakpoint
CREATE INDEX `idx_pulse_signal_status_time` ON `pulse_source_signal` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_pulse_signal_source_time` ON `pulse_source_signal` (`source_id`,`published_at`);