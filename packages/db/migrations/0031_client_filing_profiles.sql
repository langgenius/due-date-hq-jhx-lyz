CREATE TABLE `client_filing_profile` (
  `id` text PRIMARY KEY NOT NULL,
  `firm_id` text NOT NULL,
  `client_id` text NOT NULL,
  `state` text NOT NULL,
  `counties_json` text DEFAULT '[]' NOT NULL,
  `tax_types_json` text DEFAULT '[]' NOT NULL,
  `is_primary` integer DEFAULT 0 NOT NULL,
  `source` text DEFAULT 'manual' NOT NULL,
  `migration_batch_id` text,
  `archived_at` integer,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`client_id`) REFERENCES `client`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_cfp_firm_client` ON `client_filing_profile` (`firm_id`, `client_id`);
--> statement-breakpoint
CREATE INDEX `idx_cfp_firm_state` ON `client_filing_profile` (`firm_id`, `state`);
--> statement-breakpoint
CREATE INDEX `idx_cfp_batch` ON `client_filing_profile` (`migration_batch_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_cfp_client_state_active` ON `client_filing_profile` (`client_id`, `state`)
WHERE
  `archived_at` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_cfp_client_primary_active` ON `client_filing_profile` (`client_id`)
WHERE
  `is_primary` = 1
  AND `archived_at` IS NULL;
--> statement-breakpoint
INSERT INTO `client_filing_profile` (
  `id`,
  `firm_id`,
  `client_id`,
  `state`,
  `counties_json`,
  `tax_types_json`,
  `is_primary`,
  `source`,
  `migration_batch_id`,
  `created_at`,
  `updated_at`
)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', abs(random()) % 4 + 1, 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  `firm_id`,
  `id`,
  upper(`state`),
  CASE
    WHEN `county` IS NULL OR trim(`county`) = '' THEN '[]'
    ELSE json_array(`county`)
  END,
  '[]',
  1,
  'backfill',
  `migration_batch_id`,
  cast(strftime('%s', 'now') || '000' as integer),
  cast(strftime('%s', 'now') || '000' as integer)
FROM `client`
WHERE `state` IS NOT NULL AND trim(`state`) <> '';
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `client_filing_profile_id` text REFERENCES `client_filing_profile`(`id`) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `jurisdiction` text;
--> statement-breakpoint
UPDATE `obligation_instance`
SET `jurisdiction` = CASE
  WHEN lower(`tax_type`) LIKE 'federal%' THEN 'FED'
  ELSE (
    SELECT upper(`state`)
    FROM `client`
    WHERE `client`.`id` = `obligation_instance`.`client_id`
      AND `client`.`firm_id` = `obligation_instance`.`firm_id`
    LIMIT 1
  )
END
WHERE `jurisdiction` IS NULL;
--> statement-breakpoint
UPDATE `obligation_instance`
SET `client_filing_profile_id` = (
  SELECT `client_filing_profile`.`id`
  FROM `client_filing_profile`
  WHERE `client_filing_profile`.`firm_id` = `obligation_instance`.`firm_id`
    AND `client_filing_profile`.`client_id` = `obligation_instance`.`client_id`
    AND `client_filing_profile`.`state` = `obligation_instance`.`jurisdiction`
    AND `client_filing_profile`.`archived_at` IS NULL
  LIMIT 1
)
WHERE `jurisdiction` IS NOT NULL AND `jurisdiction` <> 'FED';
--> statement-breakpoint
DROP INDEX IF EXISTS `uq_oi_generated_rule_period`;
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_oi_generated_rule_period` ON `obligation_instance` (
  `firm_id`,
  `client_id`,
  `jurisdiction`,
  `rule_id`,
  `tax_year`,
  `rule_period`
)
WHERE
  `rule_id` IS NOT NULL
  AND `tax_year` IS NOT NULL
  AND `rule_period` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `idx_oi_firm_jurisdiction_due` ON `obligation_instance` (
  `firm_id`,
  `jurisdiction`,
  `current_due_date`
);
--> statement-breakpoint
CREATE INDEX `idx_oi_profile` ON `obligation_instance` (`client_filing_profile_id`);
