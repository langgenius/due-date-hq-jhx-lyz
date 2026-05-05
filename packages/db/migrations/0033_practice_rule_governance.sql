CREATE TABLE `rule_source_template` (
  `id` text PRIMARY KEY NOT NULL,
  `jurisdiction` text NOT NULL,
  `title` text NOT NULL,
  `url` text NOT NULL,
  `source_type` text NOT NULL,
  `acquisition_method` text NOT NULL,
  `cadence` text NOT NULL,
  `priority` text NOT NULL,
  `health_status` text NOT NULL,
  `is_early_warning` integer DEFAULT false NOT NULL,
  `notification_channels_json` text,
  `last_reviewed_on` text NOT NULL,
  `status` text DEFAULT 'available' NOT NULL,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rule_source_template_jurisdiction` ON `rule_source_template` (`jurisdiction`);
--> statement-breakpoint
CREATE INDEX `idx_rule_source_template_status` ON `rule_source_template` (`status`);
--> statement-breakpoint
CREATE TABLE `rule_template` (
  `id` text PRIMARY KEY NOT NULL,
  `jurisdiction` text NOT NULL,
  `title` text NOT NULL,
  `version` integer NOT NULL,
  `status` text DEFAULT 'available' NOT NULL,
  `rule_json` text NOT NULL,
  `source_ids_json` text,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rule_template_jurisdiction` ON `rule_template` (`jurisdiction`);
--> statement-breakpoint
CREATE INDEX `idx_rule_template_status` ON `rule_template` (`status`);
--> statement-breakpoint
CREATE TABLE `practice_rule` (
  `id` text PRIMARY KEY NOT NULL,
  `firm_id` text NOT NULL,
  `rule_id` text NOT NULL,
  `template_id` text,
  `template_version` integer NOT NULL,
  `status` text NOT NULL,
  `rule_json` text,
  `review_note` text,
  `reviewed_by` text,
  `reviewed_at` integer,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`template_id`) REFERENCES `rule_template`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_practice_rule_firm_rule` ON `practice_rule` (`firm_id`,`rule_id`);
--> statement-breakpoint
CREATE INDEX `idx_practice_rule_firm_status` ON `practice_rule` (`firm_id`,`status`);
--> statement-breakpoint
CREATE INDEX `idx_practice_rule_template` ON `practice_rule` (`template_id`);
--> statement-breakpoint
CREATE TABLE `practice_rule_review_task` (
  `id` text PRIMARY KEY NOT NULL,
  `firm_id` text NOT NULL,
  `rule_id` text NOT NULL,
  `template_version` integer NOT NULL,
  `status` text DEFAULT 'open' NOT NULL,
  `reason` text DEFAULT 'new_template' NOT NULL,
  `review_note` text,
  `reviewed_by` text,
  `reviewed_at` integer,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_practice_rule_task_firm_rule_version` ON `practice_rule_review_task` (`firm_id`,`rule_id`,`template_version`);
--> statement-breakpoint
CREATE INDEX `idx_practice_rule_task_firm_status` ON `practice_rule_review_task` (`firm_id`,`status`);
--> statement-breakpoint
CREATE INDEX `idx_practice_rule_task_rule` ON `practice_rule_review_task` (`rule_id`);
--> statement-breakpoint
INSERT OR IGNORE INTO `practice_rule` (
  `id`,
  `firm_id`,
  `rule_id`,
  `template_id`,
  `template_version`,
  `status`,
  `rule_json`,
  `review_note`,
  `reviewed_by`,
  `reviewed_at`,
  `created_at`,
  `updated_at`
)
SELECT
  lower(hex(randomblob(16))),
  `firm_id`,
  `rule_id`,
  NULL,
  `base_version`,
  CASE `status` WHEN 'verified' THEN 'active' ELSE 'rejected' END,
  CASE `status` WHEN 'verified' THEN `rule_json` ELSE NULL END,
  `review_note`,
  `reviewed_by`,
  `reviewed_at`,
  `created_at`,
  `updated_at`
FROM `rule_review_decision`;
--> statement-breakpoint
INSERT OR IGNORE INTO `practice_rule_review_task` (
  `id`,
  `firm_id`,
  `rule_id`,
  `template_version`,
  `status`,
  `reason`,
  `review_note`,
  `reviewed_by`,
  `reviewed_at`,
  `created_at`,
  `updated_at`
)
SELECT
  lower(hex(randomblob(16))),
  `firm_id`,
  `rule_id`,
  `base_version`,
  CASE `status` WHEN 'verified' THEN 'accepted' ELSE 'rejected' END,
  'new_template',
  `review_note`,
  `reviewed_by`,
  `reviewed_at`,
  `created_at`,
  `updated_at`
FROM `rule_review_decision`;
