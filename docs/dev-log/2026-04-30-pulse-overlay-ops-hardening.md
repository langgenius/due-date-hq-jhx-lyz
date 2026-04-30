---
title: 'Pulse Overlay and Ops Hardening'
date: 2026-04-30
---

# Pulse Overlay and Ops Hardening

## Context

The customer-visible Pulse loop was in place, but apply still mutated
`obligation_instance.current_due_date` directly and T2/source ops had no recovery commands beyond
manual SQL or the narrow review CLI.

## Change

- Added the Overlay Engine storage path with `exception_rule` and
  `obligation_exception_application` in migration `0012_powerful_sinister_six.sql`.
- Replaced the `@duedatehq/core/overlay` placeholder with pure helpers for applying latest active
  due-date overlays.
- Changed Pulse apply to create a source-backed exception rule plus per-obligation exception
  applications instead of directly updating `obligation_instance.current_due_date`.
- Changed Pulse revert to expire active exception applications and retract the source-backed
  exception rule, while keeping `pulse_application` as the audit/revert index.
- Updated Workboard, Dashboard, and obligation read repos to derive visible current due dates from
  base obligation rows plus active overlays.
- Split `pulse_approved` and `pulse_applied` digest rendering so review-available emails no longer
  read the applied payload shape or use the wrong subject.
- Expanded ops token routes and `scripts/pulse-ops.mjs` for signal listing/linking/dismissal,
  source disable/enable/revoke, and reason-bearing reject/quarantine paths with stable actor ids.
- Added scheduled T2 signal linking so open signals can attach to matching T1 Pulse rows without
  creating customer-visible alerts or Evidence links.
- Introduced an ingest fetcher registry interface so Cloudflare fetch remains the default while
  Browserless and GovDelivery fallbacks can be wired per source without changing adapters again.

## Notes

- Follow-up pass added configurable Browserless fetch binding support and GovDelivery inbound
  email-to-signal parsing; both remain optional and default-off without secrets/routing.
- Follow-up pass added a hidden browser-based `/ops/pulse` workbench on top of the same
  token-protected API. It is intentionally not in customer navigation and still waits for a formal
  internal ops auth surface.
- `pulse_application` remains the compatibility audit index; overlay applications are now the write
  path that controls effective due dates.
- E2E/staging canary validation can now use `/api/e2e/session` on staging when `E2E_SEED_TOKEN` is
  configured; production continues to return 404.

## Validation

- `pnpm --filter @duedatehq/ingest test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test -- pulse workboard`
- `pnpm --filter @duedatehq/server test -- pulse ingest ops queue outbox`
