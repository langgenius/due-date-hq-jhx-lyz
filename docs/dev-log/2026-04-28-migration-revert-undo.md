---
title: 'Migration revert and undo import'
date: 2026-04-28
author: 'Codex'
---

# Migration revert and undo import

## 背景

Migration apply 已能把导入批次提交为 clients、obligations、evidence 和 audit，但 Day 4
验收还要求批量导入后可 revert。现有 schema 已经有 `migration_batch.revert_expires_at`、
`migration_batch.reverted_at`、`client.migration_batch_id` 和
`obligation_instance.migration_batch_id`，所以本轮不需要新增字段或 migration。

## 做了什么

- 补齐 `migration.revert`：
  - 只允许 `applied` 批次在 24 小时窗口内整批撤销。
  - 同一个 D1 ordered batch 中写 `migration_revert` evidence、`migration.reverted`
    audit、删除本批次 obligations/clients，并把 batch 标记为 `reverted`。
- 补齐 `migration.singleUndo` API：
  - 只删除指定 batch 下的单个 client 及其 generated obligations。
  - 写 `migration.single_undo` audit 和 `migration_revert` evidence。
  - 不改变 batch 的整体 `applied` 状态。
- 前端接入最小 UI：
  - `Import complete` toast 增加 `Undo import` action。
  - 点击后用现有 `AlertDialog` 二次确认，再调用 `migration.revert`。
  - 成功后刷新 migration/workboard query，并跳转 Workboard。
- 同步 Lingui catalog，补齐 zh-CN 翻译。

## 为什么这样做

- Revert 是批次级原子动作，放在 migration repo 内组装 D1 batch，避免 service 层把删除、
  审计、证据和状态更新拆成多个提交。
- UI 不新增 Imports History 页面，避免把 Day 4 验收扩大成设置页/历史页工程。
- `singleUndo` 先作为 API 能力落地，等待 Client detail 或 Import history row 再挂入口。

## 验证

- `pnpm --filter @duedatehq/server test -- --run src/procedures/migration/_service.test.ts`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/app test -- --run src/router.test.ts`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm test`
- `pnpm check`
- `pnpm build`

## 后续 / 未闭环

- `singleUndo` 还没有 UI 入口；需要等 Client detail 或 Import history surface。
- 现在的 full revert 入口依赖导入成功 toast。若用户错过 toast，后续需要 Imports History
  或 batch detail 入口。
