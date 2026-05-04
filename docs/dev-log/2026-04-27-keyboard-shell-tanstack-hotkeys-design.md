---
title: 'TanStack Hotkeys keyboard shell design and implementation'
date: 2026-04-27
author: 'Codex'
updates:
  - note: 'Command Palette follow-up moved the list implementation to shadcn Command/cmdk; see 2026-04-27-command-palette-cmdk-polish.md.'
---

# TanStack Hotkeys keyboard shell design and implementation

## Context

PRD and design docs already require global shortcuts, Obligations row operations, command palette
navigation, and Migration Wizard overlay behavior. Code had no shared keyboard shell, so the next
implementation step needed an app-level registry before adding more route-specific shortcuts.

## Change

- Added `@tanstack/react-hotkeys@0.10.0` to the app catalog and protected shell.
- Added `apps/app/src/components/patterns/keyboard-shell` with:
  - `KeyboardProvider` wrapping TanStack `HotkeysProvider`
  - live `?` shortcut help from `useHotkeyRegistrations()`
  - lazy Command Palette opened by `Cmd/Ctrl+K`
  - global `?`, `Cmd/Ctrl+K`, `Cmd/Ctrl+Shift+D`, and `G then ...` sequence registrations
- Wired overlay behavior into Migration Wizard:
  - `Enter` continues only when not focused in textarea/contenteditable/select
  - `Esc` opens leave confirmation
  - `A` is reserved for Step 3 Apply-to-all rows and only fires when focus is inside a matrix suggestion cell
- Wired Obligations route shortcuts:
  - `J/K` active row movement
  - `Enter` and `E` placeholder drawers
  - `F/X/I/W` status mutations through the existing `obligations.updateStatus` contract
- Updated architecture, design, sprint, product-design docs, and recorded ADR 0015.

## Why

TanStack Hotkeys covers the hard parts without custom infrastructure: one singleton listener,
`Mod` cross-platform handling, sequence registration, input-aware defaults, metadata, and live
registration inspection. This follows the Vercel React performance guidance to deduplicate global
event listeners, keep heavy UI lazy, and avoid state subscriptions that only exist for callbacks.

## Validation

Planned validation:

```bash
pnpm --filter @duedatehq/app i18n:extract
pnpm --filter @duedatehq/app i18n:compile
pnpm --filter @duedatehq/app test
pnpm check
```

## Follow-up

- Replace Obligations `Enter` / `E` placeholders with real detail and Evidence drawer APIs when Day 6
  evidence wiring lands.
- Enable `G then C` and `G then A` when dedicated Clients and Alerts/Pulse routes exist.
- Command Palette already links Pulse through the Dashboard `#pulse` anchor; the disabled `G then A`
  navigation sequence remains reserved until an Alerts/Pulse route exists.
- Enable `/` when Ask DueDateHQ leaves placeholder state.
