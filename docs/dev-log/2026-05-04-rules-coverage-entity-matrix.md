---
title: '2026-05-04 · Rules Coverage entity matrix'
date: 2026-05-04
author: 'Codex'
---

# Rules Coverage entity matrix

## 背景

50-state candidate domains 已经让 Rules 覆盖从最初 MVP business-only 扩展到个人与
fiduciary 场景。Coverage tab 右侧仍固定展示 4 个 business entity，容易让内部用户误解
系统只支持 LLC / Partnership / S-Corp / C-Corp。

## 做了什么

- 将 `ENTITY_COLUMNS` 改为 `ENTITY_COLUMN_GROUPS`：
  - `business`: `llc`, `partnership`, `s_corp`, `c_corp`, `sole_prop`
  - `personal`: `individual`, `trust`
  - `all`: `individual`, `trust`, `llc`, `partnership`, `s_corp`, `c_corp`, `sole_prop`
- `coverageCellState` 支持 7 个矩阵 entity；旧 business override 保持原状态，新增
  `sole_prop` / `individual` / `trust` 默认显示 `review`，与 candidate domains 的人工复核
  语义一致。
- Coverage tab 右侧标题改为 `ENTITY COVERAGE`，增加本地 segmented control：
  `Business` / `Personal & fiduciary` / `All`。
- Jurisdiction summary 的 `NAME` 列固定为 90px 并截断长辖区名，减少左表空白，
  给右侧 entity matrix 留出扫描空间。
- Coverage 下方双栏改为 `xl:col-span-6` / `xl:col-span-6`，进一步收窄
  jurisdiction summary 并扩大 entity coverage 的扫描区域。
- Entity coverage 的 segmented control 在 `xl` 双栏布局下固定到标题区右上角，
  不参与标题区高度计算，使左右 table 顶边水平对齐且左侧标题区不留空白。
- `Other` 不进入 coverage matrix，只在副说明中标注为 manual review fallback。
- All 视图给表格设置最小宽度，沿用 table 容器的横向滚动能力，避免右栏挤压。

## 验证

- `pnpm --filter @duedatehq/app test -- rules-console-model`
- `pnpm --filter @duedatehq/app test -- coverage-tab`
- `pnpm --filter @duedatehq/app test -- coverage-tab.test.tsx`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
