---
title: '2026-05-04 · TaxDome fixture mixed deadlines'
date: 2026-05-04
author: 'Codex'
---

# TaxDome fixture mixed deadlines

## What changed

- Rebalanced the existing `Deadline` column in `taxdome-30clients.csv` against the
  `2026-05-04` test baseline.
- The 30 rows now cover 5 overdue dates, 1 same-day date, 8 dates in the next 30 days,
  9 later-2026 dates, and 7 2027 future dates.
- Reworked the TaxDome fixture columns to match TaxDome account import semantics:
  `Account Type` uses TaxDome's `Company` / `Individual` / `Other`, while internal filing
  entity data moved to a `Tax Entity Type` custom field.
- Updated `Sole Prop` fixture values to `Sole Proprietor` so normalization resolves to the
  internal `sole_prop` enum instead of the invalid `sole-prop` shape.
- Updated TaxDome preset fallback mapping so real TaxDome `Account Type` is ignored for
  internal entity inference and `Tax Entity Type` / `Tax Return Type` custom fields are mapped.
- Replaced user-facing migration validation copy for unrecognized entity types so the UI no
  longer exposes internal `ENTITY_ENUM` / enum wording, while retaining the internal error code for
  diagnostics and stage classification.
- Expanded entity normalization aliases for common tax-prep spellings such as `sole-prop`,
  `Sole Prop`, `Schedule C Filer`, `S-Corporation`, and `C-Corporation`.
- Changed migration normalization fallback so unknown entity labels are marked as `Other` with low
  confidence for review instead of producing an empty normalized value that blocks the whole batch.
- Updated the migration fixture README to describe the mixed deadline distribution and clarify
  that the current import contract still generates formal obligations from mapped tax types and
  verified rules, not directly from the vendor `Deadline` column.

## Validation

- CSV shape checked with `awk`.
- `pnpm --filter @duedatehq/core test -- src/normalize-dict/index.test.ts`
- `pnpm --filter @duedatehq/server test -- src/procedures/migration/_service.test.ts`
- `pnpm --filter @duedatehq/app test -- src/features/migration/Step2Mapping.test.tsx`
