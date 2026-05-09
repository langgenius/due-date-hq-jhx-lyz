---
title: '2026-05-09 · TanStack Form migration'
date: 2026-05-09
author: 'Codex'
---

# TanStack Form migration

## 背景

`apps/app` only used `react-hook-form` in two schema-managed forms, while the resolver package's
Zod subpath exposed a missing dependency metadata edge under pnpm. The app already uses TanStack
libraries for server state, table state, virtual lists, and keyboard shortcuts, so keeping a
separate form-state stack was unnecessary.

## 做了什么

- Added `@tanstack/react-form@1.29.3` to the workspace catalog and `@duedatehq/app`.
- Removed `react-hook-form` and `@hookform/resolvers` from the app and catalog.
- Migrated `CreateClientDialog` to TanStack Form with Zod Standard Schema submit validation.
- Migrated the rules generation preview form to TanStack Form while preserving its existing preview
  input and client remount behavior.
- Added ADR 0020 and updated README / frontend architecture / tech-stack docs to make TanStack Form
  the complex-form default.

## 验证

- `pnpm --filter @duedatehq/app test -- clients generation-preview-tab`
- `pnpm check:fix`
- `pnpm check`
- `pnpm check:deps`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e -- e2e/tests/workload.spec.ts`
