# 2026-05-02 · Migration upload drag affordance

## Context

Migration Step 1 accepted drag-and-drop uploads, but the upload zone did not visually respond while
a CSV / TSV / XLSX file was being dragged over it.

## Change

- Added a file-drag active state in `apps/app/src/features/migration/Step1Intake.tsx`.
- Swapped the upload zone to the existing accent tokens while active: purple-tinted background,
  accent border, accent text, and accent upload icon.
- Tracked nested drag enter/leave depth so the active state does not flicker when moving over the
  icon or text inside the drop zone.
- Updated the Migration Copilot UX token map with the upload-zone drag-active state.

## Validation

- `pnpm --filter @duedatehq/app build`
