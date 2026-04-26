---
title: '2026-04-25 · Shared Theme Runtime'
date: 2026-04-25
updates:
  - note: 'Added follow-up for shared switchThemePreference extraction.'
---

# 2026-04-25 · Shared Theme Runtime

## Context

The app already had shared Tailwind 4 tokens in `@duedatehq/ui/styles/preset.css`, but theme selection itself was not a shared runtime contract. That becomes a problem once the Astro marketing app is added: both apps need the same `light | dark | system` behavior, the same storage key, the same `dark` selector, and the same no-flash initialization path.

## Documentation Checked

- Vite official docs: package CSS should be explicitly exported so consumers can import it, and CSS imports are handled by Vite with bundling/HMR.
- Astro official styling docs: global CSS is commonly imported from a layout, npm package stylesheets with `.css` can be imported and optimized, and imported styles participate in Astro/Vite CSS ordering.
- Astro client-side script docs: scripts can be emitted into the page; for theme bootstrapping we intentionally inline the tiny script so `html.dark` is set before first paint.

## Implementation

- Added `packages/ui/src/theme/theme.ts` as the shared theme contract:
  - `THEME_STORAGE_KEY = "duedatehq.theme"`
  - `ThemePreference = "light" | "dark" | "system"`
  - helpers for validation, stored preference reads, system resolution, root application, and theme color selection.
  - `disableThemeTransitions()` for the `next-themes`-style transition guard during interactive theme changes.
- Added `packages/ui/src/theme/no-flash-script.ts` with `THEME_INIT_SCRIPT`.
- Exported both `@duedatehq/ui/theme` and `@duedatehq/ui/theme/no-flash-script` from `packages/ui/package.json`.
- Updated `apps/app/vite.config.ts` with a `transformIndexHtml` plugin that injects the shared no-flash script into `<head>`.
- Updated `packages/ui/src/styles/preset.css` so `:root` and `.dark` declare matching `color-scheme`.

## Astro Contract

Future `apps/marketing` must consume the same package exports:

```astro
---
import '@duedatehq/ui/styles/preset.css'
import { THEME_INIT_SCRIPT } from '@duedatehq/ui/theme/no-flash-script'
---

<script is:inline set:html={THEME_INIT_SCRIPT}></script>
```

The Astro app must not copy the script body or invent a second storage key. If it needs a visible theme switcher, it should write `localStorage["duedatehq.theme"]` and call helpers from `@duedatehq/ui/theme`.

## Decisions

- **Shared package owns theme runtime**: theme is a design-system concern because the Tailwind dark variant, CSS variables, meta theme color, and storage key must stay coupled.
- **Inline first-paint script, shared source**: external or module scripts are easier to cache but can run too late for first paint. The shared exported string keeps the implementation single-source while still allowing Vite and Astro to inline it.
- **No React effect for initial theme**: effects run after paint, so they are only acceptable for responding to user interactions after boot.
- **`system` remains the default**: new users follow OS preference without writing storage until they explicitly choose.

## Closure

Architecture docs now describe the app and Astro consumption paths. Runtime code, package exports, CSS token behavior, and docs all point to `packages/ui` as the single source for theme behavior.

## Follow-up · 2026-04-26

The interactive switch path was extracted into `switchThemePreference()` in
`packages/ui/src/theme/theme.ts`. Both `apps/app` (`useThemeSwitch` in
`_layout.tsx`) and the new `apps/marketing` `PreferenceSwitcher.astro`
consume that single function so the four-step side effect chain
(`disableThemeTransitions → applyResolvedTheme → updateThemeColor →
localStorage.setItem`) can never drift between products. See
`docs/dev-log/2026-04-26-marketing-preference-switcher.md` for the marketing
landing piece.
