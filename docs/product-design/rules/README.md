# Rules 产品设计册 · README

> 版本：v1.2（14 天 MVP · 2026-04-28）
> 上游：`docs/report/DueDateHQ - MVP 边界声明.md`、`docs/report/DueDateHQ-MVP-Deadline-Rules-Plan.md`、`docs/dev-file/03-Data-Model.md`
> 适用范围：Federal + CA / NY / TX / FL / WA 的 MVP deadline rules 资产、采集、审核、通知与页面设计

## 1. 本册定位

Rules 是 DueDateHQ MVP 的信任资产，不是普通配置页，也不是 AI 自动生成内容。MVP 要验证的是 CPA 是否愿意每周回来看一张可信的 deadline 分诊清单，因此 rules 的产品职责是：

- 从官方来源采集和留存 deadline 依据。
- 把原文结构化成可生成 obligations 的 verified rule。
- 区分 AI candidate、human verified rule 和需要 CPA 判断适用性的 rule。
- 让用户在 deadline row 上看见来源、核验状态和下一步检查建议。
- 让内部 ops 能发现来源变化、复核候选规则，并发布可消费的 rule pack。

内部一句话：

> Rules 把官方税务来源变成可审阅、可核验、可生成提醒的结构化 deadline 资产。

## 2. 当前 MVP 裁定

| 裁定     | 结论                                                                                        |
| -------- | ------------------------------------------------------------------------------------------- |
| 覆盖范围 | Federal + CA / NY / TX / FL / WA。MA 属于后续 Phase 0 扩展，不进入 14 天 MVP。              |
| 来源口径 | 只接受 IRS、州税局、FEMA 等官方来源作为 rule basis。第三方文章和社区内容只能做发现线索。    |
| AI 角色  | AI/parser 只能抽取 candidate，不能发布 verified rule，不能直接改客户 deadline。             |
| 用户提醒 | 只基于 verified rule 生成的 obligation 发送 30 / 7 / 1 天提醒。candidate 只触发内部复核。   |
| 临时延期 | disaster relief / emergency tax relief 进入 exception candidate，人工复核后再发布 overlay。 |
| 页面形态 | 先做内部 Rules Console；用户侧只在 deadline detail / source badge / AI Tip 中消费 rules。   |

## 3. 文档结构

| #   | 路径                                  | 用途                                                                       |
| --- | ------------------------------------- | -------------------------------------------------------------------------- |
| 00  | `README.md`                           | 本册入口、边界裁定、术语和维护约定                                         |
| 01  | `01-source-registry-and-rule-pack.md` | 官方来源注册表、采集方式、MVP 初始 rule pack、结构化数据模型、通知消费边界 |
| 02  | `02-rules-console-product-design.md`  | 内部 Rules Console 页面设计、用户路径、状态、空态、审核/发布流程           |

## 4. 当前实现落点

第一版结构化 rules asset 已落到 `packages/core/src/rules/index.ts`，并通过
`@duedatehq/core/rules` 暴露。`packages/contracts/src/rules.ts` 和
`apps/server/src/procedures/rules/index.ts` 已把它接进项目 oRPC surface，供后续
Rules Console 直接读取。当前实现包含：

| 资产             | 当前数量 | 说明                                                                                     |
| ---------------- | -------- | ---------------------------------------------------------------------------------------- |
| `RuleSource`     | 31       | Federal + CA / NY / TX / FL / WA 官方来源；含采集方式、频率、健康状态、通知通道          |
| `ObligationRule` | 26       | 25 条 verified rule + 1 条 Federal disaster relief candidate                             |
| 覆盖州           | 6        | `FED`、`CA`、`NY`、`TX`、`FL`、`WA`                                                      |
| 消费 API         | 4 个     | `rules.listSources`、`rules.listRules`、`rules.coverage`、`rules.previewObligations`     |
| Source health    | 1 个命令 | `pnpm rules:check-sources`；repo-level ops script，machine watch 与 manual review 分开报 |

当前实现仍然保持纯 domain asset，不直接写 D1。`packages/core/src/date-logic`
提供 DueDateLogic 展开纯函数，`packages/core/src/rules/index.ts` 已提供
`previewObligationsFromRules`，把客户事实、matrix tax types、verified rule、due date
logic 合成为 obligation preview。`rules.previewObligations` oRPC endpoint 暴露同一结果，
供 Rules Console、deadline detail 和后续 reminder worker 消费。

生成口径：

- `candidate` rule 不进入 preview。
- `coverageStatus!='full'`、`ruleTier='applicability_review'`、`requiresApplicabilityReview`
  或 source-defined calendar 只能生成 `requiresReview=true` 的 preview。
- 只有 verified、可匹配客户事实、可算出 concrete due date、且不需要人工复核的 preview
  才会标记 `reminderReady=true`。
- Preview input 只接受真实 client entity enum 和 MVP client states（`CA`、`NY`、`TX`、
  `FL`、`WA`）；`any_business` 与 `FED` 只用于 rule 侧，不作为 client 输入。
- default matrix 与 rule pack tax type 不一致时通过显式 alias 表转换，例如
  `ca_llc_franchise_min_800 -> ca_llc_annual_tax`、
  `ny_ptet_optional -> ny_ptet_election / ny_ptet_estimated_tax / ny_ptet`。

## 5. 规则分层

