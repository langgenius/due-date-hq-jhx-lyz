---
title: 'Sync Lingui catalog for dashboard Operations label'
date: 2026-04-27
author: 'Codex'
---

# Sync Lingui catalog for dashboard Operations label

## Context

GitHub Actions run `24960868243` failed in the `Lingui Catalog Drift` workflow. The failing
step ran:

```bash
vp run @duedatehq/app#i18n:extract
vp run @duedatehq/app#i18n:compile
git diff --exit-code -- apps/app/src/i18n/locales
```

The generated diff showed that `apps/app/src/routes/dashboard.tsx` already used the
`<Trans>Operations</Trans>` message, but the committed Lingui catalogs did not include the
corresponding source entry.

## Change

- Ran `pnpm --filter @duedatehq/app i18n:extract`.
- Ran `pnpm --filter @duedatehq/app i18n:compile`.
- Committed the generated catalog updates for `Operations` in both `en` and `zh-CN`.

The `zh-CN` catalog keeps this entry untranslated for now, matching the existing Lingui missing
translation behavior for untranslated source strings.

## Validation

```bash
pnpm --filter @duedatehq/app i18n:extract
pnpm --filter @duedatehq/app i18n:compile
git diff --exit-code -- apps/app/src/i18n/locales
```
