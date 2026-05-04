---
title: 'Migration and app shell extraction pass'
date: 2026-04-28
---

# Migration and app shell extraction pass

## Context

Follow-up refactor after the theme preference store hardening. The goal was to reduce the largest
server/app files without changing contracts, routes, or persistence behavior.

## Changes

- Extracted Step 4 migration commit-plan construction from
  `apps/server/src/procedures/migration/_service.ts` into
  `apps/server/src/procedures/migration/_commit-plan.ts`.
- Kept `MigrationService` responsible for orchestration and scoped repo calls; the extracted module
  owns pure import facts, obligation preview, evidence row, and audit row construction.
- Split app shell navigation/workspace UI into
  `apps/app/src/components/patterns/app-shell-nav.tsx`.
- Split account, language, theme, and sign-out menu UI into
  `apps/app/src/components/patterns/app-shell-user-menu.tsx`.
- Extracted Obligations status labels, status constants, and the status badge/select cell into
  `apps/app/src/features/obligations/status-control.tsx`.

## Verification

- `pnpm --filter @duedatehq/server test` passed.
- `pnpm --filter @duedatehq/app test` passed.
- Targeted `vp check` on the seven changed TS/TSX files passed.
- `pnpm --filter @duedatehq/app build` passed.
- `pnpm --filter @duedatehq/server build` passed.

## Note

Full `pnpm check` is currently blocked by the pre-existing untracked file
`docs/dev-log/2026-04-28-dashboard-figma-mvp-design.md`, which reports formatting issues. This
refactor intentionally leaves that file untouched.
