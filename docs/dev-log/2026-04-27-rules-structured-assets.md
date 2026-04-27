# 2026-04-27 · Rules Structured Assets

## Context

The rules product design now needs a project-level structured asset, not only a
documented plan. The MVP scope remains Federal plus CA, NY, TX, FL, and WA.

## Changes

- Added `@duedatehq/core/rules` as the first pure domain rules asset.
- Added a structured `RuleSource` registry with official source URLs, acquisition
  methods, watch cadence, priority, health status, and notification channels.
- Added a structured `ObligationRule` seed pack with verified Federal, CA, NY,
  TX, FL, and WA rules plus one Federal disaster relief candidate watch.
- Added coverage and filtering helpers for Rules Console reads.
- Added `packages/contracts/src/rules.ts` and `apps/server/src/procedures/rules/index.ts`
  so the rules asset is available through `rules.listSources`, `rules.listRules`,
  and `rules.coverage`.
- Added tests that enforce official source hosts, unique IDs, source linkage,
  MVP jurisdiction coverage, and the boundary that user reminders do not come
  directly from source watches or candidates.
- Updated the rules product docs so they point to the implemented core asset.

## Product Decisions

- The first implementation is a pure core asset, not a D1 migration.
- Candidate rules stay visible to internal review but are excluded from default
  rule reads.
- User deadline reminders remain downstream of verified obligation rules only.
- FEMA remains early warning; it cannot become a tax deadline source by itself.
- CA Form 568, TX PIR/OIR, FL F-1120, and WA excise rules preserve manual or
  source-defined boundaries where the official source depends on classification,
  taxable-year-end tables, filing frequency, or entity facts.

## Validation

- `pnpm --filter @duedatehq/core test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/server test`
- `pnpm format`
- `pnpm check` (passes with an existing `packages/ui/src/lib/placement.ts`
  warning)
