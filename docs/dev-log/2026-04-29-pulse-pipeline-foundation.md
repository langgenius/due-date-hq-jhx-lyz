---
title: 'Pulse Pipeline Foundation'
date: 2026-04-29
---

# Pulse Pipeline Foundation

## Context

The previous Pulse slices closed the approved-sample demo loop: a seeded
approved alert could match firm obligations, be reviewed in the app, applied,
dismissed, and reverted with audit/evidence/email-outbox writes. The remaining
gap was the real pipeline around that loop: ingest snapshots, AI extraction,
ops approval/matching, lifecycle history, snooze, notification dispatch, and
browser-level QA.

## Change

- Added `packages/ingest` with the first Phase 0 adapter contract
  (`SourceAdapter`, `RawSnapshot`, `ParsedItem`), shared HTTP/hash/selector
  helpers, fixture runner, and initial adapters for `irs.disaster`,
  `tx.cpa.rss`, and a seeded `ny.dtf.press` fixture path.
- Added `pulse_source_snapshot` to the DB schema and migration
  `0009_daily_norrin_radd.sql`. Snapshots track `sourceId`, `externalId`,
  `contentHash`, R2 key, parse status, and linked `pulse` / `ai_output` IDs.
- Added a non-tenant Pulse ops repo for snapshot creation, extract result
  persistence, approve/reject/quarantine, and deterministic firm-alert
  generation after approval. Matching still remains deterministic DB logic; AI
  only extracts the source announcement.
- Added `pulse-extract@v1`, `PulseExtractOutputSchema`, `extractPulse(...)`,
  and a glass-box guard that rejects extracted `sourceExcerpt` values that
  cannot be located in the raw source text.
- Wired Worker jobs:
  - `scheduled()` runs Pulse ingest and queues an email flush.
  - `PULSE_QUEUE` handles `pulse.extract` messages.
  - `EMAIL_QUEUE` handles `email.flush` messages.
  - Email flushing sends pending Pulse digests through Resend with `outbox_id`
    tags and records `sent` / `failed`.
  - Resend webhooks now verify Svix signatures and update tagged outbox rows
    for delivered / failed / bounced / complained / suppressed events.
- Extended user-facing Pulse lifecycle:
  - `listAlerts` remains the active feed.
  - `listHistory` powers `/alerts`.
  - `snooze(alertId, until)` is available in contracts, server procedures,
    repo, audit actions, and drawer UI.
- Replaced the demo seed stub with an idempotent D1 seed that creates a Sarah
  Demo CPA firm, clients/obligations, one matched Pulse alert, and one applied
  revertable Pulse alert.
- Added Pulse E2E coverage for Dashboard banner → drawer → apply → Workboard
  date change → audit/evidence visibility → undo, plus Coordinator read-only
  RBAC.

## Notes

- The user-facing apply path intentionally still updates
  `obligation_instance.current_due_date` directly. The Overlay Engine migration
  remains a separate Phase 1 cutover.
- The source catalog still has more adapters to add after Phase 0
  (`CA` / `FEMA` and broader state coverage). This slice establishes the
  ingestion contract and queue plumbing rather than full source coverage.
- `DESIGN.md` did not require changes: the frontend addition follows the
  existing Pulse hairline/drawer patterns and adds only the expected Snooze
  action.
- `0009_daily_norrin_radd.sql` is idempotent so local D1 databases that already
  created `pulse_source_snapshot` under an older generated migration name can
  still repair Wrangler's migration ledger.

## Validation

- `pnpm check` — passed.
- `pnpm --filter @duedatehq/contracts test` — passed, 16 tests.
- `pnpm --filter @duedatehq/ai test` — passed, 9 tests.
- `pnpm --filter @duedatehq/ingest test` — passed, 4 tests.
- `pnpm --filter @duedatehq/db test` — passed, 44 tests.
- `pnpm --filter @duedatehq/server test` — passed, 82 tests.
- `pnpm --filter @duedatehq/app test` — passed, 71 tests.
- `pnpm check:deps` — passed.
- `pnpm --filter @duedatehq/app i18n:extract` — passed, 0 missing zh-CN.
- `pnpm --filter @duedatehq/app i18n:compile` — passed.
- `pnpm test:e2e e2e/tests/pulse.spec.ts` — passed, 2 tests.
- `pnpm ready` — passed.
- `pnpm --filter @duedatehq/server build` — passed outside the sandbox to avoid
  Wrangler's `~/.wrangler` log-write restriction.
