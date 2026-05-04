# 02 · Rules Console 产品设计

> 版本：v0.6（14 天 MVP · 2026-04-28）
> 上游：`01-source-registry-and-rule-pack.md`
> 下游：
>
> - [`docs/dev-log/2026-04-27-rules-console-shell.md`](../../dev-log/2026-04-27-rules-console-shell.md) 已把本册第 3 节 IA 收敛为 4-tab 只读 P0 壳（Coverage / Sources / Rule Library / Generation Preview）并在 Figma 定稿。Candidates / Publish Preview 两 tab 留给 P1。
> - [`docs/dev-log/2026-04-28-rules-console-fullwidth-coverage.md`](../../dev-log/2026-04-28-rules-console-fullwidth-coverage.md) 把页面布局从"居中 880px settings 列"改成"全宽 ops workbench"，Coverage tab 重做为 KPI 条 + 左 7/12 汇总表 + 右 5/12 矩阵；header 段落 max-w 放宽到 1080。
>
> 目标：定义 rules 如何沉淀成真实页面，让内部团队完成 source watch、candidate review、rule publish，并把 verified rules 安全地交给产品消费

## 1. 页面定位

Rules Console 是内部运营页面，不是种子 CPA 的主要工作界面。它负责回答内部四个问题：

1. MVP 六个辖区的 rule coverage 是否完整？
2. 哪些官方来源最近变了、失败了、或需要人工检查？
3. 哪些 candidate 可以 promote 成 verified rule？
4. 发布某条 rule 会影响哪些客户 obligations 和提醒？

用户侧只在 Dashboard / Workboard / Deadline Detail 中消费 verified 结果：source badge、human verified、quality tier、AI Tip、next check。

## 2. 路由与入口

MVP 可先放在受保护 app 内：

```text
/rules
```

P0 tab state is part of the route contract:
`/rules?tab=coverage|sources|library|preview`. Missing or invalid
`tab` falls back to Coverage. This keeps Rules Console review links shareable
without adding separate routes for each tab.

Implementation note: bare `/rules` is the canonical Coverage URL;
`?tab=coverage` remains accepted but may be cleared when users switch back to
the default tab.

若后续区分内部 ops 与普通 CPA，可迁到：

```text
/admin/rules
```

14 天 MVP 的权限裁定：

- 种子用户不进入 Rules Console。
- 内部 owner/dev/ops 可以进入。
- 公开页面 `/rules` / `/watch` 不进入本轮实现，只保留文案和增长位。

## 3. 信息架构

页面使用 5 个 tab：

| Tab             | 目的                                             | 核心动作                        |
| --------------- | ------------------------------------------------ | ------------------------------- |
| Coverage        | 看 Federal + CA / NY / TX / FL / WA 的覆盖完整度 | Drill into jurisdiction         |
| Sources         | 看 source registry 健康度和最近变化              | Check now, view snapshot        |
| Candidates      | 审核 parser/AI 抽取结果                          | Reject, request source, promote |
| Rule Library    | 查看 verified / deprecated rules                 | Open rule, compare versions     |
| Publish Preview | 发布前预览影响范围                               | Generate preview, publish       |

## 4. Coverage Tab

### 4.1 目标

给内部团队一个一眼可见的 coverage map，避免“以为覆盖了，其实只是 federal fallback”。

### 4.2 布局（v0.5 · 2026-04-28，全宽 ops workbench）

> 取代了 v0.1 的"居中 880px 单列上下叠两表"。判定依据：Coverage tab 内容 100% 是表格 + 矩阵 + KPI，是 ops 数据界面而不是 settings form——按 `DESIGN.md` §5.2 新规则走 Workboard 同源的全宽布局。详见 [`2026-04-28-rules-console-fullwidth-coverage.md`](../../dev-log/2026-04-28-rules-console-fullwidth-coverage.md)。

自上而下三块，全部锚 `left=24`（与 tab nav 同列）：

1. **KPI 条**（`SectionFrame` + 4 格 grid，`sm:grid-cols-4` divide-x）
   - Verified rules · sum(verifiedRuleCount)
   - Candidates · sum(candidateCount)（>0 时数字走 `text-status-review` 紫色，0 时不强调）
   - Sources watched · sum(sourceCount)
   - Jurisdictions · rows.length，caption 动态："N fully covered · M with open candidates"
