CREATE TABLE IF NOT EXISTS `reminder_template` (
  `id` text PRIMARY KEY NOT NULL,
  `firm_id` text,
  `template_key` text NOT NULL,
  `kind` text NOT NULL,
  `name` text NOT NULL,
  `subject` text NOT NULL,
  `body_text` text NOT NULL,
  `active` integer DEFAULT true NOT NULL,
  `is_system` integer DEFAULT false NOT NULL,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `uq_reminder_template_firm_key` ON `reminder_template` (`firm_id`,`template_key`) WHERE firm_id is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `uq_reminder_template_system_key` ON `reminder_template` (`template_key`) WHERE firm_id is null;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_reminder_template_firm_kind` ON `reminder_template` (`firm_id`,`kind`);
--> statement-breakpoint
ALTER TABLE `reminder` ADD `template_id` text REFERENCES `reminder_template`(`id`) ON DELETE set null;
