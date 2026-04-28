---
title: 'D1 normalization batch limit'
date: 2026-04-28
author: 'Codex'
---

# D1 normalization batch limit

## 背景

Migration Step 2 在 TaxDome preset 正常映射后调用 `migration.runNormalizer`，本地 D1 返回：

```text
D1_ERROR: too many SQL variables at offset 1014: SQLITE_ERROR
```

这不是 CSV 字段问题，也不是 AI gateway 问题。触发点是 `migration_normalization` 批量写入：
本次 demo CSV 有 11 个 distinct `Entity Type` 原始值，repo 一次 insert 11 行。

## 根因

`packages/db/src/repo/migration.ts` 把 `migration_normalization` 误算成每行 9 个 bound params：

```ts
const NORM_BATCH_SIZE = Math.floor(100 / 9) // = 11
```

实际 insert 每行绑定 10 个值：

- id
- batch_id
- field
- raw_value
- normalized_value
- confidence
- model
- prompt_version
- reasoning
- user_overridden

`created_at` 是 SQL default expression，不占 bound param。因此 11 行会产生 110 个 bound params，
超过 D1 单 statement 100 variables 上限。

## 修复

把 normalization batch size 改为 `floor(100 / 10)`，11 条 normalizations 会拆成 `10 + 1` 两条
insert statement。

新增 `packages/db/src/repo/migration.test.ts`，用 fake Drizzle db 直接断言 11 条 normalization
写入会切成 `[10, 1]`。

## 后续

当前修复先止血。更系统的后续是把 D1 batch size 计算 helper 化，避免 `100 / N` 分散在不同 repo
里重复手算。
