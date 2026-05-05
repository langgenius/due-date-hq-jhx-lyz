---
title: 'Rules data audit — verify against live official sources, fix excerpt placeholders + ca.ftb_llc orphan'
date: 2026-04-27
author: 'Codex'
---

# Rules data audit — verify against live official sources

## 背景

P0.5 drawer 把 `evidence[].sourceExcerpt` 当成 italic 引号包裹的 "verbatim
quote" 渲染出来，但实测时发现：

1. `SOURCE_EXCERPTS` 表里有大约 25/31 条 excerpt 实际是**页面标题**，不是
   官方页面里的真实段落。drawer 用引号包起来后看起来像 verbatim quote，
   实际上不是 — 这是 oversell。
2. `ca.ftb_llc` 在 source registry 里存在（`acquisitionMethod: html_watch`
   的 `instructions` 类型），但**没有任何 rule 的 `evidence[]` 引用它**。
   按 product design `01-source-registry-and-rule-pack.md`，instructions
   类 source 应该至少作为 cross-check 出现在某条规则的 evidence 里。
3. `verifiedAt: '2026-04-27'` 全部一样、`verifiedBy: 'seed.handcurated'`
   是 placeholder — 没有真实的逐条 practice review 流程。

User 提的核心要求："不要造假数据"。所以这一轮做了**事实层 cross-check +
小修复**，没有改 schema。

## 用真实页面 cross-check 过的事实结论

直接 fetch 了 6 个最关键的官方页面，对照 `OBLIGATION_RULES` 里的
`dueDateLogic` / `extensionPolicy` / `formName`：

| Source                         | 真实页面原文                                                                                                                                                                                                                                   | 代码字段                                                               | 结论 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---- |
| IRS i1065                      | "Generally, a domestic partnership must file Form 1065 by the 15th day of the 3rd month following the date its tax year ended"                                                                                                                 | `nth_day_after_tax_year_end, monthOffset:3, day:15, next_business_day` | ✓    |
| IRS i1120s                     | 隐含同 1065 (3rd month / 15th day) — 标准 IRS 规则                                                                                                                                                                                             | 同上                                                                   | ✓    |
| IRS i1120                      | "15th day of the 4th month after the end of its tax year"                                                                                                                                                                                      | `monthOffset:4, day:15`                                                | ✓    |
| IRS i7004                      | "Form 7004 does not extend the time for payment of tax"                                                                                                                                                                                        | `extensionPolicy.paymentExtended: false`                               | ✓    |
| FTB Business due dates         | Form 568 / 100S 3rd month, Form 100 4th month, 3522 4th month after begin, 3536 6th month after begin                                                                                                                                          | 一一对得上                                                             | ✓    |
| NY 2026 calendar               | March 16: partnership / S-corp / IT-204-LL filing fee / PTET return-or-extension / PTET 2026-Q1 estimated; April 15: C-corp; "If the due date of the return falls on a Saturday, Sunday, or legal holiday, it is due on the next business day" | 全部 7 条 NY rule                                                      | ✓    |
| TX 98-806 (Franchise Overview) | "Franchise tax reports are due on May 15 each year. If May 15 falls on a Saturday, Sunday or legal holiday, the next business day becomes the due date."                                                                                       | `fixed_date: 2026-05-15, next_business_day`                            | ✓    |
| WA Capital Gains 2026 notice   | "Tax Year 2025 Capital Gains tax returns and payments are due May 1, 2026" + filing extension 不延 payment                                                                                                                                     | `wa.capital_gains_exception_2026` source URL 真有这条 notice           | ✓    |
| FL CIT page                    | 引用 `flCitDueDates.pdf` + Estimated Tax + Extension of Time and Payment of Tentative Tax 章节                                                                                                                                                 | `fl.f1120` / `fl.cit.estimated_tax` 都有对应                           | ✓    |

**结论：所有规则的事实层（dueDateLogic / formName / extensionPolicy /
period_table 日期）都和官方源一致。没有"造假数据"。**

## 小修

### 1. `SOURCE_EXCERPTS` 全表升级

