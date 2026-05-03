---
title: 'Evidence Quote Tone'
date: 2026-05-03
author: 'Codex'
---

# Evidence Quote Tone

## Context

Evidence drawer verbatim quotes used the same subtle gray background as nearby surfaces, so the
quoted source text did not stand out enough when the parent card was tinted.

## Change

- Changed the quote block from `bg-background-subtle` to the existing `bg-severity-medium-tint`.
- Kept the treatment borderless and compact, while raising text color to `text-text-primary` for
  readability.

## Docs Check

No DESIGN.md or stable architecture update was needed. This reuses an existing warning/risk tint and
does not add a new component or token.

## Validation

- `pnpm exec vp check apps/app/src/features/evidence/EvidenceDrawerProvider.tsx docs/dev-log/2026-05-03-evidence-quote-tone.md`
- `git diff --check -- apps/app/src/features/evidence/EvidenceDrawerProvider.tsx docs/dev-log/2026-05-03-evidence-quote-tone.md`
