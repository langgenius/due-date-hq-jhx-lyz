# 2026-05-12 Client Detail Workspace

## Change

- Replaced the Clients fact-profile sheet with a same-page detail workspace at
  `/clients?client=<id>`.
- Kept the Clients list as the directory view, and hid the directory header while a client detail is
  selected so the page reads as one workspace.
- Added client-scoped work plan summary, Pulse impact, contact-chain readiness, risk inputs, filing
  profiles, risk summary, activity log, notes, and delete action in one detail surface.

## Design Notes

- Reference project learning: client detail should behave like a page, not a split drawer attached to
  the list.
- The final layout uses one document scroll. Pulse impact sits under the client header as context;
  work plan, filing facts, risk summary, and activity log are the main column; contact chain, risk
  inputs, fact checklist, notes, and delete are a shorter supporting rail.
- Pulse decisions still live in Rules > Pulse Changes. Client detail only shows the client-specific
  back edge for follow-up and source review.

## Verification

- `pnpm exec vp check --fix apps/app/src/features/clients/ClientFactsWorkspace.tsx apps/app/src/features/clients/client-detail-model.ts apps/app/src/features/clients/client-detail-model.test.ts apps/app/src/routes/clients.tsx`
- `pnpm --filter @duedatehq/app test -- src/features/clients/client-detail-model.test.ts src/features/clients/client-readiness.test.ts src/features/clients/client-query-state.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app build`
- `E2E_REUSE_EXISTING_SERVER=1 pnpm exec playwright test e2e/tests/clients.spec.ts --project=chromium --reporter=list`
