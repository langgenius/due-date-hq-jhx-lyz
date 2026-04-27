# 2026-04-27 · Rules Official Source Health

## Context

The rules asset had become API-readable, but the next product step needs official
source accuracy, explicit rule states, pullability checks, and a reusable due-date
DSL before obligations and reminders consume it.

## Changes

- Rechecked Federal, CA, NY, TX, FL, and WA rules against official sources only.
- Corrected `RuleSource` URLs, ids, source types, acquisition methods, cadence,
  and health status where code had drifted from the product design.
- Added NY sources and rules for partnerships, CT-3-S, PTET election, and PTET
  estimated payments.
- Added TX sources and rules for franchise extensions and no-tax-due threshold
  review.
- Corrected WA monthly and quarterly excise due dates for weekend/holiday
  rollover and marked WA DOR sources as `manual_review` + `degraded` because
  direct machine fetches return 403.
- Added `subscription` source type for NY email services.
- Added `@duedatehq/core/date-logic` expansion for fixed, relative,
  period-table, and source-defined due date logic.
- Added root `rules:check-sources` so ops can verify which official sources are
  machine-fetchable and which require manual review without putting I/O inside
  `packages/core`.

## Product Decisions

- `verified` means the rule basis is official and reviewed; it does not mean
  the rule can always generate a reminder without client facts.
- `applicability_review` + `coverageStatus='manual'` is the default for rules
  that depend on LLC classification, PTET election, TX threshold status, or
  source-defined calendars.
- WA DOR remains in MVP coverage, but source freshness is honest: manual review
  is required until a reliable ingestion path exists.
- Candidate and manual-review rules remain blocked from user reminders until an
  obligation generation layer explicitly marks them reminder-ready.
- Source health checking is an ops script boundary. `packages/core` remains the
  pure source of rule data, DueDateLogic, and preview computation.

## Validation

- `pnpm --filter @duedatehq/core test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm rules:check-sources`
