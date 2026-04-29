# 0018 · D1 tenant isolation through scoped repos and ports

## Context

D1 does not provide row-level security. DueDateHQ still handles sensitive firm/client/compliance data,
so tenant isolation cannot depend on caller discipline or frontend filtering.

ADR 0010 decided that `firm_profile.id` reuses `organization.id`, making
`firmId == organization.id == firm_profile.id`. Since then, the implementation added a broader
boundary:

- `tenantMiddleware` injects active firm context.
- `scoped(db, firmId)` is the only business-data repository entry.
- Procedures are lint-blocked from importing `@duedatehq/db` directly.
- `@duedatehq/ports/<domain>` owns structural TypeScript port contracts without depending on Drizzle,
  Hono, Worker bindings, or app packages.

This full isolation model deserves a dedicated ADR because it is the primary replacement for database
RLS.

## Decision

Tenant isolation is enforced by three layers: runtime context, scoped repositories, and static
dependency rules.

1. Runtime context:
   - better-auth session provides `activeOrganizationId`.
   - `tenantMiddleware` verifies active membership, member status, and active `firm_profile`.
   - The middleware injects `firmId`, `tenantContext`, and `scoped(db, firmId)`.
   - Missing `firm_profile` rows may be lazy-created only from a valid organization + owner member.

2. Repository boundary:
   - Business procedures must use `context.vars.scoped` and `context.vars.tenantContext`.
   - Tenant-scoped repos hard-code `WHERE firm_id = :firmId`.
   - Procedures must not accept `firmId` for tenant-scoped business access.
   - Writes that reference parent tenant rows must prove the parent belongs to the same firm before
     writing child rows.

3. Static boundary:
   - `apps/server/src/procedures/**` may not import `@duedatehq/db` or schema paths.
   - Procedure/service type needs use `@duedatehq/ports/<domain>` subpaths.
   - `@duedatehq/ports` has no root export and no runtime dependencies.
   - `packages/db` implements the ports; `packages/core` stays infrastructure-free.

The cross-firm `makeFirmsRepo(db)` is an explicit exception for firm lifecycle and selection. It must
only query firms reachable by the authenticated user and must not become a business-data backdoor.

## Consequences

Good:

- Tenant isolation is testable without DB-level RLS.
- Procedure code stays decoupled from Drizzle schema and database factories.
- Ports give service code stable structural contracts without importing the infrastructure package.
- Future DB migrations or per-firm sharding have a narrower replacement surface.

Bad:

- Every new repo method must remember to encode firm scope and parent ownership checks.
- Lint/dependency rules are part of the security model, so build tooling drift can weaken isolation.
- Some admin/ops paths need carefully documented exceptions.

Uncertain:

- If DueDateHQ later needs hard physical tenant isolation, this ADR should be superseded with a
  per-firm/per-region D1 sharding or Postgres RLS decision.

## Status

accepted · 2026-04-30
