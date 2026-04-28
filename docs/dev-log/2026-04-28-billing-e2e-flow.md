# 2026-04-28 · Billing E2E Flow Coverage

## Context

The pricing + Stripe integration needed browser-level coverage, but the default PR gate should not
depend on Stripe-hosted Checkout DOM or live third-party network behavior.

## Decisions

- Playwright now starts two local surfaces for default e2e: the app Worker at `127.0.0.1:8787` and
  Astro marketing preview at `127.0.0.1:4321`.
- Marketing is built with `PUBLIC_APP_URL` pointing to the app e2e Worker, so `/pricing` CTA tests
  exercise the same absolute deep link shape used in production without leaving the local loop.
- The app Worker gets fake Stripe env vars in local e2e. This enables Better Auth Stripe
  subscription-list routes, but tests still intercept Checkout and Billing Portal session creation
  before any outbound Stripe API call.
- `/api/e2e/billing/subscription` is development-only and writes the same post-webhook facts the app
  consumes: Better Auth `subscription`, `organization.stripe_customer_id`, and
  `firm_profile.plan / seat_limit / billing_*`.
- Billing tests assert URL/query state, owner-only affordances, Better Auth payloads, and
  webhook-backed app state. They intentionally avoid CSS, layout, and Stripe page copy assertions.

## Coverage

- Pricing Firm CTA preserves `plan=firm&interval=monthly` through the login redirect.
- Chinese pricing CTA carries `lng=zh-CN`; the app consumes locale before redirecting and keeps
  billing query state clean.
- Checkout sends organization-scoped upgrade payloads and includes `subscriptionId` when changing an
  existing subscription.
- Coordinator sessions see owner-only checkout gating and cannot trigger a checkout request.
- Success remains pending without subscription state, then shows activation after the webhook facts
  exist.
- Settings Billing reads the cached plan/seat state and opens Billing Portal with the expected
  organization reference payload.
- Cancel keeps the selected plan available through the restart checkout link.

## Follow-ups

- Add a separate `@stripe-live` suite only when CI has isolated Stripe test credentials and webhook
  forwarding. It should assert DueDateHQ state after payment, not Stripe-hosted DOM.
