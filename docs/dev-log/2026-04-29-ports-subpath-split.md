# 2026-04-29 · Ports Subpath Split

## Context

- `packages/ports/src/index.ts` had grown into a 900+ line mixed model file with tenant,
  repo, row, AI, migration, dashboard, workload, and pulse types.
- Keeping every port in one root entry made it harder to see which boundary a consumer needed.
- The repo already enforces `oxc/no-barrel-file`, so the split should not introduce a root
  barrel API.

## Changes

- Split `packages/ports/src/index.ts` into concrete domain files:
  - `shared`, `tenants`, `scoped`
  - `clients`, `obligations`, `audit`, `evidence`
  - `dashboard`, `obligations`, `workload`
  - `migration`, `pulse`, `ai`
- Removed the `@duedatehq/ports` root export from `packages/ports/package.json`.
- Added explicit package exports for each concrete subpath.
- Updated server and db consumers to import only the subpath they need.
- Kept `packages/db/src/types.ts` as the db package compatibility surface, but backed it with
  concrete ports subpaths instead of the removed root entry.

## Validation

- `pnpm check`
- `pnpm check:deps`
- `pnpm test`
- `pnpm build`
