// @duedatehq/ai orchestrator entry.
// Returns guarded result + trace payload; apps/server is responsible for persisting via
// injected writers (ai_output / evidence_link / llm_log).
// HARD CONSTRAINT (docs/dev-file/08 §4.6): no direct import of @duedatehq/db anywhere.
