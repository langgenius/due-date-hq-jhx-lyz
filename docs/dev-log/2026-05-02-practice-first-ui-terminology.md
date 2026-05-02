---
title: 'Practice-first UI terminology'
date: 2026-05-02
---

# 2026-05-02 · Practice-first UI terminology

## Context

The data model still uses Better Auth `organization` plus app-owned `firm_profile`, with
`firmId == organization.id == firm_profile.id`. That remains the correct persistence boundary, but
the product UI should not make normal CPA users reason about multiple firms or auth organizations.

## Changes

- AppShell now treats the sidebar tenant header as practice identity. A single-practice user sees
  static identity chrome with no chevron and no switch hotkey registration; multi-practice users
  still get the switcher, labeled `Practices`.
- Removed the app-shell create-second-firm entry. Onboarding and backend recovery paths can still
  create a practice, but the protected app no longer promotes that as a primary workflow.
  Superseded later on 2026-05-02: the switcher keeps a secondary, plan-gated `Add practice`
  action for Firm entitlement discovery, but single-practice product copy remains Practice-first.
- Reworded visible app UI from firm/organization/tenant/workspace language to Practice where the
  text describes the customer tenant. Internal route names, RPC contracts, DB concepts, and audit
  action keys stay unchanged.
- Renamed the visible `plan === 'firm'` tier to `Scale` while preserving the stored enum value.
  This naming was superseded later on 2026-05-02 by the Firm entitlement/pricing closure: the
  stored enum remains `firm`, and the visible paid tier is now `Firm`.
- 2026-05-02 follow-up: Practice profile is now routed at `/practice`; the old `/firm` URL is not
  kept as a compatibility alias.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test -- --run src/router.test.ts src/features/audit/audit-log-model.test.ts`
- `pnpm check`
