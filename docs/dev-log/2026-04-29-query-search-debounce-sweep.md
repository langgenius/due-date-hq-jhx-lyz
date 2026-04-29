---
title: 'Query Search Debounce Sweep'
date: 2026-04-29
author: 'Codex'
---

# Query Search Debounce Sweep

## 背景

Workboard 已经把 URL 写入降频和 TanStack Query 请求防抖分开处理：`nuqs`
负责即时 URL state，`apps/app/src/lib/query-rate-limit.ts` 负责给 RPC input 的
debounced search value。全仓检查后发现 Audit log 仍然在页面内手写
`useDebouncedValue(..., 350)` 和 `debounce(350)`，并且四个精确文本筛选会随每次按键
直接改变 `audit.list` input。

## 做了什么

- 将 helper 收敛为通用 `useDebouncedQueryInput(value, { maxLength })`，调用方必须按
  contract 显式传入长度上限；不保留 Workboard/search 专用默认值。
- Audit log 的 `q`、`action`、`actor`、`entityType`、`entity` 都先经过共享 debounce
  helper 再进入 `orpc.audit.list.infiniteOptions()` input。
- Audit log 移除页面内本地 `debounce(350)`，URL 写入统一使用
  `queryInputUrlUpdateRateLimit`。清空输入继续立即清空请求筛选。
- Clients facts 搜索只做本地过滤，不触发服务端 fetching；本次只把 `q` 的 URL 写入接入
  共享 rate limit，保持列表过滤即时反馈。
- 更新 `docs/dev-file/05-Frontend-Architecture.md`，把高频 query 文本输入约束从
  Workboard 单点扩展为 app 级规则。

## 为什么这样做

`limitUrlUpdates` 只能降低 URL 写入频率，不能降低由 React state 派生出的
TanStack Query input 变更频率。Audit 的搜索和精确筛选都会进入服务端分页查询，所以必须
debounce 实际喂给 query key / RPC input 的值。Clients 当前不是服务端搜索，强行 debounce
本地过滤会降低输入反馈，只需要 URL 写入降频。

## 验证

- `pnpm exec vp check --fix apps/app/src/lib/query-rate-limit.ts apps/app/src/features/audit/audit-log-page.tsx apps/app/src/routes/clients.tsx`

## 后续 / 未闭环

- 后续新增 URL query 驱动的搜索、精确文本筛选、slider 等高频输入时，先复用
  `apps/app/src/lib/query-rate-limit.ts`，并从 contract 显式传入边界；不要在 route 或
  feature 页面里重新手写 timer。
