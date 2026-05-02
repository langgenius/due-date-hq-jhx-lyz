# 2026-05-02 · Firm entitlement pricing closure

## Context

The sidebar firm switcher could create additional firms, while public pricing described Solo as a
single-owner workspace and Pro as a shared workspace. The implementation already closed tenant
isolation and per-firm seat limits, but active firm count was not yet a pricing dimension.

## Product Decision

`Firm` is now documented as the billable workspace boundary.

- Solo: 1 active firm, 1 owner seat.
- Pro: 1 active firm, 5 seats.
- Firm: multiple active firms/offices by sales-assisted contract, 10+ seats.

This keeps the public pricing story coherent and prevents free or self-serve paid accounts from
creating unlimited independent tenant workspaces.

## Documentation Changes

- Added `docs/product-design/billing/01-firm-entitlement-pricing.md` as the source product
  definition for firm/workspace limits.
- Updated Data Model docs to mark the current multi-firm implementation as a foundation with an
  outstanding entitlement gap.
- Updated Frontend Architecture and AppShell design docs so `Add firm`, Billing, and plan status
  have a consistent future product behavior.
- Updated Marketing Architecture so public and in-app pricing cards must include both firm limits
  and seat limits.

## Implementation Changes

- Added server-side entitlement enforcement before `firms.create`: users who already own a Solo or
  Pro active firm now receive `FIRM_LIMIT_EXCEEDED`; Firm-plan owners can create additional active
  firms.
- Injected the same DB-backed rule into Better Auth's `allowUserToCreateOrganization` option so
  native `/api/auth/organization/create` cannot bypass the product gate.
- Added `FirmsRepo.listOwnedActive` so the entitlement count is based on owned, active,
  non-deleted firm workspaces, not invited memberships.
- Converted sidebar `Add firm` into a create-or-upgrade gate: Solo/Pro users see quota usage and a
  Billing CTA; Firm-plan users keep the creation form.
- Added active firm quota to Billing summary cards and checkout plan facts.
- Updated public marketing pricing copy in English and Simplified Chinese so every plan card names
  both firm/workspace limits and seat limits.
- Added unit coverage for app entitlement helpers, server entitlement helper, db query shape, and
  stable error codes.
- Updated firm-switch E2E to verify Solo gate behavior and Firm-plan multi-firm creation.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test -- src/features/billing/model.test.ts`
- `pnpm --filter @duedatehq/server test -- src/organization-hooks.test.ts src/procedures/firms/index.test.ts`
- `pnpm --filter @duedatehq/auth test -- src/auth.test.ts`
- `pnpm --filter @duedatehq/db test -- src/repo/firms.test.ts`
- `pnpm --filter @duedatehq/contracts test -- src/contracts.test.ts`
- `pnpm check`
- `pnpm --filter @duedatehq/marketing build`
- `pnpm --filter @duedatehq/server build`
- `pnpm exec playwright test e2e/tests/firm-switch.spec.ts`
