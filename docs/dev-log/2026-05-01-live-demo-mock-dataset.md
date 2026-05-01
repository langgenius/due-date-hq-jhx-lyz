# 2026-05-01 · Live demo mock dataset

## What changed

- Added `mock/demo.sql` as the full local demo dataset for Dashboard, Workboard, Workload,
  Alerts/Pulse, Clients, Imports, Members, Billing, Audit, and Notifications.
- Kept Better Auth tenant/user rows on readable `mock_*` IDs while using stable UUIDs for
  application-owned rows that are exposed through contracts.
- Added `mock/README.md` with the seed and local demo-login flow.
- Pointed `pnpm db:seed:demo` at the root `mock/demo.sql` file instead of keeping demo SQL inline
  in `packages/db/seed/demo.ts`.
- Added development-only `/api/e2e/demo-login` so a local presenter can enter the seeded demo firm
  without Google OAuth after running the demo seed.

## Validation

- `pnpm --filter @duedatehq/db seed:demo`
- `pnpm exec vp check apps/server/src/routes/e2e.ts apps/server/src/app.test.ts packages/db/seed/demo.ts`
- `pnpm --filter @duedatehq/server test src/app.test.ts`
- Local oRPC smoke against the running `8787` dev Worker: `/api/e2e/demo-login` then
  `pulse.listAlerts`, `pulse.getDetail`, and `dashboard.load`.

## Notes

- DESIGN.md was reviewed conceptually; this change only supplies data and a local auth bootstrap,
  so no design-token or visual-spec updates were needed.
- The mock dataset deletes only seeded demo tenant/application rows before inserting, so it can be
  re-run without clearing unrelated local profiles.
