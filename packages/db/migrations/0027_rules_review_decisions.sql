CREATE TABLE `rule_review_decision` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`rule_id` text NOT NULL,
	`base_version` integer NOT NULL,
	`status` text NOT NULL,
	`rule_json` text,
	`review_note` text,
	`reviewed_by` text NOT NULL,
	`reviewed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_rule_review_firm_rule` ON `rule_review_decision` (`firm_id`,`rule_id`);
--> statement-breakpoint
CREATE INDEX `idx_rule_review_firm_status_time` ON `rule_review_decision` (`firm_id`,`status`,`reviewed_at`);
--> statement-breakpoint
CREATE INDEX `idx_rule_review_rule_id` ON `rule_review_decision` (`rule_id`);
