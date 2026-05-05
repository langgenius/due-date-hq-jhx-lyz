# 2026-05-05 · Fast JSON plan model routing

## Context

Fast JSON prompts are cheap, structured workflows, but the product decision is to give Solo users
the stronger Gemini 3.1 Flash-Lite preview during activation import onboarding, then return them to
the stable low-cost Gemini 2.5 Flash-Lite model after the first successful client import. Paid plans
continue to use the newer preview model.

## Change

- Added `AI_GATEWAY_MODEL_FAST_JSON_SOLO_ONBOARDING`, `AI_GATEWAY_MODEL_FAST_JSON_SOLO`, and
  `AI_GATEWAY_MODEL_FAST_JSON_PAID` as non-secret runtime vars.
- Routed `fast-json` by billing plan and Solo onboarding state: Solo uses
  `AI_GATEWAY_MODEL_FAST_JSON_SOLO_ONBOARDING` until the first successful import, then
  `AI_GATEWAY_MODEL_FAST_JSON_SOLO`; Pro, Team, and Enterprise use
  `AI_GATEWAY_MODEL_FAST_JSON_PAID`.
- Kept `AI_GATEWAY_MODEL_FAST_JSON` as a fallback for older local or staging environments.
- Updated staging `wrangler.toml`, `.dev.vars.example`, AI architecture docs, DevOps docs, and the
  AI engine module note.

## Validation

- `pnpm --filter @duedatehq/ai test -- src/ai.test.ts`
- `pnpm --filter @duedatehq/server test -- src/env.test.ts`
- `pnpm exec vp check packages/ai/src/router.ts packages/ai/src/index.ts packages/ai/src/ai.test.ts packages/ai/src/ports.ts apps/server/src/env.ts apps/server/.dev.vars.example apps/server/wrangler.toml docs/project-modules/09-ai-engine.md docs/dev-file/04-AI-Architecture.md docs/dev-file/01-Tech-Stack.md docs/dev-file/07-DevOps-Testing.md docs/dev-file/10-Demo-Sprint-7Day-Rhythm.md docs/dev-log/2026-05-05-ai-model-tier-routing.md docs/dev-log/2026-05-05-fast-json-plan-models.md`

`pnpm check` was also run, but it remains blocked by a pre-existing formatting issue in
`docs/pitch-deck/index.html`, which this change did not touch.
