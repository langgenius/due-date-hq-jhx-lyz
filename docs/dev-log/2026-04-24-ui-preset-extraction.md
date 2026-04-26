---
title: '2026-04-24 · UI Preset Extraction'
date: 2026-04-24
commit: 'fe158d4'
updates:
  - commit: '47d44f3'
    note: 'Updated apps/app workspace references.'
---

# 2026-04-24 · UI Preset Extraction

## Context

`apps/app` previously owned both shadcn primitives and the design token stylesheet. That works for a single SPA, but it becomes the wrong boundary once a separate Astro marketing app exists.

This change extracts the shared UI surface from `apps/app` into `packages/ui` so the SaaS app and future marketing app consume one source of truth for React primitives, brand tokens, and low-level styling helpers.

## Final Boundary

- `packages/ui/src/components/ui/*`: shadcn/Base UI primitives only
- `packages/ui/src/lib/utils.ts`: `cn()`
- `packages/ui/src/styles/preset.css`: all shared design tokens, `@theme inline`, dark tokens, and base layer
- `apps/app/src/styles/globals.css`: consumer Tailwind entry point

Consumer apps must import the preset and explicitly source the shared UI package:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import '@duedatehq/ui/styles/preset.css';

@source '../../../../packages/ui/src';
```

The `@source` path is relative to the consuming stylesheet. Future `apps/marketing` must use its own relative path to `packages/ui/src`.

## Validation Target

Because Tailwind generates utilities by scanning source files, every consuming app must scan `packages/ui/src`. The built CSS must include both design tokens and shadcn internals:

- CSS variables: `--background`, `--card`, `--popover`, `--sidebar`, semantic severity/status tokens
- Tailwind utilities from app routes: `bg-bg-panel`, `text-text-secondary`, `border-severity-critical-border`
- Tailwind utilities from shared shadcn components: `bg-popover`, `text-popover-foreground`, `text-card-foreground`, `border-input`, `rounded-xl`, `data-open:animate-in`
