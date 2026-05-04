ALTER TABLE `obligation_instance` ADD `rule_id` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `rule_version` integer;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `rule_period` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `generation_source` text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `uq_oi_generated_rule_period` ON `obligation_instance` (
  `firm_id`,
  `client_id`,
  `rule_id`,
  `tax_year`,
  `rule_period`
)
WHERE
  `rule_id` IS NOT NULL
  AND `tax_year` IS NOT NULL
  AND `rule_period` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_oi_firm_rule_tax_year` ON `obligation_instance` (
  `firm_id`,
  `rule_id`,
  `tax_year`
);
