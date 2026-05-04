# 2026-05-04 · Rules Sources row links

Area: rules

## Change

- Updated `SourcesTab` so the visible source title/id is a native outbound link to the exact
  `RuleSource.url`, matching the trailing external-link icon.
- Kept the row-level click handler as a larger mouse target, but the primary visible source text
  no longer depends on the programmatic `window.open` path.
- Added header multi-filters for `JUR`, `TYPE`, `CADENCE`, and `METHOD`; Sources now fetches the
  full source registry once and applies health + header filters client-side.

## Verification

- `pnpm check:fix apps/app/src/features/rules/sources-tab.tsx docs/dev-log/2026-05-04-rules-sources-row-links.md`
