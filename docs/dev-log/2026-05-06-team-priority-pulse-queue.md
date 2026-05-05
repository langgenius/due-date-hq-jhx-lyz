# 2026-05-06 · Team Priority Pulse Queue

## Context

Team needed a concrete paid Pulse workflow that did not imply a stronger AI model than Pro. The
chosen slice keeps Pro's existing Pulse apply, request review, and single-row needs-review
confirmation, then adds Team/Enterprise operations control for high-risk Pulse alerts.

## Changes

- Added `pulse_priority_review` as the persistent manager review record keyed by `firm_id +
alert_id`, with review status, deterministic priority score/reasons, selected/confirmed/excluded
  obligation ids, reviewer metadata, and notes.
- Added Team/Enterprise Pulse APIs for `listPriorityQueue`, `reviewPriorityMatches`, and
  `applyReviewed`. Queue listing is derived from existing Pulse alert/source/review data; it does not
  create queue rows during reads.
- Kept `requestReview` compatible with Pro, while Team/Enterprise also upsert an open priority
  review task for the alert.
- Implemented deterministic priority scoring for preparer requested, needs-review matches,
  low confidence, high impact, and degraded/failing sources. No new AI model routing was introduced.
- Added `All Pulse` / `Priority Queue` tabs in Rules > Pulse Changes. Team/Enterprise users can
  review risk-ranked Pulse alerts; Pro users see an upgrade panel.
- Added a manager review panel in the existing Pulse drawer with confirm-all, row-level exclude,
  persistent save, and reviewed-set apply. Batch confirmation remains scoped to affected clients
  inside one Pulse alert.

## Validation

- Added unit coverage for priority scoring and selection helpers.
- Added repo/procedure coverage for manager review persistence, plan gates, role gates, and Team
  request-review task creation.
- Added a Pulse E2E path for Team Priority Queue review and apply.
