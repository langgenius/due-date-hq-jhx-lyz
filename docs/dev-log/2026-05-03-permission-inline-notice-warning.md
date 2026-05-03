---
title: 'Permission Inline Notice Warning Tone'
date: 2026-05-03
author: 'Codex'
area: permissions
---

# Permission Inline Notice Warning Tone

## Context

The inline read-only permission notice used the default alert surface, so it read like passive
information even when it was blocking edits.

## Change

- Switched `PermissionInlineNotice` to the existing `destructive` alert variant.
- Kept the lock icon and copy unchanged, while letting the shared Alert primitive provide the pale
  red background, red border, and warning icon tone.

## Docs Check

No DESIGN.md or product documentation update was needed. This reuses the existing destructive alert
variant and does not introduce a new token, component contract, or product state.

## Validation

- `pnpm exec vp check apps/app/src/features/permissions/permission-gate.tsx docs/dev-log/2026-05-03-permission-inline-notice-warning.md`
- `git diff --check -- apps/app/src/features/permissions/permission-gate.tsx docs/dev-log/2026-05-03-permission-inline-notice-warning.md`
