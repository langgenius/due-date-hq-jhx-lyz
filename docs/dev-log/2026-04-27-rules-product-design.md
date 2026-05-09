# 2026-04-27 · Rules Product Design

## Context

The 14-day MVP needs a trustworthy rules foundation before deadline reminders,
AI briefs, and jurisdiction coverage can feel credible. The current product
direction covers `FED + 50 states + DC`, with rules treated as a verified
internal asset rather than a user-editable setting.

## Changes

- Added `docs/product-design/rules/README.md` as the rules design booklet entry.
- Added `docs/product-design/rules/01-source-registry-and-rule-pack.md` for the
  official source registry, MVP rule pack, structured data model, acquisition
  workflow, and notification boundaries.
- Added `docs/product-design/rules/02-rules-console-product-design.md` for the
  internal Rules Console page design and user-facing consumption model.

## Product Decisions

- The MVP rules scope is `FED + 50 states + DC`, with candidates review-gated.
- Rules use four tiers: basic deadline, annual rolling calendar, exception /
  relief candidate, and applicability review.
- Only verified rules can generate user obligations and reminders.
- AI may extract candidates and evidence, but cannot publish rules or update
  reminder logic without review.
- Source-change alerts, candidate-review alerts, publish alerts, and user
  deadline reminders are separate notification channels.
- The first real page is an internal `/settings/rules` console; seed CPA users
  only see source evidence through deadline rows, AI briefs, and reminder
  rationale.

## Validation

- Documentation-only change. No application code or database schema changed.
- Follow-up implementation still needs schema, seed data, ingest jobs, and UI.
