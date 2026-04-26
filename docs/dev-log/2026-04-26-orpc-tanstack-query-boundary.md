---
title: 'oRPC TanStack Query Boundary'
date: 2026-04-26
commit: '6498797'
author: 'Codex'
---

# oRPC TanStack Query Boundary

## 背景

Migration Copilot wizard 直接调用 `rpc.migration.*`。这绕过了
`@orpc/tanstack-query` 已经提供的 `queryOptions()` / `mutationOptions()`，也让 pending、
错误处理和 cache invalidation 分散在组件内部。

## 做了什么

- 将 app 业务侧 RPC 消费约束为 `orpc.*.queryOptions()` / `mutationOptions()`。
- 将 raw `rpc` client 留在 `apps/app/src/lib/rpc.ts` 内部，不再从该模块导出。
- 用 lint 约束阻止业务代码直接 import `@orpc/client`。
- 将 Migration wizard 的 Step 1-3 RPC 调用迁到 TanStack Query mutations。
- 将业务侧 mutation 触发改为 `mutate(input, callbacks)`，避免事件 handler 内使用
  `mutateAsync` 串接流程。
- 修复 dry-run 错误行返回时 `batchId` 为空字符串导致输出 schema 可能失败的问题。

## 为什么这样做

DueDateHQ 是 SPA，server state 应由 TanStack Query 统一管理。oRPC 官方推荐将
`createTanstackQueryUtils(client)` 生成的 options 直接传给 TanStack Query hooks；这样 query
key、mutation lifecycle、cache invalidation 和错误处理都走同一套机制。

本次没有引入薄封装 hook，避免形成第二套 RPC 抽象。读型 RPC 后续接入时再按页面边界选择
`useQuery` 或 `useSuspenseQuery`。

写型 RPC 默认使用 `mutate(input, callbacks)`，让 success/error/settled lifecycle 继续由
TanStack Query 接管。`mutateAsync` 只适合需要 promise composition 且同一作用域明确
`try/catch/finally` 的底层场景。

## 验证

- `pnpm check`：通过，格式、lint、类型检查均无错误。
- `pnpm --filter @duedatehq/app test`：通过，4 个文件 / 26 个测试。
- `pnpm --filter @duedatehq/server test -- migration/_service.test.ts`：通过，1 个文件 / 9
  个测试。
- `pnpm --filter @duedatehq/core test -- csv-parser normalize-dict pii default-matrix`：通过，4
  个文件 / 58 个测试。
- `rg "\brpc\." apps/app/src -S`：业务代码无 raw `rpc.*` 调用。
- `rg "@orpc/client|fetch\('/rpc|fetch\(\"/rpc" apps/app/src -S`：只有
  `apps/app/src/lib/rpc.ts` 初始化 oRPC client，没有业务侧 direct import 或裸 fetch。
- `rg "mutateAsync" apps/app/src -S`：无 app 侧 `mutateAsync`。

## 后续 / 未闭环

- `migration.apply` / `revert` / `singleUndo` 仍是 Day 4 范围。
- imports history / dashboard / workboard 读型 RPC 接入时应优先使用 `useQuery` 或
  `useSuspenseQuery`。
