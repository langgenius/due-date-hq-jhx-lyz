---
title: 'Dashboard triage table sorting'
date: 2026-05-03
area: dashboard
---

## Context

The dashboard triage queue already supported URL-backed header filters, but Deadline, Severity, and
Exposure could not be reordered inside the active triage window.

## Changes

- Added TanStack client-side sorting state to the dashboard triage table.
- Added dedicated icon sort controls beside the existing header filter controls for Deadline,
  Severity, and Exposure.
- Kept default server ordering untouched until the user chooses a sort.
- Deadline sorts earliest first by default; Severity and Exposure sort highest-risk first by
  default.
- Changed the triage queue footer CTA to the primary blue button treatment.

## Design alignment

- No token, primitive, or DESIGN.md contract changes were needed.
- The sort affordance uses existing compact ghost icon buttons, table headers, and accent active
  state so it remains aligned with the dense dashboard/obligations table language.

## Validation

- `pnpm check`
- `pnpm --filter @duedatehq/app test`
