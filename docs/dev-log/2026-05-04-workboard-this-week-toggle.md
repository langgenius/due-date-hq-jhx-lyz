---
title: 'Workboard this week filter toggle'
date: 2026-05-04
area: workboard
---

## Context

The Workboard toolbar quick filter `This week` applied the seven-day upper-bound days filter, but
clicking it again wrote the same URL state instead of clearing the filter. That made the chip behave
unlike the neighboring quick filters.

## Changes

- Added a small helper for `This week` active-state detection and URL patch generation.
- Changed the quick filter click handler so an active `This week` chip clears `daysMax` instead of
  reapplying `7`.
- Added focused unit coverage for applying, clearing, and active-state detection.

## Design alignment

- No DESIGN.md or stable product-doc update was needed. The visible UI, copy, tokens, and layout are
  unchanged; this only fixes the existing chip's toggle behavior.

## Validation

- `pnpm --filter @duedatehq/app test -- src/routes/workboard.test.ts`
- `pnpm exec vp check apps/app/src/routes/workboard.tsx apps/app/src/routes/workboard.test.ts docs/dev-log/2026-05-04-workboard-this-week-toggle.md`
