---
title: 'Plan workflow gates'
date: 2026-05-03
---

# 2026-05-03 · Plan workflow gates

## Context

Solo / Pro / Team entitlement differences were defined in `packages/core`, but several AI and
workflow surfaces still relied on copy-only distinctions or model-tier routing. The missing piece was
runtime enforcement for production practice AI and Team-only review workflows.

## Changes

- Added shared server plan gate helpers and applied them to Dashboard brief refresh, client risk
  summary refresh, deadline tip refresh, readiness checklist generation, Pulse production actions,
  Pulse review requests, and guided integration migration review.
- Kept Solo migration imports AI-assisted by routing Mapper / Normalizer through the Solo basic AI
  tier. Preset and dictionary fallback now only cover AI-unavailable paths.
- Added Solo migration onboarding credit in the AI budget: 30 migration AI requests per firm per day
  for the first 7 days before the first successful import, then 15 migration AI requests per firm per
  day.
- Added Pro upgrade CTAs for manual practice AI triggers.
- Updated billing and AI architecture docs so plan copy and runtime gates describe the same product.

## Validation

- `pnpm exec vp check apps/server/src/procedures/_plan-gates.ts apps/server/src/procedures/dashboard/index.ts apps/server/src/procedures/clients/index.ts apps/server/src/procedures/obligations/index.ts apps/server/src/procedures/readiness/index.ts apps/server/src/procedures/pulse/index.ts apps/server/src/procedures/migration/index.ts apps/server/src/procedures/migration/_service.ts apps/server/src/procedures/migration/_preset-mappings.ts apps/app/src/routes/dashboard.tsx apps/app/src/features/clients/ClientFactsWorkspace.tsx apps/app/src/routes/workboard.tsx apps/app/src/features/pulse/PulseDetailDrawer.tsx apps/app/src/features/pulse/components/AffectedClientsTable.tsx apps/app/src/features/pulse/lib/error-mapping.ts packages/core/src/plan-entitlements/index.test.ts apps/server/src/procedures/migration/_service.test.ts apps/server/src/procedures/pulse/index.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/core test --run src/plan-entitlements/index.test.ts`
- `pnpm --filter @duedatehq/server test --run src/procedures/migration/_service.test.ts src/procedures/pulse/index.test.ts`
