# 2026-05-03 · Calendar ICS Subscription

## Summary

- Added lightweight one-way calendar subscriptions for DueDateHQ deadlines.
- Added Calendar sync as a Workboard secondary page with `My deadlines` and Owner/Manager-only
  `Firm-wide calendar` feeds.
- Added tokenized `/api/ics/:token` feed generation for Google Calendar, Apple Calendar, and
  Outlook subscription flows.

## Implementation

- Added `calendar_subscription` D1 schema and migration `0025_modern_leo.sql`.
- Added calendar contract, ports, scoped repo wiring, oRPC handlers, and signed calendar tokens.
- Added ICS rendering with stable obligation UIDs, all-day events, deep links, escaped fields,
  and 30/7/1-day display alarms as best-effort external reminders.
- Added privacy modes: redacted client names by default, optional full client names.
- Fixed the shared Select layout so popups expand to fit option labels while trailing check
  indicators keep their own space.
- Updated the Calendar page's Workboard shortcut to use the primary blue button style.
- Calendar subscription URLs now use the Worker/API origin (`AUTH_URL`) instead of the SPA origin
  (`APP_URL`), so local Apple Calendar subscriptions open `localhost:8787` directly instead of
  `localhost:5173`.
- Calendar feed URLs now include a `.ics` suffix while the route continues to accept the previous
  suffixless token URL.
- Empty calendar feeds now emit a non-event `VFREEBUSY` component so the `VCALENDAR` still has at
  least one standards-compliant calendar component and Apple Calendar can accept newly created
  feeds before deadlines exist.
- Calendar sync now uses `/workboard/calendar` as the canonical app URL. The old `/calendar`
  route redirects there, and the sidebar no longer lists Calendar as an Operations peer.

## Validation

- `pnpm db:generate`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm test`
- `pnpm check`
- `pnpm check:deps`
- `pnpm build` (completed; Wrangler dry-run emitted a sandbox log-file `EPERM` warning before
  continuing)
- `pnpm check` after Select layout fix
- `pnpm --filter @duedatehq/server test -- calendar`
- `pnpm --filter @duedatehq/app test -- calendar`
- `pnpm check` after Workboard shortcut style update
- `pnpm --filter @duedatehq/server test -- calendar`
- `pnpm --filter @duedatehq/server test -- ics`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test -- router calendar`
- `pnpm check`
- `pnpm test:e2e e2e/tests/authenticated-shell.spec.ts --project=chromium --workers=1`
- `pnpm test:e2e e2e/tests/workboard.spec.ts --project=chromium --workers=1`
