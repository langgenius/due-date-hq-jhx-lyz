# 2026-05-03 · Resend webhook secret deploy alignment

## Context

Resend sending was already wired through `RESEND_API_KEY`, but staging deploy did not upload
`RESEND_WEBHOOK_SECRET` to the Worker. That meant `https://app.due.langgenius.app/api/webhook/resend`
would return 503 even after the endpoint was created in Resend.

## Changes

- Added `RESEND_WEBHOOK_SECRET` to the staging GitHub Actions deploy environment and Wrangler
  secrets-file payload.
- Made staging deploy require `RESEND_API_KEY` and `RESEND_WEBHOOK_SECRET` as a pair whenever Resend
  is enabled.
- Added the empty variable to the E2E-generated local Worker env so local CI mirrors the server env
  surface.
- Updated `.dev.vars.example` and DevOps/Tech Stack/Security docs to spell out the staging sending
  domain, webhook endpoint, and the difference between send-only and delivery callback setup.

## Validation

- `vp run @duedatehq/server#test -- src/jobs/email/outbox.test.ts src/webhooks/resend.test.ts src/env.test.ts`
