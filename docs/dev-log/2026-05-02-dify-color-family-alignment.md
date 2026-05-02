# 2026-05-02 · Dify color family alignment

## Summary

Aligned the non-accent color families with Dify UI runtime values after the Dify blue accent swap. The change keeps existing utility class names and component APIs intact; only resolved token values changed.

## Decisions

- Gray, blue, red, green, warning, orange, and status colors now resolve through Dify-like util palettes instead of Tailwind slate/emerald/sky or custom project values.
- Neutral hovers returned to Dify gray alpha states. Selected route wayfinding remains on the explicit Dify UI blue accent tint.
- Severity colors map to Dify red/orange/warning families: critical red, high orange, medium warning, neutral gray.
- Status colors map to Dify green/gray/blue-light families; review remains Dify UI blue.
- Brand mark navy `#0A2540` remains a light-theme brand asset background, not a general UI text/surface token; the dark favicon neutral moved to Dify panel `#222225`.
- Primary white-text buttons continue to use `#155aef` or darker for AA contrast; `#296dff` remains reserved for solid accent indicators.

## Files Touched

- Runtime SSoT: `packages/ui/src/styles/tokens/{primitives,semantic-light,semantic-dark}.css`
- Current guidance/comments: `docs/Design/DueDateHQ-DESIGN.md`, `packages/ui/AGENTS.md`, sidebar/rules comments
