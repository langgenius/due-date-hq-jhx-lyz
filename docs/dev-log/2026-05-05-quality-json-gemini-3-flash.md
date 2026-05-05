# 2026-05-05 · Quality JSON Gemini 3 Flash routing

## Context

Quality JSON prompts power Dashboard brief, client risk summary, deadline tip, and Pulse extract
workflows. The model default was switched from DeepSeek V3.2 to Gemini 3 Flash Preview so the
quality tier can use the same Gemini family while keeping fast-json plan overrides separate.

## Change

- Set `AI_GATEWAY_MODEL_QUALITY_JSON` to `google/gemini-3-flash-preview`.
- Updated staging `wrangler.toml`, `.dev.vars.example`, AI architecture docs, tech-stack docs,
  demo-sprint notes, and the OpenRouter test fixture.

## Validation

- `pnpm --filter @duedatehq/ai test -- src/ai.test.ts`
- `pnpm --filter @duedatehq/server test -- src/env.test.ts`
- `pnpm exec vp check packages/ai/src/ai.test.ts apps/server/.dev.vars.example apps/server/wrangler.toml docs/dev-file/04-AI-Architecture.md docs/dev-file/01-Tech-Stack.md docs/dev-file/10-Demo-Sprint-7Day-Rhythm.md docs/dev-log/2026-05-05-quality-json-gemini-3-flash.md`

`pnpm check` was also run, but it remains blocked by the existing formatting issue in
`docs/pitch-deck/index.html`, which this change did not touch.
