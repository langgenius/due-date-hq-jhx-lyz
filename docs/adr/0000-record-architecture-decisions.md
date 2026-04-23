# 0000 · Record architecture decisions

## Context

DueDateHQ is a 2-engineer AI-assisted monorepo. The PRD and Dev File set covers nearly every near-term choice, but specific trade-offs (e.g. D1 vs Postgres, oRPC vs tRPC, single-Worker deploy) deserve their own traceable records so future contributors can reconstruct the why without re-reading every doc.

## Decision

We use [Architecture Decision Records](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) stored under `docs/adr/` with the numeric prefix convention `NNNN-<slug>.md`. Every non-trivial architectural change:

1. Lands a new ADR first (or updates an existing one with `Superseded by #NNN`).
2. Then modifies `docs/Dev File/*` to reflect the new state.
3. Then merges the code.

## Consequences

- **Good**: Decisions gain a single durable home; PRs can point to an ADR instead of litigating past choices in review.
- **Bad**: Slight process overhead — but only for architectural moves, not day-to-day work.
- **Uncertain**: Whether to also capture product decisions here (currently those live in PRD). For now ADRs are engineering-only.

## Status

accepted
