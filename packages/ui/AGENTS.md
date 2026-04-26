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

## Page Typography & Spacing (App Routes)

The token tree (font sizes, spacing, radius) is Dify-aligned, but consumers
need a stable contract for **how to compose** those tokens at the page level.
The recipe below is the single source of truth for new routes; existing pages
were aligned to it in the Day-style rollout.

### Page shell

- Outer container: `flex flex-col gap-6 p-4 md:p-6`
- Page header sits at the top of the route container with this structure:

```tsx
<header className="flex flex-col gap-2">
  <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{eyebrow}</span>
  <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold leading-tight text-text-primary">{title}</h1>
      <p className="max-w-[720px] text-md text-text-secondary">{description}</p>
    </div>
    <div className="flex gap-2">{actions}</div>
  </div>
</header>
```

### Card layer

- Default Card: `rounded-xl` + `py-5 px-5` + `gap-5` (provided by `Card`).
- `CardTitle` defaults to `text-md font-semibold` (14px) — matches Dify's
  `system-md-semibold`, the most common card title size in data-dense
  surfaces (dashboards, app lists, list-of-cards). Don't override per
  call-site; Card's `size="sm"` variant already drops to `text-sm`.
- For prominent / settings-module section cards where 16px reads better,
  override the title with `className="text-lg"`. Reserve this for cards
  that are the focal point of their page section.
- `CardDescription` is `text-sm text-text-tertiary`.

### Section titles inside a card / wizard step

- Major section heading (h2): `text-lg font-semibold text-text-primary`
- Minor uppercase label (h3 / fieldset legend):
  `text-xs font-medium uppercase tracking-[0.08em] text-text-tertiary`

### Body text

Dify body is **14px**, not 12px. `text-sm` (12px) is description / metadata,
not body. The default `Card` and `Table` body inherits `text-md` (14px) so
most call-sites should not need to set a size at all.

| Use                                | Class                                   | px  |
| ---------------------------------- | --------------------------------------- | --- |
| Default body (forms, prose, lists) | `text-md text-text-primary`             | 14  |
| Compact body (dense tables, rows)  | `text-base text-text-primary`           | 13  |
| Description / supporting text      | `text-sm text-text-secondary`           | 12  |
| Caption / footnote / eyebrow       | `text-xs text-text-tertiary`            | 11  |
| Form label                         | `text-sm font-medium text-text-primary` | 12  |

Rule of thumb: if a string is the user's primary signal in a row / card /
section, it's body — start with `text-md`. Reach for `text-sm` only when the
content is supporting (helper text, hint, description, secondary stat).

### Border radius hierarchy

| Layer                                    | Class          |
| ---------------------------------------- | -------------- |
| Outer card / page-level surface          | `rounded-xl`   |
| Mid container (inline box, step, alert)  | `rounded-lg`   |
| Controls (button, input, badge bg frame) | `rounded-md`   |
| Small chip / step number                 | `rounded-md`   |
| Pill / dot / avatar                      | `rounded-full` |

The `rounded-sm` (4px) bucket is intentionally avoided in app routes — it
flattens the visual hierarchy. Reserve it for table cells / decorative
separators where 6px would feel too soft.

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
