# Marketing Table Style Parity

Date: 2026-05-03
Owner: Codex

## Context

Marketing's product mock tables had drifted from the live dashboard table style:
they used hand-built grid rows, tighter row heights, and duplicated badge/row
tone classes inside each Astro component.

The live app table style is centralized in `@duedatehq/ui` primitives:
semantic `<table>` markup, 9-unit headers, `p-3` cells, subtle row borders,
severity row tints, and shared badge/status-dot tones.

## Changes

- Added marketing table style constants that mirror the shared app `Table`,
  `Badge`, and ghost-button visual classes.
- Converted the landing hero risk queue from grid rows to semantic table
  markup with dashboard-style headers, cells, row tints, status badges,
  severity badges, exposure badges, and evidence controls.
- Converted the workflow dashboard table and mapping table to the same table
  primitive classes.
- Updated the problem section's mini risk lists to use the same table row,
  cell, border, hover, and badge tone rules.
- Added `apps/marketing/src/lib` to Tailwind's marketing source scan so shared
  static class constants are generated.

## Design Alignment

No `DESIGN.md` change was needed. The existing design direction already calls
for dense scanning, 1px hairlines, compact tables, semantic risk color, and
tabular numbers; this change brings the marketing mock surfaces back in line
with that guidance and the live dashboard implementation.

## Validation

- `pnpm exec vp check --fix apps/marketing/src/components/HeroSurface.astro apps/marketing/src/components/WorkflowStep.astro apps/marketing/src/components/Problem.astro apps/marketing/src/lib/marketing-table-styles.ts apps/marketing/src/styles/globals.css docs/dev-log/2026-05-03-marketing-table-style-parity.md`
- `pnpm --filter @duedatehq/marketing check`
- `pnpm --filter @duedatehq/marketing build`
- `git diff --check`
- `pnpm exec playwright screenshot --viewport-size=1480,1240 http://127.0.0.1:4321/ /tmp/marketing-home.png`
- `pnpm exec playwright screenshot --full-page --viewport-size=1480,1240 http://127.0.0.1:4321/ /tmp/marketing-full.png`
- `pnpm exec playwright screenshot --full-page --viewport-size=390,900 http://127.0.0.1:4321/ /tmp/marketing-mobile.png`
