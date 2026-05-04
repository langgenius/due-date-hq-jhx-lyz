---
title: '2026-04-29 · Team workload paid surface'
date: 2026-04-29
---

# 2026-04-29 · Team workload paid surface

## Decision

`Team workload` is no longer treated as a hidden future route. It remains a persistent Practice
sidebar signal because team capacity and assignment pressure are the main Pro/Firm value
proposition.

Plan behavior:

- Solo keeps the sidebar row visible but locked with a paid `Pro` tag.
- Pro and Firm enable the route.
- Direct Solo navigation shows a Billing upgrade panel rather than a 404.
- The workload API also enforces paid-plan access.

## V1 Boundary

V1 is a read-only workload read model over existing Workboard data:

- obligations supply due dates and status;
- `client.assignee_name` supplies the current owner label;
- missing owner labels aggregate into `Unassigned`;
- every row links back to Workboard filters for execution.

This avoids inventing a second task system. Formal member-bound assignment, reassignment, and bulk
handoff remain a later slice once `obligation_instance.assignee_user_id` is added.

## Docs

- Product design: `docs/product-design/team-workload/README.md`
- Current sidebar and frontend architecture docs should describe Team Workload as a paid visible
  surface, not a disabled P1 placeholder.

## Implementation Notes

- `apps/app/src/routes/workload.tsx` stays a thin route wrapper.
- Feature UI and Workboard deep-link helpers live under `apps/app/src/features/workload/`.
- Workload aggregates read from existing obligation/client Workboard data and use
  `client.assignee_name` as the V1 owner label.
- Solo plan gating is enforced in both sidebar UX and the workload API handler.

## Validation

- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test -- src/repo/workload.test.ts src/repo/workboard.test.ts`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app build`
- `pnpm check:deps`
- `pnpm exec vp check --fix apps/server/src/procedures/workload/index.ts apps/server/src/procedures/migration/_service.test.ts apps/server/src/procedures/obligations/_service.test.ts apps/app/src/features/workload/workload-page.tsx apps/app/src/features/workload/workload-links.ts apps/app/src/routes/workload.tsx packages/db/src/repo/workload.ts docs/product-design/team-workload/README.md docs/dev-log/2026-04-29-team-workload-paid-surface.md`
- `pnpm --filter @duedatehq/server test -- src/procedures/workload/index.ts src/procedures/migration/_service.test.ts src/procedures/obligations/_service.test.ts`
- `pnpm check`
- `pnpm test`
- `pnpm --filter @duedatehq/server build`
- `pnpm build`
- Follow-up e2e closure: `pnpm exec playwright test e2e/tests/workload.spec.ts e2e/tests/audit-log.spec.ts e2e/tests/members.spec.ts --reporter=list`

Known warnings during build are existing Vite/Wrangler/Astro warnings: one app chunk exceeds the
default size warning threshold, Wrangler notes experimental `unsafe` fields, and Astro reports a
deprecated Vite alias resolver pattern.
