# 2026-05-02 · Notifications and Pulse alert closure

## What changed

- Added `pulse_alert` as an in-app notification type.
- Pulse approval fan-out now writes Owner / Manager in-app notifications when their in-app and
  Pulse preferences are enabled.
- Notification center rows now show semantic type labels and expose an `Open` action that marks
  unread rows read before following their `href`.
- `/alerts?alert=<id>` opens the Pulse detail drawer directly, so notification deep links land on
  the exact regulatory alert.
- Changed the sidebar Alerts icon from `Bell` to `RadioTower`; the top-right `Bell` remains the
  personal notification inbox.
- Added Notifications to Cmd-K Navigate and aligned the Alerts command icon with the sidebar
  `RadioTower` treatment.

## Product boundary

- Notifications are personal arrival events: reminders, overdue items, audit package readiness,
  system messages, and Pulse arrival pings.
- Alerts are the firm-level Pulse decision surface: review, apply, dismiss, snooze, undo, and
  reactivation stay there with evidence and audit trails.

## Validation

- `pnpm --filter @duedatehq/contracts test -- contracts`
- `pnpm --filter @duedatehq/db test -- pulse`
- `pnpm --filter @duedatehq/server test -- pulse`
- `pnpm --filter @duedatehq/app test -- pulse`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
- `pnpm test`
- `pnpm test:e2e`

## Notes

- No database migration was required for the new notification type because the SQLite column is a
  text enum in the Drizzle schema, not a database-level check constraint.
- DESIGN.md, frontend architecture, system architecture, module docs, and demo playbook were updated
  to keep the notification-vs-alert product language aligned.
