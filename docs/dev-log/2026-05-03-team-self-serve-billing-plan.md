# 2026-05-03 · Team Self-Serve Billing Plan

## Context

Pricing was updated from a two-plan self-serve model plus sales-assisted Enterprise to a complete
four-plan model:

- Solo: $39/mo, 1 seat, 1 active practice.
- Pro: $79/mo, 3 seats, 1 active practice.
- Team: $149/mo, 10 seats, 1 active practice.
- Enterprise: from $399/mo / custom, 10+ seats and multiple practices by contract.

The stored `firm` plan value remains the Enterprise tier. `team` is now a real stored plan value,
not just a display card.

## Implementation Notes

- Contract, DB, ports, auth, app billing model, and e2e seed types now accept
  `solo | pro | team | firm`.
- Better Auth Stripe plan registration keeps Pro as the minimum required checkout config and only
  registers Solo / Team checkout when their price ids are present.
- The app reads a boolean billing checkout config from the Worker, so Solo / Pro / Team CTAs can
  stay disabled with a missing-price message instead of failing only after the user clicks.
- Billing sync writes `team` with a 10-seat limit. Organization creation entitlement still allows
  multiple active practices only when an owned active practice has `plan = 'firm'`.
- App Billing and Checkout now expose Solo, Pro, and Team as self-serve choices; Enterprise remains
  sales-assisted.
- Marketing pricing now renders four public tiers and deep-links Solo / Pro / Team CTAs to their
  matching app checkout routes.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- Targeted Vitest: app billing model, auth, contracts, db firm schema, server billing/env/firm
  entitlement hooks.
- `pnpm test:e2e e2e/tests/pricing-billing-flow.spec.ts e2e/tests/billing-checkout.spec.ts e2e/tests/practice-switch.spec.ts e2e/tests/workload.spec.ts`
- `pnpm check`
- `pnpm check:deps`
