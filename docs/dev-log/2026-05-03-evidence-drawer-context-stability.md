# 2026-05-03 · Evidence drawer context stability

## What changed

- Moved the Evidence drawer context and hook into `EvidenceDrawerContext.ts`, matching the
  existing Migration wizard pattern where the context identity lives outside the provider module.
- Updated Dashboard and Obligations to consume `useEvidenceDrawer` from the stable context module.

## Validation

- `pnpm check`
- `pnpm --filter @duedatehq/app test -- src/router.test.ts`
- `pnpm --filter @duedatehq/app build`
- `git diff --check`

## Notes

- This fixes the route-level failure where Dashboard could render with a stale or unmatched
  `EvidenceDrawerContext` identity and throw
  `useEvidenceDrawer must be used within EvidenceDrawerProvider`.
