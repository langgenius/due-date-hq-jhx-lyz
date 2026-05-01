# 2026-05-01 · Notifications, audit export, RBAC, and migration integrity

## What changed

- Added reminder/notification storage, notification preferences, in-app notification procedures,
  the `/notifications` page, signed customer unsubscribe links, and a real unread-count shell bell.
- Added audit evidence package requests, queue generation, ZIP/PDF/manifest output to `R2_AUDIT`,
  signed application download URLs, and the Audit page export/status surface.
- Added permission helpers with audit-producing denials and hid dollar fields from Coordinators
  unless the firm-level `coordinatorCanSeeDollars` setting is enabled.
- Added XLSX intake in the import wizard, raw upload metadata/R2 persistence, import history,
  batch-level revert, and single-client undo entry points.
- Hardened the D1 migrations for the notification/audit storage slice so pre-existing remote
  tables or indexes do not block Wrangler from recording unapplied migrations.
- Visual follow-up: changed the Notification center "Mark all read" action from the secondary
  outline button to the existing primary purple button treatment.

## Validation

- `pnpm check:deps`
- `pnpm test`
- `pnpm check`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/db db:generate`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/server build`
- `pnpm --dir apps/server exec wrangler d1 migrations apply DB --local --persist-to /private/tmp/duedatehq-d1-fresh --config wrangler.toml`
- `pnpm exec vp check apps/app/src/features/notifications/notifications-page.tsx docs/dev-log/2026-05-01-notifications-audit-rbac-migration.md`

## Notes

- DESIGN.md was reviewed; the new operational pages use the existing dense workbench, sidebar,
  table, toolbar, dialog, and compact settings patterns, so no design-token changes were needed.
- DESIGN.md was re-checked for the migration hardening fix; no UI or product-contract changes were
  required.
- Customer deadline reminders are email-only and still use the existing email outbox path.
- MFA was intentionally removed from this implementation pass; there is no two-factor auth plugin,
  MFA setup route, or Owner/Manager MFA gate in the app.
- Migration raw upload keeps the current inline payload limit and stores raw files through the
  Worker R2 binding; no S3-compatible presigned PUT path was introduced.
