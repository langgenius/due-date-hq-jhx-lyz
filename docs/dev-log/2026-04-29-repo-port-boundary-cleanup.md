# 2026-04-29 · Repo Port Boundary Cleanup

## Context

- `apps/server/src/procedures/**` 已禁止直接 import `@duedatehq/db`，但少数 service/test 仍通过 `import('@duedatehq/db').ScopedRepo` 获取类型。
- 该 workaround 没有引入运行时 DB 访问，但会让 procedures 和 db 包的类型边界长期耦合。
- 本次只做低风险边界增强，不拆分 `rules/index.ts`、`migration/_service.ts` 或 `routes/clients.tsx`。

## Changes

- Added `@duedatehq/ports` as a pure TypeScript workspace package for repo and tenant ports.
- Moved public repo/tenant contract types (`ScopedRepo`, `TenantContext`, firm/member repo ports, domain repo ports and row/input shapes) into `packages/ports`.
- Updated `packages/db/src/types.ts` to re-export repo/tenant ports from `@duedatehq/ports/<domain>`, while keeping `Db`, `FirmProfile`, and `NewFirmProfile` owned by `@duedatehq/db`.
- Replaced procedure/env dynamic `import('@duedatehq/db')` type references with type-only `@duedatehq/ports` imports. Follow-up on 2026-04-29 removed the ports root entry and moved consumers to concrete subpaths.
- Updated dependency-direction docs and script so `packages/db -> packages/ports` is explicit and `packages/ports -> (none)`.

## Boundary Decision

- Runtime data access remains unchanged: procedures receive `context.vars.scoped` from middleware and never construct DB repos.
- `@duedatehq/ports` intentionally has no dependency on Drizzle, Hono, Worker bindings, `@duedatehq/db`, or app packages.
- The package is not a barrel over db types; it owns the structural port contracts directly and exposes only concrete subpaths such as `@duedatehq/ports/scoped`, `@duedatehq/ports/clients`, and `@duedatehq/ports/dashboard`.

## Validation

- Passed: `pnpm check:deps`
- Passed: `pnpm --filter @duedatehq/server test -- --run src/procedures/migration/_service.test.ts src/procedures/obligations/_service.test.ts`
- Passed: `pnpm check`
- Passed: `pnpm build`
- Blocked locally: `pnpm secrets:scan` (`gitleaks` is not installed on PATH)
