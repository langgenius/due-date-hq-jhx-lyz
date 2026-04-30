CREATE TABLE `audit_evidence_package` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`exported_by_user_id` text NOT NULL,
	`scope` text DEFAULT 'firm' NOT NULL,
	`scope_entity_id` text,
	`range_start` integer,
	`range_end` integer,
	`file_count` integer DEFAULT 0 NOT NULL,
	`file_manifest_json` text,
	`sha256_hash` text,
	`r2_key` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer,
	`failure_reason` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exported_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_audit_package_firm_time` ON `audit_evidence_package` (`firm_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_package_status` ON `audit_evidence_package` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `client_email_suppression` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`email` text NOT NULL,
	`token_hash` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_client_email_suppression_firm_email` ON `client_email_suppression` (`firm_id`,`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_client_email_suppression_token` ON `client_email_suppression` (`token_hash`);--> statement-breakpoint
CREATE TABLE `in_app_notification` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`href` text,
	`metadata_json` text,
	`read_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_in_app_notification_user_time` ON `in_app_notification` (`firm_id`,`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_in_app_notification_user_read` ON `in_app_notification` (`firm_id`,`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `notification_preference` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email_enabled` integer DEFAULT true NOT NULL,
	`in_app_enabled` integer DEFAULT true NOT NULL,
	`reminders_enabled` integer DEFAULT true NOT NULL,
	`pulse_enabled` integer DEFAULT true NOT NULL,
	`unassigned_reminders_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_notification_preference_firm_user` ON `notification_preference` (`firm_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notification_preference_user` ON `notification_preference` (`user_id`);--> statement-breakpoint
CREATE TABLE `reminder` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`obligation_instance_id` text NOT NULL,
	`client_id` text NOT NULL,
	`recipient_kind` text NOT NULL,
	`recipient_user_id` text,
	`recipient_email` text,
	`channel` text NOT NULL,
	`offset_days` integer NOT NULL,
	`scheduled_for` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`email_outbox_id` text,
	`notification_id` text,
	`dedupe_key` text NOT NULL,
	`sent_at` integer,
	`clicked_at` integer,
	`failure_reason` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`obligation_instance_id`) REFERENCES `obligation_instance`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `client`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`email_outbox_id`) REFERENCES `email_outbox`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`notification_id`) REFERENCES `in_app_notification`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_reminder_dedupe` ON `reminder` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `idx_reminder_firm_status_time` ON `reminder` (`firm_id`,`status`,`scheduled_for`);--> statement-breakpoint
CREATE INDEX `idx_reminder_obligation` ON `reminder` (`obligation_instance_id`);--> statement-breakpoint
ALTER TABLE `firm_profile` ADD `coordinator_can_see_dollars` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `migration_batch` ADD `raw_input_file_name` text;--> statement-breakpoint
ALTER TABLE `migration_batch` ADD `raw_input_content_type` text;--> statement-breakpoint
ALTER TABLE `migration_batch` ADD `raw_input_size_bytes` integer;
