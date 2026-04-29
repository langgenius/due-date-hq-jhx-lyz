# 2026-04-29 · Client Batch Targeted Reread

## Context

- `clients.createBatch` previously re-read created clients through `listByFirm()` and filtered
  in memory.
- That was acceptable for Demo Sprint data size, but it scales with total tenant clients instead
  of the just-created batch.
- The procedure should only touch the ids returned by the repo write path.

## Changes

- Added `ClientsRepo.findManyByIds(ids)` to the repo port contract.
- Implemented the D1 repo lookup with firm-scoped, non-deleted `WHERE id IN (...)` chunks.
- Preserved requested id order after Drizzle returns rows in database order.
- Updated `clients.createBatch` to re-read only the created ids and fail closed if any created row
  cannot be reloaded.
- Added db and server tests for empty lookup, chunked lookup, order preservation, and procedure
  reread behavior.

## Validation

- `pnpm --filter @duedatehq/db test -- --run src/repo/clients.test.ts src/db.test.ts`
- `pnpm --filter @duedatehq/server test -- --run src/procedures/clients/index.test.ts`
- `pnpm check`
- `pnpm test`
