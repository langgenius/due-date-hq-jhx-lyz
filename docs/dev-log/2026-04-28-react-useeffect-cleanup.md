---
title: 'Remove app/package useEffect usage'
date: 2026-04-28
---

# Remove app/package useEffect usage

## Context

`apps/` and `packages/` had five React effect sites:

- app theme preference sync in the protected layout
- onboarding → Migration Copilot auto-open handoff
- Step 1 paste/upload parsing
- wizard reset when closing
- sidebar mobile-sheet cleanup when crossing desktop

The goal was to apply `vercel-react-best-practices` around `rerender-derived-state-no-effect`,
`rerender-move-effect-to-event`, and `client-event-listeners`: remove effects that were only
bridging derived UI state, while keeping legitimate external synchronization explicit.

## Changes

- `apps/app/src/routes/_layout.tsx`
  - Replaced theme `useState + useEffect` listener wiring with `useSyncExternalStore`.
  - Same-tab theme switches emit a local event because the browser `storage` event does not fire
    in the tab that writes `localStorage`.
  - `prefers-color-scheme` changes still re-apply the stored preference, preserving `system`
    behavior without component-level effects.

- `apps/app/src/features/migration/Step1Intake.tsx`
  - Moved paste/upload parsing into the text/file event path.
  - The step now dispatches raw text and parse metadata together, instead of waiting for a
    post-render effect.

- `apps/app/src/features/migration/Wizard.tsx`
  - Moved reset to the explicit close/apply success path.
  - Closing the wizard now resets the reducer before handing control back to the provider.

- `apps/app/src/features/migration/WizardProvider.tsx`
  - Replaced the onboarding auto-open effect with render-phase state adjustment keyed by
    `location.key`, then `<Navigate replace state={null}>` strips the one-shot handoff flag.
  - This keeps the original contract: new firms land directly in Migration Copilot, and the
    history state is consumed so refresh/back does not reopen it.

- `packages/ui/src/components/ui/sidebar.tsx`
  - Removed the desktop-crossing cleanup effect.
  - `openMobile` exposed through context is now derived as `isMobile ? openMobile : false`, so
    desktop consumers never observe an open mobile sheet.
  - When the viewport is no longer mobile, `SidebarProvider` clamps stale local open state back to
    false during render. That preserves the old "resize to desktop closes the drawer" behavior
    without remounting the app shell or introducing a global store.

- `AGENTS.md`
  - Recorded the repository convention: app/package code should not use React `useEffect`.

## Verification

- `rg -n "useEffect|React\.useEffect" apps packages -g '*.ts' -g '*.tsx'` → no matches.
- `pnpm check` → 0 errors; one existing warning remains in
  `packages/ui/src/lib/placement.ts:30` (`no-unsafe-type-assertion`).

## Notes

Historical dev logs still mention earlier `useEffect` decisions. They remain snapshots. The live
architecture note in `docs/dev-file/05-Frontend-Architecture.md` now records the current effect-free
contract for sidebar and business UI state.

## Follow-up: theme preference store hardening

- Moved the app theme subscription implementation out of the protected route layout into
  `apps/app/src/lib/theme-preference-store.ts`.
- Split event handling by source:
  - `storage` only reacts to `localStorage["duedatehq.theme"]`, invalidates the cached read, then
    applies the stored preference.
  - same-tab preference changes use the shared switch path, then dispatch the local notification.
  - `prefers-color-scheme` changes only re-resolve the DOM theme when the active preference is
    `system`.
- Added a shared in-memory cache for `readStoredThemePreference()` so repeated snapshots avoid
  synchronous storage reads and a failed `setItem()` still leaves the current tab with the selected
  preference.
- Split `applyThemePreference()` from `switchThemePreference()` so OS color changes can update DOM
  theme state without rewriting the stored preference.
- Aligned the Astro marketing switcher with the same apply-vs-persist distinction and cache
  invalidation on cross-tab storage events.
