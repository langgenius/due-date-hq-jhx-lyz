CREATE TABLE `calendar_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`scope` text NOT NULL,
	`subject_user_id` text,
	`privacy_mode` text DEFAULT 'redacted' NOT NULL,
	`token_nonce` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`last_accessed_at` integer,
	`revoked_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_calendar_subscription_my` ON `calendar_subscription` (`firm_id`,`scope`,`subject_user_id`) WHERE scope = 'my';--> statement-breakpoint
CREATE UNIQUE INDEX `uq_calendar_subscription_firm` ON `calendar_subscription` (`firm_id`,`scope`) WHERE scope = 'firm';--> statement-breakpoint
CREATE INDEX `idx_calendar_subscription_firm` ON `calendar_subscription` (`firm_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_calendar_subscription_subject` ON `calendar_subscription` (`subject_user_id`);