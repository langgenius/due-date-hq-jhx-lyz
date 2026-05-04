---
title: 'Dashboard needs-review resolve action'
date: 2026-05-03
area: dashboard
---

## Context

The dashboard metric strip showed the firm-wide `Needs review` count, but users had to know that the
matching operational surface was the Obligations review filter. The Figma node `348:12` adds a
right-aligned `Resolve` action to that card.

## Changes

- Added a compact `Resolve` button to the dashboard `Needs review` metric card.
- Routed the action to `/obligations?status=review`, matching the dashboard summary calculation where
  `needsReviewCount` is counted from obligations with `status === 'review'`.

## Design Alignment

- Kept the card structure, typography scale, and color tokens from the current dashboard metric
  strip while matching the Figma placement and accent text treatment.
- No product docs needed changes: `docs/dev-file/03-Data-Model.md` already defines dashboard needs
  review as `status='review'`.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app build`
- `pnpm check` currently fails on pre-existing formatting issues in
  `apps/app/src/features/workload/workload-page.tsx` and `packages/auth/src/auth.test.ts`.
