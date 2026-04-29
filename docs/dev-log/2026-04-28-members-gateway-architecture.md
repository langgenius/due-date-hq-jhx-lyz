# 2026-04-28 · Members gateway backend architecture

## Scope

This slice opened the backend Members gateway. The `/settings/members` UI landed on 2026-04-29 as
an Owner-only Settings data surface backed by this gateway.

- Frontend callers get a DueDateHQ `members.*` oRPC surface instead of calling Better Auth
  organization/member APIs directly.
- Better Auth remains the identity source of truth for `organization`, `member`, `invitation`, and
  `session.activeOrganizationId`.
- The gateway owns product rules: current active firm, Owner-only member administration, seat usage,
  audit events, and stable error codes.

## Backend

- Added `packages/contracts/src/members.ts` with `listCurrent`, `invite`, `cancelInvitation`,
  `resendInvitation`, `updateRole`, `suspend`, `reactivate`, and `remove`.
- Added `packages/db/src/repo/members.ts` as the identity-side repo for current firm members,
  invitations, seat usage, status changes, and audit writes.
- Added the `invitation_organization_email_status_idx` migration for duplicate invitation lookup.
- `firmAccessMiddleware` now injects both `firms` and `members` identity repos.
- Added `requireCurrentFirmOwner` and wired `apps/server/src/procedures/members`.
- `members.*` does not bypass tenant middleware. It manages only `session.activeOrganizationId`.

## Better Auth boundary

- Official Better Auth organization docs were used for the plugin surface:
  `membershipLimit`, `invitationLimit`, member APIs, invitation APIs, and `organizationHooks`.
- `membershipLimit` is now server-injected and reads `firm_profile.seatLimit`.
- `invitationLimit` is open as a high Better Auth ceiling; the DueDateHQ wrapper and hooks enforce
  the product seat rule.
- The old P0 `beforeAddMember(role !== 'owner')` guard is replaced with role whitelist, active firm,
  seat-limit guards, and an owner-bootstrap-only exception. Owner transfer remains out of scope.

## Rules

- Members v1 is Owner-only for list and mutations.
- Managed invite/update roles are `manager`, `preparer`, and `coordinator`; inviting or mutating
  `owner` is not exposed.
- Seat usage is `active members + pending non-expired invitations`.
- `member.status='suspended'` is retained for reversible suspension and is rejected by
  `tenantMiddleware`.

## Validation

- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/auth test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/server test`
- `pnpm exec vp check` on the Members-touched source set

## 2026-04-29 UI follow-up

- Added `/settings/members` to the protected router and Settings sidebar.
- Implemented the Figma `Settings · Members` owner view using real `members.*` oRPC calls.
- The page shows seat usage KPIs, active/suspended members, pending/expired invitations, full-seat
  banner state, invite dialog, role updates, suspend/reactivate, remove, resend, and cancel actions.
- The header invite trigger stays clickable at full seat usage so the dialog can explain the block;
  only the final send action is disabled, and the gateway remains the hard seat-limit authority.
- The UI keeps mutation boundaries aligned with the gateway: Owner-only access comes from the
  server, owner/self rows are read-only, and all writes continue to flow through audit-producing
  members procedures.

## Follow-ups

1. Add accept-invitation UX and E2E after invite acceptance is wired end-to-end.
2. Add owner transfer before allowing any owner role mutation/removal.
3. Add browser-level coverage for role/status/invitation flows once seeded multi-member fixtures
   exist.
