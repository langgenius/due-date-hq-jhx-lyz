---
title: '2026-05-09 · Coverage documentation alignment'
date: 2026-05-09
author: 'Codex'
---

# Coverage documentation alignment

## 背景

Rules implementation already exposes `FED + 50 states + DC`, but several docs and marketing copy
still described the old limited public coverage scope. That made README, product docs, PRDs, and
public state-coverage copy disagree with the current rule/source registry.

## 做了什么

- Updated README and project-module docs to describe current public coverage as
  `FED + 50 states + DC`.
- Updated marketing state coverage copy and footer audience text so public pages no longer describe
  coverage as a five-state set.
- Updated architecture, PRD, report, ADR, product-design, and historical dev-log references that
  treated the old scope as current.
- Kept the product boundary explicit: source-backed candidates still require practice review before
  they become reminder-ready active rules.

## 验证

- Searched README, docs, marketing source, and public marketing files for the old limited-coverage
  wording and confirmed the targeted phrases are gone.
