# Practice Switch Cache Boundary

## Context

Practice switching changes the active firm through the server session, while most app query keys are
stable oRPC procedure keys and do not include `firmId`. A normal broad `invalidateQueries()` marks
old data stale and refetches active queries in the background, so route content can keep rendering
the previous practice until the next response lands.

## Change

- Treat practice switch, practice creation, and current-practice deletion as tenant-boundary events.
- Reset the TanStack Query cache with `resetQueries()` so subscribed routes drop old practice data
  before refetching.
- Navigate successful switch/create/delete flows back to Dashboard, the canonical post-switch
  surface.

## Validation

- Added `apps/app/src/lib/query-cache.test.ts` to lock the reset behavior.
