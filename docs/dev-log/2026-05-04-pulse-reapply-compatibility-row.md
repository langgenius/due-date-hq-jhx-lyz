# 2026-05-04 · Pulse reapply compatibility row

## What changed

- Fixed `pulse.apply` after undo/reactivation so it reuses the reverted `pulse_application`
  compatibility row instead of inserting a second row for the same firm / pulse / obligation.
- Kept each reapply as a fresh overlay application, evidence link, audit event, and digest outbox
  entry. Only the compatibility row is reactivated to respect `uq_pulse_application_obligation`.
- Added DB repo coverage for reapplying after undo so the existing application id is returned and
  the batch performs an update rather than a duplicate insert.

## Validation

- `pnpm --filter @duedatehq/db test -- pulse`
- `pnpm check`

## Notes

- No DESIGN.md or product-design update was needed. This is a backend idempotency fix inside the
  existing Pulse lifecycle contract.
