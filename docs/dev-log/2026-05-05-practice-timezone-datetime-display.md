---
title: 'Practice timezone datetime display'
date: 2026-05-05
author: 'Codex'
---

# Practice Timezone Datetime Display

## Context

Firm-scoped operational surfaces were mixing practice-local datetimes with browser-local
datetimes. The issue was most visible on the Evidence drawer in a non-US browser timezone, where
system timestamps rendered as `GMT+8` even though the active practice profile owns the intended
timezone.

## Change

- Added `PracticeTimezoneProvider` / `usePracticeTimezone()` under the protected app layout, backed
  by a lightweight firm timezone model.
- Updated system timestamp displays across account security, notifications, calendar sync,
  migration history/intake, temporary rules, evidence, obligations detail, members invitations, and
  audit change summaries to use the practice timezone.
- Kept date-only/manual business dates unchanged: due dates, readiness ETA dates, rule effective
  dates, and date pickers continue to display/submitted as `YYYY-MM-DD`.
- Made `formatDateTimeWithTimezone(value, timeZone)` require an explicit timezone so future
  datetime displays cannot silently fall back to the browser-local timezone.
- Documented the rule in the frontend architecture guide.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app exec vp check src/features/firm/timezone-model.ts src/features/firm/timezone-select.tsx src/features/firm/practice-timezone.tsx src/routes/_layout.tsx src/routes/account.security.tsx src/features/notifications/notifications-page.tsx src/features/calendar/calendar-page.tsx src/features/migration/ImportHistoryDrawer.tsx src/features/rules/temporary-rules-tab.tsx src/features/evidence/EvidenceDrawerProvider.tsx src/routes/obligations.tsx src/features/migration/Step1Intake.tsx src/features/members/member-model.ts src/features/members/members-page.tsx src/features/members/member-model.test.ts src/features/audit/audit-log-model.ts src/features/audit/audit-change-view.ts src/features/audit/audit-log-page.tsx src/features/clients/ClientFactsWorkspace.tsx src/components/patterns/app-shell-nav.tsx src/routes/practice.tsx src/lib/utils.ts`
- `pnpm --filter @duedatehq/app test -- src/lib/utils.test.ts src/features/members/member-model.test.ts src/features/members/members-page.test.tsx src/features/audit/audit-log-model.test.ts`
- Browser verification on `/obligations`: Evidence drawer timestamps rendered as `EDT`, with no
  `GMT+8` instances.
