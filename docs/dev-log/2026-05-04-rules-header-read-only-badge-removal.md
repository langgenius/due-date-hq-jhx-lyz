---
title: '2026-05-04 · Rules header read-only badge removal'
date: 2026-05-04
author: 'Codex'
---

# Rules header read-only badge removal

## Background

The Rules page header showed a `READ-ONLY` badge next to the `Rules` title. The page remains an
ops rules console, but the badge was no longer wanted in the primary title row.

## Changes

- Removed the `READ-ONLY` badge from `RulesPageHeader`.
- Removed the now-unused `READ-ONLY` Lingui catalog entry from English and Chinese catalogs.

## Verification

- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check` format phase passed; typecheck is currently blocked by unrelated pending
  `RulesRepo` / `listTemporaryRules` contract changes in server/db tests and scoped repo wiring.
