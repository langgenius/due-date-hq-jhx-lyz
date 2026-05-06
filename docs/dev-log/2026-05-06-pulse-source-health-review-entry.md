# 2026-05-06 — Pulse Source Health Review Entry

- Split Pulse source-health attention by adapter tier. T1 sources remain actionable because they are
  official primary sources that can directly create Pulse Changes; T2/T3 degradation is treated as
  passive background monitoring.
- Updated the Dashboard Pulse banner so owner/manager users see `Source needs attention · N sources`
  plus `Review sources` only when reviewable T1 sources are degraded or failing. Lower-tier or
  non-actionable source checks now read `Pulse source checks degraded · Monitoring continues` without
  exposing a count to ordinary users.
- Expanded Rules > Pulse Changes source-health warning into a `Review sources` table. The table lists
  source label/id, status, latest successful check, consecutive failures, next check, and a per-source
  retry action.
- Routed the Dashboard banner CTA to `/rules?tab=pulse&sourceReview=1#pulse-source-health`, opening
  the Pulse Changes source review section without adding a new route.
- Synced Lingui catalogs after adding the new source-health copy.
