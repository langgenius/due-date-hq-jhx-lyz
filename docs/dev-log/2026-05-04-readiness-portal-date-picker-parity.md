---
title: 'Readiness portal date picker parity'
date: 2026-05-04
area: readiness
---

## Context

The public readiness portal still used a native `input[type="date"]` for checklist ETA responses,
while the Workboard obligation detail Extension tab used the custom popover calendar built to avoid
browser-locale placeholder drift.

## Changes

- Extracted the Workboard Extension tab date picker into a shared `IsoDatePicker` app primitive.
- Reused the same picker in the public readiness portal for checklist ETA dates.
- Kept all stored and submitted date values in `YYYY-MM-DD`.
- Reused the shared ISO date validator for the Extension tab save guard.

## Design alignment

- No DESIGN.md or token changes were needed.
- The readiness portal now uses the same input visual language and calendar affordance as the
  obligation detail Extension tab.

## Validation

- `pnpm exec vp check apps/app/src/components/primitives/iso-date-picker.tsx apps/app/src/routes/readiness.tsx apps/app/src/routes/workboard.tsx`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
