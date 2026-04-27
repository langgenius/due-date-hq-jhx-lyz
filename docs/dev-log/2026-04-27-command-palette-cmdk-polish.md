---
title: 'Command palette cmdk polish'
date: 2026-04-27
author: 'Codex'
---

# Command palette cmdk polish

## Context

The first keyboard shell implementation opened a command palette with `Cmd/Ctrl+K`, but the palette
body was still a hand-rolled `Dialog + Input + button[]` list. That meant ArrowUp/ArrowDown did not
move an active command, Enter could not execute the active command, and the footer exposed the
implementation term `Mod+K` instead of a platform-facing shortcut.

The repository already standardizes on shadcn `base-vega` primitives, and shadcn's official Command
component is backed by `cmdk`, which provides the command-menu keyboard model we need.

## Change

- Added `cmdk@1.1.1` through the workspace catalog and `@duedatehq/ui`.
- Added `@duedatehq/ui/components/ui/command`, adapted from the shadcn `Command` component:
  - keeps `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandGroup`,
    `CommandItem`, `CommandSeparator`, `CommandEmpty`, and `CommandShortcut` composition
  - replaces upstream `popover/muted/border` aliases with DueDateHQ tokens:
    `components-panel-*`, `divider-*`, `background-*`, `text-*`, and `shadow-overlay`
  - preserves centered dialog placement through the shared `DialogContent` geometry
- Reworked `CommandPalette` to use `cmdk` filtering, ArrowUp/ArrowDown active item, Enter select,
  disabled item handling, and `disablePointerSelection` so pointer hover does not steal keyboard
  selection.
- Split command-row interaction visuals:
  - mouse hover is shallow and neutral (`bg-background-subtle`)
  - keyboard active item is deeper (`bg-state-base-hover`) with no left indicator
- Made the footer shortcut platform-facing: Apple platforms show `⌘K`; other platforms show
  `Ctrl+K`.
- Enabled the Pulse command by anchoring the Dashboard Pulse card at `#pulse`.
- Marked the Day 6 keyboard-shell checklist item complete.
- Added a repository workflow note to `AGENTS.md`: every development task should update the
  relevant dev log and verify DESIGN/docs remain aligned with implementation.

## Why

Using `cmdk` is lower risk than hand-rolling roving focus, active item state, listbox ARIA, disabled
item behavior, and Enter dispatch. TanStack Hotkeys remains the app-level shortcut registry; `cmdk`
owns only the command menu interaction once the overlay is open. The palette stays lazy-loaded, so
the new dependency does not enter the initial route bundle.

## Validation

```bash
pnpm format:fix
pnpm check:deps
pnpm --filter @duedatehq/app i18n:extract
pnpm --filter @duedatehq/app i18n:compile
pnpm --filter @duedatehq/app test
pnpm check
pnpm --filter @duedatehq/app build
pnpm design:lint
```

`pnpm check` still reports the pre-existing `packages/ui/src/lib/placement.ts` unsafe tuple
assertion warning, but exits with 0 errors. The app build includes `CommandPalette` as a lazy chunk.
The final quality pass also checked the architecture/design docs for drift and corrected the
Command Palette grouping language to match the implementation: search input plus
Navigate / Actions / Ask results.

## Follow-up

- `G then A` stays reserved until a dedicated Alerts/Pulse route exists.
- Ask remains visible as `Coming soon` until Phase 1 enables the Ask surface.
