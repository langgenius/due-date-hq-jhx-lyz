---
title: 'Audit Log Management Page'
date: 2026-04-28
status: implemented
owner: LYZ
---

# Audit Log Management Page

## 1. Purpose

Audit Log is the firm-wide read surface for `audit_event`. Its job is not to create
another analytics feed. It lets the firm answer a narrow compliance question:

> What changed, who caused it, when did it happen, and what was the before/after state?

This page turns the existing append-only audit writer into a user-visible management
surface. It should make Workboard status changes, Migration imports/reverts, client
batch creation, and future Pulse/Team writes reviewable without exposing raw database
access.

## 2. Current State

The repository already has the write-side foundation:

- `audit_event` schema exists in `packages/db/src/schema/audit.ts`.
- `createAuditWriter()` is insert-only and server-clocked.
- `scoped.audit.write()` / `writeBatch()` are available to tenant-scoped procedures.
- `scoped.audit.list()` supports server-side filters and keyset pagination.
- Sidebar `Audit log` is enabled under `Organization`.

Missing pieces:

- Stable docs disagree on some action names. Existing code uses names such as
  `client.created`, `client.batch_created`, `obligation.status.updated`, and
  `migration.imported`; PRD/dev-file examples still include older variants such as
  `client.create` and `obligation.status.change`.

## 3. Scope

### Activation Slice

Implement a read-only firm-wide Audit Log page:

- Sidebar entry becomes enabled.
- `/audit` is a protected route inside the existing AppShell.
- Page lists audit events newest first with server-side pagination.
- Filters are URL-backed and safe to share.
- Users can open a row detail drawer to inspect metadata and before/after JSON.
- Empty, loading, and error states are explicit.

### Deferred

These stay out of this slice:

- CSV/PDF export.
- Email attachment delivery for exports.
- `export.audit` self-audit event.
- Full Owner/Manager RBAC permission middleware.
- Member multi-select backed by a Team members query.
- Audit-Ready Evidence Package ZIP and SHA-256 manifest.
- Firm deletion anonymization workflows.

The page may show an `Export · P1` disabled affordance only if it is visually clear
that export is not enabled. It must not fake a download.

## 4. Information Architecture

Navigation:

- Sidebar group: `Organization`.
- Enabled item: `Audit log`.
- Enabled sibling items: `Rules`, `Members`, and `Billing`.
- `Clients` is its own sidebar group; `Team workload` remains disabled under `Operations`.
- Command Palette may include `Audit log` as a navigation command.

Route:

- Path: `/audit`.
- Protected by the existing `protectedLoader`.
- AppShell route summary: eyebrow `Organization`, title `Audit log`.

The page is a data workbench, not a settings form. It follows the same full-width
route container pattern as Dashboard, Workboard, and Rules Console.

## 5. Page Layout

### Header

The header should communicate proof, not fear.

- Eyebrow: `Organization`
- H1: `Audit log`
- Description: `Review firm-wide write events, before/after state, and actor metadata.`
- Secondary action: disabled `Export · P1` if included.

### Controls

Controls sit in one card or unframed toolbar, depending on visual density after
implementation. Required controls:

- Search: free text over action, entity type, entity id, and reason.
- Time range: `24h`, `7d`, `30d`, `All`.
- Action category: `All`, `Client`, `Obligation`, `Migration`, `Rules`, `Auth`,
  `Team`, `Pulse`, `Export`, `AI`, `System`.
- Exact action: optional exact string, primarily for deep links from toast or future
  detail surfaces.
- Actor: optional actor id string for this slice. Member display-name multi-select
  waits for Team.
- Entity: optional `entityType` and `entityId`.

URL state:

- Use `nuqs` parser-level options with `history: 'replace'`.
- Empty/default values clear from the URL.
- Search input is debounced before query execution.

### Table

Columns:

| Column | Behavior                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- |
| Time   | Local timestamp as the primary line; UTC timestamp as secondary metadata. Use mono tabular numerals. |
| Actor  | User display label when available; `System` when `actorId` is null; raw actor id as fallback.        |
| Action | Stable action string in mono. Do not translate the stored action.                                    |
| Entity | `entityType` + shortened `entityId`.                                                                 |
| Change | Human summary derived from `beforeJson` and `afterJson`; fallback to `No before/after payload`.      |
| Device | `IP hash` / `UA hash` presence indicators, not raw values.                                           |
| Detail | Icon button or row click opens drawer.                                                               |

Rows should be dense enough for scanning. The first viewport should show at least ten
rows on common laptop sizes when data exists.

### Detail Drawer

Drawer width follows the existing 400px right-drawer rule unless the JSON diff needs
more room; if it overflows, prefer scrollable code blocks over widening the drawer.

Sections:

- Summary: time, actor, action, entity.
- Reason: visible only when present.
- Before/after: structured diff summary first, raw JSON blocks second.
- Device: hash values, never raw IP/user-agent.
- Raw event metadata: audit id and firm id, primarily for support.

The drawer must not allow edit, delete, or redact actions.

## 6. Action Categorization

