---
title: 'Workboard P0-13 filters'
date: 2026-05-01
area: workboard
---

## Context

P0-13 requires Workboard filters for Client, State, County, Form / Tax Type, Status,
Readiness, Assignee, $ At Risk, and Days, with a P0 target of 1000 obligations / 200 clients
responding under one second.

## Changes

- Extended `workboard.list` contract and repo input with multi-select filters:
  `clientIds`, `states`, `counties`, `taxTypes`, `assigneeNames`, `readiness`, plus dollar and
  days ranges.
- Added `workboard.facets` for server-derived filter options and counts. County facets carry state
  metadata so the UI can narrow county choices after state selection.
- Added Workboard row fields `clientState`, `clientCounty`, `readiness`, and `daysUntilDue`.
  Readiness is a derived bridge until the dedicated readiness state machine lands:
  `waiting_on_client → waiting`; `review` or non-ready exposure → `needs_review`; all others →
  `ready`.
- Added DB indexes for the new high-use filters:
  `idx_client_firm_state_county`, `idx_client_firm_assignee`,
  `idx_oi_firm_tax_type_due`, and `idx_oi_firm_exposure_amount`.
- Updated `/workboard` controls to keep all filters in `nuqs` URL state, preserve the existing
  workload `assignee` deep link, and render dense multi-select dropdowns with searchable client /
  county / assignee options.
- DESIGN.md check: no token, color, spacing, or component contract change was needed; this stays on
  existing `Button`, `Badge`, `DropdownMenu`, `Input`, and `Table` primitives.

## Validation

- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test -- src/repo/workboard.test.ts src/db.test.ts`
- `pnpm --filter @duedatehq/server test -- src/procedures/obligations/_service.test.ts src/procedures/migration/_service.test.ts`
- `pnpm check`
- `pnpm check:deps`
- `pnpm ready`

`pnpm ready` returned 0. Wrangler dry-run still printed the local log-file EPERM warning for
`~/Library/Preferences/.wrangler/logs/...`, but the Worker dry-run and all builds completed.
