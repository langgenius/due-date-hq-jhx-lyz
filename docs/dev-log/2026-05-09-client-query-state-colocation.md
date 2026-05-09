---
title: '2026-05-09 · Client query state colocation'
date: 2026-05-09
author: 'Codex'
---

# Client query state colocation

## 背景

`/clients` route carried both page composition and URL filter normalization. That made the route
harder to scan and left the client facts vertical without a single contract for query-backed
filters.

## 做了什么

- Moved the Clients URL parser map, list limit, and filter normalization helpers into
  `features/clients/client-query-state`.
- Kept `routes/clients.tsx` focused on data loading, mutations, and wiring
  `ClientFactsWorkspace`.
- Added focused tests for filter cleanup, typed enum guarding, state normalization, and nullable
  `nuqs` patch behavior.
- Kept the marketing Astro suppression on the `defineConfig` call where TypeScript reports the
  plugin type recursion.
- Made the workload E2E seed deterministic for the fixed `2026-04-30` browser clock, so the
  unassigned obligation stays in the due-soon window regardless of the CI runner date.

## 验证

- `pnpm check`
- `pnpm check:deps`
- `pnpm --filter @duedatehq/app test -- clients`
- `pnpm --filter @duedatehq/server test -- app e2e workload`
- `pnpm --filter @duedatehq/app build`
- `pnpm test:e2e -- e2e/tests/workload.spec.ts`
- `pnpm test`
