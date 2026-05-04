# Pulse Ingest Stuck Runbook

## Scope

This runbook covers `PULSE_QUEUE`, `R2_PULSE`, `pulse_source_state`,
`pulse_source_snapshot`, and `pulse_source_signal`.

## Triggers

- Dashboard or `/alerts` shows `Source needs attention`.
- `pulse_source_state.health_status` is `degraded` or `failing`.
- `pulse_source_snapshot.parse_status` stays `pending_extract`, `extracting`, or `failed`.
- FEMA/GovDelivery style signals appear in `pulse_source_signal` but no T1 Pulse follows.

## First Checks

1. Identify the affected source:

```sql
select source_id, health_status, consecutive_failures, last_checked_at, last_success_at, failure_reason
from pulse_source_state
order by updated_at desc;
```

2. Inspect recent snapshots and signals:

```sql
select id, source_id, title, parse_status, failure_reason, pulse_id, fetched_at
from pulse_source_snapshot
order by fetched_at desc
limit 20;

select id, source_id, title, signal_type, status, linked_pulse_id, fetched_at
from pulse_source_signal
order by fetched_at desc
limit 20;
```

3. If a raw snapshot exists, inspect it through the ops route:

```bash
PULSE_OPS_BASE_URL=https://<worker-host> \
PULSE_OPS_TOKEN=<token> \
node scripts/pulse-ops.mjs show <pulse_id>
```

## Recovery

- `selector_drift`: compare the stored raw text with the adapter selectors, patch
  `packages/ingest/src/adapters/index.ts`, add or update a fixture, then re-run ingest tests.
- `pending_extract` / transient AI failure: retry the snapshot after confirming the raw source is
  still official.

```bash
PULSE_OPS_BASE_URL=https://<worker-host> \
PULSE_OPS_TOKEN=<token> \
node scripts/pulse-ops.mjs retry-snapshot <snapshot_id>
```

- Bad extraction or source mismatch: quarantine the Pulse instead of approving. Use a stable
  internal actor id and record the reason.

```bash
PULSE_OPS_BASE_URL=https://<worker-host> \
PULSE_OPS_TOKEN=<token> \
node scripts/pulse-ops.mjs quarantine <pulse_id> <actor_id> "Source excerpt mismatch"
```

- T2 signal without T1 follow-up: leave `pulse_source_signal.status='open'`, verify the matching
  IRS/state canonical source, and only create/approve a Pulse from T1 evidence. To inspect and link
  signals:

```bash
PULSE_OPS_BASE_URL=https://<worker-host> \
PULSE_OPS_TOKEN=<token> \
node scripts/pulse-ops.mjs signals open

PULSE_OPS_BASE_URL=https://<worker-host> \
PULSE_OPS_TOKEN=<token> \
node scripts/pulse-ops.mjs link-signal <signal_id> <pulse_id>
```

- Source takedown or revoked source: disable future ingest first, then revoke unreconciled Pulse
  rows from that source. This preserves historical snapshots/Evidence while marking pending or
  approved global Pulse rows as `source_revoked`.

```bash
PULSE_OPS_BASE_URL=https://<worker-host> \
PULSE_OPS_TOKEN=<token> \
node scripts/pulse-ops.mjs source-disable <source_id>

PULSE_OPS_BASE_URL=https://<worker-host> \
PULSE_OPS_TOKEN=<token> \
node scripts/pulse-ops.mjs source-revoke <source_id> <actor_id> "Source takedown"
```

## Validation

- `pnpm --filter @duedatehq/ingest test`
- `pnpm --filter @duedatehq/server test -- pulse ingest ops queue`
- Confirm `pulse_source_state.health_status='healthy'` after the next successful run.
- Confirm no customer-visible alert was generated from `pulse_source_signal` alone.
- Confirm Obligations/Dashboard dates are derived from active overlay applications after a Pulse apply.

## Post-Mortem Notes

Record the source ID, failure class, first failing timestamp, raw R2 key, fix commit, and whether any
approved Pulse or email digest was affected.
