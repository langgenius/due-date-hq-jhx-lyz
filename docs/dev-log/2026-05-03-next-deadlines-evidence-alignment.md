---
title: 'Next Deadlines Evidence Alignment'
date: 2026-05-03
author: 'Codex'
---

# Next Deadlines Evidence Alignment

## Context

The `Next deadlines` table right-aligns the `Evidence` header, but the row action uses a ghost
button with right padding. That made the visible `Evidence` label sit left of the header alignment
line.

## Change

- Removed the right padding from the row-level Evidence ghost button so its text/icon content aligns
  with the right-aligned column header.

## Docs Check

No DESIGN.md or stable architecture update was needed. This is a local table alignment adjustment
using existing table and button primitives.

## Validation

- `pnpm exec vp check apps/app/src/routes/dashboard.tsx docs/dev-log/2026-05-03-next-deadlines-evidence-alignment.md`
- `git diff --check -- apps/app/src/routes/dashboard.tsx docs/dev-log/2026-05-03-next-deadlines-evidence-alignment.md`
