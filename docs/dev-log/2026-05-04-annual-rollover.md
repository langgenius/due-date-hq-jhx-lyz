# 2026-05-04 · Annual Rollover

## Change

Added the first manual annual rollover path under `Rules Console > Obligation Preview`.

- Added `obligations.previewAnnualRollover` and `obligations.createAnnualRollover` contracts.
- Added nullable generated-rule metadata to `obligation_instance`:
  `rule_id`, `rule_version`, `rule_period`, and `generation_source`.
- Added an idempotency index for generated obligations on
  `firm_id + client_id + rule_id + tax_year + rule_period`.
- Added annual rollover service behavior:
  - source seeds come from source filing year `base_due_date` rows with status
    `done`, `paid`, or `extended`;
  - open and `not_applicable` rows are not rollover seeds;
  - target candidates use only `verified` rules where
    `applicableYear === targetFilingYear`;
  - concrete due-date reminder-ready rows create `pending` obligations;
  - concrete due-date requires-review rows create `review` obligations;
  - duplicate, missing verified rule, and missing due date rows stay preview-only.
- Writes verified-rule evidence, an `obligation.annual_rollover.created` audit event, and queues
  a Dashboard brief refresh when generation creates obligations.
- Added the Annual Rollover UI panel with source/target filing year controls, optional client
  filter, preview/generate actions, summary counts, row dispositions, and Workboard links.
- Kept the all-clients filter sentinel internal-only; the Select trigger now renders the localized
  `All clients` label instead of `__all_clients__`.
- Normalized missing generation metadata from legacy obligation rows to `null` in the public DTO so
  existing mock/demo data continues to pass `obligations.listByClient` output validation.

## Notes

This version intentionally does not add cron automation and does not solve multi-state clients.
Client state remains the single state on `client`, and new obligations recompute exposure from
current client-level risk inputs instead of copying prior-year payment or penalty facts.

## Validation

- Passed: `pnpm --filter @duedatehq/contracts test -- contracts.test.ts`
- Passed: `pnpm --filter @duedatehq/server test -- src/procedures/obligations/_annual-rollover.test.ts`
- Passed: `pnpm --filter @duedatehq/db test -- src/repo/tenant-scope.test.ts`
- Passed: `pnpm --filter @duedatehq/app test -- src/features/audit/audit-log-model.test.ts`
- Passed: `pnpm --filter @duedatehq/app test -- src/features/rules/generation-preview-tab.test.tsx`
- Passed: `pnpm --filter @duedatehq/app build`
- Passed: `pnpm --filter @duedatehq/app i18n:extract`
- Passed: `pnpm --filter @duedatehq/app i18n:compile`
- Passed: `pnpm --filter @duedatehq/server test -- src/procedures/obligations/_service.test.ts`
- Passed: targeted `pnpm check:fix` on touched source and docs files
- Passed: `pnpm test`
- Passed: `pnpm check`
