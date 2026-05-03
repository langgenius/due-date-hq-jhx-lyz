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

- Replaced the bow marker with a simple red diagonal ribbon in the top-right corner.
- Reused the existing `current` translation key.
- Kept the active plan card's existing success border and background state.

## Docs Check

No DESIGN.md or product documentation update was needed. This is a visual polish change to the
existing Billing plan option state.

## Validation

- `pnpm exec vp check apps/app/src/routes/billing.tsx docs/dev-log/2026-05-03-billing-current-plan-ribbon.md`
- `pnpm exec vp fmt --check apps/app/src/routes/billing.tsx docs/dev-log/2026-05-03-billing-current-plan-ribbon.md`
- `git diff --check -- apps/app/src/routes/billing.tsx docs/dev-log/2026-05-03-billing-current-plan-ribbon.md`
