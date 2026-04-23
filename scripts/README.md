# scripts/

Operational CLI utilities (docs/Dev File/08 §1).

- `check-dep-direction.mjs` — enforces the dependency DAG in docs/Dev File/08 §6. Wired into `pnpm check:deps`.

Planned (Phase 0 / Phase 1):

- `ac-traceability.ts` — PRD Test ID → E2E coverage report.
- `cost-report.ts` — Langfuse + Cloudflare cost aggregator per firm.
- `firm-inspect.ts` — admin read-only dump of a firm's obligations / pulses / audits.
