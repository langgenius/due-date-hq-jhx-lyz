---
title: 'Obligations P0-13 filters'
date: 2026-05-01
area: obligations
---

## Context

P0-13 requires Obligations filters for Client, State, County, Form / Tax Type, Status,
Readiness, Assignee, $ At Risk, and Days, with a P0 target of 1000 obligations / 200 clients
responding under one second.

## Changes

- Extended `obligations.list` contract and repo input with multi-select filters:
  `clientIds`, `states`, `counties`, `taxTypes`, `assigneeNames`, `readiness`, plus dollar and
  days ranges.
- Added `obligations.facets` for server-derived filter options and counts. County facets carry state
  metadata so the UI can narrow county choices after state selection.
- Added Obligations row fields `clientState`, `clientCounty`, `readiness`, and `daysUntilDue`.
  Readiness is a derived bridge until the dedicated readiness state machine lands:
  `waiting_on_client → waiting`; `review` or non-ready exposure → `needs_review`; all others →
  `ready`.
- Added DB indexes for the new high-use filters:
  `idx_client_firm_state_county`, `idx_client_firm_assignee`,
  `idx_oi_firm_tax_type_due`, and `idx_oi_firm_exposure_amount`.
- Updated `/obligations` controls to keep all filters in `nuqs` URL state, preserve the existing
  workload `assignee` deep link, and render dense multi-select dropdowns with searchable client /
  county / assignee options.
- Follow-up: moved P0-13 filter triggers into table headers for Client / Owner / State / County /
  Tax type / Days / Exposure / Readiness / Status. The old standalone multi-filter row was removed
  so filtering happens where users scan the table.
- Follow-up: header checkbox filter dropdowns now commit URL/query changes on each option click
  while keeping the dropdown open, so the table refilters immediately without interrupting
  multi-select workflows. Days / Exposure range inputs still commit when their dropdown closes.
- Follow-up: status cells now use the visible status pill itself as the dropdown trigger for status
  changes, replacing the extra select control that previously sat beside the pill.
- Visual follow-up: Exposure, Readiness, and Status table pills now render at 12px instead of the
  global 11px badge `text-xs` token for better scannability in the dense Obligations table.
- Visual follow-up: Days-until-due cells now render as compact semantic pills: overdue uses a
  stronger solid destructive treatment, today / 1-2 days use red, 3-7 days use warning, and 8+
  days use success. This keeps 1-day, 10-day, and overdue obligations visually distinct while
  staying on existing Badge and status-dot tokens.
- E2E follow-up: updated the Obligations page object to select Status through the table-header
  dropdown and assert immediate URL/query state while the menu remains open.
- DESIGN.md check: no token, color, spacing, or component contract change was needed; this stays on
  existing `Button`, `Badge`, `BadgeStatusDot`, `DropdownMenu`, `Input`, and `Table` primitives.

## Validation

- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test -- src/repo/obligations.test.ts src/db.test.ts`
- `pnpm --filter @duedatehq/server test -- src/procedures/obligations/_service.test.ts src/procedures/migration/_service.test.ts`
- `pnpm exec vp check apps/app/src/routes/obligations.tsx apps/app/src/i18n/locales/en/messages.po apps/app/src/i18n/locales/en/messages.ts apps/app/src/i18n/locales/zh-CN/messages.po apps/app/src/i18n/locales/zh-CN/messages.ts docs/dev-log/2026-05-01-obligations-p0-13-filters.md`
- `pnpm exec vp check apps/app/src/routes/obligations.tsx`
- `pnpm exec vp check apps/app/src/routes/obligations.tsx docs/dev-log/2026-05-01-obligations-p0-13-filters.md`
- `pnpm exec vp check apps/app/src/routes/obligations.tsx e2e/pages/obligations-page.ts e2e/tests/obligations.spec.ts docs/dev-log/2026-05-01-obligations-p0-13-filters.md`
- `pnpm exec vp check apps/app/src/features/obligations/status-control.tsx e2e/pages/obligations-page.ts e2e/tests/obligations.spec.ts e2e/tests/audit-log.spec.ts docs/dev-log/2026-05-01-obligations-p0-13-filters.md`
- `pnpm exec vp check --fix apps/app/src/routes/obligations.tsx apps/app/src/features/obligations/status-control.tsx`
- `pnpm exec vp check apps/app/src/routes/obligations.tsx apps/app/src/features/obligations/status-control.tsx docs/dev-log/2026-05-01-obligations-p0-13-filters.md`
- `pnpm check`
- `E2E_REUSE_EXISTING_SERVER=1 pnpm test:e2e e2e/tests/obligations.spec.ts`
- `pnpm test:e2e e2e/tests/obligations.spec.ts e2e/tests/audit-log.spec.ts`
- `pnpm check:deps`
- `pnpm ready`
- `pnpm --filter @duedatehq/app i18n:extract`

`pnpm ready` returned 0. Wrangler dry-run still printed the local log-file EPERM warning for
`~/Library/Preferences/.wrangler/logs/...`, but the Worker dry-run and all builds completed.
