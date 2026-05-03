---
title: 'Pulse Preparer Review Request'
date: 2026-05-03
author: 'Codex'
area: pulse
---

# Pulse Preparer Review Request

## Context

Preparer users need a lightweight escalation path when they spot a Pulse alert that should be
handled by a manager-level role. They should not gain `pulse.apply`, dismiss, snooze, or undo
authority.

## Change

- Added `pulse.requestReview` to the oRPC contract with optional 500-character note support.
- Implemented the server procedure for Owner, Manager, and Preparer callers while keeping the first
  UI exposure Preparer-only.
- Fan-out writes active Owner/Manager in-app notifications linked to `/alerts?alert=<id>`, excludes
  the requester, and records `pulse.review_requested` audit events.
- Follow-up: review requests also enqueue a `pulse_review_request` email outbox row for those same
  active Owner/Manager recipients and trigger the email flush queue.
- Follow-up: email outbox sends now pass a Resend idempotency key based on the outbox id.
- Added a Preparer-only `Request review` dialog in the Pulse detail drawer; Coordinator remains
  read-only and Owner/Manager keep the existing apply/dismiss/snooze/revert controls.
- Updated E2E auth seeding so Pulse specs use a Pro firm, matching the production Pulse entitlement.
- Added an E2E-only role switch route so the Preparer request flow can verify Owner notification
  receipt inside the same seeded firm.

## Docs Check

No DESIGN.md update was required. The UI uses existing dialog, textarea, button, toast, and
notification patterns; the product boundary remains that Preparer can request review but cannot
apply Pulse changes.

## Validation

- `pnpm check`
- `pnpm --filter @duedatehq/contracts test -- contracts.test.ts`
- `pnpm --filter @duedatehq/core test -- permissions`
- `pnpm --filter @duedatehq/server test -- app.test.ts pulse/index.test.ts`
- `pnpm --filter @duedatehq/server test -- pulse/index.test.ts email/outbox.test.ts`
- `pnpm --filter @duedatehq/app test -- PulseDetailDrawer.test.ts audit-log-model.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm test:e2e e2e/tests/pulse.spec.ts --project=chromium`
