# Smart Priority Preview Empty State

## Context

Smart Priority preview previously allowed owners to click Calculate preview even when the active
practice had no open obligations. The only visible result was a low-emphasis empty state after the
request completed.

## Changes

- Added the active open obligation count to the firm public payload.
- Disabled Calculate preview when the current practice has zero open obligations.
- Added a hover tooltip on the disabled button with the existing empty-state reason.

## Validation

- `pnpm --filter @duedatehq/contracts test --run`
- `pnpm check`
- `pnpm --filter @duedatehq/db test --run`
