---
title: '2026-05-04 · Pulse signal candidate review route'
date: 2026-05-04
author: 'Codex'
---

# Pulse signal candidate review route

## What changed

- Added `pulse.listSourceSignals` so Owner/Manager review surfaces can load open, linked, reviewed,
  or dismissed source signals from watched official sources.
- Extended `pulse_source_signal` with `reviewed_rule_id` and `review_decision_id`, plus a new
  `reviewed` status.
- Added optional `sourceSignalId` to `rules.verifyCandidate`. When an Owner/Manager verifies a
  candidate rule with a matching signal, the signal is marked `reviewed` and linked to the firm
  review decision.
- Added a rule-source adapter promotion policy. Every state/DC now has high/critical official
  candidate-review sources promoted into Pulse snapshot/extract. Lower-priority auxiliary sources
  remain signal-only.

## Boundary

Candidate verification remains firm-scoped. State/DC high-priority source promotion is global, but
the resulting Pulse still enters the existing extract and review path before any firm action changes
client deadlines.

## Validation

- `pnpm --filter @duedatehq/contracts test -- contracts.test.ts`
- `pnpm --filter @duedatehq/server test -- rule-source-adapters.test.ts pulse/index.test.ts`
- `pnpm --filter @duedatehq/db test -- pulse`
- `pnpm exec vp check packages/contracts/src/pulse.ts packages/contracts/src/rules.ts packages/contracts/src/index.ts packages/contracts/src/contracts.test.ts packages/ports/src/pulse.ts packages/db/src/schema/pulse.ts packages/db/src/repo/pulse.ts apps/server/src/procedures/pulse/index.ts apps/server/src/procedures/index.ts apps/server/src/procedures/rules/index.ts apps/server/src/jobs/pulse/rule-source-adapters.ts apps/server/src/jobs/pulse/rule-source-adapters.test.ts`

## Follow-up

- Updated server procedure test doubles to include `listSourceSignals`, `getSourceSignal`, and
  `reviewSourceSignalForRule` after the `PulseRepo` source-signal contract expanded.
- Validation: `pnpm exec vp check`; `pnpm exec vp run ci`.
