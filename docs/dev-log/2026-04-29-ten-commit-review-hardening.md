# 2026-04-29 · Ten-commit review hardening

## Scope

Reviewed the last ten commits from `1dc5170..cefdcea`, covering firm CRUD/switching,
clients management, audit log management, Stripe billing checkout/e2e coverage, and the
members gateway backend.

## Findings Fixed

- Members repository status writes now include both `organization_id` and `member.id` in the
  `WHERE` clause. The procedure already proved the target belonged to the active firm, but the
  repository write path now carries the tenant boundary itself.
- Client creation no longer wires the dialog through `mutateAsync`. The route now keeps mutation
  lifecycle ownership in TanStack Query callbacks, matching `05-Frontend-Architecture.md`.
- Clients filters and detail selection now live in module-level `nuqs` parsers (`q`, `entity`,
  `state`, `client`) instead of component-local state.
- Billing checkout/success/cancel now share a module-level `plan` / `interval` query parser
  contract.
- Firm switcher metadata now goes through Lingui instead of rendering English role/plan/seat
  strings in non-English locales.
- Audit list now checks active-firm role before reading firm-wide audit JSON/hash payloads.
- Billing subscription reads are limited to billing-reader roles, and billing management remains
  Owner-only.
- Session creation now chooses only active `firm_profile` rows when restoring
  `activeOrganizationId` for returning users.
- Billing subscription sync now reconciles over-limit seats by suspending excess non-owner members
  and canceling excess pending invitations after a downgrade/cancel.
- Members gateway Better Auth calls now adapt expected 4xx API failures into stable oRPC errors.

## Architecture Notes

- Members gateway currently exposes backend contracts and owner-only procedures without an app
  route. The next UI pass should avoid duplicating Better Auth organization semantics in the
  client and consume only `orpc.members.*`.
- Invitation status handling deliberately keeps the public contract narrow (`pending`/`expired`).
  Before adding richer invitation management UI, align Better Auth's full invitation status set
  with the contract instead of inferring non-pending states as product states.
- `apps/app/src/routes/clients.tsx` still owns filters, table, detail panel, and creation form in
  one route module. It is stable enough for P0, but further client workflow work should split the
  route into feature modules before adding edit/delete or assignment flows.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/app test`
- `pnpm check`
- `pnpm build`

`pnpm check` still reports the existing `packages/ui/src/lib/placement.ts` unsafe assertion warning;
this review did not touch that file.
