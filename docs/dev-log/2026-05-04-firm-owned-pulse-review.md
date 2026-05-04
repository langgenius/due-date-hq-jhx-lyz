# Firm-Owned Pulse Review

## Context

Pulse review is now owned by the firm. Owner and Manager users make the decision to apply,
dismiss, snooze, or later revisit a government-source Pulse from Rules > Pulse Changes; the product
no longer has a separate internal Ops Review surface.

## Changes

- Pulse extraction now creates an approved source-backed Pulse and fans it out to matching firms
  immediately, queueing owner/manager notifications and digest payloads for firm review.
- Removed the customer app `/ops/pulse` route, the hidden `OpsPulsePage`, the mounted
  `/api/ops/pulse/*` route, and `PULSE_OPS_TOKEN` configuration.
- Merged the standalone Alerts workbench into Rules as a `Pulse Changes` tab, removed the
  `/alerts` route, removed the Alerts sidebar item and `G then A` shortcut, and moved Pulse badge
  pressure onto the Rules nav item.
- Updated Pulse notification deep links to open `/rules?tab=pulse&alert=<id>` instead of the
  deleted Alerts route.
- Updated Rules Console and concept copy from Ops Review language to firm/owner/manager review.
- Updated module docs and the ingest stuck runbook to describe the new source ingest →
  Rules > Pulse Changes review flow.

## Validation

- `pnpm --filter @duedatehq/db test -- pulse`
- `pnpm --filter @duedatehq/app test -- rules-console-model PulseDetailDrawer coverage-tab`
- `pnpm --filter @duedatehq/server test -- pulse extract app`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
