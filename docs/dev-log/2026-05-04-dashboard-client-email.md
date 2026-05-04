# Dashboard Client Email

## Context

The dashboard triage table previously showed Smart Priority driver text under each client name.
That repeated `Why` and importance language inside the Client column even though the row already
has a dedicated Priority column.

## Changes

- Added `clientEmail` to dashboard row contracts and server mapping.
- Included client email in the dashboard repository query.
- Replaced the Client column subtext with the client's email, falling back to `No email`.

## Validation

- `pnpm --filter @duedatehq/contracts test -- --run contracts.test.ts`
- `pnpm --filter @duedatehq/db test -- --run dashboard.test.ts`
- `pnpm exec vp check apps/app/src/routes/dashboard.tsx apps/server/src/procedures/dashboard/index.ts packages/contracts/src/dashboard.ts packages/db/src/repo/dashboard.ts packages/ports/src/dashboard.ts`
- `pnpm exec vp check packages/contracts/src/contracts.test.ts packages/db/src/repo/dashboard.test.ts docs/dev-log/2026-05-04-dashboard-client-email.md`
- `pnpm check` currently stops on pre-existing formatting drift in
  `apps/app/src/features/pulse/AlertsListPage.tsx`.
