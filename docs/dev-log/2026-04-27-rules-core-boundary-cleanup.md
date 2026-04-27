# 2026-04-27 · Rules Core Boundary Cleanup

## Context

The rules preview direction was correct, but the source health checker mixed
network I/O concerns into `packages/core`. That conflicted with the project rule
that core must stay a pure domain layer.

## Changes

- Removed source health fetch/curl helpers from `@duedatehq/core/rules`.
- Removed the core package `rules:check-sources` script.
- Added root `pnpm rules:check-sources`, backed by `scripts/check-rule-sources.ts`
  and an explicit root `tsx` dev dependency.
- Kept the checker as an ops script that imports `RULE_SOURCES` from core but
  owns all curl, retry, and process-exit behavior outside core.
- Updated rules docs and the source-health dev log to use the repo-level command.

## Validation

- `pnpm rules:check-sources`
