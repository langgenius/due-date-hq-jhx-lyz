CREATE TABLE `audit_event` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`actor_id` text,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`reason` text,
	`ip_hash` text,
	`user_agent_hash` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_audit_firm_time` ON `audit_event` (`firm_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_firm_actor_time` ON `audit_event` (`firm_id`,`actor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_firm_action_time` ON `audit_event` (`firm_id`,`action`,`created_at`);--> statement-breakpoint
CREATE TABLE `evidence_link` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`obligation_instance_id` text,
	`ai_output_id` text,
	`source_type` text NOT NULL,
	`source_id` text,
	`source_url` text,
	`verbatim_quote` text,
	`raw_value` text,
	`normalized_value` text,
	`confidence` real,
	`model` text,
	`matrix_version` text,
	`verified_at` integer,
	`verified_by` text,
	`applied_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`applied_by` text,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`obligation_instance_id`) REFERENCES `obligation_instance`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`verified_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`applied_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_evidence_firm_time` ON `evidence_link` (`firm_id`,`applied_at`);--> statement-breakpoint
CREATE INDEX `idx_evidence_oi` ON `evidence_link` (`obligation_instance_id`);--> statement-breakpoint
CREATE INDEX `idx_evidence_source` ON `evidence_link` (`source_type`,`source_id`);--> statement-breakpoint
CREATE TABLE `client` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`name` text NOT NULL,
	`ein` text,
	`state` text,
	`county` text,
	`entity_type` text NOT NULL,
	`email` text,
	`notes` text,
	`assignee_name` text,
	`migration_batch_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_client_firm_time` ON `client` (`firm_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_client_firm_entity` ON `client` (`firm_id`,`entity_type`);--> statement-breakpoint
CREATE INDEX `idx_client_batch` ON `client` (`migration_batch_id`);--> statement-breakpoint
CREATE TABLE `migration_batch` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`raw_input_r2_key` text,
	`mapping_json` text,
	`preset_used` text,
	`row_count` integer DEFAULT 0 NOT NULL,
	`success_count` integer DEFAULT 0 NOT NULL,
	`skipped_count` integer DEFAULT 0 NOT NULL,
	`ai_global_confidence` real,
	`status` text DEFAULT 'draft' NOT NULL,
	`applied_at` integer,
	`revert_expires_at` integer,
	`reverted_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_mb_firm_draft` ON `migration_batch` (`firm_id`) WHERE status = 'draft';--> statement-breakpoint
CREATE INDEX `idx_mb_firm_time` ON `migration_batch` (`firm_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_mb_firm_status` ON `migration_batch` (`firm_id`,`status`);--> statement-breakpoint
CREATE TABLE `migration_error` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`row_index` integer NOT NULL,
	`raw_row_json` text,
	`error_code` text NOT NULL,
	`error_message` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `migration_batch`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_me_batch` ON `migration_error` (`batch_id`);--> statement-breakpoint
CREATE TABLE `migration_mapping` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`source_header` text NOT NULL,
	`target_field` text NOT NULL,
	`confidence` real,
	`reasoning` text,
	`user_overridden` integer DEFAULT false NOT NULL,
	`model` text,
	`prompt_version` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `migration_batch`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mm_batch` ON `migration_mapping` (`batch_id`);--> statement-breakpoint
CREATE TABLE `migration_normalization` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`field` text NOT NULL,
	`raw_value` text NOT NULL,
	`normalized_value` text,
	`confidence` real,
	`model` text,
	`prompt_version` text,
	`reasoning` text,
	`user_overridden` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `migration_batch`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mn_batch` ON `migration_normalization` (`batch_id`);--> statement-breakpoint
CREATE TABLE `obligation_instance` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`client_id` text NOT NULL,
	`tax_type` text NOT NULL,
	`tax_year` integer,
	`base_due_date` integer NOT NULL,
	`current_due_date` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`migration_batch_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `client`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_oi_firm_status_due` ON `obligation_instance` (`firm_id`,`status`,`current_due_date`);--> statement-breakpoint
CREATE INDEX `idx_oi_client` ON `obligation_instance` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_oi_batch` ON `obligation_instance` (`migration_batch_id`);