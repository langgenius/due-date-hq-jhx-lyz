# 2026-04-28 Clients Management Page

## Context

Sidebar P1 `Clients` already had the lower-layer data path: `client` Drizzle schema, tenant-scoped repo, `clients` oRPC contract, and server procedures. The missing product surface was the authenticated `/clients` page and an enabled sidebar entry.

## Changes

- Added `apps/app/src/routes/clients.tsx` with a dense admin work surface:
  - tenant-scoped list from `clients.listByFirm`
  - search, entity, and state filters
  - summary metrics for total clients, assigned records, and represented states
  - TanStack Table directory with source badges for manual vs imported clients
  - read-only detail panel derived from the active row
  - manual client creation dialog using the existing `clients.create` procedure
- Added the lazy `/clients` route.
- Confirmed the sidebar `Clients` nav item is enabled as its own product domain. Team workload
  remains disabled with `P1` under Operations.
- Added Playwright coverage for shell navigation into `/clients` and manual client creation through the real oRPC path.
- Updated `docs/dev-file/05-Frontend-Architecture.md` so the route map reflects the implemented page.

## Notes

- No backend contract, schema, or migration was changed. Edit/delete workflows remain out of scope until the contract exposes update/delete procedures.
- The page reuses existing oRPC/TanStack Query patterns, Lingui macros, Base UI primitives, and the Migration Wizard import entry point.
