---
title: 'Audit Log Implementation Plan'
date: 2026-04-28
status: implemented
owner: LYZ
---

# Audit Log Implementation Plan

This plan implements the read-only Audit Log management page from
[`01-audit-log-management-page.md`](./01-audit-log-management-page.md). It intentionally
does not include CSV export, Team RBAC enforcement, or Audit-Ready Evidence Package.
Implementation landed on 2026-04-28; Audit-specific Playwright coverage remains deferred until
the local E2E seed creates stable audit rows.

## Phase 0. Preflight

1. Confirm the working tree is clean or identify unrelated user changes.
2. Run focused baseline checks if needed:
   - `pnpm --filter @duedatehq/contracts test`
   - `pnpm --filter @duedatehq/db test`
   - `pnpm --filter @duedatehq/server test`
   - `pnpm --filter @duedatehq/app test`
3. Keep all implementation changes on the existing branch unless the user asks for a
   new branch.

Acceptance:

- No unrelated files are reverted.
- Any pre-existing failures are recorded before implementation.

## Phase 1. Contract Surface

Deferred files:

- `packages/contracts/src/audit.ts`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/contracts.test.ts`

Deferred tasks:

1. Add `AuditActionCategorySchema`.
2. Add `AuditListInputSchema` with capped `search` and `limit`.
3. Add `AuditEventPublicSchema`.
4. Add `AuditListOutputSchema`.
5. Add `auditContract = oc.router({ list })`.
6. Wire `audit` into `appContract` and public exports.
7. Add contract tests that freeze:
   - router key exists;
   - category enum order;
   - max search length;
   - nullable JSON fields;
   - null actor fields.

Design notes:

- Keep stored `action` as `string`, not enum. DB and product docs already require
  append-only action growth.
- Category is a UI/query helper, not a DB-level constraint.

Validation:

- `pnpm --filter @duedatehq/contracts test`

## Phase 2. DB Read Model

Files:

- `packages/db/src/repo/audit.ts`
- `packages/db/src/repo/audit.test.ts`
- `packages/db/src/types.ts` only if exported repo types require adjustment

Tasks:

1. Extend the repo with `list(input)` or replace `listByFirm()` with a backwards
   compatible wrapper if current callers need it.
2. Add keyset cursor helpers based on `(createdAt, id)`.
3. Add normalized search helper:
   - NFKC normalize;
   - trim;
   - lower-case;
   - cap length;
   - escape SQL LIKE wildcards.
4. Add filter support:
   - `range`
   - exact `action`
   - category prefix list
   - `actorId`
   - `entityType`
   - `entityId`
   - safe text search
5. Return `rows` and `nextCursor`.
6. Add tests for tenant scoping and each risky query behavior.

Design notes:

- Do not introduce deletes or updates.
- Do not require a migration unless tests prove current indexes are insufficient for
  the planned query shape. Existing indexes cover firm/time, firm/actor/time, and
  firm/action/time.
- Entity filters may be less indexed in this slice; limit remains capped to protect D1.

Validation:

- `pnpm --filter @duedatehq/db test`

## Phase 3. Server Procedure

Files:

- `apps/server/src/procedures/audit/index.ts`
- `apps/server/src/procedures/index.ts`
- `apps/server/src/procedures/audit/index.test.ts` or focused server service tests

Tasks:

1. Add `auditHandlers.list`.
2. Use `requireTenant(context)` and `context.vars.scoped.audit`.
3. Map repo rows to contract output:
   - `createdAt.toISOString()`
   - `actorLabel` fallback: `System` for null actor, otherwise shortened actor id
   - preserve JSON fields as unknown/null
4. Wire `audit: { list: auditHandlers.list }` into the root oRPC router.
5. Add tests for:
   - tenant required;
   - input filters passed to repo;
   - Date serialization;
   - system actor fallback.

Design notes:

- Procedures still cannot import `@duedatehq/db`.
- Do not add permission middleware until the app has the RBAC slice ready. Leave a
  clear P1 note in docs instead of an unactionable code placeholder.

Validation:

- `pnpm --filter @duedatehq/server test`

## Phase 4. Frontend Route And Navigation

Files:

- `apps/app/src/router.tsx`
- `apps/app/src/routes/_layout.tsx`
- `apps/app/src/routes/audit.tsx`
- `apps/app/src/components/patterns/app-shell-nav.tsx`
- `apps/app/src/components/patterns/keyboard-shell/CommandPalette.tsx` if adding command entry
- `e2e/pages/app-shell-page.ts`

Tasks:

1. Register protected `/audit` route with lazy import.
2. Add route summary for `/audit`: `Practice` / `Audit log`.
3. Enable sidebar `Audit log`.
4. Place `Audit log` under the `Practice` group.
5. Keep `Team workload` disabled with `P1` under `Operations`.
6. Add `auditLogLink` to the AppShell page object.
7. Optionally add Command Palette navigation.

Design notes:

- Do not create a separate AppShell version for audit.
- Keep account profile account-owned and Practice surfaces tenant-owned.

Validation:

- `pnpm --filter @duedatehq/app test`

## Phase 5. Frontend Feature

Files:

- `apps/app/src/features/audit/audit-log-page.tsx`
- `apps/app/src/features/audit/audit-log-model.ts`
- `apps/app/src/features/audit/audit-log-table.tsx`
- `apps/app/src/features/audit/audit-event-drawer.tsx`
- `apps/app/src/features/audit/audit-log-model.test.ts`

Tasks:

1. Create URL parser contract with `nuqs`.
2. Create category labels and action category derivation.
3. Create date/time format helpers.
4. Create before/after summary helper.
5. Render page header and controls.
6. Fetch with `useInfiniteQuery(orpc.audit.list.infiniteOptions(...))`.
7. Render table rows and `Load more`.
8. Render drawer for selected row.
9. Add reset filters behavior.
10. Add loading, error, filtered empty, and global empty states.

Design notes:

- No `useEffect`.
- Keep raw action strings as storage/query values, but render user-facing action labels in
  filters, table rows, and drawer summary.
- Use existing primitives before creating app-specific wrappers.
- JSON blocks can be raw formatted strings; do not build a complex tree diff unless
  the initial summary is insufficient.

Validation:

- `pnpm --filter @duedatehq/app test`

## Phase 6. E2E Coverage

Files:

- `e2e/pages/app-shell-page.ts`
- `e2e/pages/audit-log-page.ts`
- `e2e/tests/audit-log.spec.ts`

Tasks:

1. Add page object locators for heading, filters, table, detail drawer.
2. Test sidebar navigation:
   - authenticated user opens `/`;
   - clicks `Audit log`;
   - URL is `/audit`;
   - heading is visible.
3. Test drawer:
   - open first row detail;
   - readable action label and before/after sections are visible.
4. Test reset:
   - apply a filter;
   - reset filters;
   - URL clears default query values.

Risk:

- E2E seed may not yet create enough audit rows. If so, add the smallest
  development-only seed path or re-use existing Obligations status mutation in setup.

Validation:

- `pnpm test:e2e`

## Phase 7. Documentation Sync

Files:

- `docs/dev-file/02-System-Architecture.md`
- `docs/dev-file/03-Data-Model.md`
- `docs/dev-file/05-Frontend-Architecture.md`
- `docs/dev-file/06-Security-Compliance.md`
- `DESIGN.md`
- `docs/Design/DueDateHQ-DESIGN.md`
- `docs/dev-log/2026-04-28-audit-log-management-page.md`

Tasks:

1. Mark the audit read procedure as implemented.
2. Add the audit read contract to Data Model.
3. Add `/audit` to Frontend Architecture.
4. Align action-name examples with current code and document the normalization rule:
   action names are append-only strings and not Lingui messages.
5. Update sidebar IA: `Audit log` enabled, `Clients` and `Team workload` still P1.
6. Record implementation decisions and validation commands in dev-log.

Validation:

- Read through changed docs for "implemented" vs "planned" mismatches.

## Phase 8. Final Checks And Commit

Run:

- `pnpm check`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm build`
- `pnpm ready` if time permits or if previous commands do not cover the same scope

If implementation touches configuration or secrets, also run:

- `pnpm secrets:scan`

Commit:

- Conventional Commit title: `feat: add audit log management page`

PR notes should call out:

- No export pipeline in this slice.
- No full Team RBAC in this slice.
- Existing audit action name drift was documented/aligned.
- D1 query limits remain capped through contract and repo.

## Rollback Strategy

This slice should not require a DB migration. Rollback is code-only:

1. Disable sidebar link.
2. Remove `/audit` route registration.
3. Keep contract additions only if already consumed by other deployed code; otherwise
   revert the contract and procedure together.

No audit rows should be deleted during rollback.
