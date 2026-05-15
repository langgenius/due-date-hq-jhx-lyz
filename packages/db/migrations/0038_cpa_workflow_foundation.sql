ALTER TABLE `client` ADD `legal_entity` text;
--> statement-breakpoint
ALTER TABLE `client` ADD `tax_classification` text DEFAULT 'unknown';
--> statement-breakpoint
ALTER TABLE `client` ADD `tax_year_type` text DEFAULT 'calendar' NOT NULL;
--> statement-breakpoint
ALTER TABLE `client` ADD `fiscal_year_end_month` integer;
--> statement-breakpoint
ALTER TABLE `client` ADD `fiscal_year_end_day` integer;
--> statement-breakpoint
ALTER TABLE `client` ADD `owner_count` integer;
--> statement-breakpoint
ALTER TABLE `client` ADD `has_foreign_accounts` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `client` ADD `has_payroll` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `client` ADD `has_sales_tax` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `client` ADD `has_1099_vendors` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `client` ADD `has_k1_activity` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `client` ADD `primary_contact_name` text;
--> statement-breakpoint
ALTER TABLE `client` ADD `primary_contact_email` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `obligation_type` text DEFAULT 'filing' NOT NULL;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `form_name` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `authority` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `filing_due_date` integer;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `payment_due_date` integer;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `source_evidence_json` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `recurrence` text DEFAULT 'once' NOT NULL;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `risk_level` text DEFAULT 'low' NOT NULL;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `extension_state` text DEFAULT 'not_started' NOT NULL;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `extension_form_name` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `extension_filed_at` integer;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `extension_accepted_at` integer;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `prep_stage` text DEFAULT 'not_started' NOT NULL;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `review_stage` text DEFAULT 'not_required' NOT NULL;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `reviewer_user_id` text REFERENCES `user`(`id`) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `review_completed_at` integer;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `payment_state` text DEFAULT 'not_applicable' NOT NULL;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `payment_confirmed_at` integer;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `efile_state` text DEFAULT 'not_applicable' NOT NULL;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `efile_authorization_form` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `efile_submitted_at` integer;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `efile_accepted_at` integer;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `efile_rejected_at` integer;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_oi_firm_type_due` ON `obligation_instance` (`firm_id`,`obligation_type`,`current_due_date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_oi_firm_workflow` ON `obligation_instance` (`firm_id`,`prep_stage`,`review_stage`,`payment_state`,`efile_state`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `obligation_dependency` (
  `id` text PRIMARY KEY NOT NULL,
  `firm_id` text NOT NULL,
  `upstream_obligation_id` text NOT NULL,
  `downstream_obligation_id` text NOT NULL,
  `dependency_type` text DEFAULT 'k1' NOT NULL,
  `status` text DEFAULT 'blocking' NOT NULL,
  `source_note` text,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`upstream_obligation_id`) REFERENCES `obligation_instance`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`downstream_obligation_id`) REFERENCES `obligation_instance`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `uq_obligation_dependency_pair_type` ON `obligation_dependency` (`firm_id`,`upstream_obligation_id`,`downstream_obligation_id`,`dependency_type`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_obligation_dependency_downstream` ON `obligation_dependency` (`firm_id`,`downstream_obligation_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_obligation_dependency_upstream` ON `obligation_dependency` (`firm_id`,`upstream_obligation_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `obligation_review_note` (
  `id` text PRIMARY KEY NOT NULL,
  `firm_id` text NOT NULL,
  `obligation_instance_id` text NOT NULL,
  `author_user_id` text,
  `note_type` text DEFAULT 'review_note' NOT NULL,
  `body` text NOT NULL,
  `resolved_at` integer,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`obligation_instance_id`) REFERENCES `obligation_instance`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`author_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_obligation_review_note_obligation` ON `obligation_review_note` (`firm_id`,`obligation_instance_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_obligation_review_note_open` ON `obligation_review_note` (`firm_id`,`note_type`,`resolved_at`);
