---
title: '2026-05-04 · Pulse 51-jurisdiction source watch'
date: 2026-05-04
author: 'Codex'
---

# Pulse 51-jurisdiction source watch

## 背景

Rules 已经扩到 `FED + 50 states + DC`，但 Pulse 的 customer-facing extract 队列不能只靠
显式 live adapters（IRS、CA、NY、TX、FL、WA、MA、FEMA）表达覆盖范围。Pulse 必须把
Rules registry 里的州级官方 source 接进 source-state / snapshot / extract 路径，并且
promoted source 不能是 tax agency 首页、generic individuals page 或新闻收纳页。

## 做了什么

- 将多个州的 `*.income_tax` source 从宽泛入口替换为更具体的官方页面：例如 AL filing FAQ、
  AK Tax Facts、AZ individual income tax highlights、AR deadlines/extensions、GA individual
  return filing、MD iFile help、MS individual income tax FAQ、ND individual income tax
  deadlines、OK income-tax help center、OR PIT、UT due-date event、WI individual income tax。
- 给只证明“有/没有个人所得税申报义务”的 source 标记 `candidateDomainSlugs`，避免把单一
  return source 误用到 estimated-tax candidate。
- Pulse rule-source promotion 现在只允许 `publication`、`instructions`、`due_dates`、
  `calendar`、`emergency_relief`、`form` 这类 basis source 进入 extract queue；`news`、
  `subscription`、`early_warning` 仍由显式 adapter 或 signal 路径处理。
- 新增回归测试：`ruleSourceAdapters` 必须为扩展州覆盖生成 promoted adapters，且 promoted
  adapter 必须回链到 Rules registry 的具体 basis source。

## 验证

- `pnpm --filter @duedatehq/core test -- src/rules/index.test.ts`
- `pnpm --filter @duedatehq/server test -- rule-source-adapters`
- `pnpm exec vp check packages/core/src/rules/index.ts packages/core/src/rules/index.test.ts apps/server/src/jobs/pulse/rule-source-adapters.ts apps/server/src/jobs/pulse/rule-source-adapters.test.ts`
- `pnpm --filter @duedatehq/core test`
- `pnpm --filter @duedatehq/server test -- pulse`
- `pnpm rules:check-sources`
