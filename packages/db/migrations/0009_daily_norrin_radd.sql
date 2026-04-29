CREATE TABLE `pulse_source_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text NOT NULL,
	`title` text NOT NULL,
	`official_source_url` text NOT NULL,
	`published_at` integer NOT NULL,
	`fetched_at` integer NOT NULL,
	`content_hash` text NOT NULL,
	`raw_r2_key` text NOT NULL,
	`parse_status` text DEFAULT 'pending_extract' NOT NULL,
	`pulse_id` text,
	`ai_output_id` text,
	`failure_reason` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`pulse_id`) REFERENCES `pulse`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pss_source_external_hash` ON `pulse_source_snapshot` (`source_id`,`external_id`,`content_hash`);--> statement-breakpoint
CREATE INDEX `idx_pss_status_time` ON `pulse_source_snapshot` (`parse_status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_pss_source_time` ON `pulse_source_snapshot` (`source_id`,`published_at`);