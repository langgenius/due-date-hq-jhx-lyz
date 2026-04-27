# 2026-04-27 · Local D1 Migration Script

## Context

Local login failed during `vp run dev` because Better Auth queried the
database-backed `rate_limit` table before the local D1 database had the project
migrations applied.

The table already existed in `packages/db/src/schema/auth.ts` and
`packages/db/migrations/0000_wonderful_forgotten_one.sql`; the failing database
was the Wrangler local D1 store under `apps/server/.wrangler/state/v3/d1`, not
the remote staging D1 database.

## Change

- Applied the four pending migrations to the current local D1 database.
- Updated root migration scripts to run Wrangler from `apps/server` with the
  explicit `wrangler.toml` config, so the D1 binding can resolve
  `migrations_dir = "../../packages/db/migrations"`.
- Replaced the stale `duedatehq` migration command comment in
  `packages/db/drizzle.config.ts` with the root package scripts.

## Notes

`wrangler dev --local` still prints the configured database name
`due-date-hq-staging`, but the binding mode is local. Remote staging is only
affected when using `--remote`.
