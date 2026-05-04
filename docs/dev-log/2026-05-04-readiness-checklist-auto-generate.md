# 2026-05-04 Readiness Checklist Auto Generate

## Summary

The Workboard obligation detail drawer no longer opens the Readiness tab into a blank checklist when
there is enough plan access to generate one. It now treats generated checklist evidence as the
persisted draft source and only auto-generates when the obligation has no readiness request and no
stored generated checklist.

## Shipped

- Reused `readiness_checklist_ai` evidence as a recoverable checklist draft in
  `apps/app/src/routes/workboard.tsx`.
- Added an auto-generation query for the drawer's first empty readiness state, with infinite stale
  time and focus/reconnect refetch disabled so opening the same obligation does not repeatedly
  generate.
- Kept manual `Generate checklist` as the explicit refresh path and reused the existing generated
  checklist evidence after drawer reopen.
- Updated SPA module and user manual docs to describe the automatic checklist behavior.

## Validation

- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/app test`
- `pnpm check`

`pnpm --filter @duedatehq/app test -- workboard` was also tried, but there are no matching
`workboard` app test files, so `vp test` exits with code 1 for that filter.
