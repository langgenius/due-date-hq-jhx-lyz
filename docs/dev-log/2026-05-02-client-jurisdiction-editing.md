# 2026-05-02 — Client Jurisdiction Editing

## Context

Riverbend Draft Client can appear on Obligations with missing `STATE` / `COUNTY` because
existing clients only supported jurisdiction facts at creation or migration import time.
`Fact profile` exposed those facts read-only, so users had no in-product correction path.

## Changes

- Added `clients.updateJurisdiction` to the shared contract, server router, scoped client repo,
  and ports interface.
- The server mutation writes `client.jurisdiction.updated` audit, recalculates obligation
  exposure for that client, and refreshes dashboard/client risk summary jobs.
- Added a `Jurisdiction facts` editor inside Clients → Fact profile for state and county.
- The frontend invalidates Clients, Dashboard, Obligations list/detail/facets, and client risk
  summary caches after a save.
- Updated the user manual and data-access/frontend architecture notes so docs match the new
  correction path.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/app test`
- `pnpm build` (completed; Wrangler emitted a sandbox-only log-file EPERM warning while dry-run
  continued)
