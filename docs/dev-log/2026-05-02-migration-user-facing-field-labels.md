# 2026-05-02 · Migration user-facing field labels

## Context

Migration Step 2 displayed internal mapping target names such as `client.name` and `client.ein` in
the table and edit menu. Those values are contract/database-facing identifiers, not user-facing
labels.

## Change

- Added a migration mapping display helper that keeps internal target values separate from labels.
- Updated Step 2 mapping rows and the edit dropdown to show labels such as `Client name`, `EIN`,
  `Entity type`, `Tax types`, and `Assignee`.
- Humanized migration error messages so missing-name rows no longer expose `client.name`.
- Updated the Migration Copilot UX spec to reserve `client.*` names for internal contract/audit
  payloads only.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec vp check --fix apps/app/src/features/migration/Step2Mapping.tsx`
- `pnpm --filter @duedatehq/server test -- --run src/procedures/migration/_service.test.ts`
- `pnpm --filter @duedatehq/app build`
