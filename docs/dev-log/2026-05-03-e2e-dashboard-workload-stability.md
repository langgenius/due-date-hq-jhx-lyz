# 2026-05-03 - E2E dashboard and workload stability

## Changes

- Updated dashboard shell and Pulse E2E assertions from the removed `Next deadlines` label to the
  current `Due this week` metric.
- Fixed the team workload E2E clock at `2026-04-30T12:00:00.000Z` so fixed seed deadlines keep the
  intended due-soon and overdue buckets over time.
- Threaded the existing dashboard `asOfDate` contract through the route query string so E2E can
  assert risk-window behavior against a fixed date.

## Verification

- Pending: run the focused Playwright specs for authenticated shell, Pulse, and workload.
