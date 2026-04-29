---
title: '2026-04-29 · Flat organization routes'
date: 2026-04-29
author: 'Codex'
---

# 2026-04-29 · Flat organization routes

## 背景

Sidebar IA 已经在 2026-04-29 收敛为 `Operations / Clients / Organization`，但 URL 仍保留
Settings 前缀：Rules、Members、Billing 和 firm profile 都挂在二级 Settings 路径下。
这导致产品 IA、route summary、Cmd-K 和实际 URL 不一致。

本次明确决策：Settings 不再是当前 app 的 URL 层级，也不保留兼容 redirect。

## 做了什么

- 将 protected organization surfaces 改为一级 canonical route：
  - `/firm`：active firm profile，编辑 firm name / timezone / soft-delete。
  - `/rules`：rules coverage / sources / library / preview。
  - `/members`：成员席位、角色、邀请与 seat limit。
  - `/billing`：plan status、billing portal、plan options。
- 重命名 route modules，消除 settings 命名残留：
  - `routes/firm.tsx`
  - `routes/rules.tsx`
  - `routes/members.tsx`
  - `routes/billing.tsx`
- 从 router 中删除 Settings root 和子路由，不保留旧路径 redirect。
- AppShell `Organization` group 增加 `Firm profile`，并使用 `Building2` icon；Rules 使用
  `FileCheck2`，Billing 使用 `CreditCard`，Members 使用 `Users`，Audit log 使用 `Scale`。
- User menu 移除 firm profile 入口，避免把 firm-level profile 误表达成 user account profile。
- Cmd-K `Navigate` 直接列出一级页面：Dashboard、Workboard、Alerts、Team workload、Clients、
  Firm profile、Rules、Members、Billing、Audit log；删除聚合 Settings 命令。
- E2E page objects 和 URL 断言改为一级路径。
- 更新稳定架构文档、设计规范、E2E 文档和 Rules product design。

## 为什么这样做

Settings 已经没有自己的页面、导航父项或布局语义。继续保留 URL 前缀会让用户看到的 IA 与
深链结构分叉，也会让后续 Notifications / Imports / Setup History 等未来页面继续被错误地塞进
一个已经不存在的容器里。

Firm profile 选择 `/firm`，不是 `/profile`：当前页面编辑的是 active firm，而不是用户姓名、
头像、邮箱等 account profile。真正的 user profile 如果后续需要，应作为单独产品面重新设计。

## 验证

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile --strict`
- `pnpm check`
- `pnpm check:deps`
- `pnpm test`
- `pnpm test:e2e`：41 passed
- `pnpm build`

## 后续

- 若未来新增 Notifications、Imports history、Setup history 等页面，使用一级 canonical URL，
  不恢复 Settings 聚合层。