| 层级                   | 说明                                                               | 是否生成默认 obligation      | 是否触发用户提醒          |
| ---------------------- | ------------------------------------------------------------------ | ---------------------------- | ------------------------- |
| `basic`                | 长期稳定的常规 filing/payment/extension deadline                   | 是，发布后生成               | 是                        |
| `annual_rolling`       | 每年官方日历或 instructions 更新的规则                             | 是，按 tax year 发布         | 是                        |
| `exception`            | IRS/州 emergency relief、disaster postponement、临时延期           | 复核后才生成 overlay         | 复核发布后才提醒          |
| `applicability_review` | 适用性依赖客户事实的规则，例如 affected taxpayer、PTET eligibility | 可展示为需核验，不默认下结论 | 可提醒 CPA 核验，不给结论 |

## 6. 关键产品原则

1. **Verified 才能影响客户数据**  
   `candidate`、`needs_review`、`watch_changed` 不允许更新 `obligation_instance.current_due_date`，也不允许触发客户级 reminder。

2. **每条 rule 必须能单独审阅**  
   Rule detail 必须展示 source URL、source title、authority role、locator、source excerpt、retrieved at、due date logic、适用实体/税种、verified by、verified at、next review at。

3. **通知分三类，不混用**  
   Ops notification 提醒内部 source 变化；rule publication notification 提醒已发布 rule 影响范围；deadline reminder 提醒用户处理具体 obligation。

4. **用户侧讲行动，不讲数据库**  
   CPA 不需要看完整规则库。用户侧文案应该回答：这个 deadline 是什么、为什么有风险、下一步检查什么、依据来自哪里。

5. **诚实展示 coverage**  
   未覆盖、只 skeleton、需人工判断的州或税种不能显示为 verified。产品宁可说“State review needed”，也不能假装已覆盖。

## 7. 维护约定

- 本目录是 rules 产品设计的入口。新增子文档先更新本 README 的文档结构。
- 如果 rules 范围和 `MVP v0.3` 冲突，以 `MVP v0.3` 为 14 天执行口径。
- 如果技术实现和 `docs/dev-file/03-Data-Model.md` 冲突，先更新数据模型文档或写 ADR，再改实现。
- 每次修改 rules 覆盖范围，必须同步更新 `01-source-registry-and-rule-pack.md` 的 source registry 和初始 rule pack。
- 每次修改 `packages/core/src/rules/index.ts`，必须同步更新本 README 与
  `01-source-registry-and-rule-pack.md` 的实现状态。

## 8. 变更记录

| 版本 | 日期       | 作者  | 摘要                                                                                                                                                                                                                                                                                             |
| ---- | ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v1.2 | 2026-04-28 | Codex | Rules Console 四个 P0 tab 的 active state 持久化到 URL（`?tab=coverage\|sources\|library\|preview`），由 `nuqs` 解析；非法值回落 Coverage，方便分享 Sources / Rule Library / Generation Preview 深链。                                                                                           |
| v1.1 | 2026-04-27 | Codex | 侧栏 Settings 简化为非交互 section header（无 hover bg、静态 chevron-down、子项常驻），`/settings` 路由直接由 loader 重定向到 `/settings/rules`；详见 `docs/dev-log/2026-04-27-sidebar-settings-flatten.md`。                                                                                    |
| v1.0 | 2026-04-27 | Codex | 当前 MVP coverage 固定为 Federal + CA/NY/TX/FL/WA，移除 IL/MA 作为当前产品表达；RuleSource 增至 31，并把 RuleEvidence 收敛为 authorityRole / locator / sourceExcerpt / retrievedAt / sourceUpdatedOn 的类型安全证据包。                                                                          |
| v0.9 | 2026-04-27 | Codex | Rules Console 全量 i18n（zh-CN 零 missing），所有 jurisdiction/coverage/tier/status/footer 文案落到 Lingui 字典；Tab underline 改 `state-accent-solid`，active filter chip 改 `text-primary`，candidate count 数值为零时 muted；详见 dev-log § Token & color discipline / Internationalisation。 |
| v0.8 | 2026-04-27 | Codex | `/settings/rules` 4-tab 实现严格对齐 Figma（中心 880 列、tab 顶格 24、Generation Preview 5 列网格 + 合成 TAX YEAR）；侧栏 `Settings` 收敛为容器，紫色高亮只落在子项；详见 dev-log。                                                                                                              |
| v0.7 | 2026-04-27 | Codex | `/settings/rules` 4-tab 只读壳在 Figma 定稿；详见 `docs/dev-log/2026-04-27-rules-console-shell.md`。                                                                                                                                                                                             |
| v0.6 | 2026-04-27 | Codex | Source health checker 移到 repo-level script，保持 core 纯净。                                                                                                                                                                                                                                   |
| v0.5 | 2026-04-27 | Codex | 新增 rule-to-obligation preview、tax type alias 和 API。                                                                                                                                                                                                                                         |
| v0.4 | 2026-04-27 | Codex | 官方来源复核、source health、due date DSL 展开能力落地。                                                                                                                                                                                                                                         |
| v0.3 | 2026-04-27 | Codex | rules asset 接入 contracts/server，成为可消费项目接口。                                                                                                                                                                                                                                          |
| v0.2 | 2026-04-27 | Codex | 新增 `@duedatehq/core/rules` 结构化 asset 的实现状态说明。                                                                                                                                                                                                                                       |
| v0.1 | 2026-04-27 | Codex | 新增 rules 产品设计册入口，固定 MVP 裁定、分层和页面边界。                                                                                                                                                                                                                                       |
