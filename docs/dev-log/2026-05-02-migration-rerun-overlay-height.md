# 2026-05-02 · Migration re-run overlay height

## Context

Migration Step 2 kept the full mapping table in normal layout while the re-run AI transition overlay
was visible. The dialog therefore stayed at the table's capped height and showed an internal body
scrollbar even though the visible processing card fit comfortably without scrolling.

## Change

- Updated `apps/app/src/features/migration/WizardShell.tsx` so transition states use the processing
  card as the body height source.
- Kept the inactive step content mounted for state continuity, but moved it out of normal layout and
  disabled pointer interaction while a transition is active.
- Removed the absolute full-body overlay sizing that forced the processing card to inherit the
  scrolled Step 2 body height.

## Validation

- DESIGN.md and the Migration Copilot product docs remain aligned; this is a layout containment fix
  within the existing workbench modal and processing-state treatment.
- `pnpm exec vp check apps/app/src/features/migration/WizardShell.tsx docs/dev-log/2026-05-02-migration-rerun-overlay-height.md`
- `pnpm --filter @duedatehq/app build`
- `git diff --check`
