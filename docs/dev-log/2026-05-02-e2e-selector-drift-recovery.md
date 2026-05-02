---
title: 'E2E selector drift recovery'
date: 2026-05-02
author: 'Codex'
area: e2e
---

# E2E selector drift recovery

## Context

GitHub Actions run `25248442578` failed in the E2E workflow after recent UI copy
and table/filter structure changes. The product behavior was still present, but
several tests asserted old labels or relied on DOM structure that no longer
matched the current app:

- Clients filters and metric cards had moved away from the older first-section
  card layout assumptions.
- Rules Preview was renamed from Generation Preview to Obligation Preview.
- Audit Log now stores the raw Pulse action while rendering the user-facing
  action label.

## Changes

- Added an accessible group label to Clients metric cards and updated the page
  object to locate them by role/name instead of section/card nesting.
- Updated the Rules Console page object and E2E title to use the current
  Obligation Preview tab label.
- Updated the Pulse apply/undo E2E to assert the Audit row for the stable raw
  action value and the rendered `Pulse applied` label.
- Removed the custom 1 second timeout around the lazy-loaded shortcut help
  dialog so full-suite load does not turn a healthy keyboard shortcut into a
  timing failure.

## Why

The tests should describe product behavior through accessible user-facing
surfaces where possible, not incidental DOM placement. For audit filters, the
stable contract remains the raw action value in the URL/query layer, while the
table row intentionally renders the readable label.

No product-design or `DESIGN.md` update is required because the shipped behavior
and copy were already documented by the existing UI work; this change only
recovers E2E coverage after selector drift.

## Validation

- `pnpm test:e2e e2e/tests/pulse.spec.ts e2e/tests/rules-console.spec.ts`
- `pnpm test:e2e e2e/tests/clients.spec.ts`
- `pnpm test:e2e e2e/tests/clients.spec.ts e2e/tests/pulse.spec.ts e2e/tests/rules-console.spec.ts`
- `pnpm test:e2e e2e/tests/authenticated-shell.spec.ts --grep SHORTCUTS`
- `pnpm test:e2e`
