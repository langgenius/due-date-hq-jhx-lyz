# 2026-05-06 Rule Review Obligation Generation

## Change

- Fixed the onboarding order where clients imported before rule review did not receive obligations
  after rules became active.
- Added rule-accept obligation generation that scans existing client filing profiles, previews the
  newly accepted active rules, creates missing rule-backed obligations, writes verified-rule
  evidence, and records an `obligation.batch_created` audit event.
- Bulk rule accept now runs generation once for the accepted set instead of once per rule, preserving
  duplicate protection by client, jurisdiction, rule, tax year, and period.

## Notes

- Imported clients keep `generation_source = migration` and their original `migration_batch_id` so
  the existing migration revert path still removes generated deadlines for that batch.
- Clients or filing profiles without tax types are not backfilled because the rules engine requires
  tax-type facts to select applicable rules.

## Validation

- Added focused Vitest coverage for generation on accepted CA rules, duplicate skipping, and profiles
  without tax types.
