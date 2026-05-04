---
title: 'Sync Lingui source references after app shell and obligations extraction'
date: 2026-04-28
author: 'Codex'
---

# Sync Lingui Source References After App Shell and Obligations Extraction

## Context

The authenticated E2E coverage commit landed after extracting app shell navigation, user menu, and
obligations status controls into focused modules. Lingui message content stayed valid, but the
committed catalogs still pointed those messages at their pre-extraction source files.

## Change

- Re-ran `pnpm --filter @duedatehq/app i18n:extract` to refresh catalog source references.
- Re-ran `pnpm --filter @duedatehq/app i18n:compile` with strict catalog validation.
- Left product and design docs unchanged because this only updates generated i18n metadata.

## Validation

```bash
pnpm --filter @duedatehq/app i18n:extract
pnpm --filter @duedatehq/app i18n:compile
git diff --exit-code -- apps/app/src/i18n/locales
```
