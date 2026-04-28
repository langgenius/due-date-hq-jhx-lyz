CREATE TABLE `email_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`external_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`sent_at` integer,
	`failed_at` integer,
	`failure_reason` text,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_email_outbox_external_id` ON `email_outbox` (`external_id`);--> statement-breakpoint
CREATE INDEX `idx_outbox_status` ON `email_outbox` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_outbox_firm_time` ON `email_outbox` (`firm_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `pulse` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`source_url` text NOT NULL,
	`raw_r2_key` text,
	`published_at` integer NOT NULL,
	`ai_summary` text NOT NULL,
	`verbatim_quote` text NOT NULL,
	`parsed_jurisdiction` text NOT NULL,
	`parsed_counties` text NOT NULL,
	`parsed_forms` text NOT NULL,
	`parsed_entity_types` text NOT NULL,
	`parsed_original_due_date` integer NOT NULL,
	`parsed_new_due_date` integer NOT NULL,
	`parsed_effective_from` integer,
	`confidence` real NOT NULL,
	`status` text DEFAULT 'pending_review' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`requires_human_review` integer DEFAULT true NOT NULL,
	`is_sample` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_pulse_status_pub` ON `pulse` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_pulse_jurisdiction_pub` ON `pulse` (`parsed_jurisdiction`,`published_at`);--> statement-breakpoint
CREATE TABLE `pulse_application` (
	`id` text PRIMARY KEY NOT NULL,
	`pulse_id` text NOT NULL,
	`obligation_instance_id` text NOT NULL,
	`client_id` text NOT NULL,
	`firm_id` text NOT NULL,
	`applied_by` text NOT NULL,
	`applied_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`reverted_by` text,
	`reverted_at` integer,
	`before_due_date` integer NOT NULL,
	`after_due_date` integer NOT NULL,
	FOREIGN KEY (`pulse_id`) REFERENCES `pulse`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`obligation_instance_id`) REFERENCES `obligation_instance`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`client_id`) REFERENCES `client`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`applied_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`reverted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pulse_application_obligation` ON `pulse_application` (`firm_id`,`pulse_id`,`obligation_instance_id`);--> statement-breakpoint
CREATE INDEX `idx_pa_firm_pulse` ON `pulse_application` (`firm_id`,`pulse_id`);--> statement-breakpoint
CREATE INDEX `idx_pa_obligation` ON `pulse_application` (`obligation_instance_id`);--> statement-breakpoint
CREATE TABLE `pulse_firm_alert` (
	`id` text PRIMARY KEY NOT NULL,
	`pulse_id` text NOT NULL,
	`firm_id` text NOT NULL,
	`status` text DEFAULT 'matched' NOT NULL,
	`matched_count` integer DEFAULT 0 NOT NULL,
	`needs_review_count` integer DEFAULT 0 NOT NULL,
	`dismissed_by` text,
	`dismissed_at` integer,
	`snoozed_until` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`pulse_id`) REFERENCES `pulse`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dismissed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pulse_firm_alert` ON `pulse_firm_alert` (`firm_id`,`pulse_id`);--> statement-breakpoint
CREATE INDEX `idx_pfa_firm_status_time` ON `pulse_firm_alert` (`firm_id`,`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_pfa_pulse` ON `pulse_firm_alert` (`pulse_id`);