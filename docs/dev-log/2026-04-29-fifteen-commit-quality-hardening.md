# Fifteen-Commit Quality Hardening

Date: 2026-04-29
Owner: Codex

## Context

Reviewed the latest 15 commits across billing, members, clients, audit, firm switching, Pulse/RBAC,
and docs. The main risk was that several surfaces had shipped code while docs or enforcement still
reflected earlier planning assumptions.

## Changes

- Added server-side role gates for client writes, migration run/revert paths, and obligation status
  writes so active coordinator membership is not enough to mutate firm data.
- Added Better Auth organization hook audit rows for direct invitation, role update, and member
  removal paths; oRPC remains the preferred Members gateway.
- Changed queue handling to fail non-empty batches until a dispatcher exists, preventing silent
  acknowledgement of unprocessed email or Pulse messages.
- Aligned member invitation status contracts with Better Auth's `canceled` state.
- Fixed front-end drift: Clients keyboard navigation, client-create filter reset, paused billing
  portal visibility, practice-switch error feedback, and localized firm profile enum labels.
- Removed the unsafe placement tuple assertion in `packages/ui`.
- Updated Audit, RBAC, E2E, project script, design-path, and dev-log docs to match shipped behavior.

## Validation

- `pnpm check`
- `pnpm --filter @duedatehq/server test -- --run src/procedures/_permissions.test.ts src/organization-hooks.test.ts src/jobs/queue.test.ts`
- `pnpm --filter @duedatehq/contracts test -- --run src/contracts.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
