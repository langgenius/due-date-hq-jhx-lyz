---
title: 'Marketing Product Table Style Refresh'
date: 2026-05-03
author: 'Codex'
---

# Marketing Product Table Style Refresh

## Context

Marketing homepage product mockups were still using older hand-built table styling after the app
Dashboard / Obligations table language moved to smaller text, Dify-aligned badge colors, header
filters, sortable headers, and 36px rows.

## Change

- Updated the hero product surface, workflow dashboard surface, workflow mapping table, and problem
  mini lists to use current app-style table rows: `text-xs`, 36px height, `divider-*` borders,
  neutral hover, app badge colors, and status dots.
- Replaced old `P0/P1/P2` priority labels with Smart Priority-style score and rank mock data.
- Added typed semantic tone fields to marketing i18n rows so badge/status styling is not inferred
  from localized display text.
- Switched marketing severity rows to the same soft badge backgrounds used by Dashboard severity
  rows instead of the older `severity-*-tint` row fills.
- Tightened homepage responsive containers around these surfaces so the new mock tables keep their
  horizontal scrolling inside the product mockup instead of squeezing the page on mobile.

## Validation

- `pnpm --filter @duedatehq/marketing check`
- `pnpm --filter @duedatehq/marketing build`
- `pnpm format`
- `git diff --check`
- Playwright visual smoke for English and Chinese homepage at 1440, 768, and 390 widths:
  no page-level horizontal scroll and no table row cell overlaps. Screenshots were written to
  `/tmp/duedatehq-marketing-{en,zh}-{desktop,tablet,mobile}.png`.
