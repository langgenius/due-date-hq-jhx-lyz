# 2026-05-04 · App i18n catalog sync

## Context

The app i18n CI step failed after `lingui extract --clean` because the `zh-CN`
catalog had 7 missing translations. The new entries came from shared rules
console pagination, rule library table headers, and Pulse source health banner
copy.

## Change

- Filled the 7 missing `zh-CN` translations in
  `apps/app/src/i18n/locales/zh-CN/messages.po`.
- Kept the extractor's source-reference cleanup in both `en` and `zh-CN`
  catalogs.
- Recompiled Lingui catalogs so generated `messages.ts` files match the PO
  catalogs.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`

## Docs

No `DESIGN.md`, `docs/Design/DueDateHQ-DESIGN.md`, or stable i18n architecture
update was needed; this only syncs extracted app catalog entries with existing
strict Lingui workflow docs.
