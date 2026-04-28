CREATE TABLE `ai_output` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
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
CREATE INDEX `idx_ai_output_firm_time` ON `ai_output` (`firm_id`,`generated_at`);--> statement-breakpoint
CREATE INDEX `idx_ai_output_context` ON `ai_output` (`kind`,`input_context_ref`);--> statement-breakpoint
CREATE TABLE `llm_log` (
	`id` text PRIMARY KEY NOT NULL,
	`firm_id` text NOT NULL,
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
CREATE INDEX `idx_llm_log_firm_time` ON `llm_log` (`firm_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_llm_log_prompt_time` ON `llm_log` (`prompt_version`,`created_at`);