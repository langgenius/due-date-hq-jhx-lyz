---
title: 'Audit log action labels'
date: 2026-05-02
area: audit
---

## Context

Audit Log had already moved entity types to user-facing labels, but action values still rendered
raw audit strings such as `obligations.saved_view.deleted`. That was useful for engineering
traceability but too database-like for the firm-facing compliance surface.

## Changes

- Added a centralized Audit action label model for known audit actions, including Obligations,
  client, deadline, import, Pulse, team/member, firm, export, auth, permission, penalty, rules,
  and AI/onboarding actions.
- Kept raw action strings as the stored audit value and the `audit.list`/URL filter value.
- Updated the action filter, table Action badge, and detail drawer summary to render readable
  labels such as `Saved view deleted` and `Deadline status changed`.
- Added a humanized fallback for future action strings so unknown values still avoid dotted or
  underscored database-style text.
- Removed raw entity type/id rows from the detail drawer; the drawer keeps user-facing entity
  type labels and shortened entity ids only.
- Synced the Audit product-design note so it distinguishes stable audit storage from user-facing
  action labels.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test`
- `pnpm check`
