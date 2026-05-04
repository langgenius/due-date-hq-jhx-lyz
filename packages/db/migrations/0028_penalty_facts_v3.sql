ALTER TABLE `obligation_instance` ADD `penalty_facts_json` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `penalty_facts_version` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `missing_penalty_facts_json` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `penalty_source_refs_json` text;
--> statement-breakpoint
ALTER TABLE `obligation_instance` ADD `penalty_formula_label` text;
