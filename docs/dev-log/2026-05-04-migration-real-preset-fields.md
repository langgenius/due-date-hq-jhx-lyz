# 2026-05-04 Migration Preset Fields

## Change

- Tightened Migration preset fallback mappings to public export / bulk-update fields that can be confirmed for TaxDome, Drake, Karbon, QuickBooks, and File In Time.
- Removed demo fixture enrichment fields from preset fallback mappings, including estimated tax due, penalty tax due, owner count, gross receipts, filing frequency, and state-specific penalty inputs.
- Kept fixture-driven exposure tests by applying explicit user override mappings in tests instead of relying on preset fallback to map non-platform fields.
- Updated Migration mapper prompt docs so preset fallback is documented as source-confirmed field support, not a high-confidence demo mapping template.

## Validation

- `pnpm --filter @duedatehq/server test -- _service.test.ts`
- `pnpm check`
