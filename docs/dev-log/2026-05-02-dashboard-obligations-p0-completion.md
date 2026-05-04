# 2026-05-02 Dashboard Triage + Obligations P0 Completion

## What changed

- Dashboard `dashboard.load` now returns `triageTabs` for `this_week`, `this_month`, and
  `long_term`, computed after overlay due dates and evidence counts are applied. `this_week`
  includes overdue rows; each row appears in only one triage window.
- Dashboard UI now URL-syncs `triage` and renders the three main triage tabs with count,
  exposure total, countdown, status control, evidence entry, and a Obligations deep link.
- Obligations now supports multi-row selection while preserving URL-backed active row navigation.
  The bulk bar can update status, mark selected rows extended with an audit memo, change
  client-level assignee, export CSV, export per-client PDF zip, and clear selection.
- Obligations Saved Views are persisted in D1 via `obligation_saved_view`, including filters/sort,
  column visibility, density, and pin state. The UI can save, apply, update, rename, pin, and
  delete views.
- Obligations density and column visibility are controlled TanStack table state and synced to URL.

## Backend notes

- Obligation status enums now include `extended` and `paid`; `done` remains the existing
  filed/done wire value.
- Bulk status writes one audit row per changed obligation and queues one Dashboard brief refresh
  for the operation.
- Bulk assignee writes one batch audit row and updates the unique selected client rows.
- `obligations.exportSelected` respects coordinator dollar hiding, writes `obligations.exported`
  audit metadata, returns base64 CSV or a zip of one generated PDF per selected client.

## Validation

- Added contract coverage for new dashboard triage, Obligations Saved Views, bulk status, bulk
  assignee, export schemas, and expanded status enum.
- Added DB coverage for Dashboard triage window boundaries.
- Added server unit coverage for bulk status audit writes.
- Added e2e coverage for Dashboard triage URL sync/deep link plus Obligations saved views,
  density, column visibility, bulk assignee, CSV/PDF zip export, and extended memo flow.
- Updated the Pulse apply/revert E2E to validate `pulse_apply` through the Obligations evidence
  drawer and Audit log while Dashboard assertions now verify the resulting deadline row in the
  current `Next deadlines` / `Triage queue` UI instead of the removed Evidence checks tab.
