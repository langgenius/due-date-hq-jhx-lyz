# 0017 · oRPC contract-first and `/rpc` vs `/api` boundary

## Context

DueDateHQ has three API audiences:

- The authenticated TypeScript SPA in `apps/app`.
- External providers that call webhooks or auth callback endpoints.
- Future third-party API clients that need OpenAPI/REST semantics.

The repo already uses `packages/contracts` as the shared contract layer, `@orpc/server` for internal
RPC, and Hono for route assembly. The architecture also reserves `/api/v1/*` for future public REST.
Without a recorded decision, future contributors may collapse RPC and REST under one prefix or add
parallel contracts for public APIs.

## Decision

Use oRPC contract-first as the single product contract strategy.

- `packages/contracts` owns Zod/oRPC contracts shared by app and server.
- `apps/server` implements those contracts through oRPC procedures.
- `apps/app` consumes the contracts with the oRPC client and `@orpc/tanstack-query`.
- Internal app traffic uses `RPCHandler` on `/rpc/*`.
- `/api/*` is reserved for non-RPC HTTP surfaces:
  - `/api/auth/*` for better-auth.
  - `/api/webhook/*` for provider webhooks such as Resend and Stripe.
  - `/api/ics/:token` for token-authenticated calendar feeds.
  - `/api/health` for liveness.
  - `/api/v1/*` for future `OpenAPIHandler` public REST over the same contract family.

RPC Protocol and REST are not mixed under the same URL namespace. The naming boundary is part of the
API contract and should not drift by feature.

## Consequences

Good:

- Contract changes fail at compile time across app/server.
- TanStack Query keys, mutation options, and invalidation flow derive from contract definitions.
- Future OpenAPI routes can reuse the contract layer without making the SPA consume REST.
- Auth, webhooks, health, and public REST remain understandable to non-TypeScript clients.

Bad:

- Engineers must keep two transport concepts in mind: internal RPC and public/handwritten HTTP.
- oRPC procedure errors must be logged/intercepted in the oRPC layer; Hono `onError` is not enough for
  procedure-level failures.
- Contracts cannot become locale-specific or UI-shaped without polluting both transports.

Uncertain:

- When `/api/v1/*` becomes a paid integration surface, we may need stricter versioning and
  compatibility policy than the internal SPA contract requires.

## Status

accepted · 2026-04-30
