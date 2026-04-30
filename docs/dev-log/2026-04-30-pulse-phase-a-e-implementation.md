# 2026-04-30 · Pulse Phase A-E implementation pass

## What changed

- Made Pulse matching overlay-aware end to end: detail candidates, apply write-time validation,
  ops approval firm counts, and approval digest rows now compare against effective due dates instead
  of raw `obligation_instance.current_due_date`.
- Kept source-revoked Pulse alerts visible in customer history/detail with a source status badge;
  mutation paths still require approved sources.
- Updated demo seed data to model an applied Pulse through `exception_rule` and
  `obligation_exception_application` instead of mutating base obligation due dates.
- Added a hidden internal `/ops/pulse` workbench backed by the existing token-protected ops API for
  pending review, source health, signals, raw source inspection, and failed snapshot retry.
- Added configurable Browserless fetch support, GovDelivery inbound email-to-signal handling,
  structured Pulse metrics/alerts, stale email outbox retry recovery, and source fixture coverage.
- Promoted `ma.dor.press` from catalog candidate to a live T1 ingest adapter with fixture coverage;
  MA rules coverage still requires separate rule-pack work before product coverage claims.
- Added a draft-only client email copy action and kept source-revoked alerts non-actionable,
  including Undo.
- Added staging-capable authenticated Pulse E2E seeding behind `E2E_SEED_TOKEN`.

## Validation

- `pnpm --filter @duedatehq/db test -- pulse`
- `pnpm --filter @duedatehq/ingest test`
- `pnpm --filter @duedatehq/app test -- pulse`
- `pnpm --filter @duedatehq/server test -- pulse ingest ops queue outbox`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
- `pnpm ready`
- `E2E_REUSE_EXISTING_SERVER=1 pnpm test:e2e e2e/tests/pulse.spec.ts`

## Explicitly not claimed

- `/ops/pulse` remains protected by `PULSE_OPS_TOKEN`; a formal internal identity provider, MFA
  enrollment/enforcement, and internal role administration are still separate security work.
- Client email support is draft-only copy generation. It does not auto-send and does not yet call an
  AI model.
- MA has live source ingestion and fixtures, but MA rule-pack coverage and customer-facing coverage
  claims remain future work.
- Evidence links are written and visible; a signed/downloadable evidence package export remains
  future work.
