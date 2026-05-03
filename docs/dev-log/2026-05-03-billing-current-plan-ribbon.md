---
title: 'Billing Current Plan Ribbon'
date: 2026-05-03
author: 'Codex'
area: billing
---

# Billing Current Plan Ribbon

## Context

The Billing plan card for the active tier used a bow-like `current` marker. The shape added too
much visual noise for a plan card state.

## Change

- Replaced the bow marker with a simple diagonal `current` marker in the top-right corner.
- Recolored the active plan card from success green to the selected/current accent treatment.
- Recolored the marker from destructive red to a stronger accent surface with inverted text.
- Changed the plan seat indicator dot from destructive red to a neutral divider tone.
- Reused the existing `current` translation key.

## Docs Check

No DESIGN.md or product documentation update was needed. The Billing plan option now uses the
existing selected/current accent tokens instead of success/destructive colors, which keeps it
aligned with the documented semantic color rules.

## Validation

- `pnpm exec vp check apps/app/src/routes/billing.tsx docs/dev-log/2026-05-03-billing-current-plan-ribbon.md`
- `pnpm exec vp fmt --check apps/app/src/routes/billing.tsx docs/dev-log/2026-05-03-billing-current-plan-ribbon.md`
- `git diff --check -- apps/app/src/routes/billing.tsx docs/dev-log/2026-05-03-billing-current-plan-ribbon.md`
