---
title: 'Audit log firm timezone display'
date: 2026-05-02
area: audit
---

## Context

Audit Log event stream timestamps were formatted with the browser-local timezone by default.
Because Audit Log is a firm-scoped operational surface, users in the same firm should see the same
primary event time and date boundaries regardless of their device timezone.

## Changes

- Event stream `Time` now uses the active firm timezone as the primary row timestamp and keeps UTC
  as secondary audit metadata.
- Audit detail drawer now labels the primary timestamp as `Firm time` and uses the same timezone
  for before/after payload JSON and change summaries.
- Audit timestamp formatting helpers now accept an explicit timezone while preserving their
  browser-local default for non-firm call sites.
- Updated Audit product design and DESIGN datetime guidance to record firm timezone as the primary
  display rule for firm-scoped operational surfaces.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
- `pnpm --filter @duedatehq/app test -- src/lib/utils.test.ts src/features/audit/audit-log-model.test.ts`
