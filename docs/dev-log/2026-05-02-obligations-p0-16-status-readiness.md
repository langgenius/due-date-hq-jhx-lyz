---
title: 'Obligations P0-16 status and readiness'
date: 2026-05-02
area: obligations
---

## Context

P0-16 required the Obligations status flow to cover Filed, Paid, Extended, Waiting, Needs review,
and Not applicable while keeping readiness independent from status.

## Changes

- Added `@duedatehq/core/obligation-workflow` for the canonical status/readiness model, open vs
  closed status groups, and default readiness synchronization.
- Added persistent `obligation_instance.readiness_status` with a migration backfill and
  `firm_id/readiness_status/current_due_date` index.
- Extended obligation contracts, ports, repos, and procedures with single and bulk readiness
  mutations. Status mutations now audit both status and readiness before/after.
- Updated Obligations and Dashboard status labels so `done` renders as Filed, `review` renders as
  Needs review, and `pending` renders as Not started.
- Made Obligations readiness editable inline and in bulk, added Paid as a status target, and added
  `P` as the Mark paid hotkey.
- Switched Dashboard, Workload, Pulse, and reminders to the shared open-status model so Filed,
  Paid, Extended, and Not applicable are treated as closed.

## Validation

- `pnpm --filter @duedatehq/core test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test -- src/repo/obligations.test.ts src/db.test.ts src/repo/dashboard.test.ts src/repo/workload.test.ts`
- `pnpm --filter @duedatehq/server test -- src/procedures/obligations/_service.test.ts src/procedures/migration/_service.test.ts`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/db db:generate`
- `pnpm check`
- `pnpm check:deps`
- `E2E_REUSE_EXISTING_SERVER=1 pnpm test:e2e e2e/tests/obligations.spec.ts e2e/tests/audit-log.spec.ts`
- `pnpm ready` (exit 0; Wrangler dry-run printed a sandbox log-write EPERM warning while continuing)

DESIGN.md check: no new token or component primitive was needed; the UI stays on existing Badge,
BadgeStatusDot, DropdownMenu, Button, and Table primitives.
