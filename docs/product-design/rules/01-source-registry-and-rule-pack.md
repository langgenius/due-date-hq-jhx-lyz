# 01 · Source Registry 与 MVP Rule Pack

> 版本：v0.1（14 天 MVP · 2026-04-27）
> 上游：`README.md` §2 / §4、`docs/report/DueDateHQ-MVP-Deadline-Rules-Plan.md` §3-§10
> 目标：定义 rules 如何从官方来源采集、进入候选、人工核验、发布为结构化数据，并被 obligation / reminder / AI brief 消费

## 1. 一句话设计

Rules 采集不是“爬网页自动改日期”，而是一个带审计的内容运营工作流：

```text
Official source
  -> source snapshot
  -> parser / AI candidate
  -> human verification
  -> verified obligation_rule
  -> obligation generation / reminder / AI Tip
```

MVP 的风险边界是：**AI 可以加速抽取，不能替代核验；candidate 可以提醒内部，不影响用户 deadline；verified rule 才能生成 obligation。**

## 2. Source Registry

`RuleSource` 是规则采集的入口清单。没有登记到 registry 的来源，不视为 MVP 覆盖范围。

### 2.1 Federal

| Source ID                    | 官方来源                                                                                                               | 类型         | 用途                                                                  | 采集方式                     | MVP 频率 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------- | ---------------------------- | -------- |
| `irs.pub509.2026`            | [IRS Publication 509 (2026)](https://www.irs.gov/publications/p509)                                                    | calendar     | 全国通用 due dates、周末/法定假日顺延原则、税务日历                   | HTML snapshot + PDF fallback | 每周     |
| `irs.i1065.2025`             | [IRS Instructions for Form 1065](https://www.irs.gov/instructions/i1065)                                               | instructions | Partnership Form 1065 filing due date                                 | HTML parse                   | 季度     |
| `irs.i1120s.2025`            | [IRS Instructions for Form 1120-S](https://www.irs.gov/instructions/i1120s)                                            | instructions | S-Corp return due date、estimated tax payment pattern                 | HTML parse                   | 季度     |
| `irs.i1120.2025`             | [IRS Instructions for Form 1120](https://www.irs.gov/instructions/i1120)                                               | instructions | C-Corp return due date、estimated tax payments                        | HTML parse                   | 季度     |
| `irs.i7004.2025`             | [IRS Instructions for Form 7004](https://www.irs.gov/instructions/i7004)                                               | instructions | Business extension policy；重点标记 extension does not extend payment | HTML parse                   | 季度     |
| `irs.disaster`               | [IRS Tax Relief in Disaster Situations](https://www.irs.gov/newsroom/tax-relief-in-disaster-situations)                | emergency    | disaster relief exception candidates                                  | HTML watch                   | 每日     |
| `fema.disaster_declarations` | [OpenFEMA Disaster Declarations Summaries](https://www.fema.gov/openfema-data-page/disaster-declarations-summaries-v2) | api          | early warning；只提示内部关注，不生成税务 deadline                    | API                          | 每日     |

### 2.2 California

| Source ID                   | 官方来源                                                                                            | 类型      | 用途                                                      | 采集方式   | MVP 频率 |
| --------------------------- | --------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------- | ---------- | -------- |
| `ca.ftb.business_due_dates` | [CA FTB Due dates: businesses](https://www.ftb.ca.gov/file/when-to-file/due-dates-business.html)    | due_dates | LLC、partnership、S-Corp、C-Corp return/payment/extension | HTML parse | 每周     |
| `ca.ftb.llc_webpay`         | [CA LLC Web Pay payment types](https://webapp.ftb.ca.gov/webpay/help/llc)                           | payment   | LLC annual tax、estimated fee、extension payment          | HTML parse | 每周     |
| `ca.ftb.efile_calendar`     | [CA FTB e-file calendars](https://www.ftb.ca.gov/tax-pros/efile/e-file-calendars.html)              | calendar  | calendar-year filing and extension dates                  | HTML parse | 每周     |
| `ca.ftb.emergency_relief`   | [CA Emergency tax postponement](https://www.ftb.ca.gov/file/when-to-file/Emergency-tax-relief.html) | emergency | California disaster/emergency exception candidates        | HTML watch | 每日     |
| `ca.ftb.tax_news`           | [CA FTB Tax News](https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/index.html)                    | news      | rule-change discovery for tax pros                        | HTML watch | 每周     |

### 2.3 New York

| Source ID              | 官方来源                                                                                                 | 类型         | 用途                                                        | 采集方式                                 | MVP 频率 |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------- | ---------------------------------------- | -------- |
| `ny.tax_calendar.2026` | [NY 2026 tax filing dates](https://www.tax.ny.gov/help/calendar/2026.htm)                                | calendar     | corporation tax、partnership、PTET、estimated payment dates | HTML table parse                         | 每周     |
| `ny.ptet`              | [NY Pass-through entity tax](https://www.tax.ny.gov/bus/ptet/)                                           | instructions | PTET election/payment/return/extension                      | HTML parse                               | 每周     |
| `ny.it204ll`           | [NY Partnership, LLC, and LLP annual filing fee](https://www.tax.ny.gov/pit/efile/annual_filing_fee.htm) | instructions | IT-204-LL filing fee and no-extension rule                  | HTML parse                               | 季度     |
| `ny.partnerships`      | [NY Partnerships](https://www.tax.ny.gov/pit/efile/partneridx.htm)                                       | instructions | IT-204 partnership return due dates                         | HTML parse                               | 季度     |
| `ny.email_services`    | [NY Email services](https://www.tax.ny.gov/help/subscribe.htm)                                           | subscription | urgent notifications and deadline extensions discovery      | manual subscription + inbox parser later | 每周确认 |

### 2.4 Texas

| Source ID                    | 官方来源                                                                                                            | 类型         | 用途                                                  | 采集方式   | MVP 频率 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------- | ---------- | -------- |
| `tx.franchise_home`          | [TX Franchise Tax](https://comptroller.texas.gov/taxes/franchise/index.php/taxes/franchise/questionnaire.php)       | due_dates    | annual franchise tax report due date                  | HTML watch | 每周     |
| `tx.franchise_overview`      | [TX Franchise Tax Overview](https://comptroller.texas.gov/taxes/publications/98-806.php)                            | publication  | due date, extension, late filing penalty context      | HTML parse | 季度     |
| `tx.franchise_annual_report` | [TX Annual Report Instructions](https://comptroller.texas.gov/help/franchise/information-report.php?category=taxes) | instructions | PIR/OIR requirements and annual due date              | HTML parse | 季度     |
| `tx.franchise_extensions`    | [TX Franchise Tax Extensions](https://comptroller.texas.gov/taxes/franchise/filing-extensions.php/1000)             | instructions | extension payment requirements and extended due dates | HTML parse | 季度     |
| `tx.franchise_forms_2026`    | [TX Franchise Tax Report Forms for 2026](https://comptroller.texas.gov/taxes/franchise/forms/2026-franchise.php)    | forms        | report-year changes, no-tax-due threshold behavior    | HTML watch | 每周     |

### 2.5 Florida

| Source ID              | 官方来源                                                                                                                               | 类型         | 用途                                                        | 采集方式                       | MVP 频率 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------- | ------------------------------ | -------- |
| `fl.cit_home`          | [FL Corporate Income Tax](https://floridarevenue.com/taxes/taxesfees/Pages/corporate.aspx?source=post_page---------------------------) | due_dates    | F-1120, F-1065, extension and payment rules                 | HTML parse                     | 每周     |
| `fl.cit_due_dates_pdf` | [FL Corporate Income Tax Due Dates PDF](https://floridarevenue.com/taxes/Documents/flCitDueDates.pdf)                                  | calendar     | tax-year-end specific due dates and estimated payment dates | PDF text parse + manual review | 每周     |
| `fl.f7004`             | [FL Form F-7004](https://floridarevenue.com/Forms_library/current/f7004.pdf)                                                           | form         | tentative tax / extension request evidence                  | PDF snapshot                   | 季度     |
| `fl.tips`              | [FL Tax Information Publications](https://floridarevenue.com/taxes/tips/Pages/default.aspx)                                            | news         | official updates, due-date changes                          | HTML watch                     | 每周     |
| `fl.subscribe`         | [FL Subscribe to Our Publications](https://floridarevenue.com/Pages/subscribe.aspx)                                                    | subscription | TIP email watch setup                                       | manual subscription            | 每周确认 |

### 2.6 Washington

| Source ID                         | 官方来源                                                                                                                                                 | 类型         | 用途                                              | 采集方式      | MVP 频率   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------- | ------------- | ---------- |
| `wa.excise_due_dates_2026`        | [WA 2026 Excise tax return due dates](https://dor.wa.gov/file-pay-taxes/filing-frequencies-due-dates/2026-excise-tax-return-due-dates)                   | calendar     | monthly/quarterly/annual excise and B&O due dates | HTML parse    | 每周       |
| `wa.filing_frequencies`           | [WA Filing frequencies & due dates](https://dor.wa.gov/file-pay-taxes/filing-frequencies-due-dates)                                                      | instructions | filing frequency model                            | HTML parse    | 季度       |
| `wa.bo_tax`                       | [WA Business & occupation tax](https://dor.wa.gov/taxes-rates/business-occupation-tax)                                                                   | instructions | B&O applicability and return context              | HTML parse    | 季度       |
| `wa.annual_business`              | [WA Annual business filers](https://www.dor.wa.gov/file-pay-taxes/filing-frequencies-due-dates/annual-business-filers)                                   | due_dates    | annual return date                                | HTML parse    | 每周       |
| `wa.news`                         | [WA DOR News releases](https://dor.wa.gov/about/news-releases)                                                                                           | news         | due-date change and relief discovery              | HTML watch    | 每周       |
| `wa.capital_gains_exception_2026` | [WA Capital Gains due date moved to May 1, 2026](https://dor.wa.gov/about/news-releases/2026/capital-gains-excise-tax-returns-due-date-moved-may-1-2026) | exception    | example exception overlay pattern                 | HTML snapshot | 一次性样例 |

## 3. MVP 初始 Rule Pack

### 3.1 Federal rules

| Rule ID                            | Tier             | Entity                                 | Tax type                     | Due date logic                                                                            | Source                                        |
| ---------------------------------- | ---------------- | -------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| `fed.1065.return.2025`             | `annual_rolling` | partnership / LLC taxed as partnership | `federal_1065`               | 15th day of 3rd month after tax year end; weekend/holiday next business day               | `irs.i1065.2025`                              |
| `fed.1120s.return.2025`            | `annual_rolling` | S-Corp                                 | `federal_1120s`              | 15th day of 3rd month after tax year end; weekend/holiday next business day               | `irs.i1120s.2025`                             |
| `fed.1120.return.2025`             | `annual_rolling` | C-Corp                                 | `federal_1120`               | 15th day of 4th month after tax year end; June 30 exception marked `applicability_review` | `irs.i1120.2025`                              |
| `fed.1120.estimated_tax.2026`      | `annual_rolling` | C-Corp                                 | `federal_1120_estimated_tax` | 15th day of 4th, 6th, 9th, 12th months of tax year                                        | `irs.i1120.2025`                              |
| `fed.7004.extension.business.2025` | `basic`          | partnership / S-Corp / C-Corp          | `federal_7004_extension`     | file by original return due date; extension applies to filing, not payment                | `irs.i7004.2025`                              |
| `fed.disaster_relief.candidate`    | `exception`      | all                                    | `federal_disaster_relief`    | no automatic rule; candidate captures covered areas, dates, affected forms                | `irs.disaster` + `fema.disaster_declarations` |

### 3.2 California rules

| Rule ID                          | Tier             | Entity      | Tax type                | Due date logic                                               | Source                                            |
| -------------------------------- | ---------------- | ----------- | ----------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| `ca.llc.568.return.2025`         | `annual_rolling` | LLC         | `ca_form_568`           | follows FTB business due-date table by LLC classification    | `ca.ftb.business_due_dates`                       |
| `ca.llc.annual_tax.2026`         | `basic`          | LLC         | `ca_llc_annual_tax_800` | 15th day of 4th month after beginning of taxable year        | `ca.ftb.business_due_dates` + `ca.ftb.llc_webpay` |
| `ca.llc.estimated_fee.2026`      | `basic`          | LLC         | `ca_llc_estimated_fee`  | 15th day of 6th month of current tax year                    | `ca.ftb.business_due_dates` + `ca.ftb.llc_webpay` |
| `ca.partnership.565.return.2025` | `annual_rolling` | Partnership | `ca_565_partnership`    | 15th day of 3rd month after close of tax year                | `ca.ftb.business_due_dates`                       |
| `ca.corp.100.return.2025`        | `annual_rolling` | C-Corp      | `ca_100_franchise`      | FTB corporation row; calendar-year concrete date from source | `ca.ftb.business_due_dates`                       |
| `ca.scorp.100s.return.2025`      | `annual_rolling` | S-Corp      | `ca_100s_franchise`     | FTB S-Corp row; calendar-year concrete date from source      | `ca.ftb.business_due_dates`                       |
| `ca.emergency_relief.candidate`  | `exception`      | all         | `ca_emergency_relief`   | candidate only until FTB/IRS relief is verified              | `ca.ftb.emergency_relief`                         |

### 3.3 New York rules

| Rule ID                           | Tier                   | Entity                           | Tax type                | Due date logic                                                                   | Source                                     |
| --------------------------------- | ---------------------- | -------------------------------- | ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
| `ny.it204.return.2025`            | `annual_rolling`       | Partnership                      | `ny_it204`              | calendar year: March 15 adjusted; fiscal year: 15th day of 3rd month after close | `ny.partnerships` + `ny.tax_calendar.2026` |
| `ny.it204ll.filing_fee.2025`      | `basic`                | LLC / LLP / Partnership          | `ny_it204ll_filing_fee` | 15th day of 3rd month after close; no extension                                  | `ny.it204ll`                               |
| `ny.ct3.return.2025`              | `annual_rolling`       | C-Corp                           | `ny_ct3`                | 15th day of 4th month after close; fiscal-year logic retained                    | `ny.tax_calendar.2026`                     |
| `ny.ct3s.return.2025`             | `annual_rolling`       | S-Corp                           | `ny_ct3s`               | 15th day of 3rd month after close                                                | `ny.tax_calendar.2026`                     |
| `ny.ptet.election.2026`           | `applicability_review` | Partnership / NY S-Corp          | `ny_ptet_election`      | must be confirmed by authorized person; tax professional cannot elect for client | `ny.ptet`                                  |
| `ny.ptet.estimated_payments.2026` | `applicability_review` | electing Partnership / NY S-Corp | `ny_ptet_estimated_tax` | March 15, June 15, September 15, December 15; adjusted for weekend/holiday       | `ny.ptet` + `ny.tax_calendar.2026`         |
| `ny.ptet.return_extension.2025`   | `applicability_review` | electing Partnership / NY S-Corp | `ny_ptet_return`        | annual return generally March 15; extension extends filing, not payment          | `ny.ptet`                                  |

### 3.4 Texas rules

| Rule ID                                  | Tier                   | Entity                                                        | Tax type                  | Due date logic                                                                                    | Source                                        |
| ---------------------------------------- | ---------------------- | ------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `tx.franchise.annual_report.2026`        | `annual_rolling`       | taxable entities                                              | `tx_franchise_report`     | annual report due May 15; weekend/holiday next business day                                       | `tx.franchise_home` + `tx.franchise_overview` |
| `tx.franchise.pir_oir.2026`              | `annual_rolling`       | corporations / LLCs / LPs / financial institutions and others | `tx_pir_oir`              | due on annual franchise report due date                                                           | `tx.franchise_annual_report`                  |
| `tx.franchise.extension.2026`            | `applicability_review` | taxable entities                                              | `tx_franchise_extension`  | request/payment due by original report due date; payment requirements depend on prior/current tax | `tx.franchise_extensions`                     |
| `tx.franchise.no_tax_due_threshold.2026` | `applicability_review` | entities under threshold                                      | `tx_no_tax_due_threshold` | not a filing conclusion; flag CPA to confirm revenue threshold and PIR/OIR requirement            | `tx.franchise_forms_2026`                     |

### 3.5 Florida rules

| Rule ID                            | Tier             | Entity      | Tax type                 | Due date logic                                                                                          | Source                                 |
| ---------------------------------- | ---------------- | ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `fl.f1120.return.2025`             | `annual_rolling` | C-Corp      | `fl_f1120`               | generally later of statutory state rule and federal-related due date; calendar-year date from DOR table | `fl.cit_home` + `fl.cit_due_dates_pdf` |
| `fl.f7004.extension.2025`          | `annual_rolling` | C-Corp      | `fl_f7004_extension`     | file extension with tentative payment by original Florida return due date                               | `fl.cit_home` + `fl.f7004`             |
| `fl.f1065.return.2025`             | `annual_rolling` | Partnership | `fl_f1065`               | 1st day of 4th month after close                                                                        | `fl.cit_home`                          |
| `fl.cit.estimated_tax.2026`        | `annual_rolling` | C-Corp      | `fl_cit_estimated_tax`   | tax-year-end table in DOR PDF                                                                           | `fl.cit_due_dates_pdf`                 |
| `fl.tip.deadline_change.candidate` | `exception`      | all         | `fl_tip_deadline_change` | candidate only; review TIPs before publishing                                                           | `fl.tips`                              |

### 3.6 Washington rules

| Rule ID                           | Tier                   | Entity                                  | Tax type                     | Due date logic                                                             | Source                                            |
| --------------------------------- | ---------------------- | --------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| `wa.excise.monthly.2026`          | `annual_rolling`       | businesses assigned monthly frequency   | `wa_excise_monthly`          | source table concrete due dates; weekend/holiday already adjusted by DOR   | `wa.excise_due_dates_2026`                        |
| `wa.excise.quarterly.2026`        | `annual_rolling`       | businesses assigned quarterly frequency | `wa_excise_quarterly`        | source table concrete due dates                                            | `wa.excise_due_dates_2026`                        |
| `wa.excise.annual.2026`           | `annual_rolling`       | annual filers                           | `wa_excise_annual`           | annual return due April 15, adjusted if weekend/holiday                    | `wa.excise_due_dates_2026` + `wa.annual_business` |
| `wa.bo.applicability`             | `applicability_review` | businesses with WA gross receipts       | `wa_bo_tax`                  | not a default deadline alone; used to explain why excise return may matter | `wa.bo_tax`                                       |
| `wa.capital_gains.exception.2026` | `exception`            | individual capital gains taxpayers      | `wa_capital_gains_exception` | example overlay: 2025 filing year moved to May 1, 2026                     | `wa.capital_gains_exception_2026`                 |

## 4. 结构化数据设计

### 4.1 RuleSource

```ts
type RuleSource = {
  id: string
  jurisdiction: 'federal' | 'CA' | 'NY' | 'TX' | 'FL' | 'WA'
  title: string
  url: string
  sourceType:
    | 'calendar'
    | 'instructions'
    | 'form'
    | 'publication'
    | 'news'
    | 'emergency'
    | 'api'
    | 'subscription'
  cadence: 'daily' | 'weekly' | 'quarterly'
  priority: 'critical' | 'high' | 'medium' | 'low'
  healthStatus: 'healthy' | 'degraded' | 'failing' | 'paused'
  lastCheckedAt: string | null
  lastChangedAt: string | null
  nextCheckAt: string | null
}
```

### 4.2 RuleCandidate

```ts
type RuleCandidate = {
  id: string
  sourceId: string
  jurisdiction: string
  rawSnapshotHash: string
  extractionMethod: 'parser' | 'ai' | 'manual'
  extractedPayload: unknown
  diffSummary: string | null
  status: 'pending_review' | 'rejected' | 'promoted'
  reviewerNote: string | null
  createdAt: string
}
```

### 4.3 ObligationRule

```ts
type ObligationRule = {
  id: string
  version: string
  jurisdiction: 'federal' | 'CA' | 'NY' | 'TX' | 'FL' | 'WA'
  taxYear: number | null
  entityApplicability: string[]
  taxType: string
  formName: string | null
  ruleTier: 'basic' | 'annual_rolling' | 'exception' | 'applicability_review'
  eventType: 'filing' | 'payment' | 'extension' | 'election' | 'information_report'
  dueDateLogic: DueDateLogic
  extensionPolicy: ExtensionPolicy | null
  sourceLinks: RuleSourceLink[]
  qualityChecklist: RuleQualityChecklist
  coverageStatus: 'verified' | 'skeleton' | 'manual_review'
  status: 'candidate' | 'verified' | 'deprecated'
  verifiedBy: string | null
  verifiedAt: string | null
  nextReviewAt: string | null
}
```

### 4.4 DueDateLogic

MVP 不允许任意代码执行，使用可审阅 JSON DSL：

```ts
type DueDateLogic =
  | {
      type: 'relative_to_tax_year_end'
      monthOffset: number
      dayOfMonth: number
      rollover: 'next_business_day' | 'source_adjusted'
    }
  | {
      type: 'relative_to_tax_year_start'
      monthOffset: number
      dayOfMonth: number
      rollover: 'next_business_day' | 'source_adjusted'
    }
  | {
      type: 'concrete_dates'
      dates: Array<{ period: string; dueDate: string }>
      rollover: 'source_adjusted'
    }
```

示例：

```json
{
  "type": "relative_to_tax_year_end",
  "monthOffset": 3,
  "dayOfMonth": 15,
  "rollover": "next_business_day"
}
```

### 4.5 RuleQualityChecklist

```ts
type RuleQualityChecklist = {
  filingVsPaymentDistinguished: boolean
  extensionPolicyHandled: boolean
  calendarVsFiscalSpecified: boolean
  weekendHolidayRolloverHandled: boolean
  crossVerifiedOfficialSources: boolean
  disasterExceptionChannelEstablished: boolean
}
```

Verified rule 默认要达到 6/6。允许 5/6 的唯一情况是 `ruleTier='applicability_review'`，并且用户侧必须显示 “Confirm applicability before acting”。

## 5. 获取与发布流程

### 5.1 基础规则采集

1. Watcher 拉取 source HTML/PDF/API，并保存 snapshot hash。
2. Parser 提取表格、标题、日期、原文段落。
3. AI 可把长文转成 candidate payload，但输出必须带 source line / quote。
4. Ops 在 Rules Console 审核 candidate。
5. Verified 后发布 `ObligationRule(version)`。
6. Rule pack 发布后触发 obligation generation preview。

### 5.2 Exception 采集

1. IRS disaster / state emergency / FEMA source 变化生成 exception candidate。
2. Candidate 必须包含 affected jurisdiction、counties、effective dates、affected forms、new due date、source quote。
3. 没有 IRS 或州税局税务 relief 页面支撑时，只能保留 early warning，不能发布 overlay。
4. 发布 overlay 前显示 impacted obligations preview。
5. 发布后才允许生成用户通知。

### 5.3 发布状态机

```text
watch_changed
  -> candidate_created
  -> pending_review
  -> verified
  -> published
  -> consumed_by_obligations
```

拒绝路径：

```text
pending_review -> rejected
pending_review -> needs_more_source
```

## 6. 通知消费边界

| 通知类型                  | 触发源                                              | 接收者                      | 是否面向用户 | 是否改变 deadline     |
| ------------------------- | --------------------------------------------------- | --------------------------- | ------------ | --------------------- |
| `rules.source.changed`    | source snapshot hash 变化                           | 内部 ops                    | 否           | 否                    |
| `rules.candidate.created` | parser/AI 生成 candidate                            | 内部 ops                    | 否           | 否                    |
| `rules.review.required`   | candidate 缺少 quote / cross-source / applicability | 内部 ops                    | 否           | 否                    |
| `rules.published`         | verified rule 发布                                  | 内部 ops，可选用户侧 banner | 可选         | 触发 preview 后才改变 |
| `obligations.generated`   | verified rule pack 应用于客户                       | 用户                        | 是           | 是                    |
| `reminder.scheduled`      | obligation due in 30/7/1 days                       | 用户                        | 是           | 否                    |

MVP 的用户提醒只消费 `obligation_instance`，不直接消费 `RuleCandidate`。

## 7. 验收标准

- Source Registry 至少覆盖 Federal 7 源、CA 5 源、NY 5 源、TX 5 源、FL 5 源、WA 6 源。
- 初始 Rule Pack 至少包含本文件 §3 的 rule IDs。
- 每条 verified rule 至少有 1 个 primary official source；高风险/extension/payment rule 需要 2 个 source 或明确 cross-check note。
- 每条 rule 都有 `dueDateLogic`、`eventType`、`ruleTier`、`qualityChecklist`。
- 所有 exception 都先进入 candidate，不直接更新 obligation。
- 用户提醒只来自 verified obligations。

## 8. 变更记录

| 版本 | 日期       | 作者  | 摘要                                                             |
| ---- | ---------- | ----- | ---------------------------------------------------------------- |
| v0.1 | 2026-04-27 | Codex | 新增 MVP source registry、初始 rule pack、结构化模型和通知边界。 |
