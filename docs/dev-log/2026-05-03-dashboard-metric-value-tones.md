---
title: 'Dashboard Metric Value Tones'
date: 2026-05-03
author: 'Codex'
---

# Dashboard Metric Value Tones

## Context

The Dashboard metric strip rendered every large numeric value with `text-text-primary`, which made
`Due this week` and `Evidence gaps` read like neutral counters instead of operational risk signals.

## Change

- `Due this week` now uses the existing critical-severity tone for its number.
- `Evidence gaps` now uses the existing medium-severity tone for its number.
- Neutral metrics keep the original primary text tone.

## Docs Check

No DESIGN.md or stable architecture update was needed. This reuses existing severity tokens and does
not introduce a new component, token, or product state.

## Validation

- `pnpm exec vp check apps/app/src/routes/dashboard.tsx docs/dev-log/2026-05-03-dashboard-metric-value-tones.md`
- `git diff --check -- apps/app/src/routes/dashboard.tsx docs/dev-log/2026-05-03-dashboard-metric-value-tones.md`
