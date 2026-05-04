# Obligations list output validation

## Context

`obligations.listByClient` returned HTTP 500 from oRPC output validation after the
obligation public contract gained generation metadata fields. The endpoint maps
database rows through `toObligationPublic`, so legacy rows and rows with accrued
penalty calculation must still emit every required public field.

## Changes

- Kept generation metadata (`ruleId`, `ruleVersion`, `rulePeriod`, `generationSource`)
  normalized to `null` for legacy obligation rows.
- Added a regression test for the list-style serializer path where client facts are
  present and accrued penalty is calculated before contract validation.

## Validation

- `pnpm --filter @duedatehq/server test -- src/procedures/obligations/_service.test.ts`
- `pnpm --filter @duedatehq/contracts test -- src/contracts.test.ts`

No DESIGN.md update was needed because this is a server serialization contract fix.
