---
title: 'Firm timezone, billing subscription, and timestamp polish'
date: 2026-04-30
author: 'Codex'
---

# Firm timezone, billing subscription, and timestamp polish

## 背景

Firm profile 的 timezone 仍是自由文本；Billing 页面通过 better-auth Stripe client
直接请求 `/api/auth/subscription/list`，在本地未启用 Stripe plugin 时会 404；Audit 等
页面会把 ISO transport timestamp 直接暴露给用户。Rules detail drawer 也偏窄，evidence
和 verification metadata 扫读困难。

## 做了什么

- 在 `packages/contracts/src/firms.ts` 增加美国 IANA timezone 枚举和 options，firm
  create/update input 只接受这些值。
- 新增 app 侧 `FirmTimezoneSelect`，Firm profile 和 sidebar Add firm dialog 共用同一套
  grouped timezone dropdown；下拉层宽度跟触发输入框一致，并支持输入搜索 timezone / region。
- 新增 `firms.listSubscriptions` RPC，由 app-owned repo 读取 `subscription` 表；Billing
  status 查询改走该 RPC，checkout / portal 跳转仍使用 hosted provider endpoint。
- 新增 `formatDateTimeWithTimezone()`，Audit table/drawer、Audit JSON、Clients facts、
  Members、Dashboard brief timestamp 改为 `YYYY-MM-DD HH:mm:ss <timezone>`；date-only
  due date 使用 `YYYY-MM-DD`。
- Rules Library detail drawer 宽度覆盖 Sheet 默认 `sm:max-w-sm`，桌面提升到约 920px。

## 验证

- `pnpm --filter @duedatehq/app test -- src/lib/utils.test.ts src/features/audit/audit-log-model.test.ts src/features/members/member-model.test.ts`
- `pnpm --filter @duedatehq/contracts test -- src/contracts.test.ts`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/app build`
- `pnpm check`（通过；仍保留既有 `apps/marketing/src/pages/404.astro` 的
  `oxc(no-map-spread)` warning）
