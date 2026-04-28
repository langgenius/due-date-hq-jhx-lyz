CREATE TABLE `subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`plan` text NOT NULL,
	`reference_id` text NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`status` text DEFAULT 'incomplete' NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`trial_start` integer,
	`trial_end` integer,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`cancel_at` integer,
	`canceled_at` integer,
	`ended_at` integer,
	`seats` integer,
	`billing_interval` text,
	`stripe_schedule_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_stripe_subscription_id_unique` ON `subscription` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscription_reference_id_idx` ON `subscription` (`reference_id`);--> statement-breakpoint
CREATE INDEX `subscription_customer_idx` ON `subscription` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `subscription_status_idx` ON `subscription` (`status`);--> statement-breakpoint
ALTER TABLE `organization` ADD `stripe_customer_id` text;--> statement-breakpoint
ALTER TABLE `user` ADD `stripe_customer_id` text;--> statement-breakpoint
ALTER TABLE `firm_profile` ADD `billing_customer_id` text;--> statement-breakpoint
ALTER TABLE `firm_profile` ADD `billing_subscription_id` text;