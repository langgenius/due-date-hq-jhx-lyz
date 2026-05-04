---
title: 'Obligations full rename'
date: 2026-05-05
area: obligations
---

## Context

The old name was removed across product, code, routes, contracts, database schema naming, tests,
and documentation. The user-facing object is now `Obligations`, and the app route is `/obligations`.

## Changes

- Renamed the app route, feature directory, E2E page object/spec, server procedure directory,
  contracts, ports, DB repository, and saved-view schema files to obligation/obligations names.
- Moved the queue read endpoints under `orpc.obligations.*`, replacing the previous top-level queue
  contract mount.
- Renamed the saved-view table and audit action strings to `obligation_saved_view` and
  `obligations.saved_view.*`.
- Updated product/design/dev documentation and dev-log filenames so the old name no longer appears
  in tracked source or docs.

## Design alignment

- Updated `DESIGN.md` layout guidance and product/module docs so the first-screen and sidebar IA
  language refers to Obligations.
- Preserved the page structure, density, and table behavior while changing the route to
  `/obligations`.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test -- src/routes/obligations.test.ts src/features/rules/generation-preview-tab.test.tsx src/routes/login.test.tsx src/router.test.ts src/components/patterns/keyboard-shell/types.test.ts src/components/patterns/app-shell-user-menu.test.ts src/features/audit/audit-log-model.test.ts`
- `pnpm --filter @duedatehq/server test -- src/app.test.ts src/lib/ics.test.ts`
- `pnpm --filter @duedatehq/contracts test -- src/contracts.test.ts`
- `pnpm --filter @duedatehq/db test -- src/repo/obligation-queue.test.ts src/db.test.ts`
- `pnpm check`
- `pnpm build`
- `git diff --check`
- Legacy-name content and filename searches across apps/packages/e2e/docs/mock/DESIGN.md.
