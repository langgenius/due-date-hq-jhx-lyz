---
title: 'Enable strict Lingui catalog gate'
date: 2026-04-27
author: 'Codex'
---

# Enable strict Lingui catalog gate

## Context

`lingui compile --strict` is the official Lingui gate for missing translations, but the app
catalog previously could not use it because `zh-CN` reported 31 missing entries. Re-checking the
catalog showed those 31 entries were obsolete `#~` history from removed source messages, not active
UI strings.

Official Lingui CLI docs support both pieces needed here:

- `lingui extract --clean` removes obsolete messages from catalogs.
- `lingui compile --strict` fails when any catalog has missing translations.

## Change

- Re-generated app catalogs with obsolete entries removed.
- Changed `@duedatehq/app` scripts so `i18n:extract` runs `lingui extract --clean`.
- Changed `i18n:compile` to run `lingui compile --strict`.
- Kept the `Lingui Catalog Drift` workflow as extract + compile + `git diff --exit-code`, so CI now
  fails on both missing translations and uncommitted generated catalog drift.
- Updated `AGENTS.md`, the frontend architecture doc, the Lingui ADR, and prior dev logs so the
  repository no longer documents a missing-translation baseline.

## Decision

There is no baseline exception going forward. Active app catalog entries must be translated before
merge, and obsolete entries are removed instead of being carried forward as historical missing
translations.

## Validation

```bash
pnpm --filter @duedatehq/app i18n:extract
pnpm --filter @duedatehq/app i18n:compile
git diff --exit-code -- apps/app/src/i18n/locales
```

`zh-CN` now reports `Missing 0`, and strict compilation passes.
