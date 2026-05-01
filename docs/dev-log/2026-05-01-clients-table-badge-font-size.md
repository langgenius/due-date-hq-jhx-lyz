# Shared Badge Font Size

## Context

The Clients page table rendered the Readiness and Source badges at the shared badge default
of 11px, which was too small for those table cells. This is better handled in the shared Badge
primitive so badge typography stays consistent across the app.

## Change

- Added a dedicated `text-badge` token at 12px and changed the shared `Badge` primitive default
  from `text-xs` (11px) to that token.
- Removed the temporary Clients table local overrides so the table uses the shared Badge default.
- Updated `DESIGN.md` and the long-form design system typography table so badge typography matches
  the runtime token.

## Validation

- `pnpm exec vp check packages/ui/src/components/ui/badge.tsx apps/app/src/features/clients/ClientFactsWorkspace.tsx docs/dev-log/2026-05-01-clients-table-badge-font-size.md`
- `pnpm exec tsc -p packages/ui/tsconfig.json --noEmit`
- `pnpm exec tsc -p apps/app/tsconfig.json --noEmit`
- Pending: `pnpm design:lint`
