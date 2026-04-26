# Repository Guidelines

## Project Structure & Module Organization

DueDateHQ is a pnpm monorepo. Deployable apps live in `apps/`: `apps/app` is the Vite React SPA, and `apps/server` is the Cloudflare Worker API. Shared packages live in `packages/`: `ui` for React UI primitives and design tokens, `core` for pure TypeScript domain logic, `contracts` for Zod/oRPC contracts, `db` for Drizzle and D1 data access, `auth` for Better Auth integration, `ai` for AI ports, and `typescript-config` for shared TS settings. Tests sit beside source files as `*.test.ts` or `*.test.tsx`. Product, design, and architecture notes are under `docs/`.

## Build, Test, and Development Commands

Use pnpm with Node `>=22.19.0`.

- `pnpm dev`: run all workspace dev tasks.
- `pnpm build`: build every package/app that declares `build`.
- `pnpm test`: run Vitest across workspaces.
- `pnpm test:e2e`: run Playwright tests.
- `pnpm check`: run Vite+ lint and type-aware checks.
- `pnpm check:fix`: apply automatic lint fixes.
- `pnpm format` / `pnpm format:fix`: check or write formatting.
- `pnpm ready`: run checks, tests, and builds before handoff.
- `pnpm check:deps`: validate internal package dependency direction.
- `pnpm db:generate`, `pnpm db:migrate:local`, `pnpm db:seed:demo`: manage local Drizzle/D1 schema and demo data.
- `pnpm --filter @duedatehq/app i18n:extract`, `pnpm --filter @duedatehq/app i18n:compile`: clean obsolete Lingui entries, refresh catalogs, and compile with `--strict` so any missing translation fails; CI should fail on missing translations or uncommitted catalog drift after these commands.

## Coding Style & Naming Conventions

Write TypeScript ESM with two-space indentation, single quotes, no semicolons, trailing commas, and 100-column formatting. Use `#*` imports inside apps and package exports for cross-package usage. React components use PascalCase, hooks use `useX`, utility files use kebab or descriptive lowercase names, and tests mirror the subject file name. Keep `packages/core` infrastructure-free and keep `packages/contracts` limited to contract/schema concerns.

## Testing Guidelines

Vitest is the default test runner. Place focused unit tests next to implementation files, for example `apps/server/src/app.test.ts` or `packages/contracts/src/contracts.test.ts`. Prefer behavior-level assertions over implementation details. Run `pnpm test` for the suite and `pnpm ready` before opening a PR. Add Playwright coverage under the e2e setup when changing browser-level workflows.

## Commit & Pull Request Guidelines

Follow Conventional Commits, as used in history: `chore: ...`, `docs: ...`, `feat: ...`, `fix: ...`. Keep commits scoped and imperative. PRs should include a concise summary, validation commands run, linked issue or context, and screenshots for UI changes. Call out migrations, environment changes, or dependency-direction impacts explicitly.

## Security & Configuration Tips

Env files are owned per-app, never at the repo root. The only one that currently exists is `apps/server/.dev.vars` (copy from `apps/server/.dev.vars.example`) for the Worker runtime; the SPA is same-origin with the Worker and needs no URL config. Add an `apps/app/.env.local` (with `VITE_*` keys) only when a specific browser-facing integration actually reads it — introduce the env key and its consumer in the same change. Cloudflare CLI auth is handled by `wrangler login` (cached under `~/.wrangler/`) locally, or GitHub Actions secrets in CI — never placed in a repo file. Run `pnpm secrets:scan` before sharing changes that touch configuration. Cloudflare deployment is server-owned through `pnpm deploy`; verify migrations locally before remote D1 changes.
