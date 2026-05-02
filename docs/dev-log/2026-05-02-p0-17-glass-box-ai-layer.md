# 2026-05-02 P0-17 Glass-Box AI Layer Completion

## What changed

- Added deterministic Smart Priority in `packages/core/src/priority` with PRD weights for
  exposure, urgency, client importance, late-filing history, and readiness pressure. Dashboard,
  Workboard, and Weekly Brief ordering now share the same score/rank/factor breakdown contract.
- Added client risk inputs: `importance_weight` and `late_filing_count_last_12mo`, exposed through
  client create/update contracts and editable Client Profile risk inputs.
- Added `ai_insight_cache` for async cached `client_risk_summary` and `deadline_tip` rows. Refresh
  mutations enqueue `ai.insight.refresh` on the existing Dashboard queue path and return the current
  cached/pending/fallback state instead of waiting on the model.
- Added `client-risk-summary@v1` and `deadline-tip@v1` prompts plus guard checks for empty
  retrieval, citation bounds, uncited sections, banned tax-advice phrases, and unreplaced
  placeholders.
- Added Client Risk Summary to the Client Profile sheet, Deadline Tip to the Workboard detail
  drawer, and Smart Priority badges/popovers to Dashboard and Workboard rows.

## Data and demo notes

- Migration `0020_same_valeria_richards.sql` adds the two client risk fields and the insight cache.
- Demo seed now includes varied client risk inputs and ready cached examples for both insight kinds.
- AI insight cache remains a read model. `ai_output` / `llm_log` stay the source of audit, model,
  usage, latency, guard, and refusal trace data.

## Validation

- `pnpm --filter @duedatehq/core test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm format:fix`
- `pnpm ready`

## Follow-up: Deadline Tip refresh UX

- `obligations.requestDeadlineTipRefresh` now writes an immediate pending cache marker before
  enqueueing generation. If a previous tip exists, the pending row keeps the previous sections and
  citations so users do not lose useful context while a newer tip is prepared.
- Workboard detail `Risk` tab now shows `Preparing` state, preserves the previous tip, polls
  `obligations.getDeadlineTip` every 3 seconds for up to 60 seconds, and then shows a
  `Still preparing` message with a retry affordance.
- This stays useEffect-free: the refresh event records local start time, TanStack Query owns
  polling, and mutation success writes the returned pending insight into the query cache.

Validation:

- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
- `pnpm ready`
