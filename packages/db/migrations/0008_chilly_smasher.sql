CREATE TABLE `dashboard_brief` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`user_id` text,
	`scope` text DEFAULT 'firm' NOT NULL,
	`as_of_date` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`input_hash` text NOT NULL,
	`ai_output_id` text,
	`summary_text` text,
	`top_obligation_ids_json` text,
	`citations_json` text,
	`reason` text NOT NULL,
	`error_code` text,
	`generated_at` integer,
	`expires_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`ai_output_id`) REFERENCES `ai_output`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_dashboard_brief_firm_scope_time` ON `dashboard_brief` (`firm_id`,`scope`,`as_of_date`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_dashboard_brief_ready_hash` ON `dashboard_brief` (`firm_id`,`scope`,`as_of_date`,`input_hash`) WHERE status in ('ready', 'pending');