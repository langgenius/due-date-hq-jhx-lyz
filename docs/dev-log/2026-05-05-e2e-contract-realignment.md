---
title: '2026-05-05 · E2E contract realignment'
date: 2026-05-05
author: 'Codex'
---

# E2E contract realignment

## Background

Local `pnpm test:e2e` reproduced four failures after recent auth, migration, and dashboard copy
changes. The failing surfaces were stable in product behavior, but the browser-level contracts had
drifted from current route gates and accessible names.

## Changes

- Added an `mfa` E2E auth seed that creates a signed session with MFA enabled but unverified, so the
  `/two-factor` challenge is covered through the real loader path.
- Updated Migration Copilot Step 3 assertions to match the current "organized values" heading.
- Updated the Dashboard priority-list row helper to recognize the current `Open obligations:` row
  action name.
- Anchored the E2E "Today" dashboard filter seed to the practice's current New York date instead of
  a stale fixed 2026-05-02 date.
- Documented the MFA seed in the E2E auth/data guide.

## Verification

- `pnpm test:e2e` before the fix: 53 passed, 4 failed.
- `pnpm test:e2e e2e/tests/auth-gate.spec.ts e2e/tests/migration-wizard.spec.ts e2e/tests/obligations.spec.ts`
  after the fix: 15 passed.
- `pnpm test:e2e` after the fix: 57 passed.
- `pnpm check`
