# 2026-05-05 · AI model tier routing

## Change

- Replaced the single default AI model and plan-tier model overrides with task-tier env vars:
  `AI_GATEWAY_MODEL_FAST_JSON`, `AI_GATEWAY_MODEL_QUALITY_JSON`, and
  `AI_GATEWAY_MODEL_REASONING`.
- Model selection follows prompt `model_tier` metadata in `packages/ai`; `fast-json` now has a
  billing-plan override so Solo can stay on the stable low-cost model while paid plans use a newer
  preview model.
- Billing plans continue to control feature access and fair-use limits.

## Runtime mapping

- `fast-json`: Migration mapper, entity normalizer, tax-type normalizer, readiness checklist.
  Solo migration onboarding uses `AI_GATEWAY_MODEL_FAST_JSON_SOLO_ONBOARDING`; after the first
  successful client import, Solo uses `AI_GATEWAY_MODEL_FAST_JSON_SOLO`. Pro, Team, and Enterprise
  use `AI_GATEWAY_MODEL_FAST_JSON_PAID`; all overrides fall back to
  `AI_GATEWAY_MODEL_FAST_JSON`.
- `quality-json`: Dashboard brief, client risk summary, deadline tip, Pulse extract.
- `reasoning`: reserved for future complex reasoning or tool-loop prompts.

## Deployment notes

- Non-secret model ids live in `apps/server/wrangler.toml` and local `.dev.vars` templates.
- `AI_GATEWAY_PROVIDER_API_KEY` remains the OpenRouter secret and is required for staging deploy.
- `AI_GATEWAY_API_KEY` remains optional unless Cloudflare Authenticated Gateway or Unified provider is enabled.
