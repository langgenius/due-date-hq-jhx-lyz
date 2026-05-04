---
title: 'Obligations table sorting'
date: 2026-05-03
area: obligations
---

## Context

Obligations already had URL-backed server sorting through the toolbar select, but the table headers
did not expose direct sorting controls for the operational columns users scan most often.

## Changes

- Added Obligations sort values for Exposure high-to-low and low-to-high.
- Kept Due date sorting on the existing server-backed `due_asc` / `due_desc` sort values.
- Added compact header sort buttons for Due date and Exposure.
- Preserved server-side pagination semantics by extending repo comparison and cursor handling for
  Exposure sorting.
- Follow-up: Obligations data rows now use the pointer cursor to match their click-to-open behavior.

## Design alignment

- No DESIGN.md or token contract changes were needed.
- Header sort buttons reuse the same compact ghost icon affordance added to Dashboard, alongside the
  existing header filter controls.
- The row cursor change only clarifies an existing row action; no design token or stable docs update
  is needed.

## Validation

- `pnpm check`
- `pnpm --filter @duedatehq/db test -- --run src/repo/obligations.test.ts`
- `pnpm --filter @duedatehq/contracts test -- --run src/contracts.test.ts`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/app build`
