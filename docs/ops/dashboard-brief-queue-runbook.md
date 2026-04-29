# Dashboard Brief Queue Runbook

## Scope

This runbook covers `DASHBOARD_QUEUE` / `due-date-hq-dashboard-staging` and its DLQ
`due-date-hq-dashboard-dlq-staging`.

## Signals

- `dashboard_brief.status = pending`: queued or currently processing.
- `dashboard_brief.status = ready`: latest brief is available.
- `dashboard_brief.status = failed`: AI refusal, guard rejection, or structured generation failure.
- No new row after refresh: request was debounced, rate-limited, or Queue delivery failed.
- DLQ has messages: unexpected consumer exceptions exceeded Queue retries.

## First Checks

1. Confirm the Worker binding exists in the current deployment:

```bash
pnpm --dir apps/server exec wrangler deploy --dry-run --outdir=dist --env=""
```

2. Confirm the queue resources exist:

```bash
pnpm --dir apps/server exec wrangler queues list
```

3. Check `dashboard_brief` and `ai_output(kind='brief')` for the active firm/date before replaying.

## DLQ Handling

If messages land in `due-date-hq-dashboard-dlq-staging`, inspect the failing firm/scope/reason from
the message payload and the corresponding `dashboard_brief` row first. Do not blindly replay if the
failure is a guard rejection or rate limit.

Safe replay path:

1. Verify the firm still exists and is active.
2. Verify `dashboard_brief` does not already have a newer `ready` row for the same firm/scope/date.
3. Re-send a fresh message through the app path by clicking `Refresh brief`, or use the queue CLI with
   the same message contract only after confirming the payload is non-PII.

Manual replay example:

```bash
pnpm --dir apps/server exec wrangler queues producer send due-date-hq-dashboard-staging \
  '{"type":"dashboard.brief.refresh","firmId":"<firm_id>","scope":"firm","reason":"manual_refresh","idempotencyKey":"manual-replay:<firm_id>:<iso_time>","requestedAt":"<iso_time>"}'
```

## Rollback

Dashboard still works without AI Brief. If the queue path is unhealthy, rollback the Worker or stop
manual refresh exposure in the UI; deterministic Dashboard risk data remains available through
`dashboard.load`.
