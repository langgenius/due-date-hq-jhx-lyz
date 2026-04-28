# DueDateHQ E2E

Root-level Playwright tests cover browser-visible system behavior across the Vite SPA,
Cloudflare Worker Assets, Hono routes, and oRPC HTTP boundary.

## Commands

- `pnpm test:e2e`: build the SPA, apply local D1 migrations, start `wrangler dev --local`, and run Playwright.
- `pnpm test:e2e -- --ui`: run Playwright UI mode.
- `E2E_BASE_URL=https://staging.example.com pnpm test:e2e`: run against an already deployed target.

## Layout

- `tests/`: specs grouped by user-visible workflow.
- `fixtures/`: Playwright fixtures shared by specs.
- `pages/`: Page objects with stable locators and user actions.

Specs should keep assertions in the spec file. Page objects expose locators and small actions only.

## AC Metadata

Each spec includes `Feature`, `PRD`, and `AC` metadata comments near the top. Test titles should also
include `AC:` so humans and agents can trace a failure back to product acceptance criteria without
opening the implementation.

## Locator Rules

Prefer accessible locators in this order:

1. `getByRole`
2. `getByLabel`
3. `getByText` for stable user-facing copy
4. `getByTestId` only for dense business surfaces where accessible names are ambiguous

## Auth And Data

Current smoke coverage stays unauthenticated because real Google OAuth is intentionally outside CI.
Authenticated business flows should add a dedicated auth fixture that seeds a local Better Auth session
and tenant in D1 before navigating to protected routes.

Current specs intentionally cover shipped behavior only:

- Worker liveness through Hono `/api/health`
- unauthenticated auth gates and redirect preservation
- marketing-to-app locale handoff
- entry-page locale switching
- SPA 404 rendering
