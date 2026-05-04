CREATE TABLE `obligation_saved_view` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`name` text NOT NULL,
	`query_json` text NOT NULL,
	`column_visibility_json` text NOT NULL,
	`density` text DEFAULT 'comfortable' NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_obligation_saved_view_firm_pin_name` ON `obligation_saved_view` (`firm_id`,`is_pinned`,`name`);--> statement-breakpoint
CREATE INDEX `idx_obligation_saved_view_creator` ON `obligation_saved_view` (`firm_id`,`created_by_user_id`);