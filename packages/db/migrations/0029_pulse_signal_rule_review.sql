ALTER TABLE `pulse_source_signal` ADD `reviewed_rule_id` text;--> statement-breakpoint
ALTER TABLE `pulse_source_signal` ADD `review_decision_id` text;--> statement-breakpoint
CREATE INDEX `idx_pulse_signal_review_rule` ON `pulse_source_signal` (`reviewed_rule_id`);--> statement-breakpoint
CREATE INDEX `idx_pulse_signal_review_decision` ON `pulse_source_signal` (`review_decision_id`);
