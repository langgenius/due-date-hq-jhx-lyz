# 2026-04-28 · Firm CRUD + switch foundation

## Scope

This slice opens the independent Firm path without opening Team/Members yet.

- Users can own multiple firms.
- The sidebar firm switcher reads real firm data, creates a new firm, and switches the active firm.
- `/settings/profile` updates the active firm's display name/timezone and soft-deletes the active firm.
- Members, invitations, seat enforcement, role changes, Owner transfer, and procedure-level RBAC remain the P1 Team slice.

## Backend

- Added `packages/contracts/src/firms.ts` with `firms.listMine/getCurrent/create/switchActive/updateCurrent/softDeleteCurrent`.
- Added `packages/db/src/repo/firms.ts` as the cross-firm tenant-selection repo. It only reads firms where the current user has an active Better Auth member row and excludes soft-deleted firms.
- Added `firmAccessMiddleware` to inject `context.vars.firms` before tenant middleware.
- `tenantMiddleware` bypasses `/rpc/firms/*` because these procedures are the pre-tenant selection layer. Regular business RPCs still require `tenantContext + scoped(db, firmId)`.
- `packages/auth` no longer sets `organizationLimit:1`; `invitationLimit:0` and the non-owner `beforeAddMember` guard stay in place, so Team expansion is still closed.
- Firm delete is soft-delete only (`firm_profile.status='deleted'`, `deletedAt` set). We do not call Better Auth hard delete, which would cascade into tenant business data.

## Frontend

- `RootLayout` now queries `orpc.firms.listMine` and feeds real firm data into `AppShell`.
- `FirmSwitcherTrigger` renders all available firms, supports switching, and opens an Add Firm dialog.
- `/settings/profile` provides firm update and delete controls in the settings form layout.
- Settings nav now exposes `Profile`; `Members` remains tagged `P1`.

## Safety

- `firmId` for business data still comes only from `session.activeOrganizationId`.
- `firms.switchActive` validates active membership before updating the session.
- `firms.updateCurrent` and `firms.softDeleteCurrent` require the current user to be owner-like for the active firm.
- Firm create/update/delete/switch write audit events (`firm.created`, `firm.updated`, `firm.deleted`, `firm.switched`).

## Validation

- `pnpm check` passed with the existing `packages/ui/src/lib/placement.ts` warning.
- `pnpm test` passed.
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec playwright test e2e/tests/firm-switch.spec.ts` covers creating a second firm,
  switching active context, loading the new profile, and keeping the internal slug out of the UI.

## Follow-ups

1. Implement Members/RBAC as P1-18/P1-19: invitations, role changes, seat limit, member suspension, and procedure-level permission middleware.
2. Replace the temporary free-text timezone input with a constrained timezone picker when onboarding/profile settings get a full form pass.
3. Add a restore path for soft-deleted firms before exposing any 30-day grace period UX.
