CREATE TABLE `exception_rule` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text,
	`source_pulse_id` text,
	`jurisdiction` text NOT NULL,
	`counties` text NOT NULL,
	`affected_forms` text NOT NULL,
	`affected_entity_types` text NOT NULL,
	`override_type` text NOT NULL,
	`override_value_json` text NOT NULL,
	`override_due_date` integer,
	`effective_from` integer,
	`effective_until` integer,
	`status` text DEFAULT 'candidate' NOT NULL,
	`source_url` text,
	`verbatim_quote` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_pulse_id`) REFERENCES `pulse`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_exc_status_effective` ON `exception_rule` (`status`,`effective_from`,`effective_until`);--> statement-breakpoint
CREATE INDEX `idx_exc_firm_status` ON `exception_rule` (`firm_id`,`status`,`effective_from`);--> statement-breakpoint
CREATE INDEX `idx_exc_source_pulse` ON `exception_rule` (`source_pulse_id`);--> statement-breakpoint
CREATE TABLE `obligation_exception_application` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`obligation_instance_id` text NOT NULL,
	`exception_rule_id` text NOT NULL,
	`applied_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`applied_by_user_id` text NOT NULL,
	`reverted_at` integer,
	`reverted_by_user_id` text,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`obligation_instance_id`) REFERENCES `obligation_instance`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`exception_rule_id`) REFERENCES `exception_rule`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`applied_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`reverted_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_obligation_exception_application` ON `obligation_exception_application` (`obligation_instance_id`,`exception_rule_id`);--> statement-breakpoint
CREATE INDEX `idx_oea_firm_obligation_active` ON `obligation_exception_application` (`firm_id`,`obligation_instance_id`,`reverted_at`);--> statement-breakpoint
CREATE INDEX `idx_oea_exception` ON `obligation_exception_application` (`exception_rule_id`);