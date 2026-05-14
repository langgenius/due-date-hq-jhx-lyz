# 2026-05-14 — Notification morning digest

## Decision

The adjacent DueDateHQ reference kept notification controls under Settings. In
this repo, the useful part is the personal morning digest, not the Settings IA.
The feature therefore lives in `/notifications` beside the personal inbox and
preference toggles.

## Boundary

- Notifications remains a personal arrival surface: inbox rows, per-user channel
  preferences, and the morning digest.
- Reminders remains the firm-level automation console for templates, 30/7/1-day
  schedule visibility, recent reminder delivery, and client suppressions.
- Rules > Pulse Changes remains the decision surface for apply / dismiss /
  snooze / revert. The digest can link to pending Pulse changes, but it does not
  execute Pulse lifecycle actions.
- No `/settings/notifications` alias, SMS channel, browser push, or Phase 2
  auto-send model was introduced.

## Implementation

- Added morning digest fields to `notification_preference`.
- Added `notification_digest_run` for queued / sent / skipped quiet / failed
  audit history.
- Added the `morning_digest` email outbox type and status propagation from
  outbox flush back to digest runs.
- Added a cron-driven `jobs/notifications` dispatcher that checks practice
  timezone, configured hour, configured weekdays, and quiet-day suppression.
- Added `/notifications` controls for digest enablement, hour, weekdays, preview,
  and recent run history.
- Added failed reminder reason visibility in `/reminders` recent delivery.

## Product note

The digest is not a second work queue. It is a concise personal email that earns
attention only when the user should enter an existing DueDateHQ surface:
Obligations for urgent deadlines, Rules > Pulse Changes for reviewed source
changes, and Reminders for delivery failures.
