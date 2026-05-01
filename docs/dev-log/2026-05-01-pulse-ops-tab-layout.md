# 2026-05-01 · Pulse Ops tab layout

## What changed

- Fixed the shared Tabs orientation wiring so horizontal tabs render as top navigation above their
  panels instead of falling back to a side-by-side flex row.
- Updated `/ops/pulse` to keep the Pending review, Sources, Signals, and Failed snapshots tabs
  aligned at the top-left of the workbench content, with each tab panel occupying the full width.
- Removed the tab rail's local scroll container; the ops tabs now wrap naturally and use a 36px
  rail height so the trigger padding does not create a stray scrollbar.

## Validation

- `pnpm exec vp check packages/ui/src/components/ui/tabs.tsx apps/app/src/features/pulse/OpsPulsePage.tsx apps/app/src/features/rules/rules-console.tsx docs/dev-log/2026-05-01-pulse-ops-tab-layout.md`
- Headless Playwright probe against `http://localhost:5173/ops/pulse` confirmed the tab list is
  above and x-aligned with the active tab panel (`listBeforePanel: true`).
- Follow-up Playwright scroll metrics confirmed no tab-list overflow:
  `hasHorizontalOverflow: false`, `hasVerticalOverflow: false`.
