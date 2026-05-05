---
title: 'Pulse Production P0'
date: 2026-04-29
---

# Pulse Production P0

## Context

The previous Pulse work closed the demo-visible alert/apply/revert loop, but the
production path still had gaps around real source health, item-level extract
snapshots, practice review, and email delivery.

## Change

- Added `pulse_source_state` and source-health reads so Dashboard/Alerts watcher
  copy reflects the configured live sources instead of a hard-coded state list;
  the NY DTF fixture remains ingest-test-only and is hidden from customer health.
- Expanded Phase 0 ingest adapters to include CA FTB Newsroom, CA FTB Tax News,
  and FEMA declarations alongside IRS Disaster Relief, TX Comptroller RSS, and
  the NY DTF fixture.
- Changed ingest to archive each parsed item `rawText` as its own R2 snapshot,
  de-dupe by item content hash, respect source cadence/next-check state, use
  conditional request headers, and record source success/failure health.
- Made Pulse extract idempotent, persisted global `pulse_extract` AI trace rows,
  and linked `pulse_source_snapshot.ai_output_id` on success or guarded failure.
- Added token-protected `/api/ops/pulse/*` endpoints for pending review,
  detail/raw snapshot inspection, approve, reject, and quarantine.
- Added Pulse digest recipients for active firm Owners and Managers, plus a
  Resend happy-path test for the outbox worker.
- Hardened county matching by normalizing `County` / `Parish` suffixes and case.
- Added advisory KV locks around apply/revert and triggered Dashboard Brief
  refresh after snooze.

## Notes

- Phase 0 still directly updates `obligation_instance.current_due_date`; the
  ExceptionRule Overlay migration remains Phase 1 as documented in PRD §6D.2.
- The ops endpoints are intentionally not part of the public oRPC contract.
  They require `PULSE_OPS_TOKEN` and are meant for internal scripts until a
  dedicated ops UI exists.
- `DESIGN.md` remains aligned: UI changes are copy/data-truth changes within
  the existing Pulse strip and drawer patterns.

## Validation

- `pnpm --filter @duedatehq/ingest test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test -- pulse`
- `pnpm --filter @duedatehq/server test -- outbox queue resend`
- `pnpm --filter @duedatehq/app test -- pulse`
- `pnpm check`
- `pnpm check:deps`
- `pnpm ready`
- `pnpm test:e2e e2e/tests/pulse.spec.ts`
