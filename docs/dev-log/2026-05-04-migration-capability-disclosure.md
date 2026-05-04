# 2026-05-04 · Migration capability disclosure

## Context

Migration mapping already tried AI first and only used preset mapping as a fallback, but the user
could not reliably tell which capability produced the current Step 2 mapping. Preset selection in
Step 1 also looked like an optional source label without explaining that it feeds AI context and
fallback behavior.

## Change

- Added a Step 1 helper explaining that AI Mapper runs first and preset provides source context plus
  fallback mapping when AI is unavailable.
- Added a Step 2 capability badge for `AI Mapper`, `Preset mapping`, and `Manual mapping`.
- Set the three Step 2 capability badges to the same red/destructive treatment and moved each
  capability explanation into a red question-mark tooltip next to the active badge.
- Changed the AI-unavailable fallback alert to destructive/red so the fallback title, explanation,
  and ignored-column count match the degraded state.
- Alphabetized the Step 2 Edit mapping options by visible label while keeping `Ignore this column`
  separated at the end.
- Updated the Migration Copilot UX spec to require capability disclosure in both steps.
- Added focused component coverage for the Step 2 capability labels.

## Validation

- DESIGN.md remains aligned; this uses existing badge, alert, icon, and typography primitives.
- `pnpm --filter @duedatehq/app test -- --run src/features/migration/Step2Mapping.test.tsx`
