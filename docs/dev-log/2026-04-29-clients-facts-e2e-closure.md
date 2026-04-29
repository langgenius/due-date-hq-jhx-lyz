---
title: 'Clients facts e2e closure'
date: 2026-04-29
author: 'Codex'
---

# Clients facts e2e closure

## Context

The Clients surface had browser coverage for shell navigation and manual client
creation, but the new facts workbench needed product-loop coverage for the data
that feeds rules, Workboard accountability, Dashboard risk, and Pulse matching.

## Changes

- Extended `e2e/pages/clients-page.ts` with stable actions and locators for
  entity/state filters, KPI cards, filtered empty state, and the Fact Profile
  Sheet.
- Expanded `e2e/tests/clients.spec.ts` with seeded `workboard` coverage:
  - readiness KPI summary for four ready manual clients
  - row-level facts for source, entity, jurisdiction, owner, and unassigned owner
  - entity/state/search URL filters plus no-results empty state
  - Fact Profile Sheet inspection for seeded identity and readiness facts
- Updated e2e and DevOps testing docs to list Clients facts as a closed product
  e2e loop, not only a protected route smoke test.

## Validation

- `pnpm exec playwright test e2e/tests/clients.spec.ts --reporter=list`
- `pnpm test:e2e --reporter=list`
- `pnpm check`
- `pnpm test`
- `pnpm build`

## Follow-ups

- Add a dedicated Clients seed for missing required facts so the warning/readiness
  path can be tested without destabilizing Workboard fixtures.
- Add import convergence coverage from `/clients` into Migration apply, then back
  to Clients and Workboard to prove imported and manual clients share the same
  product model.
