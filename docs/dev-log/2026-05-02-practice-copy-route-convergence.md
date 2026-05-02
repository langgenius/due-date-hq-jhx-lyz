---
title: 'Practice copy and route convergence'
date: 2026-05-02
author: 'Codex'
area: app
---

# Practice copy and route convergence

## Context

The Practice-first UI pass changed route headers and the Practice profile page, but the later Firm
entitlement closure moved the sidebar, switcher, Billing, and docs back toward Firm / Organization
copy. The result was mixed user-facing language: sidebar `Organization` / `Firm profile`, route
header `Practice`, page title `Practice profile`, and Cmd-K still opening the old `/firm` path.

## Decision

- User-facing tenant identity uses `Practice`: sidebar group, switcher, profile, Billing tenant
  labels, checkout tenant labels, and E2E assertions.
- The canonical Practice profile URL is `/practice`. The old `/firm` URL is not kept as a
  compatibility route.
- `Firm` remains the paid plan name and the internal persistence/RPC noun (`firmId`,
  `firm_profile`, `firms.*`, Better Auth `organization`).
- Billing entitlement copy says `practice workspace` / `active practices` in the app, while
  internal entitlement docs may still define active firm count against `firm_profile`.

## Changes

- Updated AppShell sidebar, practice switcher, Add practice dialog, Billing, Checkout, Cmd-K, route
  summary, and practice-switch E2E coverage to use Practice-facing copy and `/practice`.
- Removed the protected `/firm` route instead of adding a redirect alias.
- Updated current design, frontend architecture, billing product design, audit product design, data
  model docs, and user/module docs to match the new visible IA.
- Left historical dev-log facts intact, with a follow-up note where the same-day Firm entitlement
  closure superseded the earlier removal of the switcher create action.

## Validation

- Pending in this change: Lingui extract / compile, app route tests, targeted E2E, and repo checks.
