# 2026-05-02 · Import history i18n catalog sync

## Context

The app i18n CI step failed after `lingui extract --clean` because the `zh-CN` catalog had 10
missing translations, all from the client import history and recovery UI.

## Change

- Filled the missing `zh-CN` translations in `apps/app/src/i18n/locales/zh-CN/messages.po`.
- Recompiled Lingui catalogs so generated `messages.ts` files match the translated catalogs.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
