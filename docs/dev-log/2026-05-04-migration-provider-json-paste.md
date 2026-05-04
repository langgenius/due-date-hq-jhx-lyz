# 2026-05-04 · Migration paste normalization

## Context

The Migration Copilot connect-platform textarea expected strict JSON. Provider/API copies often
arrive as JSONL, multiple top-level objects, markdown fenced JSON, or common API wrappers such as
`data` and `results`, which produced low-level parser errors like "Unexpected non-whitespace
character after JSON". The Paste/Upload textarea also accepted CSV/TSV only, even though the UI
promised it could figure out pasted shape.

## Change

- Added paste-time normalization for the provider records textarea. When pasted content can be
  parsed, the field is replaced with a formatted JSON array before the rows enter the mapper flow.
- Extended the parser to accept standard arrays, single objects, JSONL/top-level JSON sequences,
  markdown code fences, trailing commas, and wrapper keys `records`, `items`, `data`, and `results`.
- Added paste-time normalization for Paste rows. JSON arrays, JSONL, single objects, row wrappers,
  fenced CSV, and fenced TSV are converted into stable TSV text before the existing tabular parser
  validates row count and SSN-like columns.
- Kept AI as a later fallback option rather than a dependency for common deterministic repairs.

## Validation

- DESIGN.md remains aligned; this is input handling only and does not change layout, tokens, or
  visual behavior.
- `pnpm --filter @duedatehq/app test -- src/features/migration/Step1Intake.test.ts`
- `pnpm exec vp check --fix apps/app/src/features/migration/Step1Intake.tsx apps/app/src/features/migration/Step1Intake.test.ts docs/dev-log/2026-05-04-migration-provider-json-paste.md`
