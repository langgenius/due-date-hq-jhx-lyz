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

> What changed, who caused it, when did it happen, and what user-facing fields moved?

This page turns the existing append-only audit writer into a user-visible management
surface. It should make Obligations status changes, Migration imports/reverts, client
batch creation, and future Pulse/Team writes reviewable without exposing raw database
access.

## 2. Current State

The repository already has the write-side foundation:

- `audit_event` schema exists in `packages/db/src/schema/audit.ts`.
- `createAuditWriter()` is insert-only and server-clocked.
- `scoped.audit.write()` / `writeBatch()` are available to tenant-scoped procedures.
- `scoped.audit.list()` supports server-side filters and keyset pagination.
- Sidebar `Audit log` is enabled under `Practice`.

Missing pieces:

- Stable docs disagree on some action names. Existing code uses names such as
  `client.created`, `client.batch_created`, `obligation.status.updated`, and
  `migration.imported`; PRD/dev-file examples still include older variants such as
  `client.create` and `obligation.status.change`.

## 3. Scope

### Activation Slice

Implement a firm-wide Audit Log page:

- Sidebar entry becomes enabled.
- `/audit` is a protected route inside the existing AppShell.
- Page lists audit events newest first with server-side pagination.
- Filters are URL-backed and safe to share.
- Users can open a row detail drawer to inspect metadata and a user-facing change summary.
- Owners on Team and Enterprise plans can open the evidence package export dialog; lower plans keep
  the export button disabled and explain the plan requirement in a tooltip.
- Empty, loading, and error states are explicit.

### Deferred

These stay out of this slice:

- CSV/PDF export.
- Email attachment delivery for exports.
- Full Owner/Manager RBAC permission middleware.
- Member multi-select backed by a Team members query.
- Firm deletion anonymization workflows.

Standalone CSV/PDF export stays deferred. The implemented evidence package export
generates a ZIP with report, CSV/JSON audit events, evidence CSV, and manifest.

## 4. Information Architecture

Navigation:

- Sidebar group: `Practice`.
- Enabled item: `Audit log`.
- Enabled sibling items: `Rules`, `Members`, and `Billing`.
- `Clients` is its own sidebar group; `Team workload` remains disabled under `Operations`.
- Command Palette may include `Audit log` as a navigation command.

Route:

- Path: `/audit`.
- Protected by the existing `protectedLoader`.
- AppShell route summary: eyebrow `Practice`, title `Audit log`.

The page is a data workbench, not a settings form. It follows the same full-width
route container pattern as Dashboard, Obligations, and Rules Console.

## 5. Page Layout

### Header

The header should communicate proof, not fear.

- Eyebrow: `Practice`
- H1: `Audit log`
- Description: `Review firm-wide write events, what changed, and actor metadata.`
- Secondary action: disabled `Export · P1` if included.

### Controls

Controls sit in one card or unframed toolbar, depending on visual density after
implementation. Required controls:

- Time range: `24h`, `7d`, `30d`, `All`.
- Action category: `All`, `Client`, `Obligation`, `Migration`, `Rules`, `Auth`,
  `Team`, `Pulse`, `Export`, `AI`, `System`.
- Action: optional exact action selected from loaded audit events. The select value remains
  the stored action string for URL/API compatibility, but the trigger and menu render
  user-facing labels such as `Saved view deleted`.
- Actor: optional actor selected from loaded audit events. Member display-name facets wait
  for Team-backed facet data.
- Entity type: optional user-facing entity type label selected from loaded audit events.
  Raw `entityType` remains the query value, but the UI renders only user-facing labels.
- Do not render an entity-instance filter in the main toolbar; entity IDs and instance names
  are too high-cardinality for a useful select control.

URL state:

- Use `nuqs` parser-level options with `history: 'replace'`.
- Empty/default values clear from the URL.
- Legacy deep-link search query values may be cleared by Reset, but the page no longer
  renders a free-text search box.

### Table

Columns:

| Column | Behavior                                                                                                                         |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Time   | Active firm timezone timestamp as the primary line; UTC timestamp as secondary metadata. Use mono tabular numerals.              |
| Actor  | User display label when available; `System` when `actorId` is null; raw actor id as fallback.                                    |
| Action | User-facing action label such as `Deadline status changed` or `Saved view deleted`; do not show the stored dotted action string. |
| Entity | Entity name/description when available; otherwise user-facing type label + shortened `entityId`. Raw `entityType` is not shown.  |
| Change | Human summary derived from `beforeJson` and `afterJson`; fallback to a no detailed snapshot note.                                |
| Device | `IP hash` / `UA hash` presence indicators, not raw values.                                                                       |
| Detail | Icon button or row click opens drawer.                                                                                           |

Pagination:

- The table renders a fixed-size current page with Previous / Next controls.
- Audit reads still use cursor-based `audit.list` fetching underneath; advancing beyond the
  currently loaded rows fetches the next cursor page.
- Keep the ACTION badge compact (`text-xs`) and render the same readable action label used
  by the filter.
- Render common raw entity types such as `obligation_saved_view` as user-facing labels such
  as `Saved obligation view`; unknown types fall back to humanized text.
- When audit payloads include names or stable business identifiers, table rows should show
  those values as the primary Entity text and move raw ids to secondary metadata.

Rows should be dense enough for scanning. The first viewport should show at least ten
rows on common laptop sizes when data exists.

### Detail Drawer

Drawer width follows the existing 400px right-drawer rule unless the JSON diff needs
more room; if it overflows, prefer scrollable code blocks over widening the drawer.

Sections:

- Summary: time, actor, action, entity.
- Reason: visible only when present.
- What changed: structured field table with `Field`, `Previous`, and `New`.
- Raw before/after JSON is not shown in the product UI. It remains in `audit_event` storage and API responses for export/support paths.
- Device: hash values, never raw IP/user-agent.
- Raw event metadata: audit id and firm id, primarily for support.

The drawer must not allow edit, delete, or redact actions.

## 6. Action Categorization

Audit actions are stable engineering strings. They are not retroactively rewritten in
storage, exports, URLs, or API filters. User-facing Audit Log surfaces map those stable
strings through localized labels and use a humanized fallback for unknown future actions.

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
- Current UI uses select filters and does not render free-text search; the contract keeps
  `search` for compatibility with older links and future explicit search surfaces.
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

- Use existing `Button`, `Select`, `Badge`, `Table`, `Sheet`/`Dialog` primitives.
- Use Lucide icons for row detail, filter, reset, and disabled export.
- Audit filter select menus show selected options with a checkbox-style square indicator on
  the left, matching the Obligations table header filter indicator instead of a trailing check mark.
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
- If no filters: `No audit events yet.` with secondary text pointing users to Obligations
  status updates or client import as the current audit-producing workflows.

## 11. Security And Compliance

Rules:

- Do not show raw IP or user-agent.
- Do not add update/delete/redact affordances.
- Do not translate stored audit action strings.
- Do not accept `firmId` from input.
- Do not query DB directly from procedures.
- Do not make export look available until the export pipeline exists.

Current behavior:

- Permission middleware for `audit.read`.
- Owner-only guard for `audit.export`.
- Team/Enterprise plan gate for evidence package export.
- Export self-audit events for request, ready, failure, and download.

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
