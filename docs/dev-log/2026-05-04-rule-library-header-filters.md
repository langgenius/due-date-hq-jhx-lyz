# 2026-05-04 · Rule Library header filters

Area: rules

## Change

- Added Rule Library header multi-filters for `JUR`, `ENTITY`, `TIER`, and `STATUS`.
- Changed Rule Library to fetch the full candidate-inclusive rule list once, then apply quick chips
  and header filters client-side.
- Removed the old top-right jurisdiction select to avoid duplicating the `JUR` header filter.
- Replaced `Show all` expansion with local 25-row pagination for the candidate-heavy library.

## Verification

- `pnpm check:fix apps/app/src/features/rules/rule-library-tab.tsx apps/app/src/features/rules/rules-console-primitives.tsx docs/dev-log/2026-05-04-rule-library-header-filters.md`
