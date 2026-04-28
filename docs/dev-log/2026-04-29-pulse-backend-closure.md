---
title: 'Pulse Backend Closure'
date: 2026-04-29
---

# Pulse Backend Closure

## Context

Pulse needed a backend-only slice before any Dashboard banner, drawer, route,
or translation work. The target was a seeded, approved Pulse that can match
firm obligations, apply due-date changes, write evidence/audit/email outbox
records, and revert within the 24h recovery window.

## Change

- Added D1-safe Pulse schema tables: `pulse`, `pulse_firm_alert`, and
  `pulse_application`, plus the minimal `email_outbox` transactional outbox.
- Added the firm-scoped Pulse repo and wired it through `scoped(db, firmId)`.
- Added Pulse contracts for `listAlerts`, `getDetail`, `apply`, `dismiss`, and
  `revert`, including public shapes, statuses, and stable error codes.
- Added server procedures with read access for tenant members and write access
  for Owner + Manager.
- Extended e2e/demo seeding with a `pulse` mode that creates one sample
  approved Pulse, one eligible obligation, one county `needs_review` obligation,
  and one non-matching obligation.
- Added unit and procedure coverage for matching, county review gating, batch
  apply writes, duplicate apply conflict, revert expiry, scoped access, and RBAC
  boundaries.

## Notes

- Phase 0 still updates `obligation_instance.current_due_date` directly and
  records `pulse_application`; the overlay engine remains a later phase.
- `dismiss` is firm-scoped only and does not mutate the global `pulse.status`.
- No React UI, Dashboard route, component, or Lingui catalog was changed in this
  slice. `docs/Design/DueDateHQ-DESIGN.md` remains aligned because the Pulse UI
  surface was intentionally deferred.

## Validation

- `pnpm --filter @duedatehq/db db:generate` - passed and generated migration
  `0007_parallel_maddog.sql`.
- `pnpm --filter @duedatehq/contracts test` - passed, 16 tests.
- `pnpm --filter @duedatehq/db test` - passed, 39 tests.
- `pnpm --filter @duedatehq/server test` - passed, 76 tests.
- `pnpm check` - passed with one pre-existing UI placement warning.
- `pnpm test` - passed across the workspace.
