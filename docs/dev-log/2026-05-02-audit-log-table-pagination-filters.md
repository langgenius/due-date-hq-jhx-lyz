---
title: 'Audit log table pagination and select filters'
date: 2026-05-02
area: audit
---

## Context

Audit Log still used the original Activation Slice table shape: a free-text search input,
exact-match text inputs, and a `Load more` button. The current UI pass needed a more table-like
workflow with page navigation and select-only filters.

## Changes

- Replaced the Audit filters free-text search UI with select controls for category, range, action,
  actor, and entity type.
- Kept URL compatibility for existing `q` links so Reset can clear old search state, but stopped
  sending search text to `audit.list`.
- Added client-side table pagination over the cursor-loaded audit events. The UI shows 10 rows per
  page while `audit.list` still fetches 50 rows at a time.
- Removed the `Load more` affordance; moving past the currently loaded pages fetches the next
  cursor page automatically.
- Added user-facing entity type labels for the table, Entity type filter, and drawer summary while
  preserving raw `entityType` in drawer metadata.
- Removed the high-cardinality Entity instance filter; specific entity names and ids remain visible
  in the table and drawer instead of becoming toolbar options.
- Changed Audit filter select menus to use a left checkbox-style selected indicator instead of the
  default trailing check mark.
- Reused the Workboard table header filter checkbox indicator styling for Audit filter selected
  options so both table filter menus share the same check affordance.
- Updated the table `Entity` column to show the entity name/description from audit payloads
  first, with type and shortened id as secondary metadata.
- Tightened the Action badge typography to `text-xs`.
- Synced the Audit product-design note with the current no-search/select-filter behavior.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
- `pnpm --filter @duedatehq/app test`
