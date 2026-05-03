# 2026-05-03 · Plan AI tier entitlements

## Context

The four-plan billing model needed clearer differentiation than seat and practice counts alone.
The product decision is that Pro and Team should not differ by AI quality: Team exists for larger
single-practice operations, not to force small teams into a higher AI tier.

## Implementation Notes

- Added `@duedatehq/core/plan-entitlements` as the shared source for plan seat limits, active
  practice limits, AI tier, fair-use budgets, and feature gates.
- Mapped AI tiers as Solo `basic`, Pro `practice`, Team `practice`, and Enterprise `enterprise`.
  Team receives higher aggregate fair-use protection but not a stronger model tier.
- Routed AI prompt execution through plan-aware model selection with
  `AI_GATEWAY_MODEL_BASIC`, `AI_GATEWAY_MODEL_PRACTICE`, and
  `AI_GATEWAY_MODEL_ENTERPRISE`, all falling back to the existing `AI_GATEWAY_MODEL`.
- Passed plan routing into dashboard brief, AI insights, readiness, migration mapper/normalizers,
  and tenant-scoped AI paths. Pulse source extraction is global and source-scoped, so it explicitly
  routes as `pulse` and defaults to the practice AI tier when no firm tenant exists.
- Added server gates for Team/Enterprise-only audit exports and manager workload insights while
  keeping shared deadline operations available to Pro and above.
- Updated Billing and Marketing pricing cards so each tier explicitly names its AI capability:
  Solo Basic AI, Pro Practice AI, Team the same Practice AI as Pro, and Enterprise custom AI by
  contract.
- Updated billing, AI architecture, project module, and Team Workload docs to keep product and
  implementation language aligned.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/core test -- src/plan-entitlements/index.test.ts`
- `pnpm --filter @duedatehq/ai test -- src/ai.test.ts`
- `pnpm --filter @duedatehq/contracts test -- src/contracts.test.ts`
- `pnpm --filter @duedatehq/auth test -- src/auth.test.ts`
- `pnpm --filter @duedatehq/server test -- src/env.test.ts src/procedures/firms/index.test.ts src/organization-hooks.test.ts src/procedures/migration/_service.test.ts src/procedures/audit/index.test.ts`
- `pnpm --filter @duedatehq/server test -- src/jobs/pulse/ingest.test.ts src/jobs/queue.test.ts`
- `pnpm --filter @duedatehq/app test -- src/features/billing/model.test.ts`
- `pnpm check:deps`
- `pnpm check`
- `pnpm test`
- `pnpm build`
- `E2E_BASE_URL=http://127.0.0.1:8787 E2E_MARKETING_BASE_URL=http://127.0.0.1:4322 pnpm test:e2e e2e/tests/pricing-billing-flow.spec.ts`

## Notes

`pnpm build` returned success. The Worker dry-run printed a local Wrangler log-file EPERM message
inside the sandbox, then continued to complete the dry-run and showed the AI model tier bindings.

The focused pricing E2E passed against a temporary Marketing preview on port `4322` built with
`PUBLIC_APP_URL=http://127.0.0.1:8787`. The local Billing/Workload E2E run reused the user's
existing dev services to avoid killing them; Workload and owner/config coverage passed, but the
three checkout payload tests stayed blocked because the reused Worker did not expose the fake
Stripe checkout price configuration that Playwright's own webServer command normally injects.
