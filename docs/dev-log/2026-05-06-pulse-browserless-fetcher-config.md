# 2026-05-06 Pulse Browserless fetcher config

## Summary

- Aligned the Pulse Browserless fetcher with the Browserless `/content` REST API token query
  parameter.
- Preserved Browserless target response codes via `X-Response-Code` so blocked sources surface as
  fetch failures instead of selector drift on an error page.
- Added `PULSE_BROWSERLESS_SOURCE_IDS` so specific source ids can be routed through Browserless from
  Worker config without editing adapter code.
- Documented local and staging config for Browserless-backed Pulse sources.

## Validation

- `pnpm --filter @duedatehq/server test -- src/jobs/pulse/ingest.test.ts src/env.test.ts`
- `pnpm --filter @duedatehq/ingest test -- src/ingest.test.ts`
- `pnpm check:fix`
