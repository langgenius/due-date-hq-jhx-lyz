---
title: 'Demo Plan Accounts'
date: 2026-05-03
author: 'Codex'
area: auth
---

# Demo Plan Accounts

## Context

The live-demo account switcher covered four firm roles inside the Brightline Pro practice. Testing
plan-specific states still required manually mutating firm billing data.

## Change

- Added three seeded owner accounts for Solo, Pro, and Team plan testing:
  - Sofia Solo (`sofia.solo@duedatehq.test`) on `mock_firm_plan_solo`.
  - Priya Pro (`priya.pro@duedatehq.test`) on `mock_firm_plan_pro`.
  - Taylor Team (`taylor.team@duedatehq.test`) on `mock_firm_plan_team`.
- Seeded matching `firm_profile`, `organization`, `member`, and active `subscription` rows.
- Extended `/api/e2e/demo-login` with an `account=` parameter while preserving the existing
  `role=` flow for Brightline owner/manager/preparer/coordinator testing.
- Extended `/api/e2e/demo-accounts` to return account id, firm id, role, and plan so the existing
  left-sidebar account menu can switch across both role and plan test accounts.

## Follow-up Data Fill

- Expanded `mock/demo.sql` so the three plan-account firms are not empty after `pnpm db:seed:demo`.
- Added plan-specific clients and obligations:
  - Sofia Solo: 3 clients, 4 obligations.
  - Priya Pro: 4 clients, 6 obligations.
  - Taylor Team: 5 clients, 8 obligations.
- Added related demo records for Dashboard briefs, AI insight cache, evidence links, Pulse alert
  matches, import history, saved Obligations views, calendar subscriptions, readiness requests,
  audit packages, audit events, reminders, email outbox rows, notification preferences, in-app
  notifications, and client email suppressions.
- Added Pro and Team staff/pending-invite rows so Members and Team workload surfaces have more than
  a single owner row while Solo still respects the one-seat plan shape.

## Docs Check

No DESIGN.md or product-design update was needed. This is demo seed coverage only; `mock/README.md`
now calls out the plan-account data coverage.

## Validation

- `pnpm --filter @duedatehq/server test -- src/app.test.ts`
- `pnpm --filter @duedatehq/app test -- src/components/patterns/app-shell-user-menu.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
- `pnpm db:seed:demo`
- Local D1 select confirmed Sofia Solo, Priya Pro, and Taylor Team with solo/pro/team plans.
- `pnpm db:migrate:local`
- `pnpm db:seed:demo`
- Local D1 selects confirmed plan-account row counts after the data fill:
  - clients: Solo 3, Pro 4, Team 5.
  - obligations: Solo 4, Pro 6, Team 8.
  - Pulse alerts, dashboard briefs, import batches, audit events, notifications, readiness requests,
    saved Obligations views, and calendar subscriptions: at least one row per plan firm.
