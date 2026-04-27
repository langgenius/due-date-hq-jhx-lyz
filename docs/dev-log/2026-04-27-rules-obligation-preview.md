# 2026-04-27 · Rules Obligation Preview

## Context

Rules were structured and source-checked, but the product still needed a safe
step from verified rules to obligations. The preview layer must preserve source
evidence, applicability review state, and reminder eligibility before any D1
write or reminder scheduling happens.

## Changes

- Added `previewObligationsFromRules` in `@duedatehq/core/rules`.
- Added explicit tax type aliases from default matrix terms to rule pack terms,
  including CA LLC annual tax, CA LLC estimated fee, NY PTET, NY IT-204-LL, TX
  franchise, and WA combined excise aliases.
- Expanded due date logic into preview rows with `period`, `dueDate`,
  `requiresReview`, `reviewReasons`, and `reminderReady`.
- Blocked candidate rules from preview output.
- Marked manual coverage, applicability-review rules, source-defined calendars,
  and missing concrete dates as review-only previews.
- Added `rules.previewObligations` to the oRPC contract and server handler.
- Updated rules product docs to make preview the boundary before generated
  obligations and reminder scheduling.
- Tightened preview input contracts so client entity uses the real
  `EntityTypeSchema` rather than rule applicability values, and client state is
  restricted to MVP states (`CA`, `NY`, `TX`, `FL`, `WA`).

## Product Decisions

- Preview is a read contract, not a persistence step. It does not write
  `obligation_instance`.
- `reminderReady=true` is the only preview state eligible for generated
  obligations and 30 / 7 / 1 day reminders.
- `requiresReview=true` previews are still useful on pages because they carry
  sources, evidence, and CPA review reasons, but they cannot schedule reminders.
- Matrix-to-rule tax type matching is explicit and deterministic; no AI matching
  is used at generation time.
- `any_business` remains a rule applicability value only. It is not a valid
  preview client entity.
- `FED` remains a rule jurisdiction only. It is not a valid preview client
  state; federal previews are added alongside a supported client state.

## Validation

- `pnpm --filter @duedatehq/core test`
- `pnpm --filter @duedatehq/contracts test`
