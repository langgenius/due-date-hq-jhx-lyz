# 2026-04-28 · Authenticated Playwright E2E Coverage

## Context

The initial Playwright foundation intentionally stayed unauthenticated because Google OAuth is not
CI-friendly and `packages/db/seed/demo.ts` is still a Phase 0 placeholder. The implemented app now has
real protected surfaces for Dashboard, Workboard, Rules Console, and Migration Copilot Step 1, so the
next useful coverage needed a deterministic local session fixture instead of testing unshipped OAuth.

## Documentation Checked

- Playwright official fixture/auth guidance through Context7 (`/microsoft/playwright`): custom
  fixtures can inject cookies through `storageState` / browser context cookies while keeping each
  test isolated.
- Better Auth official testing/session guidance through Context7 (`/better-auth/better-auth`):
  server `auth.api.getSession` reads session cookies from request headers, and its test utilities
  produce browser-compatible cookies for Playwright-style tests.

## Implementation

- Added a development-only `/api/e2e/session` route that:
  - returns 404 unless `ENV=development`;
  - inserts a real Better Auth user, organization, owner member, firm profile, and session row;
  - returns a signed `duedatehq.session_token` cookie compatible with the existing
    `auth.api.getSession` loader path;
  - optionally seeds real Workboard client/obligation rows through scoped repos.
- Extended `e2e/fixtures/test.ts` with:
  - `authSeed` option (`empty` / `workboard`);
  - `authSession`;
  - `authenticatedPage`;
  - page objects for App Shell, Migration Wizard, Rules Console, and Workboard.
- Added shipped-behavior specs for:
  - authenticated guest redirects and dashboard shell;
  - command palette navigation and opening the implemented Migration wizard;
  - Migration Step 1 paste parsing, SSN blocking, and discard confirmation;
  - Rules Console tab URL state, rule detail drawer, and generation preview;
  - Workboard seeded filtering, sorting, and status mutation with audit toast;
  - protected-route locale handoff before login redirect;
  - localized SPA 404.

## Boundaries

The new authenticated specs are local-only and skip external `E2E_BASE_URL` targets because the
test session minting route deliberately does not exist on staging/production. Still not covered:
Google OAuth, full Migration apply, Pulse apply/evidence citation, Workboard detail/evidence drawers,
Clients/Audit/Members/Profile routes, and firm switching.
