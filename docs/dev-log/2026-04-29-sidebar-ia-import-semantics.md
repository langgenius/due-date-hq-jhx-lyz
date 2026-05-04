---
title: '2026-04-29 · Sidebar IA and import semantics'
date: 2026-04-29
---

# 2026-04-29 · Sidebar IA and import semantics

## Context

`Import clients` was previously promoted to a persistent AppShell footer CTA. That matched an
early PRD note about a bottom import entry, but it no longer matched the implemented product:
Migration Copilot is an activation/setup path that turns an existing CPA client spreadsheet into
weekly triage. It is not a daily destination, and it should not compete with persistent account
surfaces like plan status and the user menu.

The sidebar groups also still used the older `Main / Manage / Admin` framing. That taxonomy exposed
implementation and permissions vocabulary instead of the user's workflow vocabulary.

## Decision

- Sidebar groups are now:
  - `Operations`: Dashboard, Workboard, Alerts, `Rules`.
  - `Clients`: Clients facts.
  - `Practice`: Practice profile, paid `Team workload`, Members, Billing, Audit log.
- `Team workload` remains visible for all plans because it is the Pro/Firm expansion path; Solo sees
  a disabled `Pro` hint, and paid firms can open the route.
- `Import clients` is removed from the sidebar footer. It remains available where the task belongs:
  `/clients` page header, clients empty state, Dashboard empty state, and Command Palette.
- `Profile` moves to the user menu. It is account-level, not firm/workspace navigation.
- Route summary eyebrows follow the same model: Clients routes say `Clients`; Rules says
  `Operations`; Practice-owned routes say `Practice`; account routes say `Account`.

## Changes

- `apps/app/src/components/patterns/app-shell.tsx`
  - Removed the footer `ImportClientsCTA`.
  - Kept `PlanStatusLink` as the only plan/billing footer surface above the user row.
  - Strengthened the plan status affordance with a section background, icon tile, and action chip while keeping the copy to plan name + seats only.
- `apps/app/src/components/patterns/app-shell-nav.tsx`
  - Replaced `Main / Manage / Admin` with `Operations / Clients / Practice`.
  - Kept `Team workload` visible and changed the tag semantics from roadmap `P1` to paid `Pro`.
  - Changed the Rules icon to `FileCheck2` so it reads as verified source-backed rules, not generic settings.
- `apps/app/src/components/patterns/app-shell-user-menu.tsx`
  - Added the `Profile` entry to the account menu.
- `apps/app/src/routes/route-summary.ts` and `apps/app/src/routes/clients.tsx`
  - Aligned route eyebrows with the new product IA.
- Documentation updated in `docs/dev-file/05-Frontend-Architecture.md`,
  `docs/Design/DueDateHQ-DESIGN.md`, and the earlier AppShell/sidebar dev logs.

## Product Semantics

Import is a setup action. It creates clients and obligations so the product can show real weekly
triage. It should appear at the point where users manage client facts or when the product has no
client data yet. It should not be a global footer CTA after a firm is operating day to day.

Rules belong with operations because they govern the deadline engine, Pulse changes, and source-backed
operating constraints. Team workload belongs with Practice because it describes the team's capacity
and assignment pressure. Clients is its own domain because client facts feed both operations and
practice controls.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app build`
- `pnpm exec vp check --fix docs/Design/DueDateHQ-DESIGN.md docs/dev-log/2026-04-27-app-shell-sidebar.md`
- `pnpm check`
- `pnpm test`
