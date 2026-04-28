---
title: 'Pulse Source Catalog Risk Alignment'
date: 2026-04-29
---

# Pulse Source Catalog Risk Alignment

## Context

The Pulse module docs still assumed IRS / state RSS coverage that was not
verified as stable. The same review also found a few implementation risks that
should be fixed before building the ingest pipeline: Pulse had no dedicated raw
snapshot bucket or queue binding, shared audit / evidence constants did not
include Pulse apply and revert strings, and RBAC docs needed a clearer boundary
between Owner-only account powers and Owner / Manager operational recovery.

## Change

- Reworked the Pulse source catalog around official canonical sources:
  `irs.disaster` as the federal disaster T1 source, TX Comptroller RSS /
  GovDelivery as the stable feed fixture, NY DTF press archive plus email as a
  fallback path, and FEMA as T2 early warning only.
- Updated PRD / architecture / data model docs so Pulse Apply writes tenant
  state through `pulse_firm_alert` / `pulse_application` instead of a global
  `pulse.status='applied'`.
- Added `R2_PULSE` and `PULSE_QUEUE` to Worker bindings and documented the
  queue split between email outbox and Pulse extract / match jobs.
- Kept `pulse.revert` and `migration.revert` available to Owner + Manager.
  Revert is treated as operational recovery; Owner-only remains reserved for
  ownership, billing, role-management, and export powers.
- Added Pulse audit actions and `pulse_apply` / `pulse_revert` evidence source
  strings to contracts and DB schema constants.

## Validation

- `pnpm --filter @duedatehq/auth test` - passed, 6 tests.
- `pnpm --filter @duedatehq/contracts test` - passed, 13 tests.
- `pnpm --filter @duedatehq/db test` - passed, 25 tests.
- `pnpm --filter @duedatehq/server build` - dry-run exited 0 and listed
  `R2_PULSE` / `PULSE_QUEUE` bindings. Wrangler printed an EPERM while trying
  to write its debug log under `~/Library/Preferences/.wrangler/logs` inside the
  sandbox; the build still completed.
- `git diff --check` - passed.
