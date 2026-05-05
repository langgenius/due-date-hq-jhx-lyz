---
title: '2026-05-05 · Onboarding to Migration activation route'
date: 2026-05-05
area: onboarding
---

# 2026-05-05 · Onboarding to Migration activation route

## Context

Practice onboarding previously created a firm, navigated to Dashboard, and used
`location.state.autoOpenMigration` to open Migration Copilot as a dialog. That worked mechanically,
but it made Dashboard act as a hidden host for a first-run setup task. The user had no stable route
explaining why client import is the next step, and refresh/deep-link semantics were weaker than a
normal route.

## Decision

- New practices now land on `/migration/new?source=onboarding`.
- `/migration/new` is an EntryShell route, not an AppShell/protected-shell child. It sits after
  authentication and active practice creation, but before the user enters the daily Dashboard shell.
- `source=onboarding` is a loader-level one-time gate: it redirects to Dashboard before render when
  the practice already has open obligations or an applied migration batch. Manual import entries are
  still allowed to open the same route.
- The route explains the activation step with an unframed route header and offers `Skip for now`.
- EntryShell hides its footer and keeps `/migration/new` as a non-scrolling viewport; the route
  shell fills the remaining height and only the wizard body scrolls.
- Step 1 uses a compact route density so paste and upload sit side by side on wide viewports,
  keeping first-run import usable without immediate internal scrolling.
- `Skip for now` appears only in the route header. The workbench header hides the dialog-style
  close/skip control on the route shell, while Esc still routes through the discard confirmation.
- The page renders the same Migration Copilot wizard in route shell form.
- Dashboard, Clients, Obligations empty state, and Command Palette keep opening the dialog shell;
  onboarding is currently the only in-product route entry to `/migration/new`.
- `location.state.autoOpenMigration` is removed from the onboarding handoff.

## Implementation

- `apps/app/src/routes/onboarding-firm-flow.ts`
  - Added `ONBOARDING_MIGRATION_TARGET` and `postOnboardingTarget`.
- `apps/app/src/routes/onboarding.tsx`
  - New firm creation now navigates to `/migration/new?source=onboarding`.
- `apps/app/src/router.tsx`
  - Added `migrationActivationLoader` under EntryShell, including the onboarding-source completion
    gate. The loader returns the current firm for onboarding-sourced visits so the route does not
    refetch permission context before render.
- `apps/app/src/routes/migration.new.tsx`
  - Added the activation route with route-level wizard, skip path, and permission guard.
- `apps/app/src/features/migration/WizardShell.tsx`
  - Extracted shared wizard frame and added `WizardRouteShell`.
- `apps/app/src/features/migration/Wizard.tsx`
  - Reused the same reducer, RPC orchestration, Step components, Live Genesis, and revert logic
    across dialog and route shells.
  - Passes compact Step 1 density only for the route shell; dialog imports keep the comfortable
    wizard intake layout.
- `apps/app/src/features/migration/WizardProvider.tsx`
  - Simplified to imperative dialog open/close only.

## Validation

Run:

- `pnpm exec vp check apps/app/src/features/migration/Wizard.tsx apps/app/src/features/migration/WizardShell.tsx apps/app/src/features/migration/WizardProvider.tsx apps/app/src/routes/migration.new.tsx apps/app/src/routes/onboarding.tsx apps/app/src/routes/onboarding-firm-flow.ts apps/app/src/routes/onboarding-firm-flow.test.ts apps/app/src/router.tsx apps/app/src/router.test.ts apps/app/src/routes/route-summary.ts apps/app/src/routes/_entry-layout.tsx`
- `pnpm --filter @duedatehq/app test -- onboarding-firm-flow.test.ts router.test.ts WizardShell.test.tsx`
