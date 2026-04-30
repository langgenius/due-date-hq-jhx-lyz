ALTER TABLE `client` ADD `estimated_tax_liability_cents` integer;--> statement-breakpoint
ALTER TABLE `client` ADD `estimated_tax_liability_source` text;--> statement-breakpoint
ALTER TABLE `client` ADD `equity_owner_count` integer;--> statement-breakpoint
CREATE INDEX `idx_client_firm_penalty_inputs` ON `client` (`firm_id`,`estimated_tax_liability_cents`,`equity_owner_count`);--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `estimated_tax_due_cents` integer;--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `estimated_exposure_cents` integer;--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `exposure_status` text DEFAULT 'needs_input' NOT NULL;--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `penalty_breakdown_json` text;--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `penalty_formula_version` text;--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `exposure_calculated_at` integer;--> statement-breakpoint
CREATE INDEX `idx_oi_firm_due_exposure` ON `obligation_instance` (`firm_id`,`current_due_date`,`exposure_status`,`estimated_exposure_cents`);