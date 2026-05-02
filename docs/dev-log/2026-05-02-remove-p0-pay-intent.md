---
title: 'Remove P0 Pay-Intent Plan'
date: 2026-05-02
author: 'Codex'
---

# Remove P0 Pay-Intent Plan

## 背景

产品决策：不再规划 P0-23 Pay-intent Button，不再把 `$49/mo` 点击埋点作为 Demo
或首发验收目标。

## 做了什么

- 从 PRD v2.0 P0 清单移除 `P0-23 Pay-intent Button`。
- 从 14 天验证目标和 6 分钟 Demo script 中移除 pay-intent CTA。
- 从 Demo Sprint playbook、7-day rhythm、DevOps smoke、Tech Stack、Security/RBAC
  边界和 Migration Copilot 设计册中移除 pay-intent 作为计划项、契约 consumer 或测试点。

## 验证

- `rg "P0-23|pay-intent|Pay-intent|Pay intent|I'd pay|I’d pay|\\$49" docs/PRD/DueDateHQ-PRD-v2.0-Part1A.md docs/PRD/DueDateHQ-PRD-v2.0-Part2B.md docs/dev-file docs/product-design/migration-copilot`

## 未改范围

- 旧版 PRD v1.0、历史 dev log、研究报告和已生成 HTML 报告保持历史记录，不回写。
