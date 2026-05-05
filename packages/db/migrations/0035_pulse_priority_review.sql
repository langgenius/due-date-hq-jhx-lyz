CREATE TABLE IF NOT EXISTS `pulse_priority_review` (
  `id` text PRIMARY KEY NOT NULL,
  `firm_id` text NOT NULL,
  `alert_id` text NOT NULL,
  `pulse_id` text NOT NULL,
  `status` text DEFAULT 'open' NOT NULL,
  `priority_score` integer DEFAULT 0 NOT NULL,
  `priority_reasons_json` text DEFAULT '[]' NOT NULL,
  `selected_obligation_ids_json` text DEFAULT '[]' NOT NULL,
  `confirmed_obligation_ids_json` text DEFAULT '[]' NOT NULL,
  `excluded_obligation_ids_json` text DEFAULT '[]' NOT NULL,
  `note` text,
  `requested_by` text,
  `reviewed_by` text,
  `reviewed_at` integer,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`alert_id`) REFERENCES `pulse_firm_alert`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`pulse_id`) REFERENCES `pulse`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`requested_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `uq_pulse_priority_review_firm_alert` ON `pulse_priority_review` (`firm_id`,`alert_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_pulse_priority_review_firm_status_score` ON `pulse_priority_review` (`firm_id`,`status`,`priority_score`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_pulse_priority_review_alert` ON `pulse_priority_review` (`alert_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_pulse_priority_review_pulse` ON `pulse_priority_review` (`pulse_id`);
