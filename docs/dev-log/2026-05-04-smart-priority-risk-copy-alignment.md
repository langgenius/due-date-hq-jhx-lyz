---
title: '2026-05-04 · Smart Priority risk copy alignment'
date: 2026-05-04
author: 'Codex'
---

# Smart Priority risk copy alignment

## Background

Dashboard and Obligations now present the dollar-risk column as `Projected risk`, while Practice
profile still used older `exposure` wording in Smart Priority settings.

## Changes

- Renamed the Smart Priority weight label from `Dollar exposure` to `Projected risk`.
- Renamed `Exposure cap` to `Projected risk cap`.
- Updated concept help and role-hidden Dashboard copy to avoid user-facing `exposure` wording.
- Refreshed Lingui catalogs and generated messages.

## Verification

- `pnpm --filter @duedatehq/app i18n:compile`
