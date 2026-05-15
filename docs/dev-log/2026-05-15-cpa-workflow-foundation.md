# 2026-05-15 · CPA Workflow Foundation

## Context

Implemented the first foundation slice for positioning DueDateHQ as a CPA firm obligation source of
truth and workflow control layer, not tax preparation software.

## Changes

- Added client tax facts: legal entity, tax classification, tax year type, fiscal year-end, owner
  count, foreign/payroll/sales-tax/1099/K-1 flags, and primary contact fields.
- Added obligation taxonomy and workflow substates: obligation type, filing/payment due dates,
  source evidence, recurrence, risk level, prep/review/extension/payment/e-file states.
- Added `obligation_dependency` for K-1/source/payment/review blockers and
  `obligation_review_note` for review notes, blocking issues, and overrides.
- Expanded verified federal rule assets for 1040/4868, 1041, 941, payroll deposit schedule,
  1099-NEC, FBAR automatic extension, 990, and individual estimated tax.
- Updated accepted-rule obligation generation to persist CPA workflow metadata and keep payment due
  tracking independent from filing extension tracking.
- Added `partner` as a business workflow role distinct from the SaaS/billing `owner`.
- Replaced generic readiness fallback items with tax-type templates for individual, entity/K-1,
  corporate, fiduciary, payroll, information returns, foreign reporting, nonprofit, and sales tax.

## Validation

- `pnpm --filter @duedatehq/core test`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/auth test`
- `pnpm --filter @duedatehq/ai test`
- `pnpm check`
- `pnpm build` (exited 0; Wrangler dry-run emitted a sandbox EPERM warning while writing its local
  log file under `~/Library/Preferences/.wrangler`)
