ALTER TABLE `obligation_instance` ADD `readiness_status` text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
UPDATE `obligation_instance`
SET `readiness_status` = CASE
  WHEN `status` = 'waiting_on_client' THEN 'waiting'
  WHEN `status` = 'review' THEN 'needs_review'
  ELSE 'ready'
END;--> statement-breakpoint
CREATE INDEX `idx_oi_firm_readiness_due` ON `obligation_instance` (`firm_id`,`readiness_status`,`current_due_date`);
