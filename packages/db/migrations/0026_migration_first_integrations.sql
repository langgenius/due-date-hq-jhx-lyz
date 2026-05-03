CREATE TABLE `migration_staging_row` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`batch_id` text NOT NULL,
	`provider` text NOT NULL,
	`external_entity_type` text DEFAULT 'unknown' NOT NULL,
	`external_id` text NOT NULL,
	`external_url` text,
	`row_index` integer NOT NULL,
	`row_hash` text NOT NULL,
	`raw_row_json` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`batch_id`) REFERENCES `migration_batch`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_msr_batch_row` ON `migration_staging_row` (`batch_id`,`row_index`);--> statement-breakpoint
CREATE INDEX `idx_msr_batch` ON `migration_staging_row` (`batch_id`);--> statement-breakpoint
CREATE INDEX `idx_msr_firm_provider_external` ON `migration_staging_row` (`firm_id`,`provider`,`external_id`);--> statement-breakpoint
CREATE TABLE `external_reference` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`provider` text NOT NULL,
	`migration_batch_id` text,
	`internal_entity_type` text NOT NULL,
	`internal_entity_id` text NOT NULL,
	`external_entity_type` text DEFAULT 'unknown' NOT NULL,
	`external_id` text NOT NULL,
	`external_url` text,
	`metadata_json` text,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`migration_batch_id`) REFERENCES `migration_batch`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_ext_ref_provider_external_internal` ON `external_reference` (`firm_id`,`provider`,`external_entity_type`,`external_id`,`internal_entity_type`,`internal_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_ext_ref_internal` ON `external_reference` (`firm_id`,`internal_entity_type`,`internal_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_ext_ref_batch` ON `external_reference` (`migration_batch_id`);
