# 2026-05-01 · Cloudflare Queue provisioning preflight

## Context

Staging deploy failed after upload because `wrangler deploy` validated the Queue bindings from
`apps/server/wrangler.toml` and found that `due-date-hq-audit-staging` did not exist in the
Cloudflare account. The Worker config can declare producers, consumers, and DLQs, but Wrangler
does not create Queue resources as part of deploy.

## Change

- Added `scripts/ensure-cloudflare-queues.mjs`, an idempotent preflight that reads Queue names from
  `apps/server/wrangler.toml`, checks each one through Wrangler, and creates only the missing
  resources.
- Wired the preflight into `pnpm cf:ensure-queues` and the `workspace-deploy` task before remote D1
  migration and Worker deploy.
- Updated DevOps, tech stack, marketing deployment, and scripts docs so the staging runbook matches
  the automated Queue step instead of requiring manual one-off Queue creation.

## Validation

- `node scripts/ensure-cloudflare-queues.mjs apps/server/wrangler.toml --dry-run`
