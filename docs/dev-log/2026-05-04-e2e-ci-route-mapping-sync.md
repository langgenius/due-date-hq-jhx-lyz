---
title: '2026-05-04 · E2E CI route and mapping sync'
date: 2026-05-04
author: 'Codex'
---

# E2E CI route and mapping sync

## What changed

- Updated the authenticated shell E2E command-palette assertion to expect `Notifications`, matching
  the current navigation surface.
- Updated Pulse E2E navigation and notification deep-link assertions from the removed `/alerts`
  route to `/rules?tab=pulse`.
- Adjusted migration wizard E2E fixtures to use TaxDome-supported `Account Name`, `State`, and
  `Type` columns as tabular paste input.
- Added a migration page helper for user-edited mapping rows so the exposure test can explicitly
  map `Estimated Tax Due` and `Owner Count`.

## Boundary

This is a test-contract sync to existing UI routes and migration mapping behavior. No product route
alias, copy, or design documentation change was required.

## Validation

- `E2E_REUSE_EXISTING_SERVER=1 pnpm test:e2e e2e/tests/pulse.spec.ts --project=chromium`
- `E2E_REUSE_EXISTING_SERVER=1 pnpm test:e2e e2e/tests/migration-wizard.spec.ts --project=chromium`
- `E2E_REUSE_EXISTING_SERVER=1 pnpm test:e2e e2e/tests/authenticated-shell.spec.ts e2e/tests/migration-wizard.spec.ts e2e/tests/pulse.spec.ts --project=chromium`
