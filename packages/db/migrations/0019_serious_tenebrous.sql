CREATE TABLE `client_readiness_request` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`obligation_instance_id` text NOT NULL,
	`client_id` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`recipient_email` text,
	`token_hash` text NOT NULL,
	`status` text DEFAULT 'sent' NOT NULL,
	`checklist_json` text NOT NULL,
	`expires_at` integer NOT NULL,
	`sent_at` integer,
	`first_opened_at` integer,
	`last_responded_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`obligation_instance_id`) REFERENCES `obligation_instance`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `client`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_readiness_request_token_hash` ON `client_readiness_request` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_readiness_request_firm_obligation` ON `client_readiness_request` (`firm_id`,`obligation_instance_id`);--> statement-breakpoint
CREATE INDEX `idx_readiness_request_status_expiry` ON `client_readiness_request` (`status`,`expires_at`);--> statement-breakpoint
CREATE TABLE `client_readiness_response` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`request_id` text NOT NULL,
	`obligation_instance_id` text NOT NULL,
	`item_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`eta_date` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`request_id`) REFERENCES `client_readiness_request`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`obligation_instance_id`) REFERENCES `obligation_instance`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_readiness_response_request` ON `client_readiness_response` (`request_id`);--> statement-breakpoint
CREATE INDEX `idx_readiness_response_obligation` ON `client_readiness_response` (`firm_id`,`obligation_instance_id`);--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `extension_decision` text DEFAULT 'not_considered' NOT NULL;--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `extension_memo` text;--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `extension_source` text;--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `extension_expected_due_date` integer;--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `extension_decided_at` integer;--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `extension_decided_by_user_id` text;