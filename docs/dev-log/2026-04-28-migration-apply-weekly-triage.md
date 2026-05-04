---
title: 'Migration apply to weekly triage'
date: 2026-04-28
author: 'Codex'
---

# Migration apply to weekly triage

## 背景

Migration dialog 原来已经完成了 intake、mapping、normalization、Default Matrix 和 dry-run，
但 Step 4 仍停在 preview-only。产品风险在于：DDL 前如果不能把导入数据落库，用户看得到
AI / rules 底座，却无法进入 DueDateHQ 的核心 weekly triage 工作流。

本轮把 Import 定义成 activation path：导入不是单独工具，而是把旧系统 / spreadsheet 的
客户清单转成客户、deadline、evidence、audit，并送进 Obligations。

## 做了什么

- 新增产品沉淀：`docs/product-design/migration-copilot/12-import-to-weekly-triage.md`，
  明确导入入口、字段策略、apply 语义、信任边界和 DDL 非目标。
- 补齐 `migration.apply`：
  - 从 confirmed mapping + raw input 生成 client facts。
  - 用 Default Matrix 归一 tax types。
  - 用 verified rules 生成 concrete obligations。
  - 写入 `client`、`obligation_instance`、`evidence_link`、`audit_event`，并把 batch 标记为 applied。
- DB 层新增 `commitImport`，用 D1 ordered batch 承接一次 apply 的写入边界。
- Step 4 CTA 从不可导入的预览状态改成真实 `Import & Generate`，成功后回到 dashboard /
  obligations 数据源。
- 新增 `verified_rule` evidence source type，区分 AI mapping / normalization 和规则来源的 due date 证据。

## 为什么这样做

- Due date 不由 AI 直接生成。AI 仍只负责字段映射 / 归一化，deadline 由 Default Matrix + verified rules
  生成，符合当前 trust model。
- Default Matrix 只负责补 tax type，不负责税期计算；规则库仍是 obligation 的唯一来源。
- D1 写入走 ordered batch，避免客户端、deadline、证据、审计和 batch 状态分散提交。
- 空姓名行在 apply 阶段跳过，避免一条空行阻断整批有效客户；其它 deterministic validation
  仍在前置 dry-run 暴露。

## 验证

- `pnpm --filter @duedatehq/server test -- --run src/procedures/migration/_service.test.ts`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test`
- `pnpm check`
- `pnpm --filter @duedatehq/server test -- --run src/procedures/migration/_service.test.ts src/procedures/obligations/_service.test.ts`

## 后续 / 未闭环

- `migration.revert` / `singleUndo` 仍是 P1，当前只写入 `migrationBatchId` 和 24h revert window。
- 并发双击 apply 目前由前端 pending state + server status check 降低概率，还没有数据库级幂等键。
- XLSX 真实解析仍未做；当前 CSV / TSV 走文本读取，本轮关键闭环是让数据能够入库并进入 weekly triage。
