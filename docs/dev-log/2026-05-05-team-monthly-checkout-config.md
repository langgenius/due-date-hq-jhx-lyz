# 2026-05-05 · Team monthly checkout config

## Context

Staging had Stripe checkout enabled for Pro monthly only. Team was exposed as a self-serve app
plan, but the Worker never received a Team monthly Stripe price id, so checkout config correctly
reported Team monthly as unavailable.

## Changes

- Added `STRIPE_PRICE_TEAM_MONTHLY` to the staging deploy environment and required Worker secrets.
- Added a fake `STRIPE_PRICE_TEAM_MONTHLY` to the CI E2E Worker `.dev.vars` so the existing Team
  checkout payload coverage can exercise the enabled monthly path.
- Left `STRIPE_PRICE_TEAM_YEARLY` optional/unset; yearly Team checkout should continue to show the
  missing-price state until an annual Stripe price is created and configured.

## Validation

- `pnpm --filter @duedatehq/auth test -- src/auth.test.ts`
- `pnpm --filter @duedatehq/server test -- src/env.test.ts`
- `pnpm check`
- `pnpm test:e2e e2e/tests/billing-checkout.spec.ts`
