# Opportunities

> Version: v0.1
> Date: 2026-05-13
> Current product anchor: Opportunities route, Clients detail, existing client facts and
> obligations

## Product Intent

Opportunities is a lightweight future-business guidance surface for CPA practices. It helps a
partner notice which clients may be worth a service, scope, or relationship conversation before the
next engagement cycle.

This feature is intentionally not a tax-planning engine. DueDateHQ does not recommend tax avoidance
methods, tax strategies, or filing positions here. The product only points to client-level
conversation cues derived from existing practice data.

The internal one-liner:

> Opportunities helps a partner decide who may deserve a future business conversation, then routes
> the user back to Client detail for review.

## What This Is Not

Opportunities must not become:

- an AI tax-advice page;
- a list of tax avoidance suggestions;
- a replacement for CPA, EA, attorney, or qualified professional review;
- a pricing benchmark surface before billing, hours, and engagement-letter data exist;
- a new task system with assignment, resolve, snooze, or lifecycle state;
- a duplicate deadline triage queue.

## Current V1 Shape

V1 has two surfaces:

1. `/opportunities`: a light queue of client-level business cues.
2. Client detail right rail: a small "Future business cues" card scoped to the open client.

The global page is for discovery. The Client detail card is for context while reviewing a client.
Both actions only open Client detail. V1 does not mutate customer data and does not persist
opportunity state.

## V1 Cue Types

| Kind                    | Meaning                                                                     | Derived from                                          | Allowed action |
| ----------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- | -------------- |
| `advisory_conversation` | The client has enough context to justify a human-led advisory conversation  | importance weight, estimated tax context, owner count | Open client    |
| `scope_review`          | The client workload footprint may justify reviewing engagement scope        | open obligations, jurisdiction spread                 | Open client    |
| `retention_check_in`    | Repeated waiting or late-filing signals may justify a relationship check-in | waiting obligations, late filing history              | Open client    |

## Data Boundary

V1 is a computed read model over existing client and obligation data:

- no new database table;
- no `opportunity` lifecycle;
- no AI-generated tax strategy;
- no billing or fee comparison;
- no cross-firm benchmark.

Future versions may add AI explanation, billing-backed pricing cues, or follow-up workflow only
after the underlying data and review boundaries exist.

## UX Rules

- Keep the page dense and quiet, closer to a work queue than a marketing page.
- Copy should say "cues" or "conversation", not "recommendation" or "tax strategy".
- Every card must show simple evidence, such as waiting item count, open obligation count, or owner
  count.
- The primary action is always `Open client` in V1.
- Client detail should show at most three cues in the right rail.

## Acceptance Criteria

- `/opportunities` appears next to Clients in navigation and command palette.
- Client detail shows a compact, client-scoped opportunity card.
- The feature does not add any write mutation or database migration.
- The feature does not mention tax avoidance advice or specific tax strategies.
- All V1 cues are deterministic and testable from existing firm-scoped data.
