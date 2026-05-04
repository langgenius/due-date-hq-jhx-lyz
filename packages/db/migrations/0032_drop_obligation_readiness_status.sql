DROP INDEX IF EXISTS `idx_oi_firm_readiness_due`;--> statement-breakpoint
ALTER TABLE `obligation_instance` DROP COLUMN `readiness_status`;
