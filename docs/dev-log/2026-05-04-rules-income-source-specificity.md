---
title: '2026-05-04 · Rules income source specificity'
date: 2026-05-04
author: 'Codex'
---

# Rules income source specificity

## 背景

50-state candidate rule pack 初版把每州 tax candidate 统一连到 `*.tax_agency`
source。这样虽然是官方站点，但很多 URL 是 agency homepage 或 default page，不能作为
具体 rule review 的好入口。用户指出 `wv.individual_income_return.candidate.2026`
打开的是 `https://tax.wv.gov/`，应进入 West Virginia Tax Division 的 Individuals
页面。

## 做了什么

- 参考 `langgenius/due-date-hq` 的 `packages/deadlines/src/rules/states/registry.ts`
  source registry，移植 46 个州/DC 的 income-tax 具体官方页面。
- 新增 `*.income_tax` source，保留原有 `*.tax_agency` 和 `*.employer_ui_agency`。
- 将 individual income、individual estimated tax、fiduciary、business income /
  franchise、PTE/composite/PTET candidate 切到 `*.income_tax`；sales/use、
  withholding 暂时继续使用 broader tax agency source；UI wage report 继续使用
  workforce/UI source。
- 加回归测试锁住 WV candidate rule：
  `wv.individual_income_return.candidate.2026 -> wv.income_tax ->
https://tax.wv.gov/Individuals/Pages/Individuals.aspx`。

## 验证

- `pnpm --filter @duedatehq/core test -- --run src/rules/index.test.ts`

## 后续

Sales/use、withholding 和 UI wage report 还只是 source-backed candidate，不应发布为
verified rule。后续逐州审核这些 domain 时，应像 income-tax 一样拆成 domain-specific
official sources，而不是复用 agency homepage。
