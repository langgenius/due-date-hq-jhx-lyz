---
title: 'E2E practice copy drift'
date: 2026-05-02
author: 'Codex'
area: e2e
---

# E2E practice copy drift

## Context

Local `pnpm test:e2e` failed after the product UI finished moving user-facing organization copy from
`Firm` to `Practice`, and after Billing success started showing title-cased plan names. The failed
specs were:

- `authenticated-shell.spec.ts`
- `billing-success.spec.ts`
- `clients.spec.ts`
- `firm-switch.spec.ts`

The app behavior was present and the failures were assertion drift, not product regressions.

## Changes

- Updated command palette coverage to assert `Practice profile`.
- Updated Billing success coverage to assert the webhook-backed alert and title-cased `Pro` badge.
- Updated Clients filtered-empty coverage to assert `practice directory`.
- Updated firm switching coverage to assert `Practice profile`, `Practice name`, and
  `Active practice summary`.
- Updated `e2e/README.md` to match the current Practice Profile surface name.

## Why

Playwright coverage should track stable user-visible behavior through accessible role and label
queries. These tests were still validating the right workflows, but they used stale copy from before
the practice terminology pass.

No `DESIGN.md` or `docs/dev-file/07-DevOps-Testing.md` update is required because this did not
change product behavior, the E2E harness, seed routes, Playwright config, or CI semantics.

## Validation

- `pnpm test:e2e e2e/tests/authenticated-shell.spec.ts e2e/tests/billing-success.spec.ts e2e/tests/clients.spec.ts e2e/tests/firm-switch.spec.ts`
- `pnpm test:e2e`
