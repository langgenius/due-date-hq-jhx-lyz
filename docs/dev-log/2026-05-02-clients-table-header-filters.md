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

## Validation

- `pnpm --filter @duedatehq/app test -- src/features/clients/client-readiness.test.ts`
- `pnpm exec vp check --fix apps/app/src/routes/clients.tsx apps/app/src/features/clients/ClientFactsWorkspace.tsx apps/app/src/features/clients/client-readiness.ts apps/app/src/features/clients/client-readiness.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec tsc -p apps/app/tsconfig.json --noEmit`
- `pnpm check`
