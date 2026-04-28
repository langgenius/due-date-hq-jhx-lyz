# 2026-04-28 · Rules Console tab URL state

## Context

`/settings/rules` already uses the app-wide `NuqsAdapter`, and `nuqs` is present
in the workspace dependency catalog. Workboard had already established the URL
state pattern for shareable operational views, but Rules Console still kept its
four P0 tabs in component-local state. That meant `/settings/rules` always
returned to Coverage and could not deep-link directly to Sources, Rule Library,
or Generation Preview.

## Decision

Rules Console tab selection is now route state:

```text
/settings/rules?tab=coverage|sources|library|preview
```

Missing or invalid values fall back to `coverage`. The query parameter is
updated with `history: replace`, so tab clicks keep the current URL shareable
without filling the browser back stack with intermediate tab switches.
Because `coverage` is the default, bare `/settings/rules` remains the canonical
Coverage URL; `?tab=coverage` is accepted but can be cleared on default.

## Implementation

- `apps/app/src/features/rules/rules-console-model.ts`
  - Added `RULES_TAB_VALUES` as the literal tuple source of truth.
  - Added `DEFAULT_RULES_TAB = 'coverage'`.
  - Added `rulesConsoleSearchParamsParsers` as the module-level query
    contract.
  - Derived `RulesConsoleSearchParams` and `RulesTab` with `inferParserType`.
  - Kept `isRulesTab` as a runtime guard backed by the same tuple.
- `apps/app/src/features/rules/rules-console.tsx`
  - Replaced `useState<RulesTab>('coverage')` with
    `useQueryState('tab', rulesConsoleSearchParamsParsers.tab)`.
  - Applied `withDefault(DEFAULT_RULES_TAB)` and `withOptions({ history:
'replace' })` inside the parser contract, matching `nuqs` v2 hook typing.
  - Kept tab rendering controlled by the validated `RulesTab` value.
- `apps/app/src/features/rules/rules-console-model.test.ts`
  - Covers the shared literal tuple, default tab, and invalid-value guard.

This follows the same React constraints already used in the route:
derive state during render, avoid effect-based URL synchronization, keep event
logic in the tab change handler, and keep literal values analyzable at module
scope.

## Docs

- `docs/dev-file/05-Frontend-Architecture.md` now treats tab/subview selection
  as URL state and documents the Rules Console `tab` parameter.
- `docs/product-design/rules/02-rules-console-product-design.md` now includes
  the route-state contract.
- `docs/product-design/rules/README.md` and historical Rules Console dev-logs
  now note the URL-state follow-up so older local-state descriptions do not
  become misleading.

## Validation

- `pnpm --filter @duedatehq/app test -- --run src/features/rules/rules-console-model.test.ts`
  — 5/5 passing
- `pnpm check` — formatting passes; type/lint initially caught this change's
  `useQueryState` option placement and `RULES_TABS` count typing, both fixed.
  The remaining warnings are pre-existing `no-unsafe-type-assertion` warnings
  in `apps/server/src/env.test.ts` and `packages/ui/src/lib/placement.ts`.
