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
  filter, preview/generate actions, summary counts, row dispositions, and Obligations links.
- Added inline help tooltips to every Annual Rollover summary metric and result-table column so
  first-time users can interpret counts, dispositions, skipped reasons, and Obligations links in
  place.
- Kept the all-clients filter sentinel internal-only; the Select trigger now renders the localized
  `All clients` label instead of `__all_clients__`.
- Normalized missing generation metadata from legacy obligation rows to `null` in the public DTO so
  existing mock/demo data continues to pass `obligations.listByClient` output validation.
- Added Brightline demo seed coverage for the default `2026 -> 2027` rollover path:
  - 3 firm-scoped verified runtime rules in `rule_review_decision` for `federal_1120s`,
    `federal_1065`, and `federal_1041`;
  - 2 additional closed 2026 source-year obligations for Bright Studio S-Corp and Lakeview Medical
    Partners, complementing the existing closed Magnolia Family Trust row;
  - the default preview now has concrete generated rows instead of all rows falling into
    `missing_verified_rule`.

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
- Passed: `pnpm check apps/app/src/features/rules/generation-preview-tab.tsx apps/app/src/features/rules/generation-preview-tab.test.tsx apps/app/src/i18n/locales/en/messages.po apps/app/src/i18n/locales/en/messages.ts apps/app/src/i18n/locales/zh-CN/messages.po apps/app/src/i18n/locales/zh-CN/messages.ts docs/dev-log/2026-05-04-annual-rollover.md`
- Note: latest full `pnpm check` is currently blocked by separate client filing profile worktree
  changes outside the Annual Rollover UI files.
- Passed: targeted `pnpm check:fix` on touched source and docs files
- Passed: `pnpm test`
- Passed: `pnpm check`
- Passed: `pnpm --filter @duedatehq/server test -- src/procedures/obligations/_annual-rollover.test.ts`
- Passed: `pnpm db:seed:demo`
- Passed: local D1 verification queries for Brightline demo 2026 closed rollover seeds and 2027
  verified runtime rules.
