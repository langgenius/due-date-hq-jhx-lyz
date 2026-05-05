---
title: '2026-05-05 · Practice rule governance'
date: 2026-05-05
author: 'Codex'
---

# Practice rule governance

## 做了什么

- Rules runtime 改为“全局模板 + practice active rule”：`packages/core/src/rules` 继续保留 seed、preview 和 due date expansion，生产 request path 只读取当前 practice 的 active rules。
- 新增 `rule_source_template`、`rule_template`、`practice_rule`、`practice_rule_review_task` schema / repo / migration，并保留旧 `rule_review_decision` 作为迁移兼容路径。
- Rules API 入口会把当前内置 source/rule pack lazy seed 到全局 template 表；demo seed 也会把旧 verified decision 同步成 practice active rules，避免本地运行时仍依赖 legacy 表。
- 新增 `0034_repair_obligation_saved_view.sql`，用 `CREATE TABLE IF NOT EXISTS` 修复本地 D1 migration ledger 已记录 `0017` 但实际缺少 `obligation_saved_view` 的漂移，避免 saved views RPC 500。
- Rules API 增加 `listReviewTasks`、`acceptTemplate`、`bulkAcceptTemplates`、`rejectTemplate`、`createCustomRule`、`updatePracticeRule`、`archivePracticeRule`、`previewBulkRuleImpact` 等 practice-scoped mutation/query。
- Annual rollover、migration apply、obligation generation 的生产写入 gate 改为只消费 `practice_rule.status='active'`；pending templates 只能 preview/review。
- Migration apply / annual rollover 在读取 active rules 前会确保未审核或版本变更的模板进入当前 practice 的 review queue。
- Rules Console 增加 Review Queue，支持筛选、勾选、bulk preview、batch review note 和批量接受；单次批量上限 100，后端按 selected IDs + expected template versions 校验并返回 skipped conflicts。Bulk preview 显示 jurisdiction / form / entity / review reason 分布、source 数量和预估 obligation match。
- UI / docs 删除平台审核员、全局核验、候选发布预览等生产口径，改成 owner/manager practice review。

## 关键边界

- Owner/manager 可以 accept/reject/bulk accept/create/edit/archive rules；preparer/coordinator 只能读取和预览。
- 批量确认不允许修改 due date logic、applicability、extension policy；需要改字段的规则必须进入单条 review drawer。
- Source snapshot / Pulse signal 不直接改 active rule，只创建 practice-specific review task。
- 接受 rule 不自动生成 obligations；真正写入仍由 explicit generation/import/rollover 流程触发。

## 验证

- `pnpm exec vp check --fix packages/ports/src/rules.ts packages/db/src/repo/rules.ts packages/db/src/schema/rules.ts apps/server/src/procedures/rules/index.ts apps/server/src/routes/e2e.ts mock/demo.sql packages/db/migrations/0033_practice_rule_governance.sql apps/app/src/features/rules/review-queue-tab.tsx apps/app/src/features/rules/rules-console.tsx`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/core test -- src/rules/index.test.ts`
- `pnpm --filter @duedatehq/app test -- src/features/rules src/features/clients/client-readiness.test.ts`
- `pnpm --filter @duedatehq/db test -- src/repo/pulse.test.ts`
- `pnpm --filter @duedatehq/db test -- src/repo/migration.test.ts src/repo/obligation-queue.test.ts`
- `pnpm --filter @duedatehq/db test -- src/repo/obligation-queue.test.ts`
- `pnpm --filter @duedatehq/server test -- src/procedures/migration/_service.test.ts src/procedures/obligations/_annual-rollover.test.ts`
- `pnpm --filter @duedatehq/server test -- src/jobs/pulse/rule-source-adapters.test.ts src/procedures/obligations/_service.test.ts src/procedures/_penalty-exposure.test.ts`
- `pnpm --filter @duedatehq/server test -- src/procedures/obligations/_service.test.ts src/procedures/migration/_service.test.ts src/procedures/obligations/_annual-rollover.test.ts`
- `pnpm test`
- `pnpm check` 目前只被未关联的 `docs/pitch-deck/index.html` 格式问题阻塞。
