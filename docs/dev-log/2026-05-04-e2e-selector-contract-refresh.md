---
title: '2026-05-04 · E2E selector contract refresh'
date: 2026-05-04
author: 'Codex'
---

# E2E selector contract refresh

## Background

GitHub Actions run 25308172753 was not directly accessible from the local GitHub tooling, so the
E2E failures were reproduced with the local Playwright suite. The failures were caused by UI copy,
seed data, and accessibility role drift after recent product changes rather than a single runtime
regression.

## Changes

- Updated login page selectors to accept the current welcome heading and email field label.
- Refreshed billing, members, and RBAC assertions for the current Pro seat limit and permission
  surfaces.
- Made obligations row helpers cover both full table rows and dashboard triage buttons.
- Updated Pulse and migration wizard assertions for current dashboard copy.
- Adjusted Rules Console E2E setup to use seeded obligations data, explicit status filters, and a
  selected preview client before running simulations.

## Verification

- `pnpm test:e2e e2e/tests/rbac-permissions.spec.ts e2e/tests/billing-checkout.spec.ts`
- `pnpm test:e2e`
