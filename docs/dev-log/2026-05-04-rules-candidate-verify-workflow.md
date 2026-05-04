---
title: '2026-05-04 · Rules candidate verify workflow'
date: 2026-05-04
author: 'Codex'
---

# Rules candidate verify workflow

## 做了什么

- 新增 `rule_review_decision` D1 表，用于保存 firm-scoped candidate `verified/rejected` 决策。
- Rules RPC 新增 `listReviewDecisions`、`verifyCandidate`、`rejectCandidate`。
- Rules runtime 会把 firm 已发布的 verified decision merge 回 `listRules`、`coverage`、`previewObligations`；Migration apply 也会读取这些 firm-verified rules。
- Rules Console 的 rule detail drawer 增加 Ops review 面板，可基于官方 source excerpt、due-date logic、extension policy、coverage status 完成 verify/reject。
- 新增 server-side `ruleSourceAdapters`，把 rule source registry 里带 `candidate_review` 的官方 sources 接入 Pulse source-state/signal 机制；这会记录 source snapshot/diff signal，但不会自动生成客户 Pulse 或 reminder。

## 关键边界

- Candidate verify 需要 Owner/Manager 角色。
- `coverageStatus='full'` 且不要求 applicability review 时，必须提供 concrete due-date logic；`source_defined_calendar` 不能发布成 reminder-ready verified rule。
- 自动 source watch 只生成内部 source signals；真正 verified rule 仍必须由人工审核后发布。

## 验证

- `pnpm check:fix`
