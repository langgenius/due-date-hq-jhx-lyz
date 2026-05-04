# 2026-05-04 · Provider export reality check

## Summary

- Reworded Migration Step 1 to distinguish normal provider CSV/XLSX exports from JSON handoff
  records, instead of implying universal direct API sync.
- Added a frontend provider capability registry for JSON handoff labels, tiers, and helper copy.
  Soraban is now shown as a Karbon/Zapier/uploaded-export path, not as a direct API commitment.
- Added review copy that generated obligations require supporting imported facts; missing entity,
  jurisdiction, tax type, tax year, payment, or extension facts remain in review.
- Tightened the Step 1 mode again after review: normal provider CSV/XLSX exports stay on
  Paste / Upload + preset, while the provider-specific choices are only for JSON handoff records
  from API/Zapier/converted reports.
- Updated Migration docs, the user manual, and the prior integration foundation log to preserve the
  reality-based export/handoff scope.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test --run src/features/migration/Step1Intake.test.ts`
- `pnpm --filter @duedatehq/app build`
- `pnpm check`
- Searched app/docs/packages for legacy direct-connect and full-calendar promise copy.
