# 2026-05-13 — Reminders operations loop

## Decision

Reminders is now a first-level Operations surface at `/reminders`, not a
Settings subsection and not part of the personal notification inbox.

## Boundary

- Rules decide which obligations are reminder-ready.
- Obligations remain the concrete deadline work queue.
- Reminders owns firm-level automation: templates, schedule visibility, recent
  delivery status, and client email suppression.
- Notifications remains the personal inbox and user preference surface behind
  the app-shell bell.

## Implementation

- Added `reminder_template` with firm overrides over built-in system defaults.
- Added a tenant-scoped `reminders` repo and oRPC contract/procedures.
- The reminder cron now renders member/client emails through resolved templates
  instead of hard-coded client copy.
- Email outbox flushing now propagates sent/failed state back to `reminder`.
- Added the `/reminders` page, sidebar navigation entry, route summary, and
  Command Palette entry.

## Product note

The page intentionally shows the four control points needed for a closed loop:
active templates, upcoming 30/7/1-day reminders, recent delivery, and client
email suppressions. It avoids a generic "settings" page so the automation stays
anchored to deadline operations.
