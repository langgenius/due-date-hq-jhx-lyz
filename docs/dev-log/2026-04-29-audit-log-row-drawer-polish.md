# 2026-04-29 · Audit log row and drawer polish

## Context

Audit log detail review was inconsistent with other operational tables: users had
to target the small eye icon in the Detail column, while Rules Console and other
workbench tables open detail drawers from the whole row. The audit drawer also
discarded its Sheet subtree as soon as the selected event disappeared, which
made the transition lifecycle feel abrupt.

## Change

- Made each audit event row a keyboard-accessible row button. Click, Enter, and
  Space all open the event detail drawer.
- Replaced the interactive eye button with the same passive trailing chevron
  affordance used by rule rows, avoiding nested interactive controls inside the
  clickable row.
- Kept the audit Sheet mounted and retained the last rendered event while the
  drawer closes, so Base UI can run its open/close transition instead of
  remounting from `null`.

## Validation

- `pnpm --filter @duedatehq/app exec tsc --noEmit --pretty false`
- `pnpm --filter @duedatehq/app test -- audit-log`
