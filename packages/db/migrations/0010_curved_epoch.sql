CREATE TABLE `pulse_source_state` (
	`source_id` text PRIMARY KEY NOT NULL,
	`tier` text NOT NULL,
	`jurisdiction` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`cadence_ms` integer NOT NULL,
	`health_status` text DEFAULT 'degraded' NOT NULL,
	`last_checked_at` integer,
	`last_success_at` integer,
	`last_change_detected_at` integer,
	`next_check_at` integer,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`etag` text,
	`last_modified` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pss_health_next` ON `pulse_source_state` (`health_status`,`next_check_at`);--> statement-breakpoint
CREATE INDEX `idx_pss_enabled_next` ON `pulse_source_state` (`enabled`,`next_check_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ai_output` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text,
	`user_id` text,
	`kind` text NOT NULL,
	`prompt_version` text NOT NULL,
	`model` text,
	`input_context_ref` text,
	`input_hash` text NOT NULL,
	`output_text` text,
	`citations_json` text,
	`guard_result` text NOT NULL,
	`refusal_code` text,
	`generated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`tokens_in` integer,
	`tokens_out` integer,
	`latency_ms` integer DEFAULT 0 NOT NULL,
	`cost_usd` real,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_ai_output`("id", "firm_id", "user_id", "kind", "prompt_version", "model", "input_context_ref", "input_hash", "output_text", "citations_json", "guard_result", "refusal_code", "generated_at", "tokens_in", "tokens_out", "latency_ms", "cost_usd") SELECT "id", "firm_id", "user_id", "kind", "prompt_version", "model", "input_context_ref", "input_hash", "output_text", "citations_json", "guard_result", "refusal_code", "generated_at", "tokens_in", "tokens_out", "latency_ms", "cost_usd" FROM `ai_output`;--> statement-breakpoint
DROP TABLE `ai_output`;--> statement-breakpoint
ALTER TABLE `__new_ai_output` RENAME TO `ai_output`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_ai_output_firm_time` ON `ai_output` (`firm_id`,`generated_at`);--> statement-breakpoint
CREATE INDEX `idx_ai_output_context` ON `ai_output` (`kind`,`input_context_ref`);--> statement-breakpoint
CREATE TABLE `__new_llm_log` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text,
	`user_id` text,
	`prompt_version` text NOT NULL,
	`model` text,
	`input_hash` text NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`latency_ms` integer DEFAULT 0 NOT NULL,
	`cost_usd` real,
	`guard_result` text NOT NULL,
	`refusal_code` text,
	`success` integer NOT NULL,
	`error_msg` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`firm_id`) REFERENCES `firm_profile`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_llm_log`("id", "firm_id", "user_id", "prompt_version", "model", "input_hash", "input_tokens", "output_tokens", "latency_ms", "cost_usd", "guard_result", "refusal_code", "success", "error_msg", "created_at") SELECT "id", "firm_id", "user_id", "prompt_version", "model", "input_hash", "input_tokens", "output_tokens", "latency_ms", "cost_usd", "guard_result", "refusal_code", "success", "error_msg", "created_at" FROM `llm_log`;--> statement-breakpoint
DROP TABLE `llm_log`;--> statement-breakpoint
ALTER TABLE `__new_llm_log` RENAME TO `llm_log`;--> statement-breakpoint
CREATE INDEX `idx_llm_log_firm_time` ON `llm_log` (`firm_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_llm_log_prompt_time` ON `llm_log` (`prompt_version`,`created_at`);