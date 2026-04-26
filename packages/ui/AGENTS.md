# @duedatehq/ui

Shared React UI primitives, design tokens, and styling utilities.
Visual language is adapted from Dify (`@langgenius/dify-ui`) over Tailwind v4
with `@base-ui/react` headless primitives. Brand palette is DueDateHQ purple.

## Component Authoring Rules

- Use `@base-ui/react` primitives + `cva` (class-variance-authority) + `cn`.
- One component per file under `src/components/ui/<name>.tsx`. The matching
  shadcn-style `data-slot="<name>"` attribute should be present on the root.
- Each public component is exported via `package.json#exports` under
  `@duedatehq/ui/components/ui/<name>`. Don't add new entrypoints unless a new
  file is added.
- No imports from `apps/`. No hard dependencies on routing, auth, oRPC, or
  domain logic — `@duedatehq/ui` is the leaf of the dependency tree.
- Props pattern: `Primitive.Props & VariantProps<typeof variants> & { /* extra */ }`.
  Forward `className` through `cn(variants({ ... }), className)` so callers
  can override.
- Use `data-slot`, `data-variant`, `data-size` attributes for downstream
  styling targets; avoid leaking variant strings into class names other than
  through the cva config.
- Cross-component imports inside the package use relative paths
  (`../button`). External consumers use the subpath exports.

## Token Tree (`src/styles/`)

Tailwind v4 CSS-first config. The token bundle splits into three layers:

| Layer          | File                        | Defines                                                                                   |
| -------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| Primitives     | `tokens/primitives.css`     | `@theme` — fonts, radius, font sizes, spacing, shadows, breakpoints, util-colors palettes |
| Semantic light | `tokens/semantic-light.css` | `:root` — text-/background-/divider-/state-/effects-/components-\* + legacy aliases       |
| Semantic dark  | `tokens/semantic-dark.css`  | `.dark` — same names, dark values                                                         |

`preset.css` (entry) imports the three sub-files, then exposes every CSS
variable to Tailwind via a single `@theme inline` block. Light/dark swap
is driven by `.dark` on `<html>`.

### Available namespaces (utility class prefixes)

- `text-text-{primary,secondary,tertiary,quaternary,placeholder,disabled,destructive,success,warning,accent,inverted,...}`
- `bg-background-{default,body,section,subtle,soft,overlay,overlay-backdrop,sidenav-bg,...}`
- `border-divider-{subtle,regular,deep,intense,solid,solid-alt,accent}`
- `bg-state-{base,accent,destructive,success,warning}-{hover,hover-alt,active,solid,...}`
- `bg-components-{button,input,checkbox,radio,toggle,segmented,panel,tooltip,menu,card,actionbar,badge}-*`
- `bg-util-colors-{gray,primary,red,green,yellow,orange,warning,blue,blue-light,indigo,violet,teal,pink,rose}-{25..900}`
- `shadow-{xs,sm,md,lg,xl,2xl,3xl}` and `shadow-status-indicator-{green,warning,red,blue,gray}`

Legacy aliases (`bg-primary`, `text-foreground`, `bg-card`, `border-border`,
`bg-sidebar`, `text-muted-foreground`, `bg-severity-*`, etc.) remain valid
and resolve onto the new token tree, so pre-migration call-sites keep
working without value changes.

## Border Radius: Figma Token → Tailwind Class

Tailwind v4 defaults are not overridden. Match Figma tokens like so:

| Figma Token     | Value | Tailwind Class   |
| --------------- | ----- | ---------------- |
| `--radius/2xs`  | 2px   | `rounded-xs`     |
| `--radius/xs`   | 4px   | `rounded-sm`     |
| `--radius/sm`   | 6px   | `rounded-md`     |
| `--radius/md`   | 8px   | `rounded-lg`     |
| `--radius/lg`   | 10px  | `rounded-[10px]` |
| `--radius/xl`   | 12px  | `rounded-xl`     |
| `--radius/2xl`  | 16px  | `rounded-2xl`    |
| `--radius/3xl`  | 20px  | `rounded-[20px]` |
| `--radius/full` | 999px | `rounded-full`   |

### Rules

- Do **not** add custom `borderRadius` values to `tokens/primitives.css`.
- Do **not** introduce a `radius-*` utility class layer; use the standard
  Tailwind classes from the table above.
- For the non-standard sizes (10px, 20px), use arbitrary values like
  `rounded-[10px]`.

## Overlay Primitive Selection: Tooltip vs Popover

Pick by the **trigger's purpose** and **a11y reach**, not visual richness.

| Primitive | Opens on      | Trigger purpose       | Content                   | Reachable on touch / SR? |
| --------- | ------------- | --------------------- | ------------------------- | ------------------------ |
| `Tooltip` | hover / focus | has its own action    | short plain-text label    | No (label only)          |
| `Popover` | click / tap   | **to open the popup** | anything, incl. long text | Yes                      |

Decision rule (Base UI):

> If the trigger's purpose is to open the popup itself, it's a popover.
> If the trigger's purpose is unrelated to opening the popup, it's a tooltip.

- `Tooltip` — ephemeral visual label. The trigger must already carry its own
  `aria-label` / visible text; the tooltip mirrors it for sighted mouse and
  keyboard users. Do **not** put interactive UI or multi-line prose inside.
- `Popover` — any popup with its own interactions, or any "infotip"
  (`?` / `(i)` glyph whose sole purpose is to reveal help text). For the
  infotip case, pass `openOnHover` on `PopoverTrigger` — it stays accessible
  to touch and screen reader users because the popover still opens on tap and
  focus.

A `PreviewCard` primitive is intentionally not provided yet; if a hover-only
rich preview pattern is needed in the future, we'll port it from Dify.

## Shared Overlay Helpers (`src/lib/overlay.ts`)

Class strings shared across `dialog`, `popover`, `dropdown-menu`, `select`,
`tooltip`, `sheet`. Centralised so the six surfaces share consistent border,
blur, animation tokens. Re-export the pieces you need:

- `overlayPopupBaseClassName` — floating panel surface
- `overlayPopupAnimationClassName` — open/close transition
- `overlayBackdropClassName` — fullscreen backdrop
- `overlayRowClassName` — highlightable row (menu item, select option)
- `overlayDestructiveClassName` — destructive variant on a row
- `overlayLabelClassName` — section label inside menus
- `overlayIndicatorClassName` — trailing check / chevron
- `overlaySeparatorClassName` — inline separator between groups
