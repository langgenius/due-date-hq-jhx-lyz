---
title: 'RBAC Revert Boundary'
date: 2026-04-29
---

# RBAC Revert Boundary

## Context

The product boundary for high-impact actions was clarified: Owner-only should
cover ownership / account powers, while revert is an operational recovery
capability. Because Manager can run migration imports and Pulse batch apply,
Manager also needs the matching 24h revert capability.

## Change

- Updated RBAC docs so `migration.revert` and `pulse.revert` are Owner +
  Manager.
- Kept Owner-only language for Firm ownership, billing, role management,
  member administration v1, and full-firm evidence/export powers.
- Updated Migration Copilot conflict resolution, UX entry matrices, email
  revert-token language, and ADR index to reflect the new boundary.
- Updated `packages/auth` role configuration and regression tests so Manager
  has `migration.revert` and `pulse.revert`.

## Validation

- `pnpm --filter @duedatehq/auth test` - passed, 7 tests.
- `git diff --check` - passed.
