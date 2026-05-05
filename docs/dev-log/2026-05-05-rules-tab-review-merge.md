---
title: '2026-05-05 · Rules tab review merge'
date: 2026-05-05
author: 'Codex'
---

# Rules tab review merge

## 背景

Review Queue 和 Rule Library 都在回答同一个核心问题：当前 practice 要接受哪些
pending template，让它们变成 active practice rules，从而允许 client obligation
generation 消费。独立 tab 会让用户误以为有两套审核流程。

## 做了什么

- 移除独立 Review Queue tab；`Rules` tab 承担原 Rule Library + Review Queue。
- `Rules` 默认进入 `Needs review` smart view，并保留 Active / All / Rejected /
  Archived / Applicability review / Exception 视图。
- 在同一张 rules table 中给 pending/open-task 行增加 checkbox；选择后主表保持全宽，只显示
  轻量 selection bar，且只保留 `Review selected` 作为进入批量审核 drawer 的入口。
- 将原 `BULK CONFIRM` 常驻右侧面板收敛为 Bulk Review drawer，drawer 内承载 selected
  rules、bulk preview、batch review note 和 Accept selected。
- 当 practice 已有 active v1 但 template 升级为 v2 且存在 open `source_changed`
  task 时，`rules.listRules(includeCandidates: true)` 现在同时返回 active v1 台账行和
  pending v2 `Update available` 行，避免新版只存在于 review task 数据中。
- `source_changed` / `Update available` 行禁止 bulk accept：前端禁用 checkbox，后端
  `previewBulkRuleImpact` / `bulkAcceptTemplates` 返回
  `source_changed_requires_review` skipped reason，强制进入单条 Rule Detail drawer。
- 单条 Rule Detail review 默认路径从复杂编辑表单收敛为只读审阅 + Accept/Reject：
  `Accept rule` 现在调用 `acceptTemplate`，和 bulk accept 一样按当前 template 原样激活。
- Rule table 用 `ruleId:version:status` 做行身份，避免同一 rule 的 active v1 与 pending
  v2 在详情抽屉或 checkbox 选择上互相覆盖。
- Active/rejected/archived 行继续作为规则台账，只能查看详情、证据和 review metadata；
  不参与批量接受。
- 同步 product design 文档，把 Review Queue 改为 Rules 表内的 smart view。

## 验证

- `pnpm --filter @duedatehq/app test -- rules-console-model`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
