# Billing Hide Enterprise Card

## Context

Enterprise remains part of the plan model, entitlement logic, and current-plan status copy, but
the Billing page should not present it as a visible membership card until the future enterprise
workflow is ready.

## Changes

- Filtered Billing page plan cards to Solo, Pro, and Team.
- Changed the plan card grid from four wide columns to three wide columns.
- Left the Enterprise plan id, pricing model, and current-plan label intact for future use.

## Validation

- `pnpm exec vp check apps/app/src/routes/billing.tsx docs/dev-log/2026-05-05-billing-hide-enterprise-card.md`
- `git diff --check -- apps/app/src/routes/billing.tsx docs/dev-log/2026-05-05-billing-hide-enterprise-card.md`
