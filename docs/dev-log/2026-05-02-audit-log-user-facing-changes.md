---
title: 'Audit log user-facing changes'
date: 2026-05-02
area: audit
---

## Context

Audit Log had readable action/entity labels, but the `Change` column and detail drawers still
exposed raw before/after payloads such as `status: pending -> done` or full JSON. That was useful
for debugging but not for firm users trying to understand what changed.

## Changes

- Added a centralized Audit change presenter model that converts audit payloads into a `headline`,
  structured `Field / Previous / New` rows, and notes.
- Covered every currently known audit action with a presenter entry, while keeping a user-facing
  fallback for future action strings.
- Replaced Audit Log table summaries with presenter headlines.
- Replaced Audit detail drawer raw `Before` / `After` JSON blocks with a `What changed` table.
- Updated the Evidence drawer audit timeline to reuse the same presenter and stop rendering raw
  before/after JSON.
- Kept raw `beforeJson` / `afterJson` unchanged in storage and API responses.
- Updated the Audit Log e2e detail assertions to target the new structured change table without
  strict-mode text collisions.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test -- audit-log`
- `pnpm check`
- `pnpm test:e2e e2e/tests/audit-log.spec.ts --project=chromium`
