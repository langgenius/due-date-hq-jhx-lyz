---
title: 'Dashboard AI Brief Product Closure'
date: 2026-04-29
author: 'Codex'
---

# Dashboard AI Brief Product Closure

## 背景

`feat: add dashboard ai brief pipeline` 已经完成后台 Queue 物化主路径，但 review 指出
Dashboard Brief 的产品验收还有四个缺口：citation 交互、手动刷新 pending 反馈、周末
scheduled 策略、debounce 粒度。

## 做了什么

- 收紧 `DashboardBriefPublic.citations` contract，固定为 `ref + obligationId + evidence`。
- Dashboard ready brief 增加 citation chips：
  - 点击 citation 打开 Dashboard 内 Evidence Drawer。
  - Drawer 展示 obligation、source metadata。
  - Drawer 可跳转 Obligations 对应 obligation，也可打开 official source URL。
- 手动 `Refresh brief` 后立即进入 queued / pending UI；queued / pending 期间禁用刷新按钮。
- `dashboard.requestBriefRefresh` 不再绕过 debounce。
- `enqueueDashboardBriefRefresh` 的 debounce key 改为 firm + scope + user，reason 只作为
  message metadata，不再拆散 5 分钟合并窗口。
- Manual refresh 增加每 firm / scope / date 最多 3 次的 KV 成本保护；debounced 请求视为已有
  refresh 在排队，不重复计数。
- 新增 `docs/ops/dashboard-brief-queue-runbook.md`，记录 queue / DLQ、`dashboard_brief`
  状态和 AI trace 排障边界；运行时代码不写裸 `console.log`。
- Cron scheduled brief 补齐周末策略：周末默认不生成；只有 Dashboard snapshot 存在
  `critical` risk 时才投递 scheduled refresh。
- 同步产品设计册、AI 架构、前端架构、系统架构和 DevOps 测试口径。

## 验证

- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/app exec tsgo --noEmit`
- `pnpm ready`

## 部署影响

- 无新增 secret。
- 无新增 Cloudflare binding。
- 继续依赖已创建的 `DASHBOARD_QUEUE` 和 dashboard DLQ。
