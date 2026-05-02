---
title: 'Firm profile save feedback toast'
date: 2026-05-02
area: firm
---

## Context

The Firm profile form updated name/timezone through `firms.updateCurrent`, but save feedback only
appeared as inline error text. Users needed an immediate popup confirmation for both successful and
failed `Save changes` attempts.

## Changes

- Added a success toast after `Save changes` completes, using the saved firm name as context.
- Added error toasts for RPC failure and the local minimum-name validation path.
- Kept the existing inline error text so the failure remains visible after the toast disappears.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