Audit actions are stable engineering strings. They are not Lingui messages and must
not be translated or retroactively rewritten.

Category is a derived UI concept:

| Category   | Prefixes / examples                |
| ---------- | ---------------------------------- |
| Client     | `client.`                          |
| Obligation | `obligation.`                      |
| Migration  | `migration.`                       |
| Rules      | `rule.`                            |
| Auth       | `auth.`                            |
| Team       | `team.`, `member.`, `firm.owner.`  |
| Pulse      | `pulse.`                           |
| Export     | `export.`, `ics.`                  |
| AI         | `ai.`, `ask.`, `onboarding.agent.` |
| System     | everything else                    |

Implementation should centralize this mapping in front-end feature code or contracts
only if contracts need to validate category input. It should not become a DB enum.

## 7. Data Contract

New contract router: `audit`.

`audit.list` input:

- `search?: string`
- `category?: AuditActionCategory`
- `action?: string`
- `actorId?: string`
- `entityType?: string`
- `entityId?: string`
- `range?: '24h' | '7d' | '30d' | 'all'`
- `cursor?: string | null`
- `limit?: number` capped at 100

`audit.list` output:

- `events: AuditEventPublic[]`
- `nextCursor: string | null`

`AuditEventPublic`:

- `id`
- `firmId`
- `actorId`
- `actorLabel`
- `entityType`
- `entityId`
- `action`
- `beforeJson`
- `afterJson`
- `reason`
- `ipHash`
- `userAgentHash`
- `createdAt`

Cursor format should be opaque to the client and based on `(createdAt, id)` for stable
newest-first pagination.

## 8. Backend Design

Extend `makeAuditRepo(db, firmId)` with a paginated list method. The repo must hard-code
`audit_event.firm_id = scoped firmId`, including for searches and future joins.

Query behavior:

- Default sort: `created_at desc`, then `id desc`.
- `limit + 1` sentinel detects `nextCursor`.
- `range` is converted server-side to a lower-bound timestamp.
- `action` is exact match.
- `category` becomes a safe prefix list or controlled `LIKE 'prefix.%'` expression.
- `search` is normalized, capped, escaped, and applied only to safe text fields.
- Actor label join is optional. If joining `user`, select only display fields needed
  for the row label.

No write method is added for this page.

## 9. Frontend Design

Route:

- `apps/app/src/routes/audit.tsx` stays thin and renders the feature component.

Feature module:

- `apps/app/src/features/audit/audit-log-page.tsx`
- `apps/app/src/features/audit/audit-log-model.ts`
- `apps/app/src/features/audit/audit-event-drawer.tsx`
- `apps/app/src/features/audit/audit-log-table.tsx`

State:

- URL state through `nuqs`.
- Data through TanStack Query and `orpc.audit.list.infiniteOptions`.
- No React `useEffect` in app/package code.

Rendering:

- Use existing `Button`, `Input`, `Select`, `Badge`, `Table`, `Sheet`/`Dialog` primitives.
- Use Lucide icons for row detail, filter, reset, and disabled export.
- Do not introduce a new UI primitive unless an existing primitive cannot express the
  required accessibility behavior.

## 10. Error And Empty States

Loading:

- Skeleton controls and 8-10 table skeleton rows.

Error:

- Destructive alert with retry.
- Include the RPC error message when safe.

Empty:

- If filters are active: `No audit events match these filters.` with `Reset filters`.
- If no filters: `No audit events yet.` with secondary text pointing users to Workboard
  status updates or client import as the current audit-producing workflows.

## 11. Security And Compliance

Rules:

- Do not show raw IP or user-agent.
- Do not add update/delete/redact affordances.
- Do not translate stored audit action strings.
- Do not accept `firmId` from input.
- Do not query DB directly from procedures.
- Do not make export look available until the export pipeline exists.

P0 behavior:

- Existing protected route + tenant middleware is sufficient for the demo/solo slice.

P1 behavior:

- Add permission middleware for `audit.read`.
- Add Owner-only guard for `audit.export`.
- Add export self-audit event.

## 12. Tests

Required before handoff:

- Contract test freezes `audit.list` input/output shape.
- DB repo tests cover firm scoping, range filter, action filter, invalid cursor fallback,
  and `limit + 1` pagination.
- Server procedure tests cover tenant access, Date to ISO serialization, and null actor
  labeling.
- App tests cover category mapping and JSON diff summary helpers.
- E2E covers sidebar navigation to `/audit`, table visibility with seeded events, filter
  reset, and opening the detail drawer.

## 13. Documentation Updates

Implementation must update:

- `docs/dev-file/02-System-Architecture.md`
- `docs/dev-file/03-Data-Model.md`
- `docs/dev-file/05-Frontend-Architecture.md`
- `docs/dev-file/06-Security-Compliance.md`
- `DESIGN.md`
- `docs/Design/DueDateHQ-DESIGN.md`
- `docs/dev-log/YYYY-MM-DD-audit-log-management-page.md`

Stable architecture docs should describe what is implemented. Future export/RBAC work
should remain explicitly marked as P1.
