# 2026-04-28 · Seven-commit review hardening

## Scope

Reviewed the last seven commits from `1dc5170^..4776bd5`, covering firm CRUD/switching,
clients management, audit log management, and Stripe billing checkout.

## Findings Fixed

- Billing checkout could be started before the subscription query had settled, so an existing
  subscription could be upgraded without passing `subscriptionId`.
- Billing success could report cache agreement when Stripe subscription data matched but
  `firm_profile.plan` was still stale.
- Billing/profile routes collapsed query failures into empty states, hiding auth/network/server
  errors from operators.
- Better Auth Stripe deletion callbacks left `firm_profile.billing_subscription_id` populated after
  reverting the firm to `solo`.
- Stripe `authorizeReference` treated read and management actions the same; active members may now
  read subscription state, while subscription management stays owner-only.
- Client form and audit summary fallback strings were hard-coded English and bypassed Lingui.

## Architecture Notes

- Firm lifecycle writes still span Better Auth organization/member/session, `firm_profile`, and
  audit rows without a transaction or compensation service. D1 transaction orchestration should be
  centralized before adding richer member/RBAC workflows.
- Billing policy remains split between `packages/auth` and app display code. Plan seat limits,
  active statuses, and CTA availability should move into a shared billing policy module.
- `apps/app/src/routes/clients.tsx` is large enough to split into form model, filters, table, and
  detail panel modules once the current UI surface stabilizes.
- The slug collision retry was reviewed and left unchanged: `slugifyPracticeName()` generates a
  fresh random suffix on every call, so the retry path does change the slug.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/server test`
- `pnpm exec vp check <changed files>`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/server build`

Repository-wide `pnpm check` was not clean because unrelated in-progress member/e2e files already
had formatting issues in the shared worktree; this change only formatted the files it owns.
