# Repository Guidelines

## Project Structure & Module Organization

DueDateHQ is a pnpm monorepo. Deployable apps live in `apps/`: `apps/web` is the Vite React SPA, and `apps/server` is the Cloudflare Worker API. Shared packages live in `packages/`: `core` for pure TypeScript domain logic, `contracts` for Zod/oRPC contracts, `db` for Drizzle and D1 data access, `auth` for Better Auth integration, `ai` for AI ports, and `typescript-config` for shared TS settings. Tests sit beside source files as `*.test.ts` or `*.test.tsx`. Product, design, and architecture notes are under `docs/`.

## Build, Test, and Development Commands

Use pnpm with Node `>=22.12.0`.

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

## Coding Style & Naming Conventions

Write TypeScript ESM with two-space indentation, single quotes, no semicolons, trailing commas, and 100-column formatting. Use `#*` imports inside apps and package exports for cross-package usage. React components use PascalCase, hooks use `useX`, utility files use kebab or descriptive lowercase names, and tests mirror the subject file name. Keep `packages/core` infrastructure-free and keep `packages/contracts` limited to contract/schema concerns.

## Testing Guidelines

Vitest is the default test runner. Place focused unit tests next to implementation files, for example `apps/server/src/app.test.ts` or `packages/contracts/src/contracts.test.ts`. Prefer behavior-level assertions over implementation details. Run `pnpm test` for the suite and `pnpm ready` before opening a PR. Add Playwright coverage under the e2e setup when changing browser-level workflows.

## Commit & Pull Request Guidelines

Follow Conventional Commits, as used in history: `chore: ...`, `docs: ...`, `feat: ...`, `fix: ...`. Keep commits scoped and imperative. PRs should include a concise summary, validation commands run, linked issue or context, and screenshots for UI changes. Call out migrations, environment changes, or dependency-direction impacts explicitly.

## Security & Configuration Tips

Env files are owned per-app, never at the repo root: copy `apps/server/.dev.vars.example` to `apps/server/.dev.vars` for the Worker runtime, and `apps/web/.env.example` to `apps/web/.env.local` for browser-facing `VITE_*` vars. Cloudflare CLI auth is handled by `wrangler login` (cached under `~/.wrangler/`) locally, or GitHub Actions secrets in CI — never placed in a repo file. Run `pnpm secrets:scan` before sharing changes that touch configuration. Cloudflare deployment is server-owned through `pnpm deploy`; verify migrations locally before remote D1 changes.
