# 2026-05-13 · Lightweight Opportunities

## Change

- Added a lightweight Opportunities product surface for future business cues.
- Added `opportunities.list` as a read-only oRPC endpoint over existing client facts and
  obligations.
- Added `/opportunities` to the authenticated app shell and command palette.
- Added a Client detail right-rail card for client-scoped future business cues.
- Documented the product boundary in `docs/product-design/opportunities/README.md`.

## Product Boundary

This is not a tax advice or tax avoidance feature. The V1 cue types are intentionally limited to:

- advisory conversation;
- scope review;
- retention check-in.

Every cue is deterministic, shows simple evidence, and routes back to Client detail. V1 does not add
an opportunity table, lifecycle state, write mutation, pricing benchmark, or AI-generated tax
strategy.

## Verification

- Added unit coverage for the deterministic opportunity read model.
- Added contract coverage for the `opportunities.list` public shape.
