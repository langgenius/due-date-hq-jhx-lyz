---
title: 'Obligation Risk Evidence Readable Fields'
date: 2026-05-05
author: 'Codex'
---

# Obligation Risk Evidence Readable Fields

## Context

The obligation detail drawer exposed several implementation identifiers in user-facing risk and
evidence surfaces, including penalty formula versions, facts versions, snake_case source types, raw
JSON payloads, and stored penalty input keys. Those values are useful for debugging, but they are
not readable enough for practice users reviewing why a penalty estimate changed.

## Change

- Hid penalty formula and facts version ids from the Risk tab while preserving the user-facing
  formula label and input state.
- Replaced stored penalty input keys such as `partnerCount`, `penaltyMonths`, and
  `monthlyRateCents` with readable labels and currency formatting.
- Replaced inline `penalty_override` evidence rows with a plain-language "Penalty input" summary
  and key before/after fields.
- Reused the audit label model in the obligation Audit tab so actions display as user-facing event
  names instead of database action ids.

## Validation

- `pnpm --filter @duedatehq/app exec vp check src/routes/obligations.tsx`
- `pnpm --filter @duedatehq/app test -- src/routes/obligations.test.ts src/features/audit/audit-log-model.test.ts`
- `pnpm --filter @duedatehq/app i18n:compile`
