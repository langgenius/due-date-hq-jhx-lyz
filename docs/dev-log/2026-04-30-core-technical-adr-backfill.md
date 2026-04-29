---
title: 'Core Technical ADR Backfill'
date: 2026-04-30
author: 'Codex'
---

# Core Technical ADR Backfill

## Context

The stable architecture docs already documented the main platform decisions, but the ADR index still
listed old Phase 0 placeholders (`0001`-`0008`) while accepted ADRs had advanced to `0015`. That made
the durable decision trail harder to trust.

## Change

- Added four accepted ADRs:
  - `0016-cloudflare-first-single-worker-d1-platform.md`
  - `0017-orpc-contract-first-rpc-api-boundary.md`
  - `0018-d1-tenant-isolation-scoped-repo-ports.md`
  - `0019-ai-sdk-gateway-glass-box-boundary.md`
- Updated `docs/adr/README.md` so accepted decisions and remaining backlog reflect current numbering.
- Updated `docs/dev-file/08-Project-Structure.md` to stop pointing at obsolete placeholder numbers.
- Added ADR cross-links to the relevant stable architecture docs:
  - `01-Tech-Stack`
  - `02-System-Architecture`
  - `03-Data-Model`
  - `04-AI-Architecture`
- Repointed the Lingui ADR's contract-first reference from the old placeholder `ADR 0002` to
  `ADR 0017`.

## Notes

- No runtime code changed.
- Pulse and PWA ADRs were intentionally left out of this pass after scope was narrowed to the first
  four core technical decisions.
