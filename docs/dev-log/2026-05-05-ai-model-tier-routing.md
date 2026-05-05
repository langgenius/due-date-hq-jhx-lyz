# 2026-05-05 · AI model tier routing

## Change

- Replaced the single default AI model and plan-tier model overrides with task-tier env vars:
  `AI_GATEWAY_MODEL_FAST_JSON`, `AI_GATEWAY_MODEL_QUALITY_JSON`, and
  `AI_GATEWAY_MODEL_REASONING`.
- Model selection now follows prompt `model_tier` metadata in `packages/ai`, not the billing plan.
- Billing plans continue to control feature access and fair-use limits only.

## Runtime mapping

- `fast-json`: Migration mapper, entity normalizer, tax-type normalizer, readiness checklist.
- `quality-json`: Dashboard brief, client risk summary, deadline tip, Pulse extract.
- `reasoning`: reserved for future complex reasoning or tool-loop prompts.

## Deployment notes

- Non-secret model ids live in `apps/server/wrangler.toml` and local `.dev.vars` templates.
- `AI_GATEWAY_PROVIDER_API_KEY` remains the OpenRouter secret and is required for staging deploy.
- `AI_GATEWAY_API_KEY` remains optional unless Cloudflare Authenticated Gateway or Unified provider is enabled.
