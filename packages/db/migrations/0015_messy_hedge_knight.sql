CREATE INDEX IF NOT EXISTS `idx_client_firm_state_county` ON `client` (`firm_id`,`state`,`county`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_client_firm_assignee` ON `client` (`firm_id`,`assignee_name`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_oi_firm_tax_type_due` ON `obligation_instance` (`firm_id`,`tax_type`,`current_due_date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_oi_firm_exposure_amount` ON `obligation_instance` (`firm_id`,`estimated_exposure_cents`);
