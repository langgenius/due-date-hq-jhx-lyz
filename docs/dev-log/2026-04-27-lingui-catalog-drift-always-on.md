---
title: 'Run Lingui catalog drift on every main update'
date: 2026-04-27
author: 'Codex'
---

# Run Lingui catalog drift on every main update

## Context

The `Lingui Catalog Drift` workflow previously used `paths` filters for app i18n-related files.
That saved some CI work, but it also meant a later docs-only push would not re-run the drift check
even if `main` already contained stale catalogs.

GitHub Actions evaluates `paths` filters against changed files for `push` and `pull_request`
events. When both branch and path filters are present, both must match before the workflow runs.
That behavior is useful for expensive localized jobs, but it is the wrong shape for catalog drift:
the check answers whether the current repository state is clean after extraction and compilation.

Checked Lingui's official CLI and testing docs before keeping the existing drift assertion. The CLI
documents `extract` as an updating command that merges, saves catalogs, and prints statistics; it
does not expose a `--check` or dry-run mode for "would this change files?". The later strict-catalog
follow-up cleared the `zh-CN` baseline by removing obsolete entries with `extract --clean` and now
uses `compile --strict` for missing translations, while `git diff` still catches stale extracted or
compiled catalog files. The React testing guide covers wrapping components with `I18nProvider` and
asserting rendered translated text, not catalog generation drift.

## Change

- Removed `paths` filters from `.github/workflows/i18n-catalog-drift.yml`.
- Kept the workflow scoped to `main` pushes and pull requests targeting `main`.
- Updated the i18n architecture docs and Lingui ADR to state that catalog drift runs on every
  relevant update instead of only on i18n path changes.
- Kept `git diff --exit-code -- apps/app/src/i18n/locales` as the outer generated-artifact
  synchronization assertion after Lingui writes catalogs.

## Validation

```bash
pnpm --filter @duedatehq/app i18n:extract
pnpm --filter @duedatehq/app i18n:compile
git diff --exit-code -- apps/app/src/i18n/locales
```

The YAML change is expected to trigger `Lingui Catalog Drift` on this commit after push.
