# Demo Mock Data

This folder contains the local live-demo seed for DueDateHQ.

## Use It

```bash
pnpm db:migrate:local
pnpm db:seed:demo
pnpm dev
```

For a local no-OAuth walkthrough, open:

```text
http://localhost:8787/api/e2e/demo-login
```

That development-only helper signs in as `Sarah Martinez` and activates
`Brightline Demo CPA`, then redirects to `APP_URL` from `apps/server/.dev.vars`
(usually `http://localhost:5173`). It expects this seed to have run first.

## Coverage

- Dashboard: open obligations, due-this-week counts, exposure states, evidence gaps, and an AI brief.
- Workboard: pending, in-progress, review, waiting, done, overdue, unassigned, and missing-evidence rows.
- Team workload: Pro-plan firm with assigned and unassigned owner load.
- Alerts/Pulse: one apply-ready IRS alert, one applied CA FTB overlay, one low-confidence NY DTF
  advisory, one sub-50% FL DOR bulletin, source health, snapshots, and signals. The seeded alerts
  cover the `AI XX%` badge tones plus a very-low-confidence example.
- Pulse Ops: pending approve / reject / quarantine extracts, an open source signal, and a failed
  snapshot so `/ops/pulse` can exercise each internal action.
- Clients: manual, imported, ready, incomplete, multi-state, and missing-contact records.
- Imports: applied and reverted migration batches with mapper, normalizer, and validation rows.
- Members: owner, manager, preparer, coordinator, and pending invitations.
- Billing: active Pro subscription for the primary demo firm.
- Audit/Notifications: cross-category audit events, a ready evidence package, reminders, email outbox, and in-app notifications.
- Plan accounts: Sofia Solo, Priya Pro, and Taylor Team each have plan-specific clients,
  obligations, dashboard briefs, imports, evidence, audit events, notifications, readiness
  requests, calendar subscriptions, saved Workboard views, and Pulse alert matches.
