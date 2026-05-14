ALTER TABLE `notification_preference` ADD `morning_digest_enabled` integer DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `notification_preference` ADD `morning_digest_hour` integer DEFAULT 7 NOT NULL;
--> statement-breakpoint
ALTER TABLE `notification_preference` ADD `morning_digest_days_json` text DEFAULT '["mon","tue","wed","thu","fri"]' NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `notification_digest_run` (
  `id` text PRIMARY KEY NOT NULL,
  `firm_id` text NOT NULL,
  `user_id` text NOT NULL,
  `local_date` text NOT NULL,
  `status` text NOT NULL,
  `urgent_count` integer DEFAULT 0 NOT NULL,
  `pulse_count` integer DEFAULT 0 NOT NULL,
  `failed_reminder_count` integer DEFAULT 0 NOT NULL,
  `unassigned_count` integer DEFAULT 0 NOT NULL,
  `email_outbox_id` text,
  `failure_reason` text,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  `sent_at` integer,
  FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`email_outbox_id`) REFERENCES `email_outbox`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `uq_notification_digest_run_user_local_date` ON `notification_digest_run` (`user_id`,`local_date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_notification_digest_run_firm_time` ON `notification_digest_run` (`firm_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_notification_digest_run_user_time` ON `notification_digest_run` (`user_id`,`created_at`);
