# 2026-04-27 · Rules Console Shell (`/settings/rules`)

## Context

`docs/product-design/rules/02-rules-console-product-design.md` defines the
Rules Console IA for the internal settings area. The P0 implementation ships
the four read-only Figma tabs and leaves Candidates promotion, Publish Preview,
detail drawers, and write flows for P1.

Figma frames, all in the **App Page** canvas:

| Frame                  | Node    | Position      |
| ---------------------- | ------- | ------------- |
| Coverage tab           | `214:2` | `(0,    980)` |
| Sources tab            | `219:2` | `(1520, 980)` |
| Rule Library tab       | `224:2` | `(3040, 980)` |
| Generation Preview tab | `225:2` | `(4560, 980)` |

All four states share the same route chrome, `Rules Console` page identity,
`READ-ONLY` badge, 40 px underline tab row, and centered 880 px settings
content column.

## Implementation

- Added the lazy route `settings/rules` in `apps/app/src/router.tsx`, rendering
  `apps/app/src/routes/settings.rules.tsx`.
- Added the feature module under `apps/app/src/features/rules/`:
  - `rules-console.tsx` owns the tab shell and tab-specific descriptions.
  - `rules-console-primitives.tsx` owns shared frame, chip, status, table, and
    empty/loading/error primitives.
  - `coverage-tab.tsx` consumes `rules.coverage`.
  - `sources-tab.tsx` consumes `rules.listSources`.
  - `rule-library-tab.tsx` consumes `rules.listRules` with candidates included.
  - `generation-preview-tab.tsx` consumes `rules.previewObligations` using
    React Hook Form + Zod for client facts.
  - `rules-console-model.ts` keeps tab metadata, filter logic, static coverage
    matrix labels, and preview form mapping out of render code.
  - `rules-console-model.test.ts` covers route-tab guards, preview mapping,
    source/rule filters, and preview grouping.
- Updated `apps/app/src/routes/_layout.tsx` so AppShell route titles are derived
  from location. `/settings/rules` now displays `Settings` / `Rules`.
- Updated `apps/app/src/components/patterns/app-shell.tsx` with Settings
  sub-navigation. `Rules` links to `/settings/rules`; `Members` and `Profile`
  are disabled P1 placeholders.
- Updated `apps/app/src/components/patterns/keyboard-shell/CommandPalette.tsx`
  with a `Rules Console` command.
- Updated Lingui catalogs and compiled messages so the new shell labels are not
  missing in `zh-CN`.

No contract, server, database, or core rule changes were needed. The route uses
the existing oRPC endpoints from `packages/contracts/src/rules.ts` and
`apps/server/src/procedures/rules/index.ts`.

## Data Wiring

| Tab                | Endpoint                   | Notes                                                                                                                           |
| ------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Coverage           | `rules.coverage`           | Renders the jurisdiction table from live coverage rows and the Figma-aligned coverage matrix labels from local model constants. |
| Sources            | `rules.listSources`        | Supports health chips, jurisdiction filter, 12-row default density, and show-all expansion across 28 sources.                   |
| Rule Library       | `rules.listRules`          | Includes candidates, supports tier chips, jurisdiction filter, 13-row default density, and candidate row tint.                  |
| Generation Preview | `rules.previewObligations` | Dry-runs the CA LLC default scenario and groups results into reminder-ready and requires-review sections.                       |

The Generation Preview default uses the current core rules boundary that
produces:

- 1 reminder-ready row: `ca.llc.annual_tax.2026 v1`
- 2 requires-review rows: `fed.1065.return.2025 v1` and
  `ca.llc.estimated_fee.2026 v1`

## Design Notes

- The route keeps the existing AppShell. It does not duplicate global chrome.
- The tab row is second-level route chrome, full inset width with 24 px left
  padding so it anchors to the same vertical line as the sidebar's interior
  content (Figma `left=24`).
- Content (page header + active panel) sits in a centered `max-w-[928px]` flex
  column with `px-6` outer padding. On the 1440 px Figma frame this resolves
  to a 880 px content column starting at `left=170 px` — matching every
  Coverage / Sources / Rule Library / Generation Preview frame exactly.
  `Tabs` is forced to `flex flex-col gap-0` so the centred column is not
  pulled by the cva default `gap-2`.
- Tables use shadcn table primitives and flat 1 px frames. No nested cards
  were introduced.
- Filter chips and status pills are local composition over design-system
  tokens; no new token family was added.
- Generation Preview is the only card-like form surface. The form is a fixed
  5-column grid `[220 110 110 220 120]`. The TAX YEAR column shows a single
  composite string `YYYY-MM-DD → MM-DD` while the Zod schema still validates
  two ISO `taxYearStart` / `taxYearEnd` fields under the hood — `parseTaxYearInput`
  accepts both `YYYY-MM-DD → YYYY-MM-DD` and the abbreviated `YYYY-MM-DD →
MM-DD` form, the latter inheriting the start year. The submit button
  carries the `↵` glyph as a keyboard affordance.
- Rule Library candidate rows now use the `review` (purple) tone dot,
  matching the Figma `accent` ellipse used on `fed.disaster_relief.watch`.
- Shared display logic lives in model/primitives modules to avoid inline
  component definitions and derived-state effects in route render code.

### Token & color discipline

The Figma `var(--accent/default, #5b5bd6)` lookups are tokens, not raw hex —
the `#5b5bd6` is the export fallback. We map them exactly once, then never
touch hex in code:

