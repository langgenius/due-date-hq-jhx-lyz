---
title: 'Rules Obligation Preview tax year picker'
date: 2026-05-02
area: rules
---

## Context

Generation Preview exposed TAX YEAR as a controlled text input over a composite date string. Because
the form only accepted complete ISO date segments, partial edits were rejected on every keystroke and
the field appeared uneditable.

## Changes

- Replaced the manual TAX YEAR input with a `Popover` year-grid selector using existing app UI
  primitives and lucide calendar/chevron icons.
- Renamed the user-facing tab from Generation Preview to Obligation Preview.
- Replaced CLIENT ID free text with a preview-client preset dropdown; selecting a preset updates the
  associated entity, state, and tax types together.
- Routed the ENTITY trigger and menu items through the same display label helper so the selected
  value matches the dropdown casing.
- Added pure helpers that map a selected preview calendar year to the rule-engine date inputs:
  `taxYearStart = YYYY-01-01` and `taxYearEnd = (YYYY - 1)-12-31`.
- Added model coverage for the year/date mapping so the default 2026 preview scenario remains
  stable.
- Synced Lingui catalogs for the picker labels and updated the Rules user/manual docs.

DESIGN.md check: no new token or component primitive was needed; the picker stays on existing
`Popover`, `Button`, input-state tokens, and mono numeric typography.

## Validation

- `pnpm --filter @duedatehq/app test -- src/features/rules/rules-console-model.test.ts`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
- `pnpm --filter @duedatehq/app build`
