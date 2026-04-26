---
title: '2026-04-25 · Lingui Catalog Line Number Churn'
date: 2026-04-25
commit: 'd96ba09'
---

# 2026-04-25 · Lingui Catalog Line Number Churn

## Context

Lingui PO catalogs include source origin comments by default. With line numbers enabled, moving code
or adding unrelated lines can update entries such as `#: src/routes/workboard.tsx:117` even when the
message and translation did not change.

That makes i18n diffs noisy and increases merge conflict risk for routine UI edits.

## Decision

Configure the app's PO formatter with `origins: true` and `lineNumbers: false`.

This preserves file-level origin context for translation and debugging while removing line-number-only
diff churn from `messages.po`.

## Validation

Run the app catalog sync after changing the formatter:

```bash
pnpm --filter @duedatehq/app i18n:extract
pnpm --filter @duedatehq/app i18n:compile
```

For CI drift checks, run extraction and compilation, then fail if catalog files changed without being
committed:

```bash
git diff --exit-code -- apps/app/src/i18n/locales
```
