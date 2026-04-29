---
title: 'Pulse Frontend MVP'
date: 2026-04-29
---

# Pulse Frontend MVP

## Context

The backend Pulse slice landed in
[Pulse Backend Closure](./2026-04-29-pulse-backend-closure.md): seed data, repo,
contracts, server procedures, and RBAC were all in place but no React surface
existed. CPAs could not see, review, apply, or revert a Pulse alert from the
app — the dashboard "Pulse Banner" component was actually a generic risk row
container, and `apps/app/src/features/` had no `pulse` directory.

## Change

- Renamed the dashboard primitive `PulseBanner` → `RiskBanner` and moved it to
  `apps/app/src/components/primitives/risk-banner.tsx` so the Pulse name is
  reserved for the regulatory feature. Updated the only call site
  (`routes/dashboard.tsx`).
- Added `apps/app/src/features/pulse/` containing the full Pulse client:
  - `api.ts` centralises oRPC `queryOptions` and a `usePulseInvalidation` hook
    that refreshes `pulse.*`, `dashboard.load`, `workboard.list`, and `audit.*`
    after every Pulse mutation.
  - `lib/error-mapping.ts` resolves `PULSE_NOT_FOUND` / `PULSE_APPLY_CONFLICT` /
    `PULSE_REVERT_EXPIRED` / `PULSE_NO_ELIGIBLE_OBLIGATIONS` /
    `FIRM_FORBIDDEN` to Lingui descriptors and provides `isPulseConflict` /
    `isPulseNotFound` predicates.
  - `lib/selection.ts` holds the pure default-selection helpers
    (`isSelectable`, `defaultSelection`, `toggleSelection`, `setAllSelection`,
    `computeSelectionStats`).
  - `lib/revert-window.ts` mirrors the server's 24h `REVERT_WINDOW_MS` for UI
    hints and decides whether an alert is currently revertable.
  - `DrawerContext.ts` + `DrawerProvider.tsx` mount the detail drawer once at
    the layout level; `usePulseDrawer()` opens it from anywhere in the tree
    (mirrors the `MigrationWizardProvider` pattern).
  - `components/PulseAlertCard.tsx`, `PulseSourceBadge.tsx`,
    `PulseConfidenceBadge.tsx`, `PulseStatusBadge.tsx`, `PulseFreshness.tsx`,
    `PulseStructuredFields.tsx`, `AffectedClientsTable.tsx` are small,
    composable building blocks (each < 200 lines).
  - `PulseAlertsBanner.tsx` renders the dashboard banner stack: 1 expanded
    card + folded "N more alerts" toggle + freshness signal, with `Dismiss`
    wired to `pulse.dismiss`.
  - `PulseDetailDrawer.tsx` is the main interaction surface — Sheet with header
    chips, structured fields + source excerpt, affected clients table, RBAC
    gate, glass-box safety checklist, and `Apply / Dismiss / Undo (24h)`
    actions wired to the three mutations. Apply success toasts include an
    inline `Undo` action that calls `pulse.revert`.
  - `AlertsListPage.tsx` powers the new `/alerts` route (history view that
    reuses the same drawer through the provider).
- Wired the feature into the app:
  - `routes/_layout.tsx` mounts `<PulseDrawerProvider>` inside the keyboard
    shell so the drawer can portal cleanly over every protected route.
  - `routes/dashboard.tsx` renders `<PulseAlertsBanner />` between the error
    state and the existing risk pulse card.
  - `router.tsx` adds the lazy `/alerts` route.
  - `components/patterns/app-shell-nav.tsx` adds the `Alerts` nav entry with a
    badge sourced from the same `pulse.listAlerts` query the banner uses (no
    double fetch — TanStack Query dedupes).
- Added 14 unit tests covering selection helpers, error mapping, and the
  revert window. The existing `apps/app` suite continues to pass at 71 tests.
- Refreshed Lingui catalogs: 62 new EN messages with full zh-CN translations;
  `i18n:compile --strict` is green.

## Notes

- The drawer derives default selection from `defaultSelection(detail.affectedClients)`
  using a render-time `setState` guard keyed on `alert.id + affectedClients.length`,
  not `useEffect`, in line with the project rule that bans `useEffect` in app
  code (see AGENTS.md).
- RBAC follows `procedures/_permissions`: only `owner` / `manager` can apply,
  dismiss, or revert. The drawer reads the role from the `firms.listMine` cache
  the layout already primed; no extra fetch.
- `PULSE_APPLY_CONFLICT` toasts include a `Refresh` action that re-runs
  `pulse.getDetail`, matching the locking guidance in PRD §3.6.6.
- `pulse.listAlerts` currently filters server-side to `matched` /
  `partially_applied`. The Alerts history page therefore lists active alerts
  only; full lifecycle (`applied` / `dismissed` / `reverted`) timeline is a
  contract follow-up.
- `Snooze` is intentionally not implemented — the contract has no `snooze`
  procedure yet. The banner exposes only `Dismiss` for v1.
- `Generate client email` is deferred — it depends on the Reminders template
  (PRD §7.1) which is not in this slice.

## Iteration 2 — "Heartbeat" redesign

The first iteration shipped a soft-warning panel + skeleton block per
Migration's chrome convention, but it conflicted with the DESIGN.md "calm,
dense, hairline-first" stance and contradicted the product metaphor: a Pulse
should feel like a vital sign, always present but never noisy.

- Replaced the Dashboard banner with a single 36px hairline strip
  (`PulseAlertsBanner`): leading `PulsingDot` + mono source label · title ·
  impact count · meta timestamp · inline `Dismiss` / `Review` actions. The
  strip itself is interactive (click anywhere → drawer); inline buttons stop
  propagation.
- Added `components/PulsingDot.tsx`: a 4px halo dot with the existing
  `shadow-status-indicator-{tone}` token plus an `animate-ping` ring on top.
  `motion-reduce:hidden` honours the OS reduced-motion preference.
- Loading state is now a strip with a pulsing disabled-tone dot and "Checking
  IRS + state sources…" rather than a skeleton block — the watcher promise
  stays visible while we fetch.
- Idle state ("All clear · Watching IRS + …") uses the success-tone heartbeat
  so even with zero alerts the dashboard signals that the system is alive.
- Simplified `PulseAlertCard` (history page) to the same hairline language:
  flat row, mono source/impact metadata, no soft-warning panel.
- Drawer header inherits the heartbeat dot at the top of the badge row, so
  the metaphor carries through into the detail surface.
- Deleted the now-redundant `PulseFreshness` component.

## Iteration 3 — Empty Refetch State

- Dashboard Pulse banner now shows `Checking IRS + state sources…` when the
  active alerts query is refetching and no alerts are currently cached.
- If active alerts are already visible, background refetch keeps the alert row
  on screen instead of replacing it with the checking strip.
- Active Pulse alerts now poll every 60 seconds through shared query options,
  so the Dashboard banner and nav badge stay in sync.
- Dashboard Pulse banner now includes a manual refresh icon that calls the
  same `pulse.listAlerts` query refetch used by polling.

## Validation

- `pnpm --filter @duedatehq/app exec tsgo --noEmit` — passed.
- `pnpm --filter @duedatehq/app test` — passed, 71 tests (14 new).
- `pnpm --filter @duedatehq/app i18n:compile --strict` — passed, no missing
  translations.
- `pnpm test` — passed across the workspace.
- `pnpm check` — passed (0 errors; 1 pre-existing `placement.ts` warning).
- `pnpm check:deps` — passed.
- `pnpm --filter @duedatehq/app build` — built in 1.1s.
