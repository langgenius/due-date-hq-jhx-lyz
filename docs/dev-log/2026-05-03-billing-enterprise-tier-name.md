---
title: 'Billing Enterprise tier name'
date: 2026-05-03
author: 'Codex'
area: billing
---

# Billing Enterprise tier name

## Context

The third billing tier was visibly named `Firm`, while the product and codebase already use
`firm` for the tenant/workspace boundary. That made billing copy collide with internal and
management-language nouns.

## Decision

- The customer-facing third tier is now `Enterprise`.
- The stored plan enum remains `firm`; no data migration is needed.
- Billing, checkout, success, sidebar plan status, practice summary, Team Workload paid copy,
  public pricing, and entitlement docs use the Enterprise label.
- The Billing page payment model copy now stacks its provider/webhook notes in a single reading
  column instead of splitting short explanatory text across two columns.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test -- --run src/features/billing/model.test.ts`
- `pnpm --filter @duedatehq/marketing check`
- `pnpm --filter @duedatehq/app build`
