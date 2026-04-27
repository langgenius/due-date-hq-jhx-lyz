# Brand assets

Single source of truth for the DueDateHQ product mark.
Figma: file `ssejugriUJkW9vbcBzmRgd`, frame "DueDateHQ — Brand Icon (Design Spec)"
(node `98:2`). Geometry rationale lives in `docs/Design/DueDateHQ-DESIGN.md`.

## Files

| File                     | viewBox | Tile fill | Accent fill | Use it for                                                |
| ------------------------ | ------- | --------- | ----------- | --------------------------------------------------------- |
| `brand-mark.svg`         | 256×256 | `#0A2540` | `#5B5BD6`   | OG images, email hero, ≥ 64 px hero tiles                 |
| `brand-favicon.svg`      | 32×32   | `#0A2540` | `#5B5BD6`   | Browser favicon, ≤ 32 px inline brand chips (light theme) |
| `brand-favicon-dark.svg` | 32×32   | `#15171C` | `#7C7BF5`   | ≤ 32 px inline brand chips (dark theme)                   |

The full mark uses 1 px hairline elements (clock-face ring, four ticks,
workbench baseline, pulse halo). Below ~32 px those features sub-pixel out
and the icon turns to mush. The favicon variants drop every hairline element
and only keep the three-shape minimum that survives small sizes:

- rounded-square tile
- deadline arc (stroke 8 % of edge, round caps)
- pulse dot (ø 16 % of edge)

All files use hardcoded hex (no CSS variables, no `currentColor`) so they
work as standalone files in `<link rel="icon">` tags and in email templates
where CSS-variable resolution is unavailable.

## Theme strategy

| Surface                         | Theme-aware? | How                                                                                                                                                    |
| ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<link rel="icon">` favicon     | No           | Ship the light variant only. Browser tab chrome is browser-managed and does not follow app theme; the navy tile reads on every browser-tab background. |
| Inline `<img>` in app/marketing | Yes          | Render two `<img>` tags, hide one via Tailwind `dark:hidden` / `hidden dark:block`. Zero JS, no theme-switch flash, no hydration cost.                 |

## How to consume

### From any app's `public/` (favicons)

Copy `brand-favicon.svg` to `apps/<app>/public/favicon.svg`. Each app keeps
its own copy because public assets are emitted per-app at build time.

### Inlined in app/marketing UI (theme-aware)

Both Vite (apps/app) and Astro (apps/marketing) resolve `*.svg` imports as
URL strings by default — no plugin, no `?raw`, no React component wrapper.

```tsx
// React (apps/app)
import brandLight from '@duedatehq/ui/assets/brand/brand-favicon.svg'
import brandDark from '@duedatehq/ui/assets/brand/brand-favicon-dark.svg'

<img src={brandLight} alt="" aria-hidden width={16} height={16} className="size-4 dark:hidden" />
<img src={brandDark} alt="" aria-hidden width={16} height={16} className="hidden size-4 dark:block" />
```

```astro
---
// Astro (apps/marketing)
import brandLight from '@duedatehq/ui/assets/brand/brand-favicon.svg'
import brandDark from '@duedatehq/ui/assets/brand/brand-favicon-dark.svg'
---
<img src={brandLight} alt="" aria-hidden width="16" height="16" class="size-4 dark:hidden" />
<img src={brandDark} alt="" aria-hidden width="16" height="16" class="hidden size-4 dark:block" />
```

The browser preloads both files (~395 bytes each) and CSS hides one based
on the `.dark` class on `<html>`. Same pattern GitHub uses for theme-aware
markdown images.

## Sync rule

Any change to the icon must start in Figma (frame `98:2`), be re-exported
via `node.exportAsync({ format: 'SVG_STRING' })`, and replace these files
in the same PR. Do not hand-edit geometry locally.
