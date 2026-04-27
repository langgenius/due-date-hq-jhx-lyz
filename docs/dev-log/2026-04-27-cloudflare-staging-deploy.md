# 2026-04-27 · Cloudflare staging deployment plan

## Goal

Set up an internal staging deployment on Cloudflare that is repeatable from CI and still matches
the repository's current two-surface architecture:

- `apps/server` owns the API Worker and serves the Vite SPA through Workers Static Assets.
- `apps/marketing` stays a separate Astro static Worker.
- GitHub Actions deploys after the normal CI checks pass.

The staging setup intentionally uses the existing `langgenius.app` zone rather than waiting on a
new product domain.

## Design

The top-level Worker configuration now represents the internal staging environment. We deliberately
did not introduce `[env.staging]` yet because Cloudflare bindings do not inherit from top-level
configuration. Adding named environments now would require duplicating every D1, KV, R2, Queue, and
Vectorize binding, which would add complexity without improving the current deployment flow.

The deployment pipeline keeps the existing release order:

1. Run repository checks and tests.
2. Build the SPA and verify the server Worker through Wrangler dry-run.
3. Apply D1 migrations to the staging database.
4. Deploy the app/server Worker, including the SPA assets.
5. Deploy the marketing Worker last so its CTA points at an already-updated app surface.

Runtime secrets are supplied by the GitHub Actions environment at deploy time and are passed to
Wrangler through a temporary secrets file on the runner. No secret values or local env files are
committed to the repository.

## Changes

- Added a `deploy-staging` GitHub Actions job gated behind CI and scoped to the
  `due-date-hq-staging` GitHub environment.
- Pointed the server Worker at staging Cloudflare resources with stable, product-specific names.
- Switched the marketing Worker to the internal staging name and removed the assets binding from
  its assets-only Worker config, which fixes Wrangler's dry-run validation.
- Updated marketing CTA fallback and Wrangler public config to point at the internal app domain.
- Made the root build include marketing so CI/deploy cannot publish stale marketing assets.
- Updated the remote D1 migration command to target the staging database.
- Updated DevOps and marketing architecture docs to describe the staging topology.

## Cloudflare Shape

Staging is split into two Workers:

- App/server Worker: `due-date-hq-app-staging`
- Marketing Worker: `due-date-hq-marketing-staging`

Provisioned backing services:

- D1 for relational application state
- KV for cache/session-adjacent hot data
- R2 buckets for PDF, migration, and audit artifacts
- Queue plus DLQ for email/outbox style work
- Vectorize index for future rules retrieval

## Remaining Work

- Run the first real CI deployment from `main`.
- After both Workers exist, attach the internal app and marketing hostnames to the corresponding
  Workers through Cloudflare routes or custom domains.
- Rotate the OAuth client secret once staging is confirmed, because the setup secret was shared
  during manual configuration.
- Introduce separate production bindings later instead of reusing the current staging top-level
  configuration.
