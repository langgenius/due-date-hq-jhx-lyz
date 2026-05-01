# Toast Tone Styling

## Context

Right-bottom toast notifications were rendering with the same neutral surface for both positive
and negative outcomes, even though the shared Sonner wrapper already exposed success and error
design-token variables.

## Change

- Enabled Sonner rich colors in the shared `Toaster` wrapper so typed toasts use the existing
  tokenized tone styles.
- `toast.success(...)` now renders with the success green tint, border, text, and icon color.
- `toast.error(...)` now renders with the destructive red tint, border, text, and icon color.

## Validation

- `pnpm exec vp check packages/ui/src/components/ui/sonner.tsx docs/dev-log/2026-05-01-toast-tone-styling.md`
  - Formatting passed; path-scoped lint exited before analysis because this file set produced no lint
    targets.
- `pnpm exec tsc -p packages/ui/tsconfig.json --noEmit`
