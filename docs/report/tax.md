# 美国联邦 + 50 州主要申报税种速查

更新时间：2026-04-21

> Scope note: 本文件是 50 州税种研究材料，不代表 DueDateHQ 当前 MVP rules
> coverage。当前 MVP rules coverage 是 Federal + CA/NY/TX/FL/WA；IL/MA 等州只可作为后续扩州研究材料引用。

## 适用范围

| 项目     | 内容                                                                                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 覆盖范围 | 联邦个人与企业年度报税；预估税；工资税 / 代扣代缴 / 失业保险；州个人所得税；州企业所得税 / franchise / gross receipts / margin / B&O / CAT / business privilege；州销售税 / 使用税 |
| 不含项目 | 市 / 县 / 学区 / 交通区地方税；地方房产税、商业 personal property tax；高度行业化专项税；一次性 probate / court 流程型申报                                                         |
| 口径说明 | 下文若写“2025 年度 return”，指 `2025 tax year, 2026 filing season`                                                                                                                 |
| 日期规则 | 月报 / 季报税种若遇周末、法定假日、灾害延期，会顺延                                                                                                                                |
| 表号规则 | 很多州强制电子申报；若无稳定单一纸表，下文写 `州门户 / e-file return`                                                                                                              |
| 附件规则 | `依赖附件 / 常见附件` 一列写的是建模时最常见的 supporting forms / schedules / source documents，不代表完整穷尽                                                                     |

## 术语说明

| 术语            | 含义                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `UI`            | `Unemployment Insurance`，即州级失业保险税 / 失业保险申报                                                         |
| `州 UI 季报`    | 雇主按季度向州劳工 / workforce / unemployment agency 申报工资和失业保险税的 return，通常附带 employee wage detail |
| `代扣工资税`    | 雇主从员工工资中代扣并向州税局申报 / 缴纳的州所得税 withholding                                                   |
| `销售 / 使用税` | 卖家按州规则申报的 sales tax / use tax；部分州会用 excise、gross receipts、TPT、GET 等替代传统 sales tax 名称     |

## 联邦税

### 个人

