---
title: 'Evidence Drawer Source Summary'
date: 2026-05-05
author: 'Codex'
---

# Evidence Drawer Source Summary

## Context

The Evidence drawer source timeline exposed implementation fields such as `sourceType`,
`rawValue`, `normalizedValue`, confidence percentage, model, and source ids as the primary reading
surface. That was useful for debugging, but too technical for practice users trying to understand
why a deadline exists or what changed.

## Change

- Renamed the drawer surface from an evidence-chain/source-timeline framing to deadline evidence
  with "What this evidence says".
- Replaced raw technical rows with user-facing source labels, plain-language headlines, short
  descriptions, and key before/after details.
- Added tailored summaries for verified rules, migration mapping/normalization, readiness
  checklist/client responses, penalty-input changes, Pulse apply/revert, and import revert records.
- Kept source excerpts, timestamps, and source links available without making them the first thing
  users must parse.
- Removed short source-id reference badges from evidence cards; those ids remain stored with the
  evidence record but no longer appear in the drawer reading surface.
- Clarified before/after value copy so empty-to-value updates read as `Set to ...` instead of the
  ambiguous `Not set to ...`.
- Formatted penalty-input summary amounts as dollars, so stored cents values such as `1500000`
  display as `$15,000.00`.
- Updated i18n catalogs and the app module documentation.

## Validation

- `pnpm --filter @duedatehq/app test -- src/routes/obligations.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
