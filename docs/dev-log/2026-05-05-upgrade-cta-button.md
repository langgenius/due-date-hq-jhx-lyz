---
title: 'Upgrade CTA Button'
date: 2026-05-05
author: 'Codex'
---

# Upgrade CTA Button

## Context

AI-gated surfaces such as Deadline Tip and Client Risk Summary used a neutral outline "Upgrade"
button. In dense dark drawers, that treatment read like a secondary action and did not clearly pull
attention toward the paid upgrade path.

## Change

- Added a shared `UpgradeCtaButton` for self-serve Pro upgrade links.
- Switched the CTA to a warm solid treatment with a warning-tone border, glow, and hover sheen so
  it stands apart from neutral operational controls.
- Updated the CTA copy to "Upgrade to Pro" and reused it in obligation readiness, obligation risk,
  and client facts AI-gated surfaces.

## Validation

- `pnpm --filter @duedatehq/app exec vp check src/features/billing/upgrade-cta-button.tsx src/routes/obligations.tsx src/features/clients/ClientFactsWorkspace.tsx`
- `pnpm --filter @duedatehq/app test -- src/routes/obligations.test.ts src/features/billing/model.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- Browser checked the obligation Risk drawer CTA at `localhost:5173/obligations`.
