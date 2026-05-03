---
title: 'Demo Role Switcher'
date: 2026-05-03
author: 'Codex'
area: auth
---

# Demo Role Switcher

## Context

The demo seed already includes Sarah, Miguel, Avery, and Jules as active members of the
Brightline demo practice, but the live-demo login path always created a Sarah owner session.
That made Manager, Preparer, and Coordinator permission checks hard to test from the app shell.

## Change

- Extended the demo login route to accept `role=owner|manager|preparer|coordinator`.
- Added a demo accounts probe under `/api/e2e/demo-accounts`.
- Added a left-sidebar account-menu switcher that appears only for `mock_user_*` sessions when
  the demo probe is available.
- Kept the feature behind the existing `/api/e2e` access rules: development is open, staging
  requires the E2E seed token, and production stays unavailable.

## Docs Check

No DESIGN.md or product documentation update was needed. This is a demo-only auth/testing affordance
and does not change the production account or role-management product surface.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm test`
- `pnpm check`
- `pnpm db:migrate:local`
- `pnpm db:seed:demo`
