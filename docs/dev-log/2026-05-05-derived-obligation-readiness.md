---
title: 'Derived obligation readiness'
date: 2026-05-05
area: obligations
---

## Context

Obligations had both workflow `status` and persisted `readiness_status`, which made `Needs review`
ambiguous and duplicated the status state machine.

## Changes

- Removed `obligation_instance.readiness_status` from the Drizzle schema and added a migration to
  drop its index and column.
- Kept public `readiness` as a read-model field derived from closed/open status plus the latest
  Readiness Portal request and responses.
- Removed explicit single and bulk readiness update procedures and UI controls; readiness remains
  available in read models, Calendar, audit summaries, and exports.
- Stopped portal response submission from writing the obligation row; it now records response rows,
  evidence, and audit only.
- Removed the readiness column and readiness header filter from the Obligations queue UI; readiness
  request history remains available in the obligation detail drawer.

## Validation

- `pnpm check`
- `pnpm test`
- `pnpm build` (Wrangler dry-run completed; sandbox blocked writing its debug log under
  `~/.wrangler`, but the command exited successfully.)
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
