# 2026-05-02 · Migration upload continue gate

## Context

After selecting a file in Migration Step 1, the footer Continue button could remain disabled without
enough feedback about whether the file was still being read, had failed to read, or contained no
data rows.

## Change

- Added an explicit file-reading state to `apps/app/src/features/migration/Step1Intake.tsx`.
- Cleared the previous parsed row count at upload start so Continue only re-enables after the new
  file produces `rowCount >= 1`.
- Added file-read failure and no-data-row error paths so empty or header-only uploads explain why
  Continue stays disabled.
- Stopped the hidden file input click from bubbling back into the upload zone.
- Fixed the intake reducer so an explicit `fileName: null` clears upload metadata when the user
  switches back to pasted data.
- Updated the Migration Copilot UX spec for the Step 1 upload validating state.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec vp check apps/app/src/features/migration/Step1Intake.tsx apps/app/src/features/migration/state.ts apps/app/src/features/migration/state.test.ts`
- `pnpm --filter @duedatehq/app test -- --run src/features/migration/state.test.ts`
- `pnpm --filter @duedatehq/app build`
- `git diff --check`
