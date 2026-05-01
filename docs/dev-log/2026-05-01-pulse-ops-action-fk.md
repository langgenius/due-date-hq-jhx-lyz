# 2026-05-01 · Pulse Ops action FK fix

## What changed

- Fixed `/api/ops/pulse/:pulseId/{approve,reject,quarantine}` when the ops workbench sends a
  synthetic actor id such as `ops-web`.
- `makePulseOpsRepo` now resolves ops actor ids against the real `user` table before writing
  `pulse.reviewed_by` or `audit_event.actor_id`. Unknown ops actor labels are kept in audit JSON
  context instead of being written into user foreign-key columns.
- Applied the same actor resolution to source revoke so token-protected ops actions behave
  consistently.
- Added required-reason validation for reject and quarantine decisions. The frontend now blocks
  empty reasons before submitting, and the Hono ops route returns `400` for blank or missing
  reasons. The same frontend guard covers source revoke to match the workbench copy.
- Empty required reasons now mark the reason textarea invalid so the existing input invalid state
  shows a red border/ring next to the toast feedback.

## Validation

- `pnpm --filter @duedatehq/db test -- pulse`
- `pnpm --filter @duedatehq/server test -- ops-pulse`
- `pnpm exec vp check packages/db/src/repo/pulse.ts packages/db/src/repo/pulse.test.ts apps/server/src/routes/ops-pulse.ts apps/server/src/routes/ops-pulse.test.ts`
- `pnpm exec vp check apps/server/src/routes/ops-pulse.ts apps/server/src/routes/ops-pulse.test.ts apps/app/src/features/pulse/OpsPulsePage.tsx docs/dev-log/2026-05-01-pulse-ops-action-fk.md`
- `pnpm exec tsc -p apps/app/tsconfig.json --noEmit`
- Local Wrangler HTTP verification returned `200 OK` for reject, approve, and quarantine using the
  default `ops-web` actor id; demo seed was restored afterward with `pnpm db:seed:demo`.
