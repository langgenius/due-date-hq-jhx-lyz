# 2026-05-01 · Pulse undo reactivation loop

## What changed

- Changed Pulse undo semantics so `pulse.revert` still writes application/evidence/audit rollback
  rows, but the firm alert returns to `matched` and refreshes its matched / needs-review counts.
- Added `pulse.reactivate` for historical `reverted` alerts so users can reopen an old closed alert
  from `/alerts`, review it, and apply it again.
- Updated the Pulse drawer to show `Reactivate / Re-apply` only for `reverted` alerts; source-revoked
  alerts remain non-actionable.
- Updated Pulse contracts, ports, audit action unions, and dashboard brief reason strings for the new
  lifecycle action.

## Validation

- `pnpm --filter @duedatehq/db test -- pulse`
- `pnpm --filter @duedatehq/contracts test -- contracts`
- `pnpm --filter @duedatehq/app test -- pulse`
- `pnpm --filter @duedatehq/server test -- pulse`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`

## Notes

- DESIGN.md did not require new tokens or layout rules. The action uses the existing drawer footer
  button pattern and the same icon treatment as Undo.
