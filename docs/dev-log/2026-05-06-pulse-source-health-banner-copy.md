# 2026-05-06 — Pulse Source Health Banner Copy

- Shortened the dashboard Pulse source-health banner so the inline warning reads as
  `Source needs attention · N sources` instead of listing source families and raw fetch errors.
- Kept source family details in the banner `title` for quick inspection, but stopped exposing
  `lastError` values such as HTTP fetch failures in the visible banner or retry toast.
- Stopped generic rule-source ingest from auto-fetching `manual_review`, `pdf_watch`,
  `email_subscription`, and `api_watch` rule sources. This keeps broad 50-state evidence pages out
  of Pulse cron unless they have a source-specific adapter.
- Scoped source idle alerts to the currently configured adapter set so previously persisted source
  states for removed manual sources do not keep generating stale health noise.
- Pointed `fema.declarations` back to the official OpenFEMA v2 API endpoint and updated parsing for
  the OpenFEMA response shape.
- Routed CA FTB, CA CDTFA, and MA DOR live adapters through the configurable Browserless fetcher so
  production can avoid Cloudflare egress WAF failures when `PULSE_BROWSERLESS_URL` is configured.
- This keeps source-health diagnostics out of the MVP customer-facing dashboard while preserving the
  existing source health model and retry flow.
- DESIGN.md remains aligned: the Pulse banner is still a compact status strip; source-catalog docs
  now clarify the automated-vs-manual source boundary.
