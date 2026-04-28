---
title: 'Resend Webhook Signature Gate'
date: 2026-04-28
---

# Resend Webhook Signature Gate

## Context

`/api/webhook/resend` was already mounted as a public callback route, while the
handler still returned `{ ok: true }` before verifying the sender. The
architecture docs define `/api/webhook/*` as unauthenticated external callbacks
that must use signature verification before side effects.

## Change

- Added optional `RESEND_WEBHOOK_SECRET` to server env validation and
  `.dev.vars.example`.
- Verified Resend callbacks with `resend.webhooks.verify()` using the raw
  request body and Svix headers.
- Rejected missing secrets with `503`, missing signature headers with `400`,
  and invalid signatures with `400`.
- Added unit coverage for missing secret, missing headers, invalid signature,
  and accepted signed requests.

## Product Impact

The route remains a delivery-event intake point for future email outbox status
updates: delivered, bounced, complained, opened, and clicked events. No outbox
state mutation was added in this change; the handler now only guarantees that
future work starts behind the required verification gate.

When `RESEND_WEBHOOK_SECRET` is not configured, only
`POST /api/webhook/resend` returns `503`. The app shell, auth, RPC, and email
send path remain unaffected. This keeps the callback feature optional for
staging while preventing the public placeholder from accepting unsigned
requests.

The architecture route table now distinguishes required provider signature
verification from optional IP allowlisting. Resend signature verification is
the implemented gate; IP allowlisting remains a future defense-in-depth option
if a provider exposes stable source ranges.

## Validation

- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/server build`
- `pnpm check` passes with one pre-existing warning in
  `packages/ui/src/lib/placement.ts`.
