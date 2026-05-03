# 2026-05-03 · Migration-first integrations foundation

## Summary

- Added a migration-first integration foundation so provider payloads enter the existing
  Migration Copilot pipeline instead of a separate settings flow.
- New integration sources cover TaxDome Zapier, Karbon API, Soraban API, SafeSend API, and
  ProConnect export handoffs.
- Added `migration_staging_row` for provider JSON provenance and `external_reference` for durable
  links from imported DueDateHQ clients/obligations back to provider objects.
- Step 1 now supports Paste / Upload, Connect platform JSON records, and Reuse provider import.
- Adjusted entitlement handling so Connect platform staging is part of the activation migration
  flow instead of a Team-only guided review; Reuse provider import and staging review remain Team+.
- Added draft discard from Clients › Import history and corrected the stale Settings › Imports
  History conflict message.
- Fixed Migration Copilot processing overlays so the progress bar reflects completed substeps and
  normalize preparation is not clipped by the previous step's scroll position.

## Validation

- `pnpm check`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/contracts test --run src/contracts.test.ts`
- `pnpm --filter @duedatehq/server test --run src/procedures/migration/_service.test.ts`
- `pnpm --filter @duedatehq/db test --run src/repo/migration.test.ts src/db.test.ts`
- `pnpm --filter @duedatehq/server test --run src/procedures/migration/index.test.ts`