2. **Jurisdiction summary**（`xl:col-span-7`）
   - JUR · NAME · VERIFIED · CANDIDATE · SOURCES · STATUS（数字列右对齐，金融报表惯例）
   - STATUS pill 颜色规则不变：FED candidate watch 用 `accent`，TX/FL/WA review 用 `severity-medium`，CA/NY basic+review 用 `background-subtle`
3. **Jurisdiction × Entity 矩阵**（`xl:col-span-5`）
   - 6 jurisdictions × 4 entity（LLC / PARTNERSHIP / S-CORP / C-CORP），每格 `text-center`，dot + label
   - 下方挂 `CoverageLegend`（verified / review / no rule）

`< xl` 断点下 2、3 自动 stack 回单列，阅读顺序与 v0.1 一致。

### 4.2.1 旧布局（v0.1，2026-04-27 → 2026-04-28，已 superseded）

```text
Rules Coverage
Federal     6 verified · 0 needs review · updated Apr 27
CA          7 verified · 1 candidate · updated Apr 27
NY          7 verified · 1 applicability review · updated Apr 27
TX          4 verified · 2 applicability review · updated Apr 27
FL          5 verified · 1 PDF parse review · updated Apr 27
WA          5 verified · 1 exception sample · updated Apr 27
```

下方是矩阵：

```text
Jurisdiction × Entity

             LLC   S-Corp   Partnership   C-Corp
Federal      ✓     ✓        ✓             ✓
CA           ✓     ✓        ✓             ✓
NY           ✓     ✓        ✓             ✓
TX           ⚠     ⚠        ⚠             ⚠
FL           ○     ○        ✓             ✓
WA           ⚠     ⚠        ⚠             ⚠
```

状态含义：

- `✓ verified`：有 verified rule 可生成 obligation。
- `⚠ applicability review`：有官方来源，但是否适用需 CPA 判断。
- `○ skeleton`：有 source watch，但不生成默认 obligation。
- `— unsupported`：不在 MVP。

### 4.3 空态

当某辖区没有 verified rule：

```text
No verified rules for this jurisdiction yet.
Register official sources first, then promote candidates after review.
```

## 5. Sources Tab

### 5.1 表格字段

| 字段         | 说明                                                    |
| ------------ | ------------------------------------------------------- |
| Source       | 官方来源标题                                            |
| Jurisdiction | federal / CA / NY / TX / FL / WA                        |
| Type         | calendar / instructions / form / news / emergency / api |
| Cadence      | daily / weekly / quarterly                              |
| Health       | healthy / degraded / failing / paused                   |
| Last checked | 最近检查时间                                            |
| Last changed | 最近内容变化                                            |
| Next check   | 下次检查                                                |
| Owner        | 内部负责人                                              |

### 5.2 Row actions

- `Open source`：打开官方页面。
- `View snapshot`：查看上次保存的原文快照。
- `Check now`：立即检查并生成 diff。
- `Create candidate`：从当前 snapshot 手动创建 candidate。

### 5.3 Health 状态

| 状态     | 产品含义                                | UI   |
| -------- | --------------------------------------- | ---- |
| healthy  | 按频率成功检查，hash 无异常             | 绿色 |
| degraded | 最近一次失败或 parser warning           | 黄色 |
| failing  | 连续失败 3 次或 source 结构变化无法解析 | 红色 |
| paused   | 人工暂停，不参与 coverage freshness     | 灰色 |

Source failing 只通知内部，不通知 CPA，除非它导致 published rule 被撤回或标记 deprecated。

## 6. Candidates Tab

### 6.1 Candidate card

每个 candidate 展示：

```text
CA LLC annual tax due date
Source: CA FTB Due dates: businesses
Extracted by: parser · confidence 0.92
Jurisdiction: CA
Tax type: ca_llc_annual_tax_800
Tier: basic
Suggested due logic:
  15th day of 4th month after beginning of taxable year
Quote:
  "The $800 annual tax is due..."

[Promote to rule] [Needs more source] [Reject]
```

### 6.2 审核 Checklist

Promote 前必须确认：

- Filing vs payment 是否区分。
- Extension 是否处理，尤其是否不延 payment。
- Calendar year / fiscal year 是否明确。
- Weekend / legal holiday rollover 是否明确。
- Source 是否为官方来源。
- 是否需要 applicability review。

### 6.3 Promote 行为

