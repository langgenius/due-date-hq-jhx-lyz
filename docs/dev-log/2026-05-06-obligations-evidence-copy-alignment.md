---
title: 'Obligations Evidence Copy Alignment'
date: 2026-05-06
author: 'Codex'
---

# Obligations Evidence Copy Alignment

## Context

The Dashboard Priority list used `Needs evidence` when an obligation had no linked evidence, while
the Obligations table rendered the same zero-evidence state as `Open`. That made the Evidence action
look like a navigation/status command instead of the missing-evidence state already used elsewhere.

## Change

- Updated the Obligations table Evidence cell to match the Dashboard copy: zero linked evidence now
  reads `Needs evidence`.
- Reused the Dashboard count style for linked evidence: `# source` / `# sources`.
- Refreshed Lingui catalogs after the copy source reference changed.

## Docs Check

No DESIGN.md or stable architecture document change was needed. The evidence data model and drawer
behavior remain unchanged; this is a local copy alignment on an existing table action.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app exec tsc --noEmit`
- `pnpm --filter @duedatehq/app test -- --run`
- `pnpm exec vp check apps/app/src/routes/obligations.tsx apps/app/src/i18n/locales/en/messages.po apps/app/src/i18n/locales/zh-CN/messages.po docs/dev-log/2026-05-06-obligations-evidence-copy-alignment.md --no-error-on-unmatched-pattern`

Repository-wide `pnpm check` was also run, but it still reports pre-existing formatting issues in
the unrelated Pulse files currently modified in the worktree.
