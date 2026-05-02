# 2026-05-02 · Dify UI blue accent swap

## Summary

Replaced the DueDateHQ purple accent palette with Dify product UI blue across the runtime token tree, shared brand SVGs, app/marketing favicons, and current design guidance.

## Decisions

- `primary-600 #155aef` is the default CTA/button background because white text passes normal-text contrast.
- `primary-500 #296dff` is reserved for solid accent indicators such as tab underlines and progress/rib highlights; it is not used for white-text primary buttons.
- Light selected/wayfinding tint moved from purple `#f1f1fd` to Dify blue `#eff4ff`; strong tint moved to `#d1e0ff`.
- Dark accent uses `#5289ff` for blue-on-dark emphasis, while component primary buttons stay on `#155aef` or darker for white-text contrast.
- `status-review` now maps to the Dify blue accent family so review/candidate UI no longer introduces a separate purple status color.

## Files Touched

- Runtime SSoT: `packages/ui/src/styles/tokens/{primitives,semantic-light,semantic-dark}.css`
- Brand assets: `packages/ui/src/assets/brand/*.svg`, `apps/app/public/favicon.svg`, `apps/marketing/public/favicon.svg`
- Current guidance/comments: `docs/Design/DueDateHQ-DESIGN.md`, `packages/ui/AGENTS.md`, sidebar/rules comments, frontend/marketing architecture notes
