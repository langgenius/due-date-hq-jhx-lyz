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

## Docs Check

No DESIGN.md or product documentation update was needed. This is a demo-only auth/testing
affordance behind the existing `/api/e2e` access rules and does not change production billing
behavior.

## Validation

- `pnpm --filter @duedatehq/server test -- src/app.test.ts`
- `pnpm --filter @duedatehq/app test -- src/components/patterns/app-shell-user-menu.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
- `pnpm db:seed:demo`
- Local D1 select confirmed Sofia Solo, Priya Pro, and Taylor Team with solo/pro/team plans.
