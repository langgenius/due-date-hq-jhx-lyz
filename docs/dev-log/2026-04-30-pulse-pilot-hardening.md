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
- Added confidence-tone fixture coverage for `/alerts`: dev mock and local e2e Pulse seed now include
  one high-confidence, one medium-confidence, and one low-confidence alert so the `AI XX%` badge
  success / info / warning states can be inspected side by side.
- Added the same confidence-tone coverage to the live-demo `mock/demo.sql` seed, so presenters can
  inspect the three badge colors from the normal demo database without `?mockPulse=1`.
- Added a fourth, sub-50% Pulse fixture across live-demo, dev mock, and e2e seed data to make
  very-low-confidence alert copy and `AI 46%` rendering visible in `/alerts`.
- Changed the Pulse confidence badge urgency mapping so any alert below 70% confidence renders with
  the red destructive badge treatment instead of warning yellow.
- Promoted sub-50% Pulse confidence into a more visible `/alerts` treatment: the full alert row now
  uses the red attention tone, shows an explicit low-confidence review prompt, and repeats that
  warning in the detail drawer before structured fields.
- Changed the `/alerts` card status dot for alerts with no matching clients from neutral blue to
  success green, keeping yellow for affected-client alerts and red for sub-50% confidence alerts.
- Seeded `/ops/pulse` live-demo fixtures for approve, reject, quarantine, open-signal link/dismiss,
  source enable/disable/revoke, and failed-snapshot retry walkthroughs.

## Notes

- Superseded later on 2026-04-30 by the Overlay cutover in
  `2026-04-30-pulse-overlay-ops-hardening.md`: Pulse apply now writes
  `exception_rule` + `obligation_exception_application` and keeps `pulse_application` as the
  compatibility audit/revert index.

## Validation

- `pnpm exec vp check apps/app/src/features/pulse/__dev__/mock-pulse.ts apps/server/src/routes/e2e.ts docs/dev-log/2026-04-30-pulse-pilot-hardening.md`
- `pnpm exec vp check mock/demo.sql mock/README.md apps/app/src/features/pulse/__dev__/mock-pulse.ts apps/server/src/routes/e2e.ts docs/dev-log/2026-04-30-pulse-pilot-hardening.md`
- `pnpm exec vp check apps/app/src/features/pulse/components/PulseConfidenceBadge.tsx docs/dev-log/2026-04-30-pulse-pilot-hardening.md`
- `pnpm exec vp check apps/app/src/features/pulse/components/PulseConfidenceBadge.tsx apps/app/src/features/pulse/components/PulseAlertCard.tsx apps/app/src/features/pulse/PulseDetailDrawer.tsx docs/dev-log/2026-04-30-pulse-pilot-hardening.md`
- `pnpm exec vp check apps/app/src/features/pulse/components/PulseAlertCard.tsx docs/dev-log/2026-04-30-pulse-pilot-hardening.md`
- `pnpm exec vp check mock/demo.sql mock/README.md apps/server/src/routes/ops-pulse.ts docs/dev-log/2026-04-30-pulse-pilot-hardening.md`
- `pnpm --filter @duedatehq/app test -- pulse`
- `pnpm --filter @duedatehq/server test -- pulse ingest ops queue outbox`
- `pnpm --filter @duedatehq/server test -- pulse`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test -- pulse`
- `pnpm db:seed:demo`
- `pnpm --dir apps/server exec wrangler d1 execute DB --local --config wrangler.toml --command "select p.id, p.source, p.confidence, a.status, a.matched_count, a.needs_review_count from pulse p join pulse_firm_alert a on a.pulse_id = p.id where a.firm_id = 'mock_firm_brightline' order by p.confidence desc;"`
