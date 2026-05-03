---
title: 'Billing plan tooltip copy'
date: 2026-05-03
---

# 2026-05-03 · Billing plan tooltip copy

## Context

Billing plan cards clamp AI capability copy inside a fixed-height comparison block. On narrower
cards, the visible text can end in an ellipsis, leaving sighted users without a way to inspect the
full message on hover.

## Changes

- Wrapped the clamped AI label, AI description, and AI feature chip copy in the existing UI
  `Tooltip` primitive so the complete text appears on hover.
- Kept the pricing content and entitlement semantics unchanged; `DESIGN.md` and
  `docs/product-design/billing/01-practice-entitlement-pricing.md` remain aligned with the
  implementation.

## Validation

- `pnpm exec vp check apps/app/src/routes/billing.tsx`
