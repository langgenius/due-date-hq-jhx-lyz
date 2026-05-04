# I18n Strict Catalog Fix

## Summary

- Synced Lingui catalogs after extraction introduced the `Explain {label}` concept-help message.
- Added missing `zh-CN` translations for concept-help labeling and dashboard severity labeling so
  strict catalog compilation can pass.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
