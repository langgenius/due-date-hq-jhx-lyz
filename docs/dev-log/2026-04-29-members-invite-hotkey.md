# 2026-04-29 · Keyboard shell shortcut hardening

## Scope

This follow-up closes the mismatch between visible shortcut labels and actual keyboard behavior.
It started with the Figma `⌘I` label on `/settings/members`, then expanded into a repo-wide
shortcut audit for implemented app surfaces.

## Implementation

- Registered `Mod+I` in `SettingsMembersRoute` via the project keyboard shell wrapper
  `useAppHotkey`.
- Kept the shortcut route-scoped with `scope: 'route'` and categorized it under a new `settings`
  shortcut group so the help surface does not misclassify it as global navigation.
- Registered the implemented firm switcher trigger with `Mod+Shift+O`, removed its stale reserved
  shortcut entry, and added `aria-keyshortcuts` on the visible trigger.
- Added keyboard-shell display helpers around TanStack Hotkeys `formatForDisplay()` and routed
  command palette, app shell, reserved shortcut, and Members labels through that shared path.
- Used TanStack Hotkeys formatting for visible labels, so Mac shows command glyphs and non-Mac
  platforms render the control form consistently.
- Set `ignoreInputs: true` and `requireReset: true` so the shortcut does not fire while typing and
  does not repeat from a held key.
- Added `aria-keyshortcuts="Meta+I Control+I"` to the visible trigger. The button remains clickable
  when seats are full; only the dialog's final send action is disabled.
- Kept route shortcuts disabled while their own route dialogs are open to avoid local scope leaks.

## Reference

- Official TanStack Hotkeys React docs were checked through Context7 (`/websites/tanstack_hotkeys`):
  `useHotkey` registers callbacks, `enabled` handles conditional activation, `requireReset`
  prevents repeated triggers, and `meta` is exposed through `useHotkeyRegistrations()` for shortcut
  help UIs.
- Existing project practice already matched the docs: `KeyboardProvider` owns global defaults
  (`preventDefault`, `stopPropagation`) and route code should consume `useAppHotkey` rather than
  calling TanStack directly.

## Validation

- `pnpm check`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/app build`
- `pnpm test`
- `pnpm build`
- `pnpm design:lint`
