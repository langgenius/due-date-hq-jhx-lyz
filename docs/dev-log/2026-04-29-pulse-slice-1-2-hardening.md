---
title: 'Pulse Slice 1/2 Hardening'
date: 2026-04-29
---

# Pulse Slice 1/2 Hardening

## Context

Pulse already had the demo-visible banner, drawer, active alerts route, and
batch apply/revert path. The remaining near-term risk was polish drift in the
navigation surface and stale obligation state between drawer load and apply or
revert writes.

## Change

- Enabled the `G then A` keyboard shortcut and routed the command palette Pulse
  action to `/alerts`.
- Aligned Pulse idle copy with current MVP coverage by removing MA from the
  watcher list in the banner and alerts empty state.
- Added write-time Pulse apply validation that re-reads selected obligations
  and active applications before building mutation batches.
- Added revert validation that refuses to roll an obligation back if its current
  due date no longer matches the Pulse-applied due date.
- Extended DB repo tests for stale apply due dates, active application
  conflicts, needs-review selections, stale revert due dates, and expired
  revert windows.

## Validation

- `pnpm --filter @duedatehq/db test` — pass
- `pnpm --filter @duedatehq/app test` — pass
- `pnpm --filter @duedatehq/app i18n:compile --strict` — pass
- `pnpm check` — pass
