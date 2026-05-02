CREATE TABLE `ai_insight_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`kind` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`as_of_date` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`input_hash` text NOT NULL,
	`ai_output_id` text,
	`output_json` text,
	`citations_json` text,
	`reason` text NOT NULL,
	`error_code` text,
	`generated_at` integer,
	`expires_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ai_output_id`) REFERENCES `ai_output`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_ai_insight_subject_time` ON `ai_insight_cache` (`firm_id`,`kind`,`subject_type`,`subject_id`,`as_of_date`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_ai_insight_ready_hash` ON `ai_insight_cache` (`firm_id`,`kind`,`subject_id`,`as_of_date`,`input_hash`) WHERE status in ('ready', 'pending');--> statement-breakpoint
ALTER TABLE `client` ADD `importance_weight` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `client` ADD `late_filing_count_last_12mo` integer DEFAULT 0 NOT NULL;