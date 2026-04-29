---
title: 'Dashboard AI Brief Architecture'
date: 2026-04-29
author: 'Codex'
---

# Dashboard AI Brief Architecture

## 背景

Dashboard 已经从 fake arrays 收敛为 server-side deterministic aggregation，但 AI Weekly Brief
仍没有稳定产品 / 后端口径。实时在 `dashboard.load` 中调用模型会让首屏受 provider latency、
budget、失败率和 guard rejection 影响，也会破坏当前 “30 秒看清风险” 的产品 SLA。

Cloudflare Queues / Cron / D1 / AI trace 表都已在项目中存在或有绑定位置，但 `queue.ts` 和
`cron.ts` 仍是 dispatcher TODO。需要先把 Dashboard AI Brief 的产品行为、后台任务流、
数据模型和 Cloudflare 配置边界写清楚，再进入实现。

## 做了什么

### 设计阶段

- 新增 `docs/product-design/dashboard-ai-brief/README.md`：
  - 固定 “后台物化，Dashboard 首屏不等 AI” 的产品裁定。
  - 定义 `ready` / `stale` / `pending` / `failed` 四种用户状态。
  - 定义 scheduled、data mutation、manual refresh 三类触发。
  - 定义 `dashboard_brief` read-model 表、Queue message contract、consumer 流程。
  - 明确不新增 secret；最终采用 `DASHBOARD_QUEUE` binding。
- 更新稳定架构文档：
  - `docs/dev-file/02-System-Architecture.md`：Dashboard module 输出改为物化 AI Brief 上下文；性能约束改为 Brief 后台 Queue 生成。
  - `docs/dev-file/03-Data-Model.md`：新增 `dashboard_brief` 字段与索引。
  - `docs/dev-file/04-AI-Architecture.md`：Weekly Brief 改为 Queue-generated materialized output；`dashboard.load` 禁止调 AI。
  - `docs/dev-file/05-Frontend-Architecture.md`：Dashboard Brief 前端状态和 refresh 行为约束。
  - `docs/dev-file/08-Project-Structure.md`：预留 `jobs/dashboard-brief/` 代码归属。

### 实现阶段

- 新增 `dashboard_brief` schema / Drizzle migration / repo 方法，Dashboard read model 与
  `ai_output` trace 分离。
- 扩展 `dashboard.load` contract，返回 latest materialized brief；新增
  `dashboard.requestBriefRefresh` mutation，只投递 queue，不在 request path 调 AI。
- 新增 `apps/server/src/jobs/dashboard-brief/`：
  - `message.ts` 定义 `dashboard.brief.refresh` contract 与 idempotency key。
  - `enqueue.ts` 使用 KV debounce 合并 mutation-triggered refresh。
  - `consumer.ts` 读取 deterministic Dashboard snapshot，计算 input hash，调用 `brief@v1`，
    写入 `ai_output(kind='brief')` 与 `dashboard_brief` ready / failed 状态。
- 接入 cron scheduled refresh、本地数据变化触发和 `DASHBOARD_QUEUE` dispatcher。
- Dashboard UI 增加 AI Brief panel，支持 ready / stale / pending / failed / empty 状态和手动刷新。
- 同步 Lingui catalog、稳定架构文档与产品设计册 v0.2。

## 为什么这样做

- Dashboard 的确定性风险列表必须先于 AI 可用；AI 是解释层，不是首屏数据依赖。
- Queue 比 `ctx.waitUntil()` 更适合需要可靠完成、可重试、可能调用 provider 的后台任务。
- 独立 Dashboard queue 可以把 Brief 的成本 / retry / provider 故障与 Pulse 24h SLA 隔离。
- `ai_output` / `llm_log` 继续做审计 trace，`dashboard_brief` 只做 Dashboard read-model 状态。

## 验证

- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/server exec tsgo --noEmit`
- `pnpm --filter @duedatehq/db exec tsgo --noEmit`
- `pnpm --filter @duedatehq/app exec tsgo --noEmit`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check:deps`
- `pnpm check`

## Cloudflare / CI

- 新增 Queue binding：`DASHBOARD_QUEUE`。
- 新增 Cloudflare queue 资源要求：
  - `due-date-hq-dashboard-staging`
  - `due-date-hq-dashboard-dlq-staging`
- 未新增 secret；继续复用现有 `AI_GATEWAY_*` 配置和 provider secret。
