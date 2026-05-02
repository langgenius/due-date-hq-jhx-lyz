# Shared Badge 11px Token

## Context

The shared `Badge` primitive should read as a compact metadata chip across the app, aligned with
the 11px metadata/table-header tier rather than the 12px secondary-text tier.

## Change

- Changed the shared `text-badge` runtime token from 12px to 11px.
- Kept the `Badge` primitive on `text-badge` so default and mono badge call sites inherit the
  project-wide size without per-feature overrides.
- Updated `DESIGN.md` and the long-form design system typography table to keep the documented
  badge typography aligned with runtime tokens.

## Validation

- `pnpm design:lint`
- `pnpm exec tsc -p packages/ui/tsconfig.json --noEmit`
