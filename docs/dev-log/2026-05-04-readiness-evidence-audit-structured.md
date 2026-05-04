---
title: 'Readiness evidence and audit structured display'
date: 2026-05-04
area: readiness
---

## Context

Obligation detail showed `readiness_checklist_ai` evidence by printing the stored JSON string. The
Audit tab also printed before/after payloads as raw JSON, which made readiness request and portal
events hard to scan.

## Changes

- Render `readiness_checklist_ai` evidence as a client-facing checklist with item labels,
  descriptions, reasons, and source hints.
- Render `readiness_client_response` evidence as response rows with status, ETA, note, and resulting
  readiness.
- Replace raw JSON in the obligation detail Audit tab with key/value summaries, including dedicated
  presenters for readiness request sent/revoked, portal opened, and client response submitted.

## Design alignment

- No DESIGN.md or token changes were needed.
- The display keeps the existing compact Obligations detail card language while avoiding raw JSON for
  common readiness artifacts.

## Validation

- `pnpm exec vp check apps/app/src/routes/obligations.tsx`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
