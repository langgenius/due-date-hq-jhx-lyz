# 2026-05-06 · Hide Priority Queue MVP UI

## Context

The Team Priority Pulse Queue backend and persistence slice exists, but the current release should
stay MVP-shaped and not expose the new queue or manager-review controls in the app yet.

## Changes

- Removed the visible `All Pulse` / `Priority Queue` switcher from Rules > Pulse Changes.
- Disabled the Team priority-review drawer UI so `Manager review`, `Confirm all review-needed`,
  and `Apply reviewed set` are not shown in the MVP.
- Updated the Pulse E2E path to assert that the Priority Queue surface stays hidden for Team users.
- Removed user-facing docs that described Priority Queue as currently available.
