---
title: 'Pulse Pilot Hardening'
date: 2026-04-30
---

# Pulse Pilot Hardening

## Context

Pulse had the user-visible loop in place, but pilot readiness still needed cleaner notification
semantics, audit action separation, T2 source gating, and a small ops workflow before the Overlay
Engine migration.

## Change

- Split Pulse digest payload semantics with `event='pulse_approved'` and `event='pulse_applied'`
  while keeping the existing `email_outbox.type='pulse_digest'` transport.
- Queue approved digests for firm Owners and Managers during ops approval, before any CPA applies
  due-date changes.
- Added `pulse.dismiss` and `pulse.quarantine` audit actions so firm dismissal no longer reuses the
  global reject semantic.
- Added `pulse_source_signal` for FEMA/T2 anticipated signals; `SourceAdapter.canCreatePulse=false`
  now prevents customer-visible Pulse creation and queue extraction.
- Expanded live adapters to IRS newsroom/guidance, CA CDTFA, real NY DTF, FL DOR, and WA DOR sources;
  retained the NY fixture for ingest tests only.
- Added per-host polite fetch throttling, cached robots checks, selector drift classification, and
  source attention states in Dashboard banner and `/alerts`.
- Added needs-review confirmation in the Pulse drawer so missing-county rows can be applied only
  after explicit CPA confirmation.
- Added local `/alerts` status/source filters, source excerpt copy affordance, an ops CLI, and a Pulse
  ingest stuck runbook.

## Notes

- Superseded later on 2026-04-30 by the Overlay cutover in
  `2026-04-30-pulse-overlay-ops-hardening.md`: Pulse apply now writes
  `exception_rule` + `obligation_exception_application` and keeps `pulse_application` as the
  compatibility audit/revert index.

## Validation

- `pnpm --filter @duedatehq/app test -- pulse`
- `pnpm --filter @duedatehq/server test -- pulse ingest ops queue outbox`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test -- pulse`
