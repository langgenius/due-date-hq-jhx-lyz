# 2026-05-01 · AlertDialog overlay dismissal

## Context

All app confirmation dialogs use the shared `@duedatehq/ui` AlertDialog wrapper. Base UI keeps
alert dialogs non-dismissible on outside press by default, so clicking the backdrop did not close
these confirmation dialogs.

## Change

- Updated `packages/ui/src/components/ui/alert-dialog.tsx` to keep the dialog `actionsRef` in a
  local context and close the active alert dialog when its overlay is clicked.
- Kept existing controlled `open` / `onOpenChange` behavior intact by using Base UI's imperative
  close action instead of mutating app state directly.
- Added a focused app-level Vitest covering overlay click dismissal.

## Validation

- `pnpm --filter @duedatehq/app test -- alert-dialog-overlay-close`
