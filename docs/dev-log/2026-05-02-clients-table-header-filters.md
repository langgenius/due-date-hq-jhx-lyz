---
title: 'Clients table header filters'
date: 2026-05-02
area: clients
---

## Context

Clients facts already had local search plus top-level entity/state filters, but the table headers
did not match the Workboard table interaction. The page still reads from
`clients.listByFirm({ limit: 500 })`, so these filters stay client-side and URL-backed.

## Changes

- Reused the shared `TableHeaderMultiFilter` pattern for Clients table headers.
- Added URL-backed multi-select filters for client, readiness, entity, jurisdiction state, source,
  and owner.
- Kept the top Entity/State controls, but converted them to the same checkbox dropdown pattern so
  the toolbar and header interactions match.
- Extended the client readiness model and unit coverage for readiness/source/owner facet filters.
- Set the Clients Readiness and Source badges to `text-xs` locally.
- DESIGN.md check: no token or component spec change was needed; this reuses existing DropdownMenu,
  Table, Button, and Badge primitives.

## 2026-05-02 Follow-up: Header Toolbar Layout

- Fixed the `Client facts` card header toolbar after the top-level Entity/State filters were added.
- Root cause: nested `CardAction` still contributed `data-slot="card-action"`, which triggered the
  shared `CardHeader` two-column grid selector even though the action was no longer a direct grid
  child. The next toolbar row was then auto-placed into the narrow right column.
- Replaced that nested `CardAction` with a local flex toolbar so count/Profile, search, and
  Entity/State controls stay horizontal on desktop and only wrap when the available width is too
  small.
- Follow-up: replaced the toolbar free-text client search with the same searchable multi-select
  dropdown pattern used by Entity/State, so Client / Entity / State now share one horizontal
  filter row and all write URL-backed facet filters.
- DESIGN.md check: no design-token or component-contract update was needed; this is a local
  composition fix that keeps the existing Card, Button, Badge, and DropdownMenu primitives.

## Validation

- `pnpm --filter @duedatehq/app test -- src/features/clients/client-readiness.test.ts`
- `pnpm exec vp check --fix apps/app/src/routes/clients.tsx apps/app/src/features/clients/ClientFactsWorkspace.tsx apps/app/src/features/clients/client-readiness.ts apps/app/src/features/clients/client-readiness.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec tsc -p apps/app/tsconfig.json --noEmit`
- `pnpm check`
- Follow-up: `pnpm check`
- Follow-up: `pnpm --filter @duedatehq/app build`
- Follow-up: `E2E_REUSE_EXISTING_SERVER=1 pnpm exec playwright test e2e/tests/clients.spec.ts --project=chromium --grep E2E-CLIENTS-FACTS-SEED`
- Follow-up: `E2E_REUSE_EXISTING_SERVER=1 pnpm exec playwright test e2e/tests/clients.spec.ts --project=chromium --grep E2E-CLIENTS-FILTERS`
