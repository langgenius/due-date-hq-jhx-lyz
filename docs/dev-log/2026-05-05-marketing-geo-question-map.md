---
title: 'Marketing GEO Question Map'
date: 2026-05-05
area: marketing
---

# Marketing GEO Question Map

Updated the public GEO content map so each page answers a buyer-facing operational question tied
to the current product surface instead of only explaining source coverage.

## Changes

- Reframed `/rules` around how a filing rule becomes source-backed, reviewed work for a CPA team.
- Reframed `/state-coverage` and state detail pages around Pulse review, client-context matching,
  and whether a state signal should become deadline work.
- Reframed guide FAQs around triage priority, migration data quality, evidence requirements, Pulse
  apply/revert auditability, and AI’s assistant role.
- Updated `llms.txt` and the marketing module doc to reflect the new question map.

## Validation

- `pnpm --filter @duedatehq/marketing check`
- `pnpm --filter @duedatehq/marketing build`
