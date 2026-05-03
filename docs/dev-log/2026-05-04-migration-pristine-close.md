# 2026-05-04 · Migration pristine close

## Context

The Migration Wizard always opened the discard confirmation when the user clicked Close, pressed
Esc, or dismissed the modal from the backdrop. That was correct once the wizard had pasted data,
uploaded file metadata, source choices, batch state, AI results, or preview output, but it made an
empty open-and-close path feel unnecessarily heavy.

## Change

- Added an explicit `hasDiscardableWizardWork` state predicate and passed it into the wizard shell.
- Kept the existing discard confirmation for any entered data, selected source/preset/provider,
  previous import choice, later step, batch, AI result, preview, or error state.
- Let Close / Esc / backdrop close the wizard directly when the state is still pristine.
- Updated the Migration Copilot UX docs and keyboard delta notes to match the conditional behavior.

## Validation

- DESIGN.md remains aligned; this is a behavior guard inside the existing modal/alert-dialog pattern
  and does not change visual tokens or layout rules.
- `pnpm --filter @duedatehq/app test -- --run src/features/migration/state.test.ts src/features/migration/WizardShell.test.tsx`
- `pnpm exec vp check apps/app/src/features/migration/Wizard.tsx apps/app/src/features/migration/WizardShell.tsx apps/app/src/features/migration/WizardShell.test.tsx apps/app/src/features/migration/state.ts apps/app/src/features/migration/state.test.ts docs/product-design/migration-copilot/02-ux-4step-wizard.md docs/product-design/migration-copilot/09-design-system-deltas.md docs/dev-log/2026-05-04-migration-pristine-close.md`
