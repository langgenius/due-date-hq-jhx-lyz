---
title: '2026-04-27 · Zod 4 API cleanup'
date: 2026-04-27
---

# 2026-04-27 · Zod 4 API cleanup

## 背景

仓库通过 `pnpm-workspace.yaml` catalog 使用 Zod。`npm view zod version` 确认最新版本为
`4.3.6`，当前 catalog 已经固定在该版本；本次重点转为清理 Zod 4 的 deprecated API 和
统一 import 方式。

## 做了什么

- 将全仓 `import { z } from 'zod'` 改为 `import * as z from 'zod'`，类型导入改为
  `import type * as z from 'zod'`。
- 将 deprecated string format method 改为 Zod 4 顶层 API：
  `z.email()`、`z.url()`、`z.uuid()`、`z.iso.date()`、`z.iso.datetime()`。
- 将旧式 `.regex(..., 'message')` 改为 `.regex(..., { error: 'message' })`。
- 同步更新 Migration Copilot prompt 文档中的 Zod import 示例。

## 为什么这样做

Zod 4 官方文档建议使用 namespace import，并将 string format validators 迁到顶层
`z` namespace。`z.record(z.string(), value)` 的现有用法已经是 Zod 4 的双参数形式，
且 key schema 不是 enum，不触发 enum record 的 exhaustive key 行为变化，所以无需改为
`z.partialRecord`。

## 验证

- `pnpm check`
- `pnpm test`

备注：`pnpm check` 仍报告一个既有 warning，位于 `packages/ui/src/lib/placement.ts` 的
tuple type assertion；本次未触碰该文件。
