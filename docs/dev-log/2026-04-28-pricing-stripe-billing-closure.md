# 2026-04-28 · Pricing + Stripe Billing Closure

## Context

Pricing now has a full test-mode payment loop:

`apps/marketing /pricing` → `apps/app /billing/checkout` → Stripe Checkout →
`/billing/success` → `/settings/billing`.

## Decisions

- Public pricing stays in Astro. It is static, SEO-friendly, and only emits deep links into the SaaS app.
- Checkout is a protected route, not a URL-state dialog. This keeps auth redirects, onboarding, Stripe
  success/cancel redirects, page refreshes, and E2E deterministic.
- Better Auth Stripe plugin owns Stripe webhook handling and the `subscription` table. `firm_profile`
  keeps only the app-facing cache: `plan`, `seat_limit`, `billing_customer_id`, and
  `billing_subscription_id`.
- Billing is organization-scoped. The reference id is the active `firm_profile.id == organization.id`;
  only active owner members may list, upgrade, cancel, restore, or open the billing portal.
- Checkout passes the current Stripe subscription id when an active/trialing/past_due/paused
  subscription exists. Better Auth Stripe warns that plan changes without `subscriptionId` can create
  parallel subscriptions for the same reference id.
- Staging deploy now requires the Stripe test-mode runtime contract in GitHub environment
  `due-date-hq-staging`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
  `STRIPE_PRICE_PRO_MONTHLY`. After Team became a self-serve tier, staging also requires
  `STRIPE_PRICE_TEAM_MONTHLY`; optional yearly/firm price ids are passed through when present.
- E2E covers the payment loop without depending on Stripe-hosted DOM: Playwright asserts pricing
  deep links, auth redirect preservation, checkout payloads, owner-only gating, cancel recovery,
  Billing Portal payloads, and webhook-backed success/settings state. The post-webhook state is seeded
  through development-only `/api/e2e/billing/subscription`.

## Follow-ups

- Add production Stripe price ids and webhook endpoint secrets per environment.
- Decide the downgrade/cancel product policy before exposing self-serve cancellation copy.
- Add Stripe Tax / invoice profile / coupon support only after the test-mode checkout loop is stable.
- Add an explicit `@stripe-live` suite only after CI has isolated Stripe test credentials and webhook
  forwarding; keep it out of the default PR gate.
