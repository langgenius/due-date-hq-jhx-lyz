---
title: 'Billing Metric Content Width'
date: 2026-05-03
author: 'Codex'
area: billing
---

# Billing Metric Content Width

## Context

The Billing subscription overview metric row used fixed grid columns, so the metric cards were sized
by the grid instead of their label and value content. After the plan metric was removed from the row,
the remaining metrics also left grid-driven empty space.

## Change

- The Billing metric row now uses a wrapping `fit-content` flex container.
- Each `Metric` card keeps content-based width, can wrap with sibling metrics, and is capped by the
  parent width for long labels or values.

## Docs Check

No DESIGN.md or product documentation update was needed. This preserves the existing Billing page
width, card styling, and content model while only changing intra-row sizing behavior.

## Validation

- `pnpm exec vp check apps/app/src/routes/billing.tsx`
- `pnpm exec vp fmt --check apps/app/src/routes/billing.tsx`
- `pnpm check` currently fails on pre-existing formatting drift in
  `apps/app/src/features/workload/workload-page.tsx`.
