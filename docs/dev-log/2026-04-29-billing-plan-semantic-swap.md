# Billing Plan Semantic Swap

Date: 2026-04-29
Owner: Codex

> Product follow-up (2026-05-02): plan-id semantics still stand (`pro` self-serve, `firm` custom),
> and active firm count is now an explicit pricing entitlement. Solo / Pro include 1 active firm;
> Firm plan supports multiple active firms/offices by contract. See
> `docs/product-design/billing/01-practice-entitlement-pricing.md`.

## Context

The original billing model made `firm` the $99 / 5-seat self-serve plan and `pro`
the larger custom plan. That created an awkward long-term split: "firm" is also
the tenant noun across the product, so code and UI had to distinguish active
firm, Firm profile, and Firm plan.

There are no production subscriptions, and the local/staging database can be
rebuilt. That makes this the right point to swap the billing semantics at the
plan-id layer instead of adding a display-name mapping.

## Changes

- `pro` is now the self-serve paid tier: $99/mo, $79/mo billed yearly, 5 seats,
  recommended, 14-day trial, and the only public checkout deep link.
- `firm` is now the sales-assisted custom tier: 10+ seats, annual agreement,
  audit exports, coverage expansion, and priority onboarding.
- Better Auth Stripe configuration now requires `STRIPE_PRICE_PRO_MONTHLY` for
  billing enablement; `STRIPE_PRICE_FIRM_*` remains optional for sales-assisted
  subscriptions.
- Marketing `/pricing`, app `/billing`, checkout, success/cancel flow, sidebar
  plan status, Members, Team workload, and E2E fixtures now use the same plan
  semantics.
- CI deployment secret checks and Playwright/Wrangler E2E env injection require
  `STRIPE_PRICE_PRO_MONTHLY`. Current staging additionally requires `STRIPE_PRICE_TEAM_MONTHLY`
  because Team is now exposed as a self-serve monthly checkout option; Firm price ids remain
  optional.
- Current docs were updated so pricing and deployment guidance point to
  `/billing/checkout?plan=pro&interval=monthly`.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile --strict`
- `pnpm exec vp check --fix packages/auth/src/index.ts apps/app/src/routes/billing.tsx apps/app/src/routes/billing.checkout.tsx`
- `pnpm exec vp check packages/auth/src/index.ts apps/server/src/env.test.ts apps/server/src/routes/e2e.ts apps/app/src/features/billing/model.ts apps/app/src/routes/billing.tsx apps/app/src/routes/billing.checkout.tsx apps/app/src/features/workload/workload-page.tsx apps/app/src/components/patterns/app-shell-nav.tsx apps/app/src/features/members/members-page.tsx e2e/pages/workload-page.ts e2e/pages/billing-page.ts e2e/fixtures/billing.ts e2e/tests/billing-checkout.spec.ts e2e/tests/billing-success.spec.ts e2e/tests/pricing-billing-flow.spec.ts e2e/tests/workload.spec.ts e2e/tests/members.spec.ts`
- `pnpm --filter @duedatehq/marketing build`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/server test`
- `pnpm test`
- `git diff --check`
- `pnpm exec vp check .github/workflows/ci.yml .github/workflows/e2e.yml playwright.config.ts`
- `pnpm test:e2e --project=chromium`
