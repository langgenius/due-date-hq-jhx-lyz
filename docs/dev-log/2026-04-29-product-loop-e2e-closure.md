---
title: 'Product loop e2e closure'
date: 2026-04-29
author: 'Codex'
---

# Product loop e2e closure

## 背景

最近两天的增量已经从单页面 demo 推进到多条可闭环产品路径：

- Migration、Obligations、Clients、Rules、Billing 已经有基础浏览器覆盖；
- Pulse 和 Dashboard 增量很大，但本轮明确不把它们作为补测目标；
- Team Workload 刚成为 Pro/Firm 付费面，Audit Log 和 Members 也已经具备真实 oRPC 写入与
  audit trail，但缺少围绕产品本身的 e2e 闭环。

## 做了什么

- 新增 `e2e/tests/workload.spec.ts`，覆盖 Solo 锁定升级、Pro workload 指标、unassigned 风险行、
  以及 Workload 到 Obligations 的 owner/due deep link。
- 新增 `e2e/tests/audit-log.spec.ts`，从 Obligations 状态变更写入开始，回到 Audit Log 打开详情
  drawer，验证 before/after 状态。
- 新增 `e2e/tests/members.spec.ts`，用 Firm 计划 seed 覆盖成员邀请、取消 pending invitation，并
  验证对应 member audit action 可检索。
- 抽出 `e2e/fixtures/billing.ts`，复用 development-only billing subscription seed，避免每个 spec
  重复解析 helper。
- 扩展 `obligations` e2e seed，增加一条 unassigned open obligation，让 Team Workload 的风险行有真实
  数据来源。

## 为什么这样做

选择顺序按“产品价值面 + 已有真实数据边界 + 测试稳定性”排序。Team Workload 是最新付费价值面，必须先
锁住 Solo/Firm 差异和 Obligations 执行闭环；Audit Log 是合规信任面，适合用 Obligations 的真实写事件做
端到端验证；Members 是团队协作入口，邀请/取消不需要额外外部服务，在 development email fallback 下
可以稳定跑。

本轮没有补 Onboarding 或更大的 Migration fixture 矩阵，因为它们需要新增 no-firm session seed 或更重的
CSV 场景，适合单独做下一批，避免把默认 e2e 套件拉慢。

## 验证

- `pnpm exec playwright test e2e/tests/workload.spec.ts e2e/tests/audit-log.spec.ts e2e/tests/members.spec.ts --reporter=list`

## 2026-04-29 Clients follow-up

- 已在 `e2e/tests/clients.spec.ts` 补齐 Clients facts seeded readiness、entity/state/search URL
  筛选、过滤空态，以及从客户列表打开 Fact Profile Sheet 的浏览器闭环。
- 验证命令：`pnpm exec playwright test e2e/tests/clients.spec.ts --reporter=list`。
- 回归命令：`pnpm test:e2e --reporter=list`、`pnpm check`、`pnpm test`、`pnpm build`。

## 后续

- 为 first-login onboarding 增加 `noFirm` e2e session seed。
- 为 Clients import convergence 增补从 `/clients` 入口进入 Migration、导入后回到 Clients/Obligations
  的跨域闭环。
- 再评估是否把 Members 的 role update、suspend/reactivate 扩展到专门的 `team` seed。
