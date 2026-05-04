# 2026-05-04 · Rules Preview — Real Client Facts

## Change

`/rules?tab=preview` now uses current firm client data instead of the old local demo presets.

- The client selector reads `clients.listByFirm`.
- The selected client's `entityType` and `state` seed the preview form.
- Tax types come from existing `obligations.listByClient` rows when present.
- Clients without generated obligations fall back to Default Matrix inference for the selected
  `(entityType, state)` pair.
- Clients without a usable state remain visible in the selector but cannot be selected for preview.

## Notes

`ClientPublic` does not store a canonical `taxTypes` array today. Existing obligations are the
closest persisted source of client-specific tax types; Default Matrix is the fallback for clients
that have facts but no generated obligations yet.

## Validation

- Passed: `pnpm --filter @duedatehq/app test -- --run src/features/rules/rules-console-model.test.ts`
- Passed: `pnpm check:fix apps/app/src/features/rules/generation-preview-tab.tsx apps/app/src/features/rules/rules-console-model.ts apps/app/src/features/rules/rules-console-model.test.ts docs/project-modules/14-user-manual.md docs/dev-log/2026-05-04-rules-preview-real-clients.md`
- Passed: `pnpm --filter @duedatehq/app i18n:extract`
- Passed: `pnpm --filter @duedatehq/app i18n:compile`
