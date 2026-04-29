---
title: 'Vite+ Astro CI recovery'
date: 2026-04-29
author: 'Codex'
---

# Vite+ Astro CI recovery

## Context

Commit `8fac259` upgraded the dependency catalog and immediately broke the
`CI` and `E2E` GitHub Actions runs on `main`.

The CI failure was a type-check failure in `apps/marketing/astro.config.mjs`:
the existing `@ts-expect-error` became unused under the upgraded toolchain. The
E2E failure happened before browser assertions: Playwright's web server could
not start because `@duedatehq/marketing` failed during `astro build` with a
`Not implemented` error from Vite+'s `generateBundle` path.

## Changes

- Pinned the Vite+ release train back to the last CI-green set:
  `vite-plus`, aliased `vite`, and aliased `vitest` all use `0.1.19`.
- Pinned the marketing Astro toolchain back to the last CI-green set:
  `astro@6.1.8` and `@astrojs/check@0.9.8`.
- Regenerated `pnpm-lock.yaml`.
- Updated the tech-stack doc so the catalog excerpt no longer advertises the
  failing Vite+/Astro combination.

## Why

The failed Actions logs pointed at `@voidzero-dev/vite-plus-core@0.1.20`, but
local reproduction showed that downgrading only Vite+ was not enough once Astro
had already moved to `6.1.10`. The smallest recovery is therefore to restore
the known-good Vite+/Astro pair while leaving unrelated dependency patches from
the catalog update in place.

## Validation

- `pnpm install`
- `pnpm exec vp check apps/marketing/astro.config.mjs`
- `pnpm --filter @duedatehq/marketing build`
- `pnpm check`
- `pnpm test:e2e --reporter=list` (41 passed)

## Follow-up

Reproduce the failed upgrade in a disposable `/tmp` checkout and isolate whether
the unsupported `generateBundle` access is introduced by Vite+ `0.1.20`, Astro
`6.1.10`, or their interaction before attempting the bump again.
