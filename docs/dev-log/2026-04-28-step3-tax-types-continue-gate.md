---
title: 'Step 3 tax types continue gate'
date: 2026-04-28
author: 'Codex'
---

# Step 3 tax types continue gate

## 背景

TaxDome preset 正常映射后，Step 3 可能仍无法继续。此时不是 D1 写入问题，而是前端
continue gate 把所有 `NormalizationRow` 都要求为非空。

AI 不可用时，`tax_types` normalizer 会返回 `normalizedValue=null`，让 Default Matrix 或 apply
阶段的 raw split fallback 接管。但 Step 3 UI 只展示 `entity_type` 和 `state` 两组可编辑输入，
不展示 `tax_types` normalization rows，于是不可见的 `tax_types=null` 会永久禁用 Continue。

## 修复

新增 `canContinueNormalization()`，Step 3 只要求用户可见且必须确认的字段非空：

- `entity_type`
- `state`

`tax_types` 不再阻塞 Step 3。原因是：

- 缺 tax types 是产品允许状态；
- Default Matrix 的职责就是从 entity × state 推断 tax types；
- apply 阶段仍能在有 raw tax types 时做 split fallback。

## 验证

- `pnpm --filter @duedatehq/app test -- --run src/features/migration/continue-rules.test.ts`
- `pnpm check`