| 税种             | 表格                     | 适用范围                                                                                                                                                                                                                                                                  | 依赖附件 / 常见附件                                                                                                                                                                                                                                                                                                                                                                  | 截止日期                                                                                           |
| ---------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 联邦个人所得税   | `Form 1040`              | 美国税务居民个人；2025 年通常至少达到基本 filing threshold 即需申报，例如单身 `<65` 岁通常 `gross income >= $15,000`、`MFJ` 双方 `<65` 岁通常 `gross income >= $30,000`、`HOH` 通常 `gross income >= $22,500`；另有 `self-employment net earnings >= $400` 等强制申报情形 | [`W-2`](#att-w-2)、`1099-INT`、`1099-DIV`、`1099-B`、`1099-NEC`、`1099-MISC`、`1099-R`、`SSA-1099`、`Schedule 1`、`Schedule 2`、`Schedule 3`、[`Schedule A`](#att-schedule-a)、[`Schedule B`](#att-schedule-b)、[`Schedule C`](#att-schedule-c)、[`Schedule D`](#att-schedule-d)、[`Schedule E`](#att-schedule-e)、`Schedule SE`、`Form 8949`、`Form 6251`、`Form 1116`、`Form 8889` | 2025 年度通常 `2026-04-15`；延期 `Form 4868` 通常到 `2026-10-15`，但税款通常仍在 `2026-04-15` 到期 |
| 联邦个人所得税   | `Form 1040-SR`           | `65` 岁及以上、可使用 senior return 格式的美国税务居民个人；2025 年 filing threshold 仍按 filing status + age 计算，例如单身 `65+` 通常 `gross income >= $16,600`，`MFJ` 双方都 `65+` 通常 `gross income >= $33,200`                                                      | 与 `Form 1040` 类似；常见为 [`W-2`](#att-w-2)、`1099-R`、`SSA-1099`、`Schedule A/B/D`、`Form 8889`                                                                                                                                                                                                                                                                                   | 2025 年度通常 `2026-04-15`；延期通常到 `2026-10-15`                                                |
| 联邦个人所得税   | `Form 1040-NR`           | 非居民个人；无统一单一金额门槛。只要满足 IRS 1040-NR instructions 中任一 filing trigger 即需申报，例如有美国 trade or business 收入、需申报退款 / treaty benefit、或其他被要求申报情形                                                                                    | `1042-S`、[`W-2`](#att-w-2)、[`1099`](#att-1099)、`Schedule A (1040-NR)`、`Schedule NEC`、treaty statement、withholding support                                                                                                                                                                                                                                                      | 2025 年度通常 `2026-04-15`；若无工资代扣且仅报特定项目，规则可能不同                               |
| 个人预估税       | `Form 1040-ES`           | 预计 2026 年在扣除 withholding 与 refundable credits 后，仍有 `tax due >= $1,000` 的个人                                                                                                                                                                                  | 上年 return、当年收入预测、capital gains / pass-through 预估、self-employment 预估                                                                                                                                                                                                                                                                                                   | 2026 分期通常为 `2026-04-15`、`2026-06-15`、`2026-09-15`、`2027-01-15`                             |
| 家庭雇主税       | `Schedule H (Form 1040)` | 2025 年向任一 household employee 支付 `cash wages >= $2,800` 触发 SS/Medicare household employment tax；或任一季度对全部 household employees 支付 `cash wages >= $1,000` 触发 household FUTA                                                                              | 家庭雇员工资记录、[`W-2`](#att-w-2)、代扣记录、州失业税资料                                                                                                                                                                                                                                                                                                                          | 随个人所得税申报；通常 `2026-04-15`                                                                |
| 联邦赠与税       | `Form 709`               | 2025 年对任一受赠人的 present-interest gifts 超过年度 exclusion `>$19,000`；或涉及 gift-splitting、未来利益赠与、GST allocation 等情形                                                                                                                                    | 赠与明细、估值报告、trust / partnership / stock transfer supporting docs、prior-year taxable gifts                                                                                                                                                                                                                                                                                   | 对 2025 年赠与，通常不早于 `2026-01-01`，不晚于 `2026-04-15`                                       |
| 联邦遗产税 / GST | `Form 706`               | 2025 年死亡人：`gross estate + adjusted taxable gifts + specific exemption > $13,990,000`；或 executor 要做 portability election 传递 `DSUE` 时，无论遗产规模都可需申报                                                                                                   | 死亡证明、资产清单、估值报告、trust docs、beneficiary schedules、prior gift tax returns                                                                                                                                                                                                                                                                                              | 通常为死亡后 `9` 个月内；延期 `Form 4768`                                                          |

### 企业

| 税种                 | 表格            | 适用范围                                                                                                                                                                                                           | 依赖附件 / 常见附件                                                                                                              | 截止日期                                                                           |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| C corporation 所得税 | `Form 1120`     | 按 C corp 纳税的公司                                                                                                                                                                                               | 财务报表、总账、trial balance、`Schedule M-1 / M-3`、`Form 4562`、`Form 1125-A`、`Form 1125-E`、股东 / officer compensation 明细 | 通常为税年结束后第 `4` 个月第 `15` 天；calendar-year 2025 return 通常 `2026-04-15` |
| S corporation        | `Form 1120-S`   | 已作 S election 的公司                                                                                                                                                                                             | 财务报表、总账、`Schedule K-1`、股东 basis / distribution 明细、`Form 4562`、`1125-A`、`1125-E`                                  | 通常为税年结束后第 `3` 个月第 `15` 天；calendar-year 2025 return 为 `2026-03-16`   |
| Partnership          | `Form 1065`     | partnership、多成员 LLC 按 partnership 纳税实体                                                                                                                                                                    | 财务报表、总账、`Schedule K-1`、partner capital / basis 明细、`Form 4562`、`1125-A`                                              | 通常为税年结束后第 `3` 个月第 `15` 天；calendar-year 2025 return 为 `2026-03-16`   |
| 公司预估税计算       | `Form 1120-W`   | 预计在 2026 年有 `estimated tax >= $500` 的 C corp；`1120-W` 本身通常是 worksheet，不单独提交，但用来计算分期预缴                                                                                                  | 上年 return、当年 taxable income forecast、book-to-tax adjustments                                                               | 相关付款一般按 `2026-04-15`、`2026-06-15`、`2026-09-15`、`2026-12-15` 分期         |
| 工资税               | `Form 941`      | 有员工且工资需申报 federal income tax withholding 或 Social Security / Medicare tax 的雇主                                                                                                                         | [payroll register](#att-payroll-register)、代扣税记录、`941 Worksheet`、health insurance / sick leave adjustments、存税记录      | 按季，通常为 `04-30 / 07-31 / 10-31 / 01-31`                                       |
| 年度雇主税           | `Form 940`      | 一般雇主：2024 或 2025 任一季度支付工资 `>= $1,500`，或在 2024 / 2025 年有至少 `1` 名员工在 `20` 个不同周工作过一天；农业雇主另有 `$20,000` / quarter 测试，家庭雇主通常走 `Schedule H` 的 `$1,000` / quarter 测试 | FUTA 应税工资明细、州失业税缴纳记录、[payroll register](#att-payroll-register)                                                   | 通常 `01-31`；若按时足额存税，一般可到 `02-10`                                     |
| 小额雇主年报         | `Form 944`      | IRS 书面通知必须报 `944` 的雇主；通常设计给 annual employment tax liability `<= $1,000` 的最小雇主                                                                                                                 | [payroll register](#att-payroll-register)、代扣税记录、存税记录                                                                  | 通常 `01-31`；2025 年度通常 `2026-02-02`，足额按时存税可到 `2026-02-10`            |
| 农业雇主             | `Form 943`      | 对 farmworkers 适用：任一员工年度 cash wages `>= $150`，或全年向全部 farmworkers 支付 cash wages 合计 `>= $2,500`                                                                                                  | 农业工资记录、代扣税记录、存税记录                                                                                               | 通常 `01-31`；2025 年度通常 `2026-02-02`，足额按时存税可到 `2026-02-10`            |
| 非工资代扣           | `Form 945`      | 对 pension、annuity、IRA、gambling winnings、backup withholding 等非工资付款有 federal withholding obligation 的付款人                                                                                             | backup withholding 记录、IRA / pension / gambling / vendor payment records、存税记录                                             | 2025 年度通常 `2026-02-02`；若足额按时存税，一般可到 `2026-02-10`                  |
| 工资信息申报         | `Form W-2`      | 向雇员发放工资并需出具 wage statement 的雇主                                                                                                                                                                       | employee master data、工资明细、代扣和福利记录                                                                                   | 向雇员提供通常 `01-31`                                                             |
| 工资信息汇总申报     | `Form W-3`      | 向 SSA 纸质汇总报送 [`W-2`](#att-w-2) 的雇主                                                                                                                                                                       | [`W-2`](#att-w-2) 汇总、工资与代扣 reconciliation                                                                                | 向 SSA 报送通常 `01-31`                                                            |
| 非雇员报酬信息申报   | `Form 1099-NEC` | 对非雇员在 2025 年支付 compensation `>= $600` 的付款人，或有 backup withholding 的付款人                                                                                                                           | vendor master、`W-9`、AP ledger、payment detail、backup withholding 记录                                                         | 一般 `01-31`                                                                       |
| 纸质信息申报汇总     | `Form 1096`     | 纸质提交某些信息申报表时的 transmittal form；电子提交通常不用                                                                                                                                                      | 已填好的 [`1099`](#att-1099) / `1098` / `5498` / `W-2G` 纸质表汇总                                                               | 截止日期随所附信息表而变                                                           |
| 外国人预提税年报     | `Form 1042`     | 向外国人 / 外国实体付款并承担 chapter 3 / 4 withholding obligation 的 withholding agent                                                                                                                            | withholding certificates、beneficial owner docs、treaty claims、payment ledger                                                   | 一般 `03-15`，遇周末顺延                                                           |
| 外国人预提税收款人表 | `Form 1042-S`   | 对外国收款人有需报告 payment / withholding 的 withholding agent                                                                                                                                                    | recipient-level payment detail、withholding detail、[treaty docs](#att-treaty-docs)                                              | 一般 `03-15`，遇周末顺延                                                           |
| 联邦消费税           | `Form 720`      | 从事适用联邦消费税业务的企业                                                                                                                                                                                       | taxable transaction logs、fuel / communications / environmental excise detail、存税记录                                          | 按季，于季度结束后次月最后一天                                                     |
| 重型公路车辆税       | `Form 2290`     | 使用应税重型公路车辆的纳税人                                                                                                                                                                                       | 车辆清单、VIN、首次使用月份、taxable gross weight 资料                                                                           | 通常在首次使用月份次月最后一天                                                     |

### 联邦官方来源

| 主题                         | 官方链接                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| IRS `1040` instructions      | https://www.irs.gov/instructions/i1040gi                                               |
| IRS `1040-ES`                | https://www.irs.gov/f1040es                                                            |
| IRS employment tax due dates | https://www.irs.gov/businesses/small-businesses-self-employed/employment-tax-due-dates |
| IRS `1120`                   | https://www.irs.gov/instructions/i1120                                                 |
| IRS `1120-S`                 | https://www.irs.gov/instructions/i1120s                                                |
| IRS `1065`                   | https://www.irs.gov/instructions/i1065                                                 |
| IRS `709`                    | https://www.irs.gov/instructions/i709                                                  |
| IRS `706`                    | https://www.irs.gov/instructions/i706/ch01.html                                        |

## 50 州速查

说明：

- 本节仍按州级主税种整理，但避免使用“收入较高”这类模糊词。
- 很多州的 `适用范围` 没有单一金额门槛，而是随 `filing status / age / residency / assigned filing frequency / nexus rule` 变化；这类情形会直接写规则类型，不会编造一个假的统一数字。

## Alabama (AL)

### 个人

| 税种         | 表格        | 适用范围           | 依赖附件 / 常见附件                                                                                         | 截止日期                                   | 备注 |
| ------------ | ----------- | ------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---- |
| 州个人所得税 | `Form 40`   | Alabama 居民个人   | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、联邦 `Schedule A/B/C/D/E` | 通常与联邦同日；2025 年度通常 `2026-04-15` |      |
| 州个人所得税 | `Form 40NR` | Alabama 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、联邦 `Schedule A/B/C/D/E` | 通常与联邦同日；2025 年度通常 `2026-04-15` |      |

### 企业

| 税种                   | 表格               | 适用范围                                  | 依赖附件 / 常见附件                                                                            | 截止日期                  | 备注 |
| ---------------------- | ------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------- | ---- |
| 企业所得税             | `Form 20C`         | 在州内经营或有 apportionment nexus 的企业 | [联邦报税副本](#att-federal-return-copy)、州 [apportionment detail](#att-apportionment-detail) | 一般第 `4` 个月第 `15` 天 |      |
| Business Privilege Tax | `BPT/CPT` 系列     | 在州内经营或有 apportionment nexus 的企业 | [联邦报税副本](#att-federal-return-copy)、州 [apportionment detail](#att-apportionment-detail) | 一般第 `4` 个月第 `15` 天 |      |
| 销售 / 使用税          | `My Alabama Taxes` | 在州内销售的卖家                          | [sales detail](#att-sales-detail)                                                              | 按月 / 季 / 年            |      |
| 代扣工资税             | `A-6`              | 雇主                                      | payroll / [withholding records](#att-withholding-records)                                      | 月报                      |      |
| 代扣工资税             | `A-1`              | 雇主                                      | payroll / [withholding records](#att-withholding-records)                                      | 年终                      |      |
| UI                     | 州 UI 季报         | 雇主                                      | [payroll register](#att-payroll-register)、[UI wage detail](#att-ui-wage-detail)               | 季报                      |      |

## Alaska (AK)

### 个人

| 税种         | 表格 | 适用范围       | 依赖附件 / 常见附件 | 截止日期 | 备注 |
| ------------ | ---- | -------------- | ------------------- | -------- | ---- |
| 州个人所得税 | `无` | 无州个人所得税 |                     |          |      |

### 企业

| 税种          | 表格                   | 适用范围                            | 依赖附件 / 常见附件                                                                                   | 截止日期                                | 备注         |
| ------------- | ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------ |
| 企业所得税    | `Form 6000`            | 在 Alaska 有企业所得税 nexus 的公司 | [联邦报税副本](#att-federal-return-copy)、[apportionment detail](#att-apportionment-detail)、财务报表 | 一般按税年结束后第 `4` 个月中旬附近申报 |              |
| 销售 / 使用税 | 无 statewide sales tax |                                     |                                                                                                       |                                         | 地方层面另计 |
| 代扣工资税    | `无`                   | 无州工资代扣税                      |                                                                                                       |                                         |              |
| UI            | 州 UI 季报             | 在州内有雇员的雇主                  | [payroll register](#att-payroll-register)、[UI wage detail](#att-ui-wage-detail)                      | 季报                                    |              |

## Arizona (AZ)

### 个人

| 税种         | 表格         | 适用范围                   | 依赖附件 / 常见附件                                                                                 | 截止日期          | 备注 |
| ------------ | ------------ | -------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `Form 140`   | Arizona 居民个人           | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |
| 州个人所得税 | `Form 140NR` | Arizona 非居民个人         | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |
| 州个人所得税 | `Form 140PY` | Arizona part-year resident | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |

### 企业

| 税种       | 表格        | 适用范围                                  | 依赖附件 / 常见附件                                         | 截止日期                                         | 备注 |
| ---------- | ----------- | ----------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ | ---- |
| 企业所得税 | `Form 120`  | 在州内经营 C corp                         | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | calendar-year corporate return 一般 `2026-04-15` |      |
| 企业所得税 | `Form 120S` | 在州内经营 S corp                         | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | calendar-year corporate return 一般 `2026-04-15` |      |
| TPT        | `AZTaxes`   | 有 transaction privilege tax nexus 的卖家 | transaction privilege tax detail                            | 通常次月 `20` 日                                 |      |
| 代扣工资税 | `A1-QRT`    | 雇主                                      | [payroll register](#att-payroll-register)                   | 按 assigned frequency                            |      |
| 代扣工资税 | `A1-APR`    | 雇主                                      | [payroll register](#att-payroll-register)                   | 按 assigned frequency                            |      |
| UI         | 州 UI 季报  | 雇主                                      | [payroll register](#att-payroll-register)                   | 季报                                             |      |

## Arkansas (AR)

### 个人

| 税种         | 表格       | 适用范围            | 依赖附件 / 常见附件                                                                              | 截止日期          | 备注 |
| ------------ | ---------- | ------------------- | ------------------------------------------------------------------------------------------------ | ----------------- | ---- |
| 州个人所得税 | `AR1000F`  | Arkansas 居民个人   | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、`Schedule C/E` | 通常 `2026-04-15` |      |
| 州个人所得税 | `AR1000NR` | Arkansas 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、`Schedule C/E` | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格       | 适用范围       | 依赖附件 / 常见附件                             | 截止日期                                         | 备注 |
| ------------- | ---------- | -------------- | ----------------------------------------------- | ------------------------------------------------ | ---- |
| 企业所得税    | `AR1100CT` | 在州内经营企业 | [联邦报税副本](#att-federal-return-copy)        | calendar-year corporate return 一般 `2026-04-15` |      |
| 销售 / 使用税 | `ATAP`     | 卖家           | [sales detail](#att-sales-detail)               | 按 assigned frequency                            |      |
| 代扣工资税    | `AR941A`   | 雇主           | [withholding records](#att-withholding-records) | 周期申报                                         |      |
| 代扣工资税    | `AR3MAR`   | 雇主           | [withholding records](#att-withholding-records) | 年终 reconciliation                              |      |
| UI            | 州 UI 季报 | 雇主           | [UI wage detail](#att-ui-wage-detail)           | 季报                                             |      |

## California (CA)

### 个人

| 税种         | 表格         | 适用范围                               | 依赖附件 / 常见附件                                                                                                                   | 截止日期       | 备注 |
| ------------ | ------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---- |
| 州个人所得税 | `Form 540`   | California 居民个人                    | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`Schedule CA`](#att-schedule-ca) supporting detail | 通常跟联邦同日 |      |
| 州个人所得税 | `Form 540NR` | California 非居民 / part-year resident | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`Schedule CA`](#att-schedule-ca) supporting detail | 通常跟联邦同日 |      |

### 企业

| 税种                    | 表格             | 适用范围                       | 依赖附件 / 常见附件                                                   | 截止日期              | 备注              |
| ----------------------- | ---------------- | ------------------------------ | --------------------------------------------------------------------- | --------------------- | ----------------- |
| 企业所得税 / Franchise  | `Form 100`       | 在州内经营或注册的 C corp      | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1)、财务报表 | 按实体类型            |                   |
| 企业所得税 / Franchise  | `100S`           | 在州内经营或注册的 S corp      | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1)、财务报表 | 按实体类型            |                   |
| Partnership return      | `565`            | 在州内经营或注册的 partnership | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1)、财务报表 | 按实体类型            |                   |
| LLC return / annual tax | `568`            | 在州内经营或注册的 LLC         | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1)、财务报表 | 按实体类型            | 含 LLC annual tax |
| 销售 / 使用税           | `CDTFA` 定频申报 | 销售税卖家                     | [sales journals](#att-sales-journals)                                 | 按 assigned frequency |                   |
| 代扣工资税              | `DE 9`           | 有员工雇主                     | [payroll records](#att-payroll-records)                               | 季报                  | EDD               |
| UI                      | `DE 9C`          | 有员工雇主                     | [payroll records](#att-payroll-records)                               | 季报                  | EDD               |

## Colorado (CO)

### 个人

| 税种         | 表格      | 适用范围                   | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | --------- | -------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `DR 0104` | Colorado 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种       | 表格       | 适用范围          | 依赖附件 / 常见附件                                                                         | 截止日期             | 备注 |
| ---------- | ---------- | ----------------- | ------------------------------------------------------------------------------------------- | -------------------- | ---- |
| 企业所得税 | `Form 112` | 在州内经营企业    | [联邦报税副本](#att-federal-return-copy)、[apportionment detail](#att-apportionment-detail) | 通常随联邦所得税逻辑 |      |
| 销售税     | `DR 0100`  | sales tax sellers | [sales detail](#att-sales-detail)                                                           | 通常次月 `20` 日     |      |
| 代扣工资税 | `DR 1094`  | 雇主              | [payroll register](#att-payroll-register)                                                   | 年度汇总             |      |
| UI         | 州 UI 季报 | 雇主              | [payroll register](#att-payroll-register)                                                   | 季报                 |      |

## Connecticut (CT)

### 个人

| 税种         | 表格      | 适用范围                      | 依赖附件 / 常见附件                                                                                        | 截止日期          | 备注                                           |
| ------------ | --------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------- |
| 州个人所得税 | `CT-1040` | Connecticut 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、estimated tax workpapers | 通常 `2026-04-15` | 预估税分期一般 `04-15 / 06-15 / 09-15 / 01-15` |

### 企业

| 税种       | 表格       | 适用范围       | 依赖附件 / 常见附件                      | 截止日期                  | 备注 |
| ---------- | ---------- | -------------- | ---------------------------------------- | ------------------------- | ---- |
| 企业所得税 | `CT-1120`  | 公司纳税人     | [联邦报税副本](#att-federal-return-copy) | 一般第 `4` 个月第 `15` 天 |      |
| 销售税     | `OS-114`   | 销售税注册卖家 | [sales detail](#att-sales-detail)        | 按 assigned frequency     |      |
| 代扣工资税 | `CT-WH`    | 有员工雇主     | withholding / wage detail                | 周期申报                  |      |
| 代扣工资税 | `CT-941`   | 有员工雇主     | withholding / wage detail                | 年终对账另报              |      |
| UI         | 州 UI 季报 | 有员工雇主     | wage detail                              | 季报                      |      |

## Delaware (DE)

### 个人

| 税种         | 表格      | 适用范围            | 依赖附件 / 常见附件                                                              | 截止日期               | 备注 |
| ------------ | --------- | ------------------- | -------------------------------------------------------------------------------- | ---------------------- | ---- |
| 州个人所得税 | `PIT-RES` | Delaware 居民个人   | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-30` 左右 |      |
| 州个人所得税 | `PIT-NON` | Delaware 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-30` 左右 |      |

### 企业

| 税种               | 表格        | 适用范围                          | 依赖附件 / 常见附件                                                                         | 截止日期              | 备注 |
| ------------------ | ----------- | --------------------------------- | ------------------------------------------------------------------------------------------- | --------------------- | ---- |
| 企业所得税         | `Form 1100` | 企业纳税人                        | [联邦报税副本](#att-federal-return-copy)、[apportionment detail](#att-apportionment-detail) | 按企业年报规则        |      |
| Gross Receipts Tax | 州门户      | 有 Delaware gross receipts 的主体 | [gross receipts detail](#att-gross-receipts-detail)                                         | 多按月或季            |      |
| 代扣工资税         | 州门户      | 雇主                              | [payroll records](#att-payroll-records)                                                     | 按 assigned frequency |      |
| UI                 | 州 UI 季报  | 雇主                              | [payroll records](#att-payroll-records)                                                     | 季报                  |      |

## Florida (FL)

### 个人

| 税种         | 表格 | 适用范围       | 依赖附件 / 常见附件 | 截止日期 | 备注 |
| ------------ | ---- | -------------- | ------------------- | -------- | ---- |
| 州个人所得税 | `无` | 无州个人所得税 |                     |          |      |

### 企业

| 税种                   | 表格     | 适用范围                    | 依赖附件 / 常见附件                                                                         | 截止日期                                 | 备注             |
| ---------------------- | -------- | --------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------- |
| 企业所得税 / Franchise | `F-1120` | Florida corporate taxpayers | [联邦报税副本](#att-federal-return-copy)                                                    | calendar-year 一般 `2026-05-01`          |                  |
| 销售税                 | `DR-15`  | 销售税卖家                  | sales tax transaction detail、[resale certificate support](#att-resale-certificate-support) | 申报期次月 `1` 日到期；`20` 日后视为逾期 |                  |
| 代扣工资税             | `无`     | 无州工资代扣税              |                                                                                             |                                          |                  |
| UI                     | `RT-6`   | 有员工雇主                  | payroll / UI records                                                                        | 季报                                     | reemployment tax |

## Georgia (GA)

### 个人

| 税种         | 表格       | 适用范围                  | 依赖附件 / 常见附件                                                                                 | 截止日期                   | 备注 |
| ------------ | ---------- | ------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------- | ---- |
| 州个人所得税 | `Form 500` | Georgia 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 2025 年度通常 `2026-04-15` |      |

### 企业

| 税种                       | 表格        | 适用范围                   | 依赖附件 / 常见附件                                                                                          | 截止日期              | 备注 |
| -------------------------- | ----------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------- | ---- |
| 企业所得税 / Net Worth Tax | `Form 600`  | 公司实体                   | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1)、[net worth schedules](#att-net-worth-schedules) | 按年报规则            |      |
| 企业所得税 / Net Worth Tax | `Form 600S` | S corp / pass-through 实体 | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1)、[net worth schedules](#att-net-worth-schedules) | 按年报规则            |      |
| 销售税                     | 州定频申报  | 卖家                       | [sales detail](#att-sales-detail)                                                                            | 按 assigned frequency |      |
| 代扣工资税                 | `G-7`       | 雇主                       | [payroll records](#att-payroll-records)                                                                      | 周期申报              |      |
| 代扣工资税                 | `G-1003`    | 雇主                       | [payroll records](#att-payroll-records)                                                                      | 年终对账              |      |
| UI                         | 州 UI 季报  | 雇主                       | [payroll records](#att-payroll-records)                                                                      | 季报                  |      |

## Hawaii (HI)

### 个人

| 税种         | 表格   | 适用范围          | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | ------ | ----------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `N-11` | Hawaii 居民个人   | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-20` |      |
| 州个人所得税 | `N-15` | Hawaii 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-20` |      |

### 企业

| 税种       | 表格           | 适用范围               | 依赖附件 / 常见附件                                         | 截止日期    | 备注             |
| ---------- | -------------- | ---------------------- | ----------------------------------------------------------- | ----------- | ---------------- |
| 企业所得税 | `N-30`         | 在州内经营 C corp      | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | 按实体类型  |                  |
| 企业所得税 | `N-35`         | 在州内经营 S corp      | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | 按实体类型  |                  |
| 企业所得税 | `N-20`         | 在州内经营 partnership | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | 按实体类型  |                  |
| GET        | `G-45`；`G-49` | GET 纳税人             | GET gross income detail                                     | 定期 + 年终 | 非传统 sales tax |
| 代扣工资税 | `HW-14`        | 雇主                   | withholding and wage records                                | 周期申报    |                  |
| 代扣工资税 | `HW-3`         | 雇主                   | withholding and wage records                                | 年终        |                  |
| UI         | 州 UI 季报     | 雇主                   | wage records                                                | 季报        |                  |

## Idaho (ID)

### 个人

| 税种         | 表格      | 适用范围         | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | --------- | ---------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `Form 40` | Idaho 居民个人   | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |
| 州个人所得税 | `Form 43` | Idaho 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格        | 适用范围   | 依赖附件 / 常见附件                             | 截止日期              | 备注 |
| ------------- | ----------- | ---------- | ----------------------------------------------- | --------------------- | ---- |
| 企业所得税    | `Form 41`   | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)        | 按年报规则            |      |
| 销售 / 使用税 | 州门户      | 卖家       | [sales journals](#att-sales-journals)           | 按 assigned frequency |      |
| 代扣工资税    | `910 / 967` | 雇主       | [withholding records](#att-withholding-records) | 周期申报 + 年终       |      |
| UI            | 州 UI 季报  | 雇主       | [UI wage detail](#att-ui-wage-detail)           | 季报                  |      |

## Illinois (IL)

### 个人

| 税种         | 表格      | 适用范围                   | 依赖附件 / 常见附件                                                                                 | 截止日期          | 备注 |
| ------------ | --------- | -------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `IL-1040` | Illinois 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |

### 企业

| 税种       | 表格       | 适用范围            | 依赖附件 / 常见附件                                                                                           | 截止日期              | 备注 |
| ---------- | ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------- | ---- |
| 企业所得税 | `IL-1120`  | 企业或 pass-through | [联邦报税副本](#att-federal-return-copy)、replacement tax / [apportionment detail](#att-apportionment-detail) | 按年报规则            |      |
| 销售税     | `ST-1`     | 卖家                | sales records                                                                                                 | 按 assigned frequency |      |
| 代扣工资税 | `IL-941`   | 雇主                | [payroll records](#att-payroll-records)                                                                       | 周期申报              |      |
| 代扣工资税 | `IL-W-3`   | 雇主                | [payroll records](#att-payroll-records)                                                                       | 年终                  |      |
| UI         | 州 UI 季报 | 雇主                | [payroll records](#att-payroll-records)                                                                       | 季报                  |      |

## Indiana (IN)

### 个人

| 税种         | 表格               | 适用范围                  | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | ------------------ | ------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `IT-40 / IT-40PNR` | Indiana 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种       | 表格          | 适用范围   | 依赖附件 / 常见附件                             | 截止日期              | 备注 |
| ---------- | ------------- | ---------- | ----------------------------------------------- | --------------------- | ---- |
| 企业所得税 | `IT-20`       | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)        | 按年报规则            |      |
| 销售税     | `ST-103`      | 卖家       | [sales detail](#att-sales-detail)               | 按 assigned frequency |      |
| 代扣工资税 | `WH-1 / WH-3` | 雇主       | [withholding records](#att-withholding-records) | 周期申报 + 年终       |      |
| UI         | 州 UI 季报    | 雇主       | UI wage records                                 | 季报                  |      |

## Iowa (IA)

### 个人

| 税种         | 表格      | 适用范围               | 依赖附件 / 常见附件                                                                                | 截止日期          | 备注 |
| ------------ | --------- | ---------------------- | -------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `IA 1040` | Iowa 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、`Schedule C/F/E` | 通常 `2026-04-30` |      |

### 企业

| 税种          | 表格                       | 适用范围   | 依赖附件 / 常见附件                      | 截止日期        | 备注                                        |
| ------------- | -------------------------- | ---------- | ---------------------------------------- | --------------- | ------------------------------------------- |
| 企业所得税    | `IA 1120`                  | 企业纳税人 | [联邦报税副本](#att-federal-return-copy) | 按年报规则      |                                             |
| 销售 / 使用税 | 州门户                     | 卖家       | [sales detail](#att-sales-detail)        | 按月 / 季 / 年  |                                             |
| 代扣工资税    | 州 e-file / reconciliation | 雇主       | withholding and wage records             | 周期申报 + 年终 |                                             |
| UI            | 州 UI 季报                 | 雇主       | UI wage records                          | 季报            | Iowa inheritance tax 已对 `2025` 起全面废止 |

## Kansas (KS)

### 个人

| 税种         | 表格   | 适用范围                 | 依赖附件 / 常见附件                                                                                 | 截止日期          | 备注 |
| ------------ | ------ | ------------------------ | --------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `K-40` | Kansas 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |

### 企业

| 税种       | 表格             | 适用范围      | 依赖附件 / 常见附件                                         | 截止日期              | 备注 |
| ---------- | ---------------- | ------------- | ----------------------------------------------------------- | --------------------- | ---- |
| 企业所得税 | `K-120 / K-120S` | 企业或 S corp | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | 按年报规则            |      |
| 销售税     | `ST-36`          | 卖家          | [sales detail](#att-sales-detail)                           | 按 assigned frequency |      |
| 代扣工资税 | `KW-5`           | 雇主          | withholding / UI wage records                               | 周期申报              |      |
| 代扣工资税 | `KW-3`           | 雇主          | withholding / UI wage records                               | 年终                  |      |
| UI         | 州 UI 季报       | 雇主          | wage records                                                | 季报                  |      |

## Kentucky (KY)

### 个人

| 税种         | 表格       | 适用范围                   | 依赖附件 / 常见附件                                                                                 | 截止日期          | 备注 |
| ------------ | ---------- | -------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `Form 740` | Kentucky 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |

### 企业

| 税种              | 表格                     | 适用范围           | 依赖附件 / 常见附件                                                          | 截止日期              | 备注             |
| ----------------- | ------------------------ | ------------------ | ---------------------------------------------------------------------------- | --------------------- | ---------------- |
| 企业所得税 / LLET | `Form 720`               | 企业或 LLET 纳税人 | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1)、LLET workpapers | 按年报规则            |                  |
| 销售 / 使用税     | `51A102` 或在线申报      | 卖家               | [sales detail](#att-sales-detail)                                            | 按 assigned frequency |                  |
| 代扣工资税        | [`K-1`](#att-k-1)；`K-3` | 雇主               | [payroll records](#att-payroll-records)                                      | 周期申报 + 年终       | 表号沿用现有口径 |
| UI                | 州 UI 季报               | 雇主               | [payroll records](#att-payroll-records)                                      | 季报                  |                  |

## Louisiana (LA)

### 个人

| 税种         | 表格               | 适用范围                    | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | ------------------ | --------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `IT-540 / IT-540B` | Louisiana 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-05-15` |      |

### 企业

| 税种          | 表格        | 适用范围   | 依赖附件 / 常见附件                                                                         | 截止日期              | 备注 |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------- | --------------------- | ---- |
| 企业所得税    | `CIFT-620`  | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)、[apportionment detail](#att-apportionment-detail) | 按年报规则            |      |
| 销售 / 使用税 | `LaTAP`     | 卖家       | [sales detail](#att-sales-detail)                                                           | 按 assigned frequency |      |
| 代扣工资税    | `L-1 / L-3` | 雇主       | [withholding records](#att-withholding-records)                                             | 周期申报 + 年终       |      |
| UI            | 州 UI 季报  | 雇主       | wage records                                                                                | 季报                  |      |

## Maine (ME)

### 个人

| 税种         | 表格     | 适用范围                | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | -------- | ----------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `1040ME` | Maine 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格               | 适用范围   | 依赖附件 / 常见附件                      | 截止日期       | 备注 |
| ------------- | ------------------ | ---------- | ---------------------------------------- | -------------- | ---- |
| 企业所得税    | `1120ME`           | 企业纳税人 | [联邦报税副本](#att-federal-return-copy) | 按年报规则     |      |
| 销售 / 使用税 | `Maine Tax Portal` | 卖家       | [sales journals](#att-sales-journals)    | 按月 / 季 / 年 |      |
| 代扣工资税    | `941ME`            | 雇主       | withholding and wage records             | 周期申报       |      |
| 代扣工资税    | `W-3ME`            | 雇主       | withholding and wage records             | 年终           |      |
| UI            | 州 UI 季报         | 雇主       | wage records                             | 季报           |      |

## Maryland (MD)

### 个人

| 税种         | 表格  | 适用范围                   | 依赖附件 / 常见附件                                                                                               | 截止日期          | 备注 |
| ------------ | ----- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `502` | Maryland 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、county/local allocation support | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格             | 适用范围   | 依赖附件 / 常见附件                      | 截止日期              | 备注                                                                   |
| ------------- | ---------------- | ---------- | ---------------------------------------- | --------------------- | ---------------------------------------------------------------------- |
| 企业所得税    | `500`            | 企业纳税人 | [联邦报税副本](#att-federal-return-copy) | 按年报规则            |                                                                        |
| 销售 / 使用税 | `bFile` 或州门户 | 卖家       | [sales detail](#att-sales-detail)        | 按 assigned frequency |                                                                        |
| 代扣工资税    | `MW506`          | 雇主       | [payroll records](#att-payroll-records)  | 周期申报              |                                                                        |
| 代扣工资税    | `MW508`          | 雇主       | [payroll records](#att-payroll-records)  | 周期申报              |                                                                        |
| 代扣工资税    | `MW508CR`        | 雇主       | [payroll records](#att-payroll-records)  | 年终                  |                                                                        |
| UI            | 州 UI 季报       | 雇主       | [payroll records](#att-payroll-records)  | 季报                  | Maryland 仍有州 estate / inheritance tax 场景，非日常 recurring return |

## Massachusetts (MA)

### 个人

| 税种         | 表格      | 适用范围                                  | 依赖附件 / 常见附件                                                                                    | 截止日期          | 备注 |
| ------------ | --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------- | ---- |
| 州个人所得税 | `Form 1`  | Massachusetts 居民个人                    | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、`Schedule B / D / E` | 通常 `2026-04-15` |      |
| 州个人所得税 | `1-NR/PY` | Massachusetts 非居民 / part-year resident | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、`Schedule B / D / E` | 通常 `2026-04-15` |      |

### 企业

| 税种             | 表格       | 适用范围                | 依赖附件 / 常见附件                                                                         | 截止日期              | 备注                            |
| ---------------- | ---------- | ----------------------- | ------------------------------------------------------------------------------------------- | --------------------- | ------------------------------- |
| Corporate Excise | `Form 355` | corporate excise 纳税人 | [联邦报税副本](#att-federal-return-copy)、[apportionment detail](#att-apportionment-detail) | 按年报规则            | S corp / partnership 另有对应表 |
| 销售税           | `ST-9`     | 卖家                    | sales records                                                                               | 按 assigned frequency |                                 |
| 代扣工资税       | `M-941`    | 雇主                    | sales and [payroll records](#att-payroll-records)                                           | 周期申报              |                                 |
| 代扣工资税       | `M-942`    | 雇主                    | sales and [payroll records](#att-payroll-records)                                           | 周期申报              |                                 |
| 代扣工资税       | `MW-3`     | 雇主                    | sales and [payroll records](#att-payroll-records)                                           | 年终                  |                                 |
| UI               | 州 UI 季报 | 雇主                    | [payroll records](#att-payroll-records)                                                     | 季报                  |                                 |

## Michigan (MI)

### 个人

| 税种         | 表格      | 适用范围                   | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | --------- | -------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `MI-1040` | Michigan 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种                 | 表格                       | 适用范围   | 依赖附件 / 常见附件                                      | 截止日期              | 备注 |
| -------------------- | -------------------------- | ---------- | -------------------------------------------------------- | --------------------- | ---- |
| Corporate Income Tax | `Form 4891` 系列           | CIT 纳税人 | [联邦报税副本](#att-federal-return-copy)、CIT workpapers | 按年报规则            |      |
| 销售 / 使用税        | `Michigan Treasury Online` | 卖家       | combined sales/use detail                                | 按 assigned frequency |      |
| 代扣工资税           | `Michigan Treasury Online` | 雇主       | combined withholding detail                              | 周期申报 + 年终       |      |
| UI                   | 州 UI 季报                 | 雇主       | [payroll register](#att-payroll-register)                | 季报                  |      |

## Minnesota (MN)

### 个人

| 税种         | 表格 | 适用范围                    | 依赖附件 / 常见附件                                                                                 | 截止日期          | 备注 |
| ------------ | ---- | --------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `M1` | Minnesota 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |

### 企业

| 税种                    | 表格         | 适用范围            | 依赖附件 / 常见附件                                                                                            | 截止日期                       | 备注 |
| ----------------------- | ------------ | ------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---- |
| Corporate Franchise Tax | `M4`         | 企业或 pass-through | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1)、[apportionment detail](#att-apportionment-detail) | 按年报规则                     |      |
| 销售 / 使用税           | `e-Services` | 卖家                | [sales detail](#att-sales-detail)                                                                              | 按 assigned frequency          |      |
| 代扣工资税              | `e-Services` | 雇主                | wage records                                                                                                   | 按月 / 季并年终 reconciliation |      |
| UI                      | 州 UI 季报   | 雇主                | wage records                                                                                                   | 季报                           |      |

## Mississippi (MS)

### 个人

| 税种         | 表格     | 适用范围                      | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | -------- | ----------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `80-105` | Mississippi 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格       | 适用范围   | 依赖附件 / 常见附件                                            | 截止日期              | 备注 |
| ------------- | ---------- | ---------- | -------------------------------------------------------------- | --------------------- | ---- |
| 企业所得税    | `83-105`   | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)                       | 按年报规则            |      |
| 销售 / 使用税 | `TAP`      | 卖家       | [sales detail](#att-sales-detail)                              | 按 assigned frequency |      |
| 代扣工资税    | `89-140`   | 雇主       | [withholding records](#att-withholding-records)、W-2/1099 上传 | 周期申报 + 年终       |      |
| UI            | 州 UI 季报 | 雇主       | [UI wage detail](#att-ui-wage-detail)                          | 季报                  |      |

## Missouri (MO)

### 个人

| 税种         | 表格      | 适用范围                   | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | --------- | -------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `MO-1040` | Missouri 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格              | 适用范围   | 依赖附件 / 常见附件                      | 截止日期              | 备注 |
| ------------- | ----------------- | ---------- | ---------------------------------------- | --------------------- | ---- |
| 企业所得税    | `MO-1120`         | 企业纳税人 | [联邦报税副本](#att-federal-return-copy) | 按年报规则            |      |
| 销售 / 使用税 | `53-1` 或在线申报 | 卖家       | [sales journals](#att-sales-journals)    | 按 assigned frequency |      |
| 代扣工资税    | `MO-941`          | 雇主       | withholding and wage records             | 周期申报              |      |
| 代扣工资税    | `MO-W3`           | 雇主       | withholding and wage records             | 年终                  |      |
| UI            | 州 UI 季报        | 雇主       | wage records                             | 季报                  |      |

## Montana (MT)

### 个人

| 税种         | 表格     | 适用范围                  | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | -------- | ------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `Form 2` | Montana 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种                    | 表格                           | 适用范围               | 依赖附件 / 常见附件                                                                         | 截止日期        | 备注 |
| ----------------------- | ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------- | --------------- | ---- |
| Corporation License Tax | `CIT`                          | 企业纳税人             | [联邦报税副本](#att-federal-return-copy)、[apportionment detail](#att-apportionment-detail) | 按年报规则      |      |
| 销售 / 使用税           | 无 general statewide sales tax |                        |                                                                                             |                 |      |
| 代扣工资税              | 州门户 + 年终 reconciliation   | 有工资税义务雇主       | withholding and wage records                                                                | 周期申报 + 年终 |      |
| UI                      | 州 UI 季报                     | 有工资税 / UI 义务雇主 | wage records                                                                                | 季报            |      |

## Nebraska (NE)

### 个人

| 税种         | 表格    | 适用范围                   | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | ------- | -------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `1040N` | Nebraska 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格       | 适用范围   | 依赖附件 / 常见附件                             | 截止日期              | 备注                                                                     |
| ------------- | ---------- | ---------- | ----------------------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| 企业所得税    | `1120N`    | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)        | 按年报规则            |                                                                          |
| 销售 / 使用税 | `Form 10`  | 卖家       | [sales detail](#att-sales-detail)               | 按 assigned frequency |                                                                          |
| 代扣工资税    | `501N`     | 雇主       | [withholding records](#att-withholding-records) | 周期申报              |                                                                          |
| 代扣工资税    | `W-3N`     | 雇主       | [withholding records](#att-withholding-records) | 年终                  |                                                                          |
| UI            | 州 UI 季报 | 雇主       | UI wage records                                 | 季报                  | Nebraska inheritance tax 为县级管理，不是 statewide DOR recurring return |

## Nevada (NV)

### 个人

| 税种         | 表格 | 适用范围       | 依赖附件 / 常见附件 | 截止日期 | 备注 |
| ------------ | ---- | -------------- | ------------------- | -------- | ---- |
| 州个人所得税 | `无` | 无州个人所得税 |                     |          |      |

### 企业

| 税种                             | 表格                                         | 适用范围                                                             | 依赖附件 / 常见附件                   | 截止日期              | 备注                    |
| -------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------- | --------------------- | ----------------------- |
| Commerce / Modified Business Tax | `Commerce Tax` 年报；`Modified Business Tax` | 在 Nevada 有 gross revenue、sales tax 或 payroll nexus 的企业 / 雇主 | gross revenue detail、NAICS support   | 按年报 / 周期申报规则 | 无 corporate income tax |
| 销售 / 使用税                    | `Nevada Tax Center`                          | 卖家                                                                 | [sales journals](#att-sales-journals) | 按 assigned frequency |                         |
| 代扣工资税                       | `无`                                         | 无州工资代扣税                                                       |                                       |                       |                         |
| UI                               | 州 UI 季报                                   | 雇主                                                                 | payroll / UI wage records             | 季报                  |                         |

## New Hampshire (NH)

### 个人

| 税种         | 表格 | 适用范围                                                                                 | 依赖附件 / 常见附件 | 截止日期 | 备注 |
| ------------ | ---- | ---------------------------------------------------------------------------------------- | ------------------- | -------- | ---- |
| 州个人所得税 | `无` | 无 wages income tax；`Interest & Dividends Tax` 已对 `2025` 起废止；无 general sales tax |                     |          |      |

### 企业

| 税种                       | 表格                                                          | 适用范围                                                     | 依赖附件 / 常见附件                                                                                                 | 截止日期   | 备注                  |
| -------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------- |
| BPT / BET                  | `Business Profits Tax (BPT)`；`Business Enterprise Tax (BET)` | 在 NH 有 business profits / business enterprise tax 义务主体 | [联邦报税副本](#att-federal-return-copy)、[财务报表](#att-financial-statements)、gross receipts / compensation base | 按年报规则 | `Granite Tax Connect` |
| Meals & Rooms Tax 等专项税 | `Granite Tax Connect`                                         | 有专项税义务主体                                             | meals & rooms detail                                                                                                | 周期申报   | 无 general sales tax  |
| 代扣工资税                 | `无`                                                          | 无州工资代扣税                                               |                                                                                                                     |            |                       |
| UI                         | 州 UI 季报                                                    | 雇主                                                         | UI wage records                                                                                                     | 季报       |                       |

## New Jersey (NJ)

### 个人

| 税种         | 表格      | 适用范围                     | 依赖附件 / 常见附件                                                                                 | 截止日期          | 备注 |
| ------------ | --------- | ---------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `NJ-1040` | New Jersey 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |

### 企业

| 税种                     | 表格       | 适用范围      | 依赖附件 / 常见附件                                         | 截止日期              | 备注                               |
| ------------------------ | ---------- | ------------- | ----------------------------------------------------------- | --------------------- | ---------------------------------- |
| Corporation Business Tax | `CBT-100`  | 企业纳税人    | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | 按年报规则            |                                    |
| Corporation Business Tax | `CBT-100S` | S corp 纳税人 | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | 按年报规则            |                                    |
| 销售税                   | `ST-50`    | 卖家          | [sales journals](#att-sales-journals)                       | 按 assigned frequency |                                    |
| 代扣工资税               | `NJ-927`   | 雇主          | withholding / wage detail、payroll contribution detail      | 周期申报              |                                    |
| 代扣工资税               | `NJ-W-3`   | 雇主          | withholding / wage detail、payroll contribution detail      | 年终                  |                                    |
| UI                       | `WR-30`    | 雇主          | wage detail                                                 | 季报                  | UI / temporary disability 一并处理 |
| UI                       | 州 UI 季报 | 雇主          | wage detail                                                 | 季报                  | New Jersey inheritance tax 仍在    |

## New Mexico (NM)

### 个人

| 税种         | 表格    | 适用范围                     | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | ------- | ---------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `PIT-1` | New Mexico 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种                                        | 表格       | 适用范围                            | 依赖附件 / 常见附件                                                                                  | 截止日期   | 备注 |
| ------------------------------------------- | ---------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------- | ---- |
| 企业所得税                                  | `CIT-1`    | 企业纳税人                          | [联邦报税副本](#att-federal-return-copy)                                                             | 按年报规则 |      |
| Gross Receipts / Compensating / Withholding | `CRS-1`    | gross receipts / withholding 纳税人 | [gross receipts detail](#att-gross-receipts-detail)、[withholding records](#att-withholding-records) | 周期申报   |      |
| UI                                          | 州 UI 季报 | 雇主                                | [UI wage detail](#att-ui-wage-detail)                                                                | 季报       |      |

## New York (NY)

### 个人

| 税种         | 表格     | 适用范围            | 依赖附件 / 常见附件                                                                                 | 截止日期          | 备注 |
| ------------ | -------- | ------------------- | --------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `IT-201` | New York 居民个人   | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |
| 州个人所得税 | `IT-203` | New York 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |

### 企业

| 税种       | 表格          | 适用范围                | 依赖附件 / 常见附件                                         | 截止日期              | 备注                  |
| ---------- | ------------- | ----------------------- | ----------------------------------------------------------- | --------------------- | --------------------- |
| 企业所得税 | `CT-3`        | C corp                  | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | 按年报规则            |                       |
| 企业所得税 | `CT-3-S`      | S corp                  | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | 按年报规则            |                       |
| 企业所得税 | `CT-4`        | 某些特殊 / 短表企业申报 | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | 按年报规则            |                       |
| 销售税     | `ST-100` 系列 | 卖家                    | [sales detail](#att-sales-detail)                           | 按 assigned frequency |                       |
| 代扣工资税 | `NYS-45`      | 雇主                    | [payroll records](#att-payroll-records)                     | 季报                  | UI 常并入 `NYS-45`    |
| UI         | `NYS-45`      | 雇主                    | [payroll records](#att-payroll-records)                     | 季报                  | 区域性 `MCTMT` 等另算 |

## North Carolina (NC)

### 个人

| 税种         | 表格    | 适用范围                         | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | ------- | -------------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `D-400` | North Carolina 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种       | 表格       | 适用范围   | 依赖附件 / 常见附件                             | 截止日期              | 备注 |
| ---------- | ---------- | ---------- | ----------------------------------------------- | --------------------- | ---- |
| 企业所得税 | `CD-405`   | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)        | 按年报规则            |      |
| 销售税     | `E-500`    | 卖家       | [sales journals](#att-sales-journals)           | 按 assigned frequency |      |
| 代扣工资税 | `NC-5`     | 雇主       | [withholding records](#att-withholding-records) | 周期申报              |      |
| 代扣工资税 | `NC-3`     | 雇主       | [withholding records](#att-withholding-records) | 年终                  |      |
| UI         | 州 UI 季报 | 雇主       | [UI wage detail](#att-ui-wage-detail)           | 季报                  |      |

## North Dakota (ND)

### 个人

| 税种         | 表格   | 适用范围                       | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | ------ | ------------------------------ | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `ND-1` | North Dakota 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格                   | 适用范围   | 依赖附件 / 常见附件                      | 截止日期              | 备注 |
| ------------- | ---------------------- | ---------- | ---------------------------------------- | --------------------- | ---- |
| 企业所得税    | `Form 40`              | 企业纳税人 | [联邦报税副本](#att-federal-return-copy) | 按年报规则            |      |
| 销售 / 使用税 | `TAP`                  | 卖家       | [sales detail](#att-sales-detail)        | 按 assigned frequency |      |
| 代扣工资税    | `306 / 307` 或在线申报 | 雇主       | withholding / wage records               | 周期申报 + 年终       |      |
| UI            | 州 UI 季报             | 雇主       | wage records                             | 季报                  |      |

## Ohio (OH)

### 个人

| 税种         | 表格      | 适用范围               | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | --------- | ---------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `IT 1040` | Ohio 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种                    | 表格              | 适用范围                 | 依赖附件 / 常见附件                                 | 截止日期                       | 备注                                |
| ----------------------- | ----------------- | ------------------------ | --------------------------------------------------- | ------------------------------ | ----------------------------------- |
| Commercial Activity Tax | `CAT` 年报 / 季报 | 有 CAT 义务的企业 / 雇主 | [gross receipts detail](#att-gross-receipts-detail) | 按门槛规则                     | 多数企业无一般 corporate income tax |
| 销售税                  | `UST-1`           | 卖家                     | [sales journals](#att-sales-journals)               | 按 assigned frequency          |                                     |
| 代扣工资税              | `IT 501`          | 雇主                     | withholding and UI wage records                     | 周期申报 + 年终 reconciliation |                                     |
| UI                      | 州 UI 季报        | 雇主                     | wage records                                        | 季报                           |                                     |

## Oklahoma (OK)

### 个人

| 税种         | 表格  | 适用范围                   | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | ----- | -------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `511` | Oklahoma 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格           | 适用范围   | 依赖附件 / 常见附件                             | 截止日期              | 备注 |
| ------------- | -------------- | ---------- | ----------------------------------------------- | --------------------- | ---- |
| 企业所得税    | `512 / 512-S`  | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)        | 按年报规则            |      |
| 销售 / 使用税 | `OTC` 周期申报 | 卖家       | [sales journals](#att-sales-journals)           | 按 assigned frequency |      |
| 代扣工资税    | `WTH10001`     | 雇主       | [withholding records](#att-withholding-records) | 周期申报              |      |
| 代扣工资税    | `WTH10003`     | 雇主       | [withholding records](#att-withholding-records) | 年终                  |      |
| UI            | 州 UI 季报     | 雇主       | [UI wage detail](#att-ui-wage-detail)           | 季报                  |      |

## Oregon (OR)

### 个人

| 税种         | 表格     | 适用范围                  | 依赖附件 / 常见附件                                                                                 | 截止日期          | 备注 |
| ------------ | -------- | ------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `OR-40`  | Oregon 居民个人           | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |
| 州个人所得税 | `OR-40N` | Oregon 非居民个人         | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |
| 州个人所得税 | `OR-40P` | Oregon part-year resident | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |

### 企业

| 税种                 | 表格                                  | 适用范围                      | 依赖附件 / 常见附件                                                                         | 截止日期   | 备注 |
| -------------------- | ------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------- | ---------- | ---- |
| 企业所得税 / CAT     | `OR-20 / OR-20-S / OR-65`；`CAT` 年报 | 企业纳税人；有 CAT 义务主体   | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1)、CAT commercial activity detail | 按年报规则 |      |
| 销售 / 使用税        | 无 general sales tax                  |                               |                                                                                             |            |      |
| 代扣工资税 / Transit | `Form OQ` 体系                        | 有 payroll / transit 义务主体 | payroll / transit records                                                                   | 季报       |      |
| UI                   | `Form OQ` 体系                        | 雇主                          | UI records                                                                                  | 季报       |      |

## Pennsylvania (PA)

### 个人

| 税种         | 表格    | 适用范围                       | 依赖附件 / 常见附件                                                                                      | 截止日期          | 备注 |
| ------------ | ------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `PA-40` | Pennsylvania 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、PA class-income detail | 通常 `2026-04-15` |      |

### 企业

| 税种       | 表格                           | 适用范围   | 依赖附件 / 常见附件                      | 截止日期              | 备注                                                         |
| ---------- | ------------------------------ | ---------- | ---------------------------------------- | --------------------- | ------------------------------------------------------------ |
| 企业所得税 | `RCT-101`                      | 企业纳税人 | [联邦报税副本](#att-federal-return-copy) | 按年报规则            |                                                              |
| 销售税     | `PA-3`                         | 卖家       | [sales journals](#att-sales-journals)    | 按 assigned frequency |                                                              |
| 代扣工资税 | `myPATH` + 年终 reconciliation | 雇主       | withholding and wage records             | 周期申报 + 年终       |                                                              |
| UI         | 州 UI 季报                     | 雇主       | wage records                             | 季报                  | 州 inheritance tax return `REV-1500` 通常为死亡后 `9` 个月内 |

## Rhode Island (RI)

### 个人

| 税种         | 表格      | 适用范围                       | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | --------- | ------------------------------ | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `RI-1040` | Rhode Island 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格       | 适用范围   | 依赖附件 / 常见附件                      | 截止日期              | 备注 |
| ------------- | ---------- | ---------- | ---------------------------------------- | --------------------- | ---- |
| 企业所得税    | `RI-1120C` | 企业纳税人 | [联邦报税副本](#att-federal-return-copy) | 按年报规则            |      |
| 销售 / 使用税 | 州门户     | 卖家       | [sales detail](#att-sales-detail)        | 按 assigned frequency |      |
| 代扣工资税    | `RI-941`   | 雇主       | withholding / wage records               | 周期申报              |      |
| 代扣工资税    | `RI-W3`    | 雇主       | withholding / wage records               | 年终                  |      |
| UI            | 州 UI 季报 | 雇主       | wage records                             | 季报                  |      |

## South Carolina (SC)

### 个人

| 税种         | 表格     | 适用范围                         | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | -------- | -------------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `SC1040` | South Carolina 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种       | 表格       | 适用范围   | 依赖附件 / 常见附件                             | 截止日期              | 备注 |
| ---------- | ---------- | ---------- | ----------------------------------------------- | --------------------- | ---- |
| 企业所得税 | `SC1120`   | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)        | 按年报规则            |      |
| 销售税     | `ST-3`     | 卖家       | [sales journals](#att-sales-journals)           | 按 assigned frequency |      |
| 代扣工资税 | `WH-1605`  | 雇主       | [withholding records](#att-withholding-records) | 周期申报              |      |
| 代扣工资税 | `WH-1606`  | 雇主       | [withholding records](#att-withholding-records) | 年终                  |      |
| UI         | 州 UI 季报 | 雇主       | [UI wage detail](#att-ui-wage-detail)           | 季报                  |      |

## South Dakota (SD)

### 个人

| 税种         | 表格 | 适用范围       | 依赖附件 / 常见附件 | 截止日期 | 备注 |
| ------------ | ---- | -------------- | ------------------- | -------- | ---- |
| 州个人所得税 | `无` | 无州个人所得税 |                     |          |      |

### 企业

| 税种           | 表格                                 | 适用范围                         | 依赖附件 / 常见附件                   | 截止日期              | 备注                    |
| -------------- | ------------------------------------ | -------------------------------- | ------------------------------------- | --------------------- | ----------------------- |
| 州级营业相关税 | contractor’s excise / tourism tax 等 | 在 South Dakota 有相关税义务主体 | contractor / tourism tax detail       | 按年报 / 周期规则     | 无 corporate income tax |
| 销售 / 使用税  | 州门户                               | 有销售税义务主体                 | [sales journals](#att-sales-journals) | 按 assigned frequency |                         |
| 代扣工资税     | `无`                                 | 无州工资代扣税                   |                                       |                       |                         |
| UI             | 州 UI 季报                           | 雇主                             | payroll / UI wage records             | 季报                  |                         |

## Tennessee (TN)

### 个人

| 税种         | 表格 | 适用范围                                               | 依赖附件 / 常见附件 | 截止日期 | 备注 |
| ------------ | ---- | ------------------------------------------------------ | ------------------- | -------- | ---- |
| 州个人所得税 | `无` | 无州个人所得税；`Hall Income Tax` 自 `2021` 税年起废止 |                     |          |      |

### 企业

| 税种                                  | 表格        | 适用范围                                  | 依赖附件 / 常见附件                                                                                                        | 截止日期           | 备注 |
| ------------------------------------- | ----------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---- |
| Franchise & Excise Tax / Business Tax | `FAE170` 等 | Tennessee 企业纳税人；business tax 纳税人 | [联邦报税副本](#att-federal-return-copy)、财务报表、net worth / property base detail、gross receipts / business tax detail | 按年报规则         |      |
| 销售 / 使用税                         | 州周期申报  | 销售税纳税人                              | [sales journals](#att-sales-journals)                                                                                      | 一般在次月 `20` 日 |      |
| 代扣工资税                            | `无`        | 无州工资代扣税                            |                                                                                                                            |                    |      |
| UI                                    | 州 UI 季报  | 雇主                                      | UI wage records                                                                                                            | 季报               |      |

## Texas (TX)

### 个人

| 税种         | 表格 | 适用范围       | 依赖附件 / 常见附件 | 截止日期 | 备注 |
| ------------ | ---- | -------------- | ------------------- | -------- | ---- |
| 州个人所得税 | `无` | 无州个人所得税 |                     |          |      |

### 企业

| 税种          | 表格                   | 适用范围                   | 依赖附件 / 常见附件                                                                                | 截止日期         | 备注                        |
| ------------- | ---------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- | ---------------- | --------------------------- |
| Franchise Tax | `Franchise Tax Report` | Texas franchise tax 纳税人 | [联邦报税副本](#att-federal-return-copy)、annualized revenue detail、margin computation workpapers | 常见截止 `05-15` | 表号因门槛 / 实体不同而变化 |
| 销售 / 使用税 | 州周期申报             | 销售税卖家                 | [sales journals](#att-sales-journals)                                                              | 通常次月 `20` 日 |                             |
| 代扣工资税    | `无`                   | 无州工资代扣税             |                                                                                                    |                  |                             |
| UI            | 州 UI 季报             | 雇主                       | UI wage records                                                                                    | 季报             |                             |

## Utah (UT)

### 个人

| 税种         | 表格    | 适用范围               | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | ------- | ---------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `TC-40` | Utah 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格             | 适用范围   | 依赖附件 / 常见附件                             | 截止日期              | 备注 |
| ------------- | ---------------- | ---------- | ----------------------------------------------- | --------------------- | ---- |
| 企业所得税    | `TC-20 / TC-20S` | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)        | 按年报规则            |      |
| 销售 / 使用税 | `TAP`            | 卖家       | [sales detail](#att-sales-detail)               | 按 assigned frequency |      |
| 代扣工资税    | `TC-941`         | 雇主       | [withholding records](#att-withholding-records) | 周期申报              |      |
| UI            | 州 UI 季报       | 雇主       | [UI wage detail](#att-ui-wage-detail)           | 季报                  |      |

## Vermont (VT)

### 个人

| 税种         | 表格     | 适用范围                  | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | -------- | ------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `IN-111` | Vermont 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格       | 适用范围   | 依赖附件 / 常见附件                      | 截止日期              | 备注 |
| ------------- | ---------- | ---------- | ---------------------------------------- | --------------------- | ---- |
| 企业所得税    | `CO-411`   | 企业纳税人 | [联邦报税副本](#att-federal-return-copy) | 按年报规则            |      |
| 销售 / 使用税 | `SU-451`   | 卖家       | [sales journals](#att-sales-journals)    | 按 assigned frequency |      |
| 代扣工资税    | `WH-431`   | 雇主       | withholding and wage records             | 周期申报              |      |
| 代扣工资税    | `WHT-434`  | 雇主       | withholding and wage records             | 年终                  |      |
| UI            | 州 UI 季报 | 雇主       | wage records                             | 季报                  |      |

## Virginia (VA)

### 个人

| 税种         | 表格    | 适用范围                    | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | ------- | --------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `760`   | Virginia 居民个人           | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-05-01` |      |
| 州个人所得税 | `763`   | Virginia 非居民个人         | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-05-01` |      |
| 州个人所得税 | `760PY` | Virginia part-year resident | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-05-01` |      |

### 企业

| 税种       | 表格       | 适用范围   | 依赖附件 / 常见附件                             | 截止日期              | 备注 |
| ---------- | ---------- | ---------- | ----------------------------------------------- | --------------------- | ---- |
| 企业所得税 | `500`      | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)        | 按年报规则            |      |
| 销售税     | `ST-9`     | 卖家       | [sales detail](#att-sales-detail)               | 按 assigned frequency |      |
| 代扣工资税 | `VA-5`     | 雇主       | [withholding records](#att-withholding-records) | 视 remitter 类别      |      |
| 代扣工资税 | `VA-15`    | 雇主       | [withholding records](#att-withholding-records) | 视 remitter 类别      |      |
| 代扣工资税 | `VA-16`    | 雇主       | [withholding records](#att-withholding-records) | 视 remitter 类别      |      |
| 代扣工资税 | `VA-6`     | 雇主       | [withholding records](#att-withholding-records) | 视 remitter 类别      |      |
| UI         | 州 UI 季报 | 雇主       | UI wage records                                 | 季报                  |      |

## Washington (WA)

### 个人

| 税种                     | 表格                    | 适用范围                     | 依赖附件 / 常见附件                                                              | 截止日期                                        | 备注               |
| ------------------------ | ----------------------- | ---------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------ |
| Capital Gains Excise Tax | 州 capital gains return | 有 WA capital gains 义务个人 | 联邦 `Schedule D / Form 8949`、[capital gains detail](#att-capital-gains-detail) | `2025` return 因联邦灾害延期，截止 `2026-05-01` | 无一般州个人所得税 |

### 企业

| 税种          | 表格                         | 适用范围                      | 依赖附件 / 常见附件                   | 截止日期                                                                       | 备注                    |
| ------------- | ---------------------------- | ----------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ | ----------------------- |
| B&O / Excise  | `combined excise tax return` | 有 B&O / sales tax nexus 企业 | B&O gross receipts records            | 月 / 季 / 年                                                                   | 无 corporate income tax |
| 销售 / 使用税 | `combined excise tax return` | 卖家                          | [sales journals](#att-sales-journals) | 月报通常次月 `25` 日；季报通常季度后次月末；年报 `2025` return 为 `2026-04-15` |                         |
| 代扣工资税    | `无`                         | 无州工资代扣税                |                                       |                                                                                |                         |
| UI            | 州 UI 季报                   | 雇主                          | UI wage records                       | 季报                                                                           | 日期易受灾害延期影响    |

## West Virginia (WV)

### 个人

| 税种         | 表格     | 适用范围                        | 依赖附件 / 常见附件                                                              | 截止日期          | 备注 |
| ------------ | -------- | ------------------------------- | -------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `IT-140` | West Virginia 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格                         | 适用范围   | 依赖附件 / 常见附件                             | 截止日期              | 备注 |
| ------------- | ---------------------------- | ---------- | ----------------------------------------------- | --------------------- | ---- |
| 企业所得税    | `CNF-120`                    | 企业纳税人 | [联邦报税副本](#att-federal-return-copy)        | 按年报规则            |      |
| 销售 / 使用税 | `MyTaxes`                    | 卖家       | [sales detail](#att-sales-detail)               | 按 assigned frequency |      |
| 代扣工资税    | 州门户 + 年终 reconciliation | 雇主       | [withholding records](#att-withholding-records) | 周期申报 + 年终       |      |
| UI            | 州 UI 季报                   | 雇主       | [UI wage detail](#att-ui-wage-detail)           | 季报                  |      |

## Wisconsin (WI)

### 个人

| 税种         | 表格     | 适用范围                    | 依赖附件 / 常见附件                                                                                 | 截止日期          | 备注 |
| ------------ | -------- | --------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 州个人所得税 | `Form 1` | Wisconsin 居民 / 非居民个人 | [联邦报税副本](#att-federal-return-copy)、[`W-2`](#att-w-2)、[`1099`](#att-1099)、[`K-1`](#att-k-1) | 通常 `2026-04-15` |      |

### 企业

| 税种          | 表格       | 适用范围            | 依赖附件 / 常见附件                                         | 截止日期              | 备注                              |
| ------------- | ---------- | ------------------- | ----------------------------------------------------------- | --------------------- | --------------------------------- |
| 企业所得税    | `Form 4`   | 企业或 pass-through | [联邦报税副本](#att-federal-return-copy)、[`K-1`](#att-k-1) | 按年报规则            | S corp / partnership 另有对应州表 |
| 销售 / 使用税 | `ST-12`    | 卖家                | [sales journals](#att-sales-journals)                       | 按 assigned frequency |                                   |
| 代扣工资税    | `WT-6`     | 雇主                | withholding and wage records                                | 周期申报              |                                   |
| 代扣工资税    | `WT-7`     | 雇主                | withholding and wage records                                | 周期申报              |                                   |
| 代扣工资税    | `WT-11`    | 雇主                | withholding and wage records                                | 年终                  |                                   |
| UI            | 州 UI 季报 | 雇主                | wage records                                                | 季报                  |                                   |

## Wyoming (WY)

### 个人

| 税种         | 表格 | 适用范围       | 依赖附件 / 常见附件 | 截止日期 | 备注 |
| ------------ | ---- | -------------- | ------------------- | -------- | ---- |
| 州个人所得税 | `无` | 无州个人所得税 |                     |          |      |

### 企业

| 税种          | 表格             | 适用范围                  | 依赖附件 / 常见附件                                               | 截止日期              | 备注 |
| ------------- | ---------------- | ------------------------- | ----------------------------------------------------------------- | --------------------- | ---- |
| 企业所得税    | 无               | 无州 corporate income tax |                                                                   |                       |      |
| 销售 / 使用税 | `WYIFS` / 州门户 | 有销售税义务主体          | [sales journals](#att-sales-journals)、exemption / resale support | 按 assigned frequency |      |
| 代扣工资税    | `无`             | 无州工资代扣税            |                                                                   |                       |      |
| UI            | 州 UI 季报       | 有雇员的主体              | UI wage records                                                   | 季报                  |      |

## 建模建议

| 主题         | 建议                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 税种拆分     | `annual income return`、`estimated payment`、`sales/use recurring return`、`withholding recurring return`、`UI quarterly return`、`entity-level special tax` |
| 纳税人维度   | `resident individual`、`nonresident individual`、`C corp`、`S corp`、`partnership`、`LLC`、`employer`、`remote seller / marketplace facilitator`             |
| 附件字段     | 建议单独建 `required_supporting_documents[]` 与 `common_schedules[]`，不要把所有附件只塞进一个字符串                                                         |
| 适用范围字段 | 建议单独建 `applies_to[]`，如 `resident_individual`、`nonresident_individual`、`c_corp`、`s_corp`、`partnership`、`llc`、`employer`、`seller_with_nexus`     |
| 截止日期字段 | 不要只存单个日期；至少支持固定绝对日期、`税期结束后第 N 天`、`次月第 N 日`、`季度后月末`、`与联邦同日`、`州灾害延期覆盖`、`按 filing frequency 分支`         |

## 高风险点

| 风险点                     | 说明                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| 州销售税 / 代扣税 / UI     | 往往不是单一表号，而是 `assigned filing frequency + online return`                           |
| 实体类型差异               | 一些州对 S corp、partnership、PTE elective tax、composite return 另外有主表，不能只看 C corp |
| 适用范围列口径             | 本文件适用范围列写的是高层级适用对象，不是法条定义的完整纳税人分类                           |
| 附件列口径                 | 本文件附件列写的是常见依赖资料，不是每州完整 statutory attachment list                       |
| 州死亡税 / 地方税 / 专项税 | 本文件没有做完全穷尽                                                                         |
| Washington 日期            | 2025 capital gains due date 因联邦灾害延期改到 `2026-05-01`，这类事件会实时变化              |

## 已核验的代表性州级官方来源

| 主题                                        | 官方链接                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Georgia due dates                           | https://dor.georgia.gov/taxes/tax-faqs-due-dates-and-other-resources/tax-due-dates            |
| Connecticut resident income tax / estimates | https://portal.ct.gov/DRS/Individuals/Resident-Income-Tax/Tax-Information                     |
| Connecticut withholding                     | https://portal.ct.gov/DRS/Withholding-Taxes/Tax-Information                                   |
| Washington capital gains tax                | https://dor.wa.gov/taxes-rates/other-taxes/capital-gains-tax                                  |
| Washington filing frequencies               | https://dor.wa.gov/file-pay-taxes/filing-frequencies-due-dates                                |
| Pennsylvania inheritance tax                | https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/inheritance-tax       |
| New Jersey inheritance tax                  | https://www.nj.gov/treasury/taxation/inheritance-estate/inheritance.shtml                     |
| Tennessee Hall tax repeal                   | https://www.tn.gov/revenue/taxes/hall-income-tax.html                                         |
| Iowa inheritance tax guidance               | https://revenue.iowa.gov/taxes/tax-guidance/inheritance-tax/introduction-iowa-inheritance-tax |

## 常见附件说明

| 附件 / 资料                                                           | 说明                                                              | 常见来源                                |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| <a id="att-federal-return-copy"></a>联邦报税副本                      | 指州申报常需附带或引用的联邦主表 / 联邦 return 数据               | `Form 1040`、`1120`、`1120-S`、`1065`   |
| <a id="att-w-2"></a>`W-2`                                             | 员工工资与联邦 / 州代扣税信息表                                   | 雇主或 payroll provider                 |
| <a id="att-1099"></a>`1099`                                           | 利息、股息、承包收入、退休金、券商、其他信息申报表的统称          | 银行、券商、付款人、平台                |
| <a id="att-k-1"></a>`K-1`                                             | pass-through 实体分配给股东 / 合伙人的收入、扣除、抵免明细        | `1120-S`、`1065`、trust / estate return |
| <a id="att-schedule-a"></a>`Schedule A`                               | 联邦个人 itemized deductions 附表                                 | `Form 1040`                             |
| <a id="att-schedule-b"></a>`Schedule B`                               | 联邦个人利息与股息附表                                            | `Form 1040`                             |
| <a id="att-schedule-c"></a>`Schedule C`                               | 联邦个人独资经营 / 单成员业务附表                                 | `Form 1040`                             |
| <a id="att-schedule-d"></a>`Schedule D`                               | 联邦个人资本利得 / 亏损附表                                       | `Form 1040`                             |
| <a id="att-schedule-e"></a>`Schedule E`                               | 联邦个人租赁、S corp、partnership、trust 等 pass-through 收入附表 | `Form 1040`                             |
| <a id="att-schedule-f"></a>`Schedule F`                               | 联邦个人农业收入 / 支出附表                                       | `Form 1040`                             |
| <a id="att-schedule-ca"></a>`Schedule CA`                             | California 个人州税对联邦收入项目的调整附表                       | California `Form 540 / 540NR`           |
| <a id="att-payroll-records"></a>payroll records                       | 员工工资、代扣、福利、工时等工资记录总称                          | payroll system / provider               |
| <a id="att-payroll-register"></a>payroll register                     | 按 pay period 汇总的工资台账 / register                           | payroll system / provider               |
| <a id="att-withholding-records"></a>withholding records               | 州 / 联邦代扣税明细、存税、年终对账资料                           | payroll system / tax deposits           |
| <a id="att-ui-wage-detail"></a>UI wage detail                         | 州失业保险申报所需的雇员季度工资明细                              | payroll system / UI reports             |
| <a id="att-sales-detail"></a>sales detail                             | 销售额、应税销售额、免税销售额、税率辖区拆分等明细                | POS / ERP / commerce platform           |
| <a id="att-sales-journals"></a>sales journals                         | 销售日记账、期间销售汇总                                          | ERP / accounting system                 |
| <a id="att-apportionment-detail"></a>apportionment detail             | 多州分摊所需的 sales / payroll / property factor 明细             | 税务工作底稿 / 财务系统                 |
| <a id="att-financial-statements"></a>财务报表                         | 资产负债表、利润表、现金流量表及相关试算平衡                      | 会计系统 / 审计报表                     |
| <a id="att-gross-receipts-detail"></a>gross receipts detail           | 总收入 / 商业收入税基计算明细                                     | ERP / tax workpapers                    |
| <a id="att-capital-gains-detail"></a>capital gains detail             | 资本利得交易明细、basis、持有期和销售净额                         | 券商报表、`1099-B`、交易记录            |
| <a id="att-net-worth-schedules"></a>net worth schedules               | 净资产 / equity / property base 相关工作底稿                      | 财务报表 / 税务工作底稿                 |
| <a id="att-resale-certificate-support"></a>resale certificate support | 转售证、免税证及其 supporting documents                           | 客户 exemption certificate 档案         |
| <a id="att-treaty-docs"></a>treaty docs                               | 税收协定主张、beneficial owner 声明、withholding certificates     | `W-8` 系列、withholding files           |
