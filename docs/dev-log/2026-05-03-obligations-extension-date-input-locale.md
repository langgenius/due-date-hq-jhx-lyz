---
title: 'Obligations extension date input locale'
date: 2026-05-03
area: obligations
---

## Context

The Obligations obligation detail Extension tab used a native `input[type="date"]` for the expected
extended due date. Native date inputs render their empty-state format with the browser or OS locale,
so an English app session could still show a Chinese `年/月/日` placeholder. We checked the existing
dependency set before adding a package: the current Base UI version does not include a calendar/date
picker primitive, and the repo does not already carry a date picker dependency.

## Changes

- Replaced the Extension tab's native date input with a local popover calendar picker built from the
  existing `Popover` and `Button` primitives.
- Kept the stored value and mutation payload in `YYYY-MM-DD`, matching the existing contract.
- Added client-side validity checking before saving the extension decision.
- Localized month and weekday labels through the active app locale instead of browser control chrome.

## Design alignment

- No DESIGN.md or token changes were needed.
- The field keeps the existing input visual language and uses the existing calendar icon affordance.

## Validation

- `pnpm exec vp check --fix apps/app/src/routes/obligations.tsx docs/dev-log/2026-05-03-obligations-extension-date-input-locale.md docs/dev-log/2026-05-03-obligations-table-sorting.md`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec vp check apps/app/src/routes/obligations.tsx apps/app/src/i18n/locales/en/messages.po apps/app/src/i18n/locales/en/messages.ts apps/app/src/i18n/locales/zh-CN/messages.po apps/app/src/i18n/locales/zh-CN/messages.ts docs/dev-log/2026-05-03-obligations-extension-date-input-locale.md docs/dev-log/2026-05-03-obligations-table-sorting.md`
- `git diff --check -- apps/app/src/routes/obligations.tsx docs/dev-log/2026-05-03-obligations-extension-date-input-locale.md docs/dev-log/2026-05-03-obligations-table-sorting.md`
