---
title: 'Dashboard triage brief removal'
date: 2026-05-04
area: dashboard
---

## Context

The Dashboard AI weekly brief repeated information already available in metrics and the Triage
queue. Compressing the card would still duplicate the top rows, so the Dashboard needed row-level
actionability instead of another summary surface.

## Changes

- Removed the standalone AI weekly brief panel and refresh state from the Dashboard route.
- Added deterministic priority sorting to the Triage queue priority column.
- Expanded Triage queue rows with Focus rank, the top Smart Priority drivers, and a Next check.
- Kept evidence access on the row so the next action and source trail stay in the same workflow.
- Made Triage queue rows open the exact Obligations obligation detail.
- Linked client names directly to the Clients fact profile for customer-level review.
- Added exact-obligation Obligations filtering so Dashboard jumps first narrow the table to the target
  row, then open the detail drawer once that row is loaded.
- Updated Dashboard user docs and the brief product design note to clarify that background Weekly
  Brief remains an async capability, while Dashboard first screen is queue-driven.

## Design alignment

- No `DESIGN.md` token or primitive changes were needed.
- The table remains dense and workbench-oriented: existing `Card`, `Table`, `Badge`, `Button`,
  semantic severity text, and mono tabular numbers.
- The change removes one repeated card and keeps the primary workflow in the single Triage queue.

## Validation

- `pnpm --filter @duedatehq/app check` was attempted, but `@duedatehq/app` does not define a
  `check` script.
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check:fix`
- `pnpm check`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/app build`
