ALTER TABLE `client` ADD `assignee_id` text;--> statement-breakpoint
CREATE INDEX `idx_client_firm_assignee_id` ON `client` (`firm_id`,`assignee_id`);