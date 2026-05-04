---
title: 'Pulse Source Health Refresh'
date: 2026-05-04
author: 'Codex'
---

# Pulse Source Health Refresh

## Context

Dashboard Pulse banner could keep showing `Source needs attention` after a source recovered because
the refresh action only refetched active Pulse alerts. The source-health query also had no polling,
so `pulse_source_state` changes were invisible until a full page reload.

## Change

- Made `pulse.listSourceHealth` poll every 60 seconds, matching the active-alert banner query.
- Updated the Dashboard Pulse refresh action to refetch both active alerts and source health.
- Added an Owner/Manager-gated `pulse.retrySourceHealth` mutation so the Dashboard warning action can
  force-rerun the affected source adapter and let ingest write the recovered or still-degraded state
  without waiting for `nextCheckAt`.
- Returned source `lastError` through the health contract and surfaced retry results with toast
  feedback: recovered, checked-but-still-attention, or checked.
- Updated `tx.cpa.rss` to discover the English GovDelivery feed from the Texas Comptroller's
  official RSS directory page, then parse GovDelivery RSS items / bulletin links instead of treating
  the directory HTML as RSS.
- Normalized legacy GovDelivery subscriber links such as
  `/accounts/TXCOMPT/subscriber/new?topic_id=...` into `/topics/.../feed.rss` before fetching, so a
  Pulse banner retry no longer hits the robots-blocked subscription form.
- Tightened Pulse parsing so source indexes, newsroom landing pages, RSS directories, and FEMA
  dataset pages are acquisition channels only. Parsed Pulse items now need a detail URL; if a
  changed source produces no detail item, ingest records selector drift instead of writing the
  index page as evidence. FEMA declarations now link to `/disaster/{number}` detail pages.
- Surfaced source `lastError` inline in the Dashboard Pulse warning strip so `Source needs attention`
  explains why the source still needs attention after refresh.
- Shortened the no-alert source health warning copy from a full source-list sentence to a
  count-based status, and capped shared Pulse source labels so broad degraded runs render as
  `CA FTB + TX + ... + N more` instead of overflowing with every source id.
- Kept Pulse banner polling active in background tabs and ordered active banner alerts by firm-alert
  update time first, so newly generated or reactivated Pulse alerts are surfaced even when their
  official publication date is older than an existing open alert.
- Added a banner-level `Hide` action for source health issues. This only hides the current
  `(source, status, lastError)` locally on the Dashboard so a known source drift, such as a
  robots.txt block, does not permanently occupy the banner while real Pulse alerts can still
  surface. The action is visible only to Owner/Manager roles. The source incident remains unresolved
  until ops fixes, disables, or replaces the source.
- Replaced the normal Pulse banner source list with a concise all-clear summary so broad source
  coverage no longer renders noisy strings like `IRS + CA FTB + ... + 55 more`.

## Docs Check

- `DESIGN.md` / broader architecture docs remain aligned: the banner is still a status strip, but
  its data now refreshes as expected.

## Validation

- `pnpm exec vp check --fix apps/app/src/features/pulse/api.ts apps/app/src/features/pulse/PulseAlertsBanner.tsx apps/app/src/features/pulse/__dev__/mock-pulse.ts apps/server/src/jobs/pulse/ingest.ts apps/server/src/procedures/pulse/index.ts apps/server/src/procedures/index.ts packages/contracts/src/pulse.ts packages/contracts/src/contracts.test.ts docs/dev-log/2026-05-04-pulse-source-health-refresh.md`
- `pnpm --filter @duedatehq/contracts test -- contracts.test.ts`
- `pnpm --filter @duedatehq/server test -- ingest.test.ts`
- `pnpm --filter @duedatehq/ingest test`
- `pnpm exec vp check --fix apps/app/src/features/pulse/PulseAlertsBanner.tsx packages/ingest/src/adapters/index.ts packages/ingest/src/ingest.test.ts`
- `pnpm exec vp check --fix packages/ingest/src/adapters/index.ts packages/ingest/src/ingest.test.ts`
- `pnpm --filter @duedatehq/app test -- src/features/pulse/lib/source-health-labels.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec vp check --fix apps/app/src/features/pulse/PulseAlertsBanner.tsx`
