---
title: '2026-04-29 · Sidebar plan status entry'
date: 2026-04-29
---

# 2026-04-29 · Sidebar plan status entry

## Context

最近 24 小时内 billing / pricing 主线已完成：marketing `/pricing` 对齐设计系统，
app `/settings/billing` 重排为 subscription overview + plan options，checkout / success
flow 也完成文案和 E2E hardening。随后需要判断 SaaS 产品是否应该把 pricing / subscription
显示在 AppShell sidebar footer 或 route header。

## Decision

- **不放 route header**：header 右侧只承载 AppShell-owned utility（`⌘K` hint + notification
  bell）。Pricing / subscription 属于 account / firm commerce 信息，不是当前 route 的 primary
  action，放进 header 会和 page toolbar 与通知竞争。
- **不升主导航**：完整 billing center 继续留在 Settings → Billing；主导航按工作域组织，而不是按商业动作组织。
- **放 sidebar footer 轻量状态入口**：在 `+ Import clients` 和 user menu 之间加入 `PlanStatusLink`，
  展示当前 firm 的 `Solo / Firm / Pro`、seat count，以及 owner 视角的 `Upgrade / Manage`
  或 member 视角的 `View`。点击统一进入 `/settings/billing`。

## Changes

- `apps/app/src/components/patterns/app-shell.tsx`
  - 新增 `PlanStatusLink`，使用 current firm 的 plan / seatLimit / role 派生展示。
  - 继续复用 `/settings/billing` 作为唯一账单落点，不新增 route 或状态源。
- `docs/dev-file/05-Frontend-Architecture.md`
  - 记录 AppShell footer 的 plan status 入口和 header 禁放 billing CTA 的规则。
- `docs/design/DueDateHQ-DESIGN.md`
  - 在 Sidebar 三段式结构里补上 Plan status slot，并明确 subscription IA。

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec vp check --fix apps/app/src/components/patterns/app-shell.tsx`
- `pnpm check`
- `pnpm --filter @duedatehq/app build`
- `pnpm test`
