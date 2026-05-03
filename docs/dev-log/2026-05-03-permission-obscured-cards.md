---
title: 'Permission Obscured Cards'
date: 2026-05-03
author: 'Codex'
area: permissions
---

# Permission Obscured Cards

## Context

Some no-permission surfaces disabled controls but still rendered sensitive values. The clearest
case was Practice Profile's Smart Priority card: non-owners could see the configured factor weights
and caps even though only the owner can manage that model.

## Change

- Added a reusable `PermissionObscuredContent` wrapper that shows a blurred locked overlay over
  redacted placeholder content.
- Applied the wrapper to Practice Profile's Smart Priority card, so non-owners no longer render the
  real weights, caps, or preview controls.
- Redacted `smartPriorityProfile` from `FirmPublic` server responses for non-owners.
- Redacted Smart Priority factor breakdowns from Dashboard and Workboard responses for non-owners,
  so configured weight proportions are not exposed through row popovers or detail panels.
- Tightened Workboard dollar redaction by omitting penalty amount breakdowns when the role cannot
  see dollar values.
- Applied the same locked-card pattern to the firm-wide calendar card.

## Docs Check

No DESIGN.md update was needed. The UI reuses existing destructive alert and skeleton primitives,
and the behavior change is an RBAC privacy rule rather than a new visual token contract.

## Validation

- `pnpm exec vp check apps/app/src/features/permissions/permission-gate.tsx apps/app/src/routes/practice.tsx apps/app/src/features/calendar/calendar-page.tsx apps/app/src/features/priority/SmartPriorityBadge.tsx apps/app/src/routes/workboard.tsx apps/server/src/procedures/firms/index.ts apps/server/src/procedures/firms/index.test.ts apps/server/src/procedures/dashboard/index.ts apps/server/src/procedures/workboard/index.ts packages/contracts/src/firms.ts packages/contracts/src/contracts.test.ts docs/dev-log/2026-05-03-permission-obscured-cards.md`
- `pnpm --filter @duedatehq/contracts test -- contracts.test.ts`
- `pnpm --filter @duedatehq/server test -- src/procedures/firms/index.test.ts`
- `pnpm check`
- `git diff --check -- apps/app/src/features/permissions/permission-gate.tsx apps/app/src/routes/practice.tsx apps/app/src/features/calendar/calendar-page.tsx apps/app/src/features/priority/SmartPriorityBadge.tsx apps/app/src/routes/workboard.tsx apps/server/src/procedures/firms/index.ts apps/server/src/procedures/firms/index.test.ts apps/server/src/procedures/dashboard/index.ts apps/server/src/procedures/workboard/index.ts packages/contracts/src/firms.ts packages/contracts/src/contracts.test.ts docs/dev-log/2026-05-03-permission-obscured-cards.md`
