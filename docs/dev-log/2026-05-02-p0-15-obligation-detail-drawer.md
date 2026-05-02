# 2026-05-02 · P0-15 Obligation Detail Drawer

## Summary

Implemented the full Workboard obligation detail experience behind URL state:
`?drawer=obligation&id=<obligationId>&tab=<readiness|extension|risk|evidence|audit>`.
The drawer now hydrates detail through `workboard.getDetail`, opens from a row click or keyboard
`Enter`, and exposes the five planned tabs.

## Shipped

- Added `client_readiness_request` and `client_readiness_response` tables, scoped repos, token hash
  lookup, revoke/open/submit behavior, and tenant-aware Workboard detail hydration.
- Added obligation extension decision persistence fields and `obligations.decideExtension`.
  Applying an extension marks the obligation `extended` without mutating due dates or implying an
  authority filing.
- Added authenticated readiness mutations for AI checklist generation, send/revoke, and list.
  The AI prompt is `readiness-checklist@v1`; fallback generation is deterministic and records a
  degraded AI run/evidence trail when the model is unavailable.
- Added public `/api/readiness/:token` GET/POST routes plus `/readiness/:token` SPA route. The portal
  uses HMAC signed links, stored token hashes, 14-day expiry, rate limiting, and a no-PII response
  shape.
- Added `readiness_request` email outbox support. Sending a request queues email when the client has
  an email address and always returns a copyable portal link.
- Replaced the minimal Workboard drawer with Readiness, Extension, Risk, Evidence, and Audit tabs.
  The Risk tab reuses the existing penalty input dialog when exposure is missing.
- Added Readiness checklist item removal so manually added or generated draft items can be deleted
  before sending a client portal request.
- Updated the Workboard table so a normal row click opens the detail drawer, and widened the drawer
  to a workflow-sized right panel on desktop.

## Validation

- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/contracts exec tsc --noEmit`
- `pnpm --filter @duedatehq/db exec tsc --noEmit`
- `pnpm --filter @duedatehq/server exec tsc --noEmit`
- `pnpm --filter @duedatehq/app exec tsc --noEmit`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm db:migrate:local`
- `E2E_REUSE_EXISTING_SERVER=1 pnpm test:e2e e2e/tests/workboard.spec.ts`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/server build`

Full `pnpm check` is currently blocked by pre-existing formatting drift in unrelated
tax-prep-workflow docs, so this slice was verified with targeted package tests/type checks.