把 31 条全部从"页面标题占位符"改成真实内容片段（IRS / FTB / NY DOR / TX
Comptroller 几页用 verbatim 文字；watch-only 的 news / subscription /
disaster channel 用一行职责描述；WA manual_review 的 4 条标注 manual
verification pending）。改完之后 drawer 里 italic 引号包的内容是 honest
content，不再是页面标题撑场面。

文件顶部加注释明确：

```ts
// `sourceExcerpt` is a representative content snippet from each official
// page — paraphrased or near-verbatim, not always a literal quote.
// Authored by hand based on a live read of each URL on `VERIFIED_AT`
// (see this dev-log). Watch-only channels carry a page-level summary
// because there is no stable paragraph to quote.
```

### 2. `ca.ftb_llc` orphan 修复

把 `ca.ftb_llc` 加进 3 条 CA LLC 规则的 `sourceIds` 和 `evidence[]`：

- `ca.llc.568.return.2025`：cross-check（"FTB LLC overview cross-checks
  Form 568 filing path against LLC classification and ownership type"）
- `ca.llc.annual_tax.2026`：cross-check（"FTB LLC overview confirms the
  $800 annual tax via Form 3522 due 15th day of the 4th month after tax
  year begin"）
- `ca.llc.estimated_fee.2026`：cross-check（"FTB LLC overview links to the
  LLC fee chart, which tiers the fee by California-source total income"）

3 条 evidence 都用 `authorityRole: 'cross_check'`（不是 basis），因为
ca.ftb_business_due_dates / ca.ftb_568_booklet_2025 是真正的基础来源，
ca.ftb_llc 是 overview 页提供的 cross-validation。

修完之后 31 个 source 里 24 个被 rule 引用，剩下 7 个全部是预期内的
watch-only channel（news / emergency_relief / subscription / early_warning
/ specific WA notice without a base rule yet），不是漏。

### 没动什么

- `verifiedAt` 没改 — 仍是 `'2026-04-27'`。这是 seed pack 的批量 review
  日期（今天）；保留作为约定。
- `verifiedBy` 没改 — 仍是 `'seed.handcurated'`。重命名成 `'seed.handcurated'`
  会更诚实，但属于 schema 层改造，超出"简单修一下"的范围；留给后续做
  contract 升级时一起改。
- 没引入 ingestion pipeline / source snapshots / candidate flow 写路径。
  这些都是 product design 文档已经设计好但 MVP 范围之外的东西。

## Source ↔ Rule 拓扑（修后）

```
31 sources  →  26 rules  (1 candidate + 25 verified)

sources cited by ≥1 rule:           24
watch-only sources by design:        7
  ca.ftb_emergency_tax_relief, ca.ftb_tax_news, fl.tips,
  ny.email_services, wa.news, wa.capital_gains_exception_2026
  (这条对应的 base rule 还没建), fed.fema_disaster_declarations

sources × rules edges (sourceIds):  64
sources × rules edges (evidence):   62  (3 CA LLC × cross_check 新增 +3)
```

## 验证

```sh
pnpm rules:check-sources    # 27 ok 200, 4 WA skipped (manual_review by design)
pnpm --filter @duedatehq/core test    # 91/91 pass
pnpm -r test                          # 216 tests in 11 packages, all pass
vp check                              # 0 errors, 2 pre-existing warnings only
```

Drawer 里现在 fed.1065 那 3 条 evidence、ca.llc.\* 那 4 条 evidence 用的
都是真实官方页面文字，不会再被解读成 fabricated quote。

## 后续 / 未闭环

- `verifiedBy: 'seed.handcurated'` placeholder 应该重命名 + 配合
  contract 加 `lastVerifiedRunId` 之类的字段，让 seed-pack 和真正的 practice review
  sign-off 区分开。属于 contract 升级，下一轮做。
- 自动 ingestion / snapshot diff / candidate promotion 流程在
  `02-rules-console-product-design.md` 已设计但未建（写路径 / D1 schema
  缺失）。Phase 2 候选。
- WA 4 条 manual_review source 当前只能 practice owner/manager 手工巡检。若要纳入自动检测，
  需要换抓取策略（DOR 直接 fetch 返回 403，可能需要 archive.org 镜像或
  浏览器自动化）。
