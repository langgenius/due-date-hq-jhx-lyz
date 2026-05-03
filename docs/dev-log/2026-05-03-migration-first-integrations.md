# 2026-05-03 · Migration-first integrations foundation

## Summary

- Added a migration-first integration foundation so provider payloads enter the existing
  Migration Copilot pipeline instead of a separate settings flow.
- New integration sources cover TaxDome Zapier, Karbon API, Soraban API, SafeSend API, and
  ProConnect export handoffs.
- Added `migration_staging_row` for provider JSON provenance and `external_reference` for durable
  links from imported DueDateHQ clients/obligations back to provider objects.
- Step 1 now supports Paste / Upload, Connect platform JSON records, and Previous sync clone.

## Validation

- `pnpm check`
- `pnpm --filter @duedatehq/contracts test --run src/contracts.test.ts`
- `pnpm --filter @duedatehq/server test --run src/procedures/migration/_service.test.ts`
- `pnpm --filter @duedatehq/db test --run src/repo/migration.test.ts src/db.test.ts`
