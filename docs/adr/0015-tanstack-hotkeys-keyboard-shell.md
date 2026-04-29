# ADR 0015 · TanStack Hotkeys Keyboard Shell

Date: 2026-04-27

## Context

PRD v2 defines keyboard-first behavior across global actions, navigation sequences, Workboard
operations, and Migration Wizard overlays. The implementation previously had no app-level shortcut
registry, so future shortcuts would either duplicate `keydown` listeners or drift from the `?` help
surface.

The app is a React SPA, not Next.js/RSC. The relevant performance constraints are therefore client
bundle size, deduplicated global listeners, stable callback handling, and avoiding subscriptions that
only exist for event callbacks.

## Decision

Use `@tanstack/react-hotkeys@0.10.0` as the only keyboard shortcut engine for `apps/app`.

- Mount one `KeyboardProvider` inside the protected app shell.
- Keep shortcut orchestration in `apps/app/src/components/patterns/keyboard-shell`; do not put app
  routing, Lingui, oRPC, or feature-provider dependencies into `packages/ui`.
- Use `HotkeysProvider` defaults for conflict warnings and shared sequence timeout.
- Use `useHotkeySequence` for `G then D/W/C/A/T`.
- Use RawHotkey object form for shifted punctuation such as `?` (`{ key: '/', shift: true }`),
  while keeping the visible label as `?`; TanStack excludes Shift punctuation from its type-safe
  hotkey string union because those keys are layout-dependent.
- Use `useHotkeyRegistrations()` plus reserved shortcut metadata for the `?` help dialog.
- Use keyboard-shell display helpers backed by TanStack `formatForDisplay` for visible shortcut
  labels; feature components must not hand-roll platform detection or glyph strings.
- Lazy-load the Command Palette on first `Cmd/Ctrl+K` use.
- Treat Wizard/Dialog/Command Palette as overlay scope that suppresses route/list and navigation
  shortcuts.

## Consequences

- One singleton manager owns global keyboard listeners; route and overlay components register
  declaratively while mounted.
- Shortcut help can render from the live registry instead of a hand-maintained static table.
- `packages/ui` remains a pure primitive/design-token package.
- Route-specific shortcuts must carry metadata so they render correctly in the help dialog.
- Reserved PRD shortcuts can be shown before their feature is implemented without becoming active.
- Implemented surface shortcuts must leave the reserved list when their UI wiring lands.

## Alternatives

- **Hand-written `document.addEventListener('keydown')` bus**: rejected because it recreates listener
  deduplication, stale-closure handling, sequence parsing, and registry introspection.
- **`react-hotkeys-hook`**: viable, but TanStack Hotkeys gives a smaller product fit for this stack:
  typed hotkeys, sequence manager, metadata, singleton registry, and platform-aware `Mod` formatting.
- **Only implement Command Palette**: rejected because Workboard and Wizard already have route/overlay
  shortcuts; a palette-only implementation would not solve keyboard-first operations or `?` help.
