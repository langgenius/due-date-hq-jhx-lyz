# 2026-05-03 · Annual Billing Plans

## Context

Billing already had `monthly | yearly` URL state, checkout copy, and Stripe yearly price id
configuration, but the Marketing pricing page and in-app Billing plan cards still presented only
monthly choices.

## Implementation Notes

- Added shared annual price math for Solo, Pro, Team, and sales-assisted Enterprise:
  Solo $31/mo billed yearly, Pro $63/mo billed yearly, Team $119/mo billed yearly, and
  Enterprise from $319/mo equivalent on an annual contract.
- Marketing pricing now has a Monthly/Yearly toggle. Monthly remains the default; Yearly swaps
  card prices, savings copy, and Solo/Pro/Team checkout links to `interval=yearly`.
- App Billing now mirrors the same Monthly/Yearly toggle and savings copy. Owners can switch the
  same self-serve plan between monthly and yearly when the active subscription interval differs.
- Checkout "already active" detection now compares both plan and billing interval, so same-plan
  annual conversion is not blocked as the current plan.
- `apps/server/.dev.vars.example` now documents the yearly Stripe recurring price amounts expected
  by `STRIPE_PRICE_*_YEARLY`.
- Product billing docs were updated. DESIGN.md needed no change because the existing Billing
  workbench width and pricing-card layout conventions still apply.

## Validation

- Added unit coverage for checkout URL interval serialization, annual price math, provider interval
  mapping, and yearly Stripe checkout configuration.
- Added e2e coverage for Marketing yearly handoff and missing yearly Stripe price gating.
