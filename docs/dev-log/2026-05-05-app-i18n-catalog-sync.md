---
title: 'App i18n catalog sync'
date: 2026-05-05
author: 'Codex'
---

# App i18n catalog sync

## Context

The app Lingui strict compile failed after `lingui extract --clean` because the
`zh-CN` catalog had 42 missing translations. The missing entries came from recent
evidence drawer, client facts, members, and import history copy.

## Change

- Filled the missing `zh-CN` translations in
  `apps/app/src/i18n/locales/zh-CN/messages.po`.
- Kept the extractor's synchronized source catalog changes in `en` and `zh-CN`.
- Recompiled Lingui catalogs so generated `messages.ts` files match the PO
  catalogs.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`

## Docs

No stable architecture or design doc update was needed; this only restores the
existing strict Lingui catalog workflow.
