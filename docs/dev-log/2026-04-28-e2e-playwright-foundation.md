# 2026-04-28 · Playwright E2E Foundation

## Context

The repo documented Playwright E2E coverage but only had a root `test:e2e` script placeholder.
There was no `@playwright/test` dependency, no `playwright.config.ts`, no `e2e/` directory, and no
independent CI workflow.

## Decision

Use root-level Playwright Test instead of `packages/e2e`.

- E2E crosses `apps/app`, `apps/server`, Worker Assets, Hono routes, oRPC HTTP, and D1 local state.
- It is not a reusable package and should not participate in package dependency direction.
- The config follows Playwright's `webServer` model and starts the real local Worker surface.

Use traditional Playwright specs with AC metadata instead of Cucumber BDD.

- Test names include `AC:` for product traceability.
- Spec-level comments record Feature, PRD, and AC.
- Page objects expose locators/actions only; assertions stay in specs for agent readability.

## Implementation

- Added `@playwright/test` to root dev dependencies.
- Added `playwright.config.ts` with:
  - `testDir: ./e2e/tests`
  - CI retries and `forbidOnly`
  - Chromium project at 1440×900
  - trace/screenshot/video failure artifacts
  - local full-stack `webServer` command:
    - build Vite SPA
    - apply local D1 migrations
    - start `wrangler dev --local`
- Added `e2e/README.md`, shared fixtures, `LoginPage`, and smoke specs:
  - Hono `/api/health`
  - unauthenticated login entry
  - protected route redirect preservation
  - root/onboarding unauthenticated redirect behavior
  - marketing `lng` handoff
  - login entry locale switch
  - SPA 404 boundary
- Added `.github/workflows/e2e.yml` as an independent CI workflow with a generated local
  `apps/server/.dev.vars` and Playwright Chromium install.

## Follow-ups

- Add an authenticated Better Auth/D1 seed fixture before implementing Dashboard, Obligations, and
  Migration Copilot happy paths.
- Wire `scripts/ac-traceability.ts` to scan `e2e/**/*.spec.ts` once that script exists.
- Promote staging E2E by setting `E2E_BASE_URL` in a release workflow after the staging deploy gate.

## CI Follow-up

- Synchronized Lingui catalogs after the Obligations table variable rename changed the extracted
  placeholder comment from `row.clientName` to `obligationRow.clientName`; runtime strings and
  translations stay unchanged.
