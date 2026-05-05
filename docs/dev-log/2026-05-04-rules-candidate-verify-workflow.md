---
title: '2026-05-04 · Rules practice review workflow'
date: 2026-05-04
author: 'Codex'
---

# Rules practice review workflow

## 做了什么

- 新增 `rule_review_decision` D1 表，用于保存早期 firm-scoped review 决策；后续生产模型迁移到 `practice_rule`。
- Rules RPC 新增早期 review decision 查询、接受、拒绝接口。
- Rules runtime 当时会把 firm review decision merge 回 `listRules`、`coverage`、`previewObligations`；Migration apply 也会读取 firm-scoped reviewed rules。
- Rules Console 的 rule detail drawer 增加 Practice review 面板，可基于官方 source excerpt、due-date logic、extension policy、coverage status 完成 accept/reject。
- Practice review 的 extension policy 编辑不再要求手写 JSON；`Duration months` 改为 1-24 月数字 stepper。延期表格/方式字段继续保留自由输入，因为当前 contract 没有稳定枚举，seed 里只有少数明确表格名。
- Extension policy 文案改为 rule-level 语义：`This rule allows an extension`，并明确说明它不会修改客户资料、不会提交延期申请、也不会自动更新 due date。Obligations 的 Extension tab 同步改为记录 internal decision 的文案，避免误解为已经向官方申请延期。
- `Official extension form` 改为 `Official extension form or method`，并做成自由输入优先的 autocomplete：默认按普通输入框使用，只有输入内容接近 `Form 7004`、`automatic extension`、`portal request`、`source-defined process` 等已知值时才显示建议；建议只辅助回填，不限制官方来源录入，已选建议可再次点击或用清空按钮取消。
- Practice review 在 `Reminder-ready -> specific date` 下的 due date 输入改用项目统一的 `IsoDatePicker`，与 Obligations obligation detail 的 Extension tab 日期选择器保持一致。
- 新增 server-side `ruleSourceAdapters`，把 rule source registry 里带 `practice_rule_review` 的官方 sources 接入 Pulse source-state/signal 机制；这会记录 source snapshot/diff signal，但不会自动生成客户 Pulse 或 reminder。

## 关键边界

- Rule acceptance 需要 Owner/Manager 角色。
- `coverageStatus='full'` 且不要求 applicability review 时，必须提供 concrete due-date logic；`source_defined_calendar` 不能接受成 reminder-ready active rule。
- 自动 source watch 只生成内部 source signals；active practice rule 必须由 owner/manager 审核后接受。

## 验证

- `pnpm check:fix`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec vp check apps/app/src/features/rules/rule-detail-drawer.tsx apps/app/src/routes/obligations.tsx apps/app/src/i18n/locales/en/messages.ts apps/app/src/i18n/locales/zh-CN/messages.ts`
