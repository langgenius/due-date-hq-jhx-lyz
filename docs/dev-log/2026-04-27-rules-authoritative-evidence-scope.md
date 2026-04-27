---
title: 'Rules authoritative evidence and MVP scope alignment'
date: 2026-04-27
author: 'Codex'
---

# Rules authoritative evidence and MVP scope alignment

## 背景

Rules 资产已经从早期 Demo Sprint seed 演进成当前 MVP 的核心信任资产，但仓库里还有三类漂移：

1. 当前实现实际覆盖 `FED + CA/NY/TX/FL/WA`，marketing 却写成 `CA/NY/TX/FL/IL`。
2. PRD、dev-file、migration-copilot 设计册里仍把 MA 写进 Phase 0 / MVP 当前覆盖。
3. `RuleEvidence` 只有 `sourceId + locator + summary`，不能类型化表达官方来源角色、来源定位、核验日期和来源摘录。

本轮裁定：当前产品和设计统一按 **Federal + 5 MVP states: CA, NY, TX, FL, WA** 表达。MA / IL 不属于当前 MVP coverage；IL 只保留在历史 50 州研究材料中，并加 scope note。

## 权威来源收集

新增和复核的权威来源只采用政府主站或官方 API：

| Source ID                                | Authority                                                                                                                                                                                             | 用途                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `fed.irs_pub_509_2026`                   | [IRS Publication 509](https://www.irs.gov/publications/p509)                                                                                                                                          | 联邦税务日历、周末/假日顺延原则                              |
| `fed.irs_i1065_2025`                     | [IRS Instructions for Form 1065](https://www.irs.gov/instructions/i1065)                                                                                                                              | Partnership Form 1065 form-specific due date                 |
| `fed.irs_i1120s_2025`                    | [IRS Instructions for Form 1120-S](https://www.irs.gov/instructions/i1120s)                                                                                                                           | S corporation Form 1120-S form-specific due date             |
| `fed.irs_i1120_2025`                     | [IRS Instructions for Form 1120](https://www.irs.gov/instructions/i1120)                                                                                                                              | C corporation return and estimated-tax evidence              |
| `fed.irs_i7004_2025`                     | [IRS Instructions for Form 7004](https://www.irs.gov/instructions/i7004)                                                                                                                              | Extension policy, especially filing-only extension treatment |
| `ca.ftb_llc` / `ca.ftb_568_booklet_2025` | [CA FTB LLC](https://www.ftb.ca.gov/file/business/types/limited-liability-company/index.html), [2025 Form 568 Booklet](https://www.ftb.ca.gov/forms/2025/2025-568-booklet.html)                       | CA LLC filing/payment rules and applicability review         |
| `tx.franchise_home`                      | [Texas Comptroller Franchise Tax](https://comptroller.texas.gov/taxes/franchise/index.php/taxes/franchise/questionnaire.php)                                                                          | Texas report-year due date evidence                          |
| `fl.cit` / `fl.cit_due_dates_2026`       | [Florida DOR Corporate Income Tax](https://floridarevenue.com/taxes/taxesfees/Pages/corporate.aspx), [Florida due-date PDF](https://floridarevenue.com/taxes/Documents/flCitDueDates.pdf)             | Florida F-1120 and estimated-tax due-date table              |
| `wa.excise_due_dates_2026` / `wa.bo`     | [WA 2026 Excise Tax Due Dates](https://dor.wa.gov/file-pay-taxes/filing-frequencies-due-dates/2026-excise-tax-return-due-dates), [WA B&O Tax](https://dor.wa.gov/taxes-rates/business-occupation-tax) | WA combined excise and B&O context                           |

Federal 的关键改动是从 “Pub 509 + Form 7004” 扩到 form-specific instructions。这样 `1065`、`1120-S`、`1120` 不再只靠综合 calendar 解释，而是每条规则都能指向对应 IRS instructions。

## 做了什么

### 类型安全

`packages/contracts/src/rules.ts` 增加：

- `RuleEvidenceAuthorityRoleSchema`: `basis | cross_check | watch | early_warning`
- `RuleEvidenceLocatorSchema`: `html | pdf | table | api | email_subscription`，并支持 `heading`、`selector`、`pdfPage`、`tableLabel`、`rowLabel`
- `RuleEvidenceSchema.sourceExcerpt`
- `retrievedAt` 与可选 `sourceUpdatedOn`

`packages/core/src/rules/index.ts` 同步成强类型接口，并把所有 evidence 通过统一 `sourceEvidence()` helper 生成。helper 会按 source 的 acquisition method / source type 推断 locator kind，并把 FEMA early-warning 自动标成 `early_warning`。

### Source registry

`RULE_SOURCES` 从 28 个扩到 31 个。新增：

- `fed.irs_i1065_2025`
- `fed.irs_i1120s_2025`
- `fed.irs_i1120_2025`

当前 registry 计数：

| Jurisdiction | Sources |
| ------------ | ------: |
| FED          |       7 |
| CA           |       5 |
| NY           |       6 |
| TX           |       6 |
| FL           |       3 |
| WA           |       4 |

合计 31 个 source。WA DOR 仍是 `manual_review + degraded`，因为当前直接机器抓取不稳定；这比伪装成 healthy watcher 更诚实。

### Rule evidence

Federal verified rules 补充 form-specific evidence：

- `fed.1065.return.2025` 增加 `fed.irs_i1065_2025`
- `fed.1120s.return.2025` 增加 `fed.irs_i1120s_2025`
- `fed.1120.return.2025` 增加 `fed.irs_i1120_2025`
- `fed.1120.estimated_tax.2026` 增加 `fed.irs_i1120_2025`

测试新增约束：

- 每条 evidence 的 `sourceId` 必须存在于 registry。
- 每条 evidence 的 `sourceId` 必须属于对应 rule 的 `sourceIds`。
- 每条 evidence 必须有 `authorityRole`、`locator.kind`、`summary`、`sourceExcerpt`、`retrievedAt`。
- 每条 verified rule 至少有一条 `authorityRole='basis'` evidence。

### 产品范围和文档对齐

已统一为：

```text
Federal + 5 MVP states: CA / NY / TX / FL / WA
```

已修正：

- Marketing status pill: `CA · NY · TX · FL · IL` -> `CA · NY · TX · FL · WA`
- Rules Console source count: 28 -> 31
- Rules product design册：source count、evidence 字段、change log
- PRD v2：P0 Rule Engine / MVP coverage / Default Matrix 描述
- dev-file：Overview、Data Model、Project Structure、AI、Testing、Pulse catalog、Marketing architecture
- Migration Copilot 设计册：明确 Default Matrix v1.0 是历史 Demo 子集；当前 Rules MVP 已覆盖 TX/FL/WA，但 matrix 自动推断仍需后续扩展
- 50 州税种研究材料 `docs/report/tax.md` 顶部增加 scope note，说明 IL/MA 是后续扩州研究，不是当前 MVP coverage

### 文案术语

当前 rules evidence 和产品文案统一用 `source excerpt`。原因：

- 官方来源可能来自 HTML 段落、PDF、table row、API 字段或 email subscription。
- 对 table/API 来说，强行命名为 “verbatim quote” 会误导设计和实现。
- `sourceExcerpt + locator` 可以表达 “摘录来自哪里”，同时保留核验和回链能力。

底层旧 `EvidenceLink` / D1 schema 仍保留 `verbatim_quote` 字段名，这是历史审计表字段，未在本轮做数据库迁移。

## 为什么这样做

采用静态 typed rule pack（方案 A）是当前阶段的最佳实践：

- MVP 更需要可信、可复核、可测试的规则资产，而不是先引入 snapshot database / crawler pipeline 的运维复杂度。
- 官方来源可以随代码版本一起 review，contract 和 core 测试能防止 evidence 字段回退成自由文本。
- 未来要做 source snapshots、candidate promotion、overlay publish 时，当前类型已经给出稳定 contract。

没有选择把 rules 放进 D1，是因为当前写路径、审核流、snapshot diff、版本发布都还没有完整产品闭环。提前数据库化会增加迁移和回滚复杂度，但不会提高规则可信度。

## 验证

已运行：

```sh
pnpm --filter @duedatehq/app i18n:extract
pnpm --filter @duedatehq/app i18n:compile
pnpm --filter @duedatehq/core test
pnpm --filter @duedatehq/contracts test
pnpm --filter @duedatehq/app test
pnpm rules:check-sources
pnpm check
```

结果：

- `@duedatehq/core`: 8 files, 91 tests passed
- `@duedatehq/contracts`: 1 file, 8 tests passed
- `@duedatehq/app`: 7 files, 45 tests passed
- Lingui strict compile passed with 0 missing translations
- `pnpm rules:check-sources` passed for machine-watch sources; WA manual-review sources are intentionally skipped
- `pnpm check` exits 0; it still reports two pre-existing warnings in:
  - `apps/server/src/env.test.ts`
  - `packages/ui/src/lib/placement.ts`

## 后续 / 未闭环

- Default Matrix v1.0 仍只覆盖 Federal + CA + NY demo cells。TX / FL / WA 已在 Rules MVP coverage 中，但 matrix 自动推断还需要 v1.1 扩展并逐格 ops sign-off。
- Rules Console 目前仍是只读壳。下一步如果做 detail drawer，应展示 `authorityRole`、`locator`、`sourceExcerpt`、`retrievedAt`、`sourceUpdatedOn`，不要只展示 source URL。
- `EvidenceLink.verbatim_quote` 是旧审计存储字段。是否迁移为 `source_excerpt` 需要单独 ADR / migration，不应和本轮 rules typed asset 混在一起。