Promote 不是直接发布。Promote 后进入 Rule Detail 编辑/确认页：

```text
candidate -> draft verified rule -> publish preview -> published
```

这样可以避免 “抽取对了，但结构化字段不完整” 的规则进入产品。

## 7. Rule Library Tab

### 7.1 列表字段

| 字段         | 说明                                                         |
| ------------ | ------------------------------------------------------------ |
| Rule         | rule id + form/tax type                                      |
| Jurisdiction | federal / CA / NY / TX / FL / WA                             |
| Entity       | LLC / S-Corp / Partnership / C-Corp                          |
| Tier         | basic / annual_rolling / exception / applicability_review    |
| Event        | filing / payment / extension / election / information_report |
| Status       | candidate / verified / deprecated                            |
| Quality      | 6/6 或 5/6                                                   |
| Verified     | verified by + date                                           |
| Next review  | next review date                                             |

### 7.2 Rule Detail

Rule Detail 是最重要的页面。它必须展示完整可审阅证据：

```text
Rule: ca.llc.annual_tax.2026
Status: verified
Quality: 6/6

Applicability
  Jurisdiction: CA
  Entities: LLC
  Tax type: ca_llc_annual_tax_800
  Event type: payment

Due date logic
  Relative to tax year start
  Month offset: 4
  Day: 15
  Rollover: next business day

Sources
  Primary: CA FTB Due dates: businesses
  Cross-check: CA LLC Web Pay payment types

Verification
  Verified by: ops
  Verified at: Apr 27, 2026
  Next review: Jul 27, 2026
```

### 7.3 Version compare

当同一 rule 有新版：

```text
v2026.1 -> v2026.2
dueDateLogic changed: none
source excerpt changed: yes
coverage changed: no
impact: 0 existing obligations
```

如果影响 existing obligations，必须进入 Publish Preview。

## 8. Publish Preview Tab

### 8.1 目标

发布前回答：

- 会新增多少 obligations？
- 会更新多少 current due dates？
- 会废弃多少旧 rule version？
- 会触发哪些 reminders 重新排程？
- 有哪些 items 只是 applicability review，不应自动改 deadline？

### 8.2 Preview 卡片

```text
Publish preview: ny.ptet.return_extension.2025

Impacted:
  12 obligations generated
  0 existing due dates changed
  5 clients flagged applicability_review
  0 reminder emails scheduled until obligations are verified

Safety:
  Candidate source is official
  Quality checklist: 5/6
  Applicability review required

[Publish verified rule] [Save draft] [Cancel]
```

### 8.3 发布后事件

发布成功写入：

- audit event: `rules.published`
- notification: `rules.published`
- optional job: `obligations.generate_from_rule_pack`
- optional job: `reminders.reschedule`

MVP 可以先不自动运行 job，改成用户/内部点击 “Generate obligations”。

## 9. 用户侧消费设计

### 9.1 Dashboard deadline row

用户侧每条 deadline 应展示：

```text
Acme LLC · CA LLC Annual Tax · due Apr 15
Waiting on client · Internal cutoff passed
Why: deadline close + payment obligation
Next: confirm payment responsibility and prior-year record
Source: CA FTB · human verified Apr 27
[In progress] [Completed] [Extended]
```

### 9.2 Source drawer

点击 source badge 打开轻量 drawer：

```text
Source
CA FTB Due dates: businesses
Verified by DueDateHQ ops · Apr 27, 2026
Quality Tier 6/6

What this means
This is a payment deadline. Extension to file does not automatically extend payment.

Check next
Confirm whether the client is required to pay the annual tax and whether payment has been scheduled.
```

### 9.3 AI Tip 约束

AI Tip 只能使用 verified rule 和 source summary：

允许：

- “Source indicates...”
- “Confirm whether...”
- “This may require review...”

禁止：

- “Your client qualifies...”
- “No penalty will apply...”
- “This extension is valid...”

## 10. 错误与边界

| 场景                            | 处理                                                           |
| ------------------------------- | -------------------------------------------------------------- |
| Source parse failed             | Source health = degraded；生成内部 alert，不影响 verified rule |
| Official source changed         | Candidate created；已发布 rule 保持不变直到人工复核            |
| 两个官方来源冲突                | Candidate status = needs_more_source；不能 publish             |
| Exception 只有 FEMA declaration | early warning only；不能生成 tax deadline overlay              |
| Rule quality < 6/6              | 只能 `applicability_review` 或保持 candidate                   |
| Published rule 被废弃           | 新 rule version publish 后 deprecated old version；保留审计    |

