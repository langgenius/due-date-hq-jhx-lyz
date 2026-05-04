---
title: 'Obligations navigation rename'
date: 2026-05-04
area: app-shell
---

## Context

The sidebar entry formerly labeled `Workboard` represents the obligation queue. The product
navigation should name the object users manage, so the visible surface is now `Obligations`.

## Changes

- Renamed user-facing app navigation, route metadata, command palette entries, shortcut help,
  buttons, audit labels, saved-view defaults, calendar return links, and permission fallback
  actions from Workboard to Obligations.
- Updated marketing copy, server PDF export title, Smart Priority source label, E2E assertions,
  and non-historical product/design docs to match the new IA.
- Kept internal contracts, URL paths, database tables, and implementation identifiers such as
  `/workboard`, `orpc.workboard`, and `WorkboardRow` unchanged to avoid a risky protocol and
  migration rename.

## Design alignment

- Updated `DESIGN.md` layout guidance and product/module docs so the first-screen and sidebar IA
  language now refers to Obligations.
- The page structure, density, table behavior, and route URL remain unchanged.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test -- src/routes/workboard.test.ts src/features/audit/audit-log-model.test.ts src/routes/login.test.tsx src/router.test.ts`
- `pnpm check`
- `git diff --check`
