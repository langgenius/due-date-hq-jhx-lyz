# 2026-04-27 · Deploy Concurrency and D1 Alignment

## Context

The staging deploy log for `fix(db): align local D1 migration script` showed the
app Worker and marketing Worker both deployed successfully, then GitHub marked
the job as canceled with `Error: The operation was canceled.`

The D1 step itself was not the failing step: CI applied remote migrations and
Wrangler reported `No migrations to apply!` before both deploy commands
completed. The cancellation matched the workflow-level concurrency policy, which
previously canceled any in-progress run for the same `main` ref when another
push arrived.

## Change

- Kept PR runs aggressively cancelable, but changed `main` pushes to queue
  behind any in-progress run instead of canceling it.
- Updated root D1 migration scripts to target the Worker binding `DB` and keep
  the target mode explicit with `--local` or `--remote`.
- Kept Wrangler execution rooted in `apps/server` with `--config wrangler.toml`
  so the monorepo `migrations_dir` resolves consistently.
- Updated DevOps, data-model, project-structure, and deployment ADR docs to
  match the current command shape.

## Notes

Cloudflare D1 local data and remote data are separate. `pnpm db:migrate:local`
uses the local Wrangler/Miniflare SQLite store; `pnpm db:migrate:remote` uses
the configured Cloudflare D1 database for the current server Worker config.

Do not run multiple local D1 migration/list/execute commands against the same
Wrangler state directory at the same time. The local SQLite backing store can
return `SQLITE_BUSY`; that is a local developer workflow limitation, not a
remote deploy failure mode.
