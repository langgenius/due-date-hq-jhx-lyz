---
title: 'Dashboard Brief Queued Tone'
date: 2026-05-03
author: 'Codex'
---

# Dashboard Brief Queued Tone

## Context

The Dashboard AI weekly brief showed the queued/preparing state with an info-blue badge and an
accent-blue inline dot. Product direction is for queued to read as a waiting state, so both visual
markers should use the warning/yellow tone.

## Change

- Updated the `Queued` badge in `DashboardBriefPanel` from `info` to `warning`.
- Updated the inline preparing-state dot from `bg-state-accent-solid` to the existing warning badge
  status token.

## Docs Check

No DESIGN.md or stable architecture update was needed. The change reuses the existing warning badge
and warning status-dot tokens without adding a new visual primitive or product state.

## Validation

- `git diff --check -- apps/app/src/routes/dashboard.tsx`
- `pnpm exec vp check apps/app/src/routes/dashboard.tsx docs/dev-log/2026-05-03-dashboard-brief-queued-tone.md`
