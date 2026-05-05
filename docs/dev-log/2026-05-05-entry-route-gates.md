---
title: '2026-05-05 · Entry route gates'
date: 2026-05-05
area: routing
---

# 2026-05-05 · Entry route gates

## Context

EntryShell is a shared chrome for pre-dashboard surfaces, not a single auth state. `/login`,
`/two-factor`, `/onboarding`, and `/migration/new` each need a distinct route-level gate. Before
this change, `/two-factor` had no loader, so a verified signed-in user could manually visit the MFA
challenge page.

## Decision

- `/two-factor` is verification-only. It renders only when the current session is signed in,
  two-factor is enabled, and the current session has not been verified.
- MFA is checked before active-practice setup. A user with MFA enabled must verify the current
  session before reaching `/onboarding`, `/migration/new`, or protected AppShell routes.
- `/login` sends already signed-in but unverified sessions straight to `/two-factor`, preserving a
  safe `redirectTo`.
- `/accept-invite` remains reachable for unauthenticated users, but signed-in unverified sessions
  verify MFA before invitation acceptance can run. Email OTP sign-in on that page revalidates the
  route loader so MFA state is not handled only inside the component.
- EntryShell stays pathless and loader-free. Child routes own their state machines through loaders.

## Validation

Run:

- `pnpm --filter @duedatehq/app test -- router.test.ts`
- `pnpm exec vp check apps/app/src/router.tsx apps/app/src/router.test.ts apps/app/src/routes/_entry-layout.tsx`
