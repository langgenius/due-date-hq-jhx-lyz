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

## Docs Check

- `DESIGN.md` / broader architecture docs remain aligned: the banner is still a status strip, but
  its data now refreshes as expected.

## Validation

- `pnpm exec vp check apps/app/src/features/pulse/api.ts apps/app/src/features/pulse/PulseAlertsBanner.tsx docs/dev-log/2026-05-04-pulse-source-health-refresh.md`
