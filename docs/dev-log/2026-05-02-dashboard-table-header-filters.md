---
title: 'Dashboard table header filters'
date: 2026-05-02
area: dashboard
---

## Context

Dashboard triage needed the same table-header filtering workflow as Workboard: multi-select
checkbox menus, immediate server-backed refresh on each option click, and menus that stay open for
continued selection.

## Changes

- Extended `dashboard.load` with table-only filters for client, tax type, deadline bucket, status,
  severity, exposure state, and evidence state.
- Added Dashboard facets to `dashboard.load` so filter headers can render option counts without
  relying on the currently visible rows.
- Refactored dashboard aggregation so global summary/top risk rows remain unfiltered while
  `triageTabs` reflect the selected table filters.
- Extracted the Workboard header checkbox filter into a shared app pattern and reused it from both
  Workboard and Dashboard.
- Converted the Dashboard triage table to TanStack Table with manual filtering and URL-backed
  `nuqs` state.
- DESIGN.md check: no token, color, spacing, or component contract change was needed; this stays on
  existing `DropdownMenu`, `Badge`, `Button`, and `Table` primitives.

## Validation

- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test -- src/repo/dashboard.test.ts src/db.test.ts`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm test:e2e e2e/tests/workboard.spec.ts`
- `pnpm check`
- `pnpm ready`

`pnpm ready` exited successfully. Wrangler dry-run emitted a local log-file EPERM warning for
`~/Library/Preferences/.wrangler/logs`, but the dry-run continued and the overall command returned 0.