## 11. MVP 验收

- `/rules` 的产品设计能覆盖 Coverage / Sources / Candidates / Rule Library / Publish Preview 五个 tab。
- 每条 rule 能追溯 source、source excerpt、quality checklist、verification metadata。
- Candidate 不会直接影响用户 deadline。
- Publish Preview 明确显示 impacted obligations 和 reminder effect。
- 用户侧 deadline row 能展示 source / human verified / next check。

## 12. 变更记录

| 版本 | 日期       | 作者  | 摘要                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---- | ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.9 | 2026-05-04 | Codex | Rules candidate verify 的 reminder-ready specific date 输入复用项目统一 `IsoDatePicker`，与 Workboard obligation detail 的 Extension tab 日期选择器保持一致，避免同一工作流出现两套日期 UI。详见 `docs/dev-log/2026-05-04-rules-candidate-verify-workflow.md`。                                                                                                                                                                                                                                                                                               |
| v0.8 | 2026-05-04 | Codex | Rules candidate verify 的 Ops review 表单细化 extension policy 输入：`Duration months` 采用 1-24 月数字 stepper，避免非数字输入；`Extension form` 暂不改下拉，因为当前 contract 没有稳定枚举，规则 seed 只有少数明确表格名，人工复核仍需要保留自由输入。详见 `docs/dev-log/2026-05-04-rules-candidate-verify-workflow.md`。                                                                                                                                                                                                                                   |
| v0.7 | 2026-04-29 | Codex | App IA 全面扁平化：Rules canonical route 改为 `/rules`，旧 Settings 前缀退出当前架构且不保留 redirect；Cmd-K 直接暴露 Rules / Members / Billing / Practice profile 等一级页面。                                                                                                                                                                                                                                                                                                                                                                               |
| v0.6 | 2026-04-28 | Codex | Rules Console 四个 P0 tab 的 active state 持久化到 URL（`?tab=coverage\|sources\|library\|preview`），由 `nuqs` 解析；非法值回落 Coverage，方便分享 Sources / Rule Library / Generation Preview 深链。                                                                                                                                                                                                                                                                                                                                                        |
| v0.5 | 2026-04-28 | Codex | 布局判定从 URL 前缀切换到内容形态：Rules Console 是 ops data surface，全宽展开（去掉 `mx-auto max-w-[928px]`），与 tab nav / Workboard 共锚 `left=24`。Coverage tab 重做为 KPI 条 + 左 7/12 jurisdiction summary + 右 5/12 jurisdiction × entity 矩阵；KPI 数字走 `font-mono text-2xl tabular-nums`，candidate>0 时数字 tone 走 `text-status-review`。`RulesPageHeader` 段落 max-w 从 720 → 1080，避免在 1512 视口下挤成 3 行。`DESIGN.md` §5.2 同步增订按内容形态判定宽度的规则。详见 `docs/dev-log/2026-04-28-rules-console-fullwidth-coverage.md`。        |
| v0.4 | 2026-04-27 | Codex | P0.5 落地：Rule Library 行可点 → 右侧 Sheet drawer（Applicability / Due-date logic / Extension / Review reasons / Evidence / Verification 6 节）；Sources 行整行 + ↗ icon 跳官方页；Generation Preview 假链接换成真链接；Coverage 头部描述讲清 Sources / Rules / Preview 三层关系。Figma `Settings · Rules` section 增加 5/4 状态稿（drawer 打开态）作为对齐基准。EvidenceCard 修复 inline-flex items-center 继承 + truncate 链断裂导致的「文字居中、长 title 把 badge 挤出 card」layout bug。详见 `docs/dev-log/2026-04-27-rules-console-detail-drawer.md`。 |
| v0.3 | 2026-04-27 | Codex | 历史记录：侧栏 Settings 容器曾收敛为非交互 section header；该 IA 已被 v0.7 的一级路由扁平化取代。                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| v0.2 | 2026-04-27 | Codex | 历史记录：最早实现曾保留 Settings 作为侧栏容器；该方案已被后续一级路由扁平化取代。                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| v0.1 | 2026-04-27 | Codex | 新增 Rules Console 页面设计、审核发布流程和用户侧消费设计。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