| Figma token                 | Tailwind class (`@duedatehq/ui`)                            |
| --------------------------- | ----------------------------------------------------------- |
| `accent/default #5b5bd6`    | `bg-state-accent-solid` (`util-colors-primary-500`)         |
| `accent/tint #f1f1fd`       | `bg-accent-tint`                                            |
| `accent/text #4338ca`       | `text-text-accent`                                          |
| `status/review #7c3aed`     | `text-status-review`                                        |
| `status/done #059669`       | `text-status-done`                                          |
| `severity/medium #ca8a04`   | `text-severity-medium` / `bg-severity-medium-tint`          |
| `severity/critical #dc2626` | `text-severity-critical` / `-tint`                          |
| `text/primary #0a2540`      | `text-text-primary`, `bg-text-primary` (active filter chip) |
| `text/muted #94a3b8`        | `text-text-muted`                                           |
| `border/default #e5e7eb`    | `border-divider-regular`                                    |

Two specific call-sites that used to drift:

1. **Tab underline** — `@duedatehq/ui` Tabs cva paints the `after:` accent
   with `bg-components-segmented-text-active` (= `#101828`, dark navy). Figma
   wants `accent/default = #5b5bd6`. We override locally with
   `after:bg-state-accent-solid` and clip the rectangle to `left:8 / right:8`
   (the cva default is `inset-x-0`).
2. **Active filter chip** — Figma uses `text/primary` (navy) as the chip
   background, _not_ the brand purple. The legacy `Button variant="primary"`
   path renders the brand purple, so `FilterChips` now applies
   `bg-text-primary text-text-inverted` directly when active and reserves the
   purple for tab underline + sub-route highlights only (DESIGN.md §1.2
   "color only serves risk").

### Internationalisation

Every user-facing string in the four tabs is routed through Lingui macros
(`useLingui` + `Trans`). `rules-console-model.ts` was reduced to **value
tables only** — `JURISDICTION_LABELS`, `COVERAGE_STATUS_LABELS`, and the old
inline `RULES_TABS.label` field were removed so non-React callers (tests,
contracts) cannot accidentally bypass i18n.

Localised label tables (`jurisdictionLabels`, `coverageStatusLabels`,
`tabLabels`, `tabDescriptions`, `tierLabels`, etc.) live next to their
component and are wrapped in `useMemo([t])` so the dictionary stays
referentially stable until the active locale changes.

`zh-CN` carries 0 missing translations after this change (`pnpm --filter
@duedatehq/app i18n:extract` reports 341 / 341 across both locales).

## Sidebar IA Decision (Settings as a container, not a flat peer)

The four-tab Figma frames render the sidebar with `Settings` highlighted in
`accent/tint` and the `Rules` sub-item also highlighted. We deliberately
deviate from that exact rendering: parent rows in the `MANAGE` group are
**neutral containers** — no `aria-current`, no `isActive`, no `text-text-primary`
override on expand. The `accent-tint` selected highlight belongs to the sub-item
only, so the sidebar reads "you are inside Settings → Rules" with the visual
weight on Rules. Parent click behaviour is three-state:

1. Collapsed + section not active → navigate to `defaultSubItemHref`
   (`/settings/rules`) and expand.
2. Collapsed + already on a sub-route → expand without navigating.
3. Expanded → collapse without navigating.

We considered flattening `Rules / Members / Profile` to top-level peers and
deleting the `Settings` container. Rejected because:

- `02-rules-console-product-design.md` §2 fixes the route at `/settings/rules`.
  Flattening would either break that contract or split URL ↔ IA.
- `MANAGE` would balloon to 3+ items today and 5+ once `Notifications`,
  `Billing`, `Workspace` land in P1 — same pattern Linear / Notion / GitHub /
  Vercel solve with a `Settings` container.
- `Profile` (per-user), `Members` (per-firm RBAC), `Rules` (per-platform ops)
  are semantically different layers; folding them together blurs the mental
  model of "what am I editing right now".

## Out of Scope

- Candidate promote/reject actions.
- Publish Preview impact simulation.
- Source and rule detail drawers.
- `obligation_instance` provenance migration.
- Saved preview inputs and input comparison.
- RBAC gating for owner/ops-only access.

## Validation

Completed:

- `pnpm dlx shadcn@latest docs -c packages/ui tabs table badge button input select card field skeleton`
- `pnpm exec vp check apps/app/src` — clean (60 files formatted, 61 type-/lint-clean)
- `pnpm --filter @duedatehq/app test -- --run src/features/rules/rules-console-model.test.ts`
  — 4/4 passing
- `pnpm --filter @duedatehq/app i18n:extract` then `i18n:compile --strict` —
  catalogs are zero-missing (the renamed `Collapse {0}` / `Expand {0}` aria
  labels carry `zh-CN` translations in the same change).

Pending final gate before merge:

- `pnpm check` (workspace-level) and `pnpm design:lint` once all routes land.

## References

- `DESIGN.md`
- `docs/product-design/rules/README.md`
- `docs/product-design/rules/02-rules-console-product-design.md`
- `packages/contracts/src/rules.ts`
- `packages/core/src/rules/index.ts`
- `apps/server/src/procedures/rules/index.ts`
- `apps/app/src/features/rules/`
- `apps/app/src/routes/settings.rules.tsx`
