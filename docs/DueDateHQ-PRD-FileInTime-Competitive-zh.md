# DueDateHQ PRD（File In Time 竞品版，中文版）

版本：v2.0  
日期：2026-04-21  
状态：Detailed Product PRD  
目标定位：File In Time 的现代化云端竞品  
目标市场：美国税务从业者  
首发范围：Federal + California + New York + Texas  
平台：Web-first  
对外语言：English-first  
产品目标：先做成税务忙季的日常工作台，再逐步长成 deadline intelligence 平台

来源依据：
- `docs/report/DueDateHQ - MVP 边界声明.md`
- `docs/report/DueDateHQ MVP深度调研报告.md`
- `docs/report/DueDateHQ 截止日与合规负载控制台行业与产品调研报告.md`
- `docs/report/DueDateHQ 深入调研报告.md`
- `docs/report/DueDateHQ_FileInTime_竞品分析.md`
- `docs/report/ File In Time 产品介绍与竞品分析研究报告.md`

---

## 1. 执行摘要

DueDateHQ 的这版 PRD 不再把产品定义为“更聪明的 deadline dashboard”，而是定义为：

> 一个面向美国独立 CPA 和小型税务事务所的、现代化的、可解释的、可执行的税务 deadline workboard。

如果说 File In Time 解决的是桌面时代的截止日跟踪问题，那么 DueDateHQ 要解决的是云端时代的小型事务所日常生产问题：
- 看清哪些事项快到期
- 知道哪些事项卡在资料
- 知道哪些事项已具备 review 条件
- 知道哪些客户该进入 extension 决策
- 知道规则变化会影响哪些客户
- 在一个统一对象模型中推进整个税务忙季工作流

这版 PRD 的核心判断是：

1. 如果目标是成为 File In Time 的真实竞品，仅仅有 `deadline + risk + AI` 不够。
2. 必须补齐三个贴近日常的轻量工作流层：
   - `Intake Readiness`
   - `Review Readiness`
   - `Extension Decision`
3. 这三层不能做成新的重模块，而必须嵌入每一个 `obligation instance`，成为日常推进工作的状态层。
4. 产品必须保留 File In Time 用户熟悉的表格密度、排序筛选、批量处理和 rollover 心智，同时显著提升现代感、解释性和 AI 辅助能力。

一句话定位：

> DueDateHQ is a modern deadline workboard for tax firms, combining deadline tracking, readiness management, extension control, and explainable intelligence in one place.

North Star 体验目标：
- 30 秒看清本周风险
- 5 分钟完成周度分诊
- 1 个 screen 内判断事项是“能做、待资料、待 review、该延期”中的哪一种
- 用 1 个对象推动从 intake 到 filing 前控制，而不是在多个工具里跳转

---

## 2. 产品命题

### 2.1 我们到底在做什么

DueDateHQ 不是：
- 纯 deadline calendar
- tax prep software
- 通用 practice management suite
- client portal 平台
- AI 税务顾问

DueDateHQ 是：
- File In Time 的现代化云端替代方案
- 小型事务所在忙季真正打开来推进日常工作的主工作台
- 一个以 `obligation instance` 为中心的税务运营系统

### 2.2 为什么这个定位成立

File In Time 的竞争优势不在于技术先进，而在于它非常贴近税务工作日常：
- deadline-first
- task-table-first
- extension-aware
- rollover-aware
- multi-client batch work

但 File In Time 的问题也很明显：
- 本地 / 桌面时代架构
- 现代协作弱
- 可解释规则层弱
- AI 缺席
- 对规则变化和受影响客户匹配支持弱

DueDateHQ 必须做到：
- 在工作流骨架上像 File In Time
- 在交互、解释性和智能化上明显强于 File In Time

---

## 3. 目标用户与角色

### 3.1 主 ICP

首发主 ICP：
- 美国独立 CPA
- 1-10 人小型税务事务所
- 有多州、多实体客户
- 现在依赖 Excel / Outlook / 邮件 / 老工具拼接管理工作
- 对 deadline、extension、资料缺失、规则变化高度敏感

### 3.2 角色分层

| 角色 | 主要职责 | 最核心 KPI | 最怕的问题 | 对 DueDateHQ 的核心期待 |
|---|---|---|---|---|
| Owner / Signing CPA | 对客户整体结果负责 | 零漏报、零延误、客户留存 | 漏 deadline、漏 extension、规则变化没跟上 | 一眼看清本周最重要事项 |
| Manager | 平衡容量、推动状态、控制 review 节奏 | 团队及时率、过载率、完成率 | 某人过载、某事项无人推进、review 堵塞 | 看清谁卡住了、卡在哪 |
| Preparer / Senior | 准备 return、追资料、推进提交前状态 | 完成量、返工率、逾期率 | 资料不齐就开工、来回返工、优先级不清 | 清楚知道先做哪单、缺什么 |
| Client Coordinator / Admin | 催资料、发提醒、同步客户状态 | 资料回收率、响应率、提醒完成率 | 客户不懂为什么急、缺材料反复追 | 有标准化催办和进度视图 |

### 3.3 非目标用户

- 只做简单 1040、州复杂度很低的 preparer
- 已深度依赖大型 practice suite 且切换意愿低的大所
- 期待自动报税、自动生成税务结论的用户
- 不愿把任何客户运营信息放入云端的团队

---

## 4. 小型事务所真实日常工作流

### 4.1 忙季前

- 发 engagement letter
- 发送 organizer / checklist
- 明确资料提交时间线
- 确认服务范围和边界
- 创建本税年 recurring work / rollover items

### 4.2 忙季中日常

- 打开本周工作盘面
- 看哪些事项 due soon / overdue / exception
- 看哪些客户资料未齐
- 决定哪些单子能进 prep
- 决定哪些单子能送 review
- 决定哪些要申请 extension
- 追客户、追内部 review、追状态
- 处理新规则、灾害延期或例外事件

### 4.3 提交前控制

- 确认资料是否充分
- 确认 return 是否 review-ready
- 确认 extension 是否已决策且客户是否知晓
- 确认 filing due date 与 payment due date 没有混淆

### 4.4 忙季后

- 复盘哪些事项延误
- 哪些客户最难推动
- 哪些州/实体最耗时
- 哪个环节最堵
- 哪些事项要 roll-forward 到下一期间

### 4.5 对产品的要求

这意味着 DueDateHQ 的核心工作流不能只是：

```text
看日期 -> 改状态 -> 结束
```

而应该是：

```text
看风险 -> 看资料 readiness -> 看 review readiness -> 决定 extension -> 推进状态 -> 留痕 -> 回到总盘面
```

---

## 5. 产品原则

### 5.1 Deadline-first

产品的第一入口不是客户档案，不是 CRM，不是文档库，而是本周工作盘面。

### 5.2 One Object, Multiple Views

一个 `obligation instance` 必须同时承载：
- deadline 信息
- readiness 信息
- extension 信息
- risk 信息
- review 状态
- 审计信息

不能拆成多个互不相连的对象。

### 5.3 Dense but Modern

必须保持税务从业者喜欢的高信息密度，但视觉、交互和操作效率必须是现代 SaaS 水平。

### 5.4 Explainable, Not Black-box

所有风险、AI 建议、规则变化和 extension 建议，都必须解释原因。

### 5.5 Human Review Required

AI 可以帮助解释、排序、草拟和建议，但不能代替 CPA 做正式税务判断。

### 5.6 Lightweight Workflow, Not Heavy Suite

我们做的是轻量工作流状态层，不做重型 portal、重型 document management、重型 billing。

---

## 6. 核心产品定义

### 6.1 产品形态

DueDateHQ 是一个 `deadline workboard + readiness layer + extension control layer + intelligence layer` 的组合产品。

### 6.2 核心对象模型

#### Client
- client name
- entity type
- jurisdiction set
- tax profile
- assignee / owner
- importance level
- contact readiness hints

#### Obligation Rule
- rule name
- jurisdiction
- entity applicability
- tax type
- due-date logic
- extension policy
- source links
- reviewed status
- version

#### Obligation Instance
- client
- rule
- tax year / period
- original due date
- current due date
- filing due date
- payment due date
- status
- risk
- intake readiness
- review readiness
- extension decision
- assignee
- notes

#### Alert
- source
- rule change type
- affected scope
- affected clients
- review status

#### Audit Event
- action
- actor
- timestamp
- before / after
- reason

---

## 7. 产品信息架构

一级导航控制在 6 个以内：
- Dashboard
- Workboard
- Clients
- Rules
- Alerts
- Reports

这里有一个关键决定：

**不单独建立 Intake、Review、Extension 三个新导航。**

原因是它们不是三个独立产品，而是所有 obligation 的三层工作流状态。它们必须内嵌在 Workboard、Client Detail 和 Obligation Detail 中。

---

## 8. 核心页面定义

### 8.1 Dashboard

目标：
- 30 秒内看清本周盘面
- 5 分钟内做完分诊

必须包含：
- Due This Week
- Overdue
- Waiting on Client
- Ready for Review
- Extension Candidates
- Recent Rule Changes
- Team Overload / Capacity Warning

关键动作：
- 快速筛选州 / assignee / tax type / entity
- 批量改状态
- 批量设置 reminder
- 打开 detail drawer
- 进入 affected clients 视图

### 8.2 Workboard

目标：
- 批量推进事项

表现形式：
- 高密度数据网格
- 支持保存视图
- 支持多条件排序与过滤

默认列：
- Client
- Entity
- State
- Tax Type / Form
- Original Due
- Current Due
- Days Left
- Status
- Intake Readiness
- Review Readiness
- Extension Decision
- Risk
- Assignee
- Source Status

### 8.3 Client Detail

目标：
- 从客户维度看近期 obligations 和当前风险

结构：
- Client summary
- Upcoming obligations
- Missing information summary
- Review queue summary
- Extension-related items
- AI client brief
- Audit history

### 8.4 Rule Detail

目标：
- 建立规则可信度和可解释性

结构：
- Rule description
- Applicability
- Due-date logic
- Extension policy
- Sources
- Review status
- Version history

### 8.5 Alerts

目标：
- 处理规则变化和例外

结构：
- Alert feed
- Affected forms / jurisdictions
- Affected clients
- Why affected
- Suggested reprioritization
- Mark reviewed / create follow-up

### 8.6 Reports

目标：
- 做内部复盘和试用证明

结构：
- Completion rate
- Overdue rate
- Waiting-on-client rate
- Review queue backlog
- Extension rate
- Team load
- Rule-change impact summary

---

## 9. 三层轻量工作流状态

这是本版 PRD 的关键增量。

### 9.1 Layer A: Intake Readiness

#### 要解决的问题

真实事务所里，大量事项不是因为技术难，而是因为：
- 资料没齐
- 客户没回应
- 信息不完整
- 还不该开工

如果不把这一层做出来，DueDateHQ 会变成一个“知道要做什么，但不知道能不能做”的系统。

#### 产品定义

`Intake Readiness` 是 obligation 级别的材料与前置信息状态层。

#### 状态枚举

- `Not Requested`
- `Requested`
- `Partially Received`
- `Complete`
- `Blocked`
- `Not Needed`

#### 必须记录的字段

- required items summary
- missing items count
- last client nudge date
- next reminder date
- blocker reason
- client response status

#### 在 UI 中的体现

- Workboard 列：`Intake`
- Detail drawer 中的 `Readiness` tab
- Dashboard 卡片：`Waiting on Client`
- Client Detail 中的 `Missing items summary`

#### 典型动作

- 标记为 `Requested`
- 标记为 `Partially Received`
- 标记为 `Complete`
- 添加缺失项说明
- 发送 reminder
- 标记为 `Blocked`

#### 设计边界

- 不做完整 client portal
- 不做复杂文档中心
- 不做文件树和版本仓库
- 做的是“材料 readiness 状态层”，不是“文件管理系统”

### 9.2 Layer B: Review Readiness

#### 要解决的问题

在真实事务所里，很多事项不是“没做”，而是：
- 还没 ready for prep
- prep 做到一半
- 可以送 review 了
- review 打回来了
- 已 ready to file

如果没有这层，DueDateHQ 只能表达“做没做”，不能表达“工作推进到了哪一步”。

#### 产品定义

`Review Readiness` 是 obligation 级别的内部推进与交接状态层。

#### 状态枚举

- `Not Ready`
- `Ready for Prep`
- `In Prep`
- `Ready for Review`
- `In Review`
- `Changes Requested`
- `Ready to File`
- `Filed`

#### 必须记录的字段

- current stage
- stage owner
- review blocker
- last moved at
- reviewer flag
- review notes summary

#### 在 UI 中的体现

- Workboard 列：`Review`
- Dashboard 卡片：`Ready for Review`
- Dashboard 卡片：`In Review`
- Client Detail 中的 `Work progression`
- Detail drawer 的 `Workflow` tab

#### 典型动作

- 从 `Ready for Prep` 推到 `In Prep`
- 从 `In Prep` 推到 `Ready for Review`
- 从 `In Review` 打回 `Changes Requested`
- 从 `Ready to File` 推到 `Filed`

#### 设计边界

- 不做完整 workpaper management
- 不做多层 sign-off 中心
- 不做 reviewer 注释系统的完整替代
- 做的是“review-ready 状态层”，不是“审计工作底稿系统”

### 9.3 Layer C: Extension Decision

#### 要解决的问题

这层在税务场景里非常关键，因为：
- extension 不是失败，而是决策
- filing due date 和 payment due date 不一定同步
- 客户是否已被告知，会直接影响服务体验与责任边界

如果没有这层，DueDateHQ 会显得不够懂税务工作流。

#### 产品定义

`Extension Decision` 是 obligation 级别的延期判断与跟进状态层。

#### 状态枚举

- `Not Evaluated`
- `Extension Recommended`
- `Extension Not Needed`
- `Extension Approved`
- `Extension Filed`
- `Payment Still Due`
- `Client Informed`
- `Follow-up Needed`

#### 必须记录的字段

- extension eligibility summary
- why extension is recommended or not
- filing due date
- payment due date
- extension filing status
- client informed status
- follow-up note

#### 在 UI 中的体现

- Workboard 列：`Extension`
- Dashboard 卡片：`Extension Candidates`
- Detail drawer 的 `Extension` tab
- Client Detail 中的 `Extension-sensitive items`

#### 典型动作

- 标记 `Extension Recommended`
- 标记 `Client Informed`
- 标记 `Extension Filed`
- 保留 `Payment Still Due`
- 生成 follow-up reminder

#### 设计边界

- 不做 extension form printing
- 不做自动报送
- 不做复杂 extension workflow engine
- 做的是“延期决策控制层”，不是“延期申报系统”

---

## 10. 状态系统设计

每条 obligation 至少同时拥有四套状态：

### 10.1 Delivery Status
- Not started
- In progress
- Completed
- Cancelled

### 10.2 Intake Readiness
- Not Requested
- Requested
- Partially Received
- Complete
- Blocked
- Not Needed

### 10.3 Review Readiness
- Not Ready
- Ready for Prep
- In Prep
- Ready for Review
- In Review
- Changes Requested
- Ready to File
- Filed

### 10.4 Extension Decision
- Not Evaluated
- Extension Recommended
- Extension Not Needed
- Extension Approved
- Extension Filed
- Payment Still Due
- Client Informed
- Follow-up Needed

### 10.5 Risk Status
- Low
- Medium
- High
- Exception

这是产品最重要的设计之一：

**不能把以上状态混成一个标签。**

用户必须能知道：
- 这件事是不是快到期
- 这件事是不是资料没齐
- 这件事是不是还没 ready for review
- 这件事是不是该延期

---

## 11. AI 产品定义

### 11.1 AI 的定位

AI 是 `copilot for explanation and triage`，不是自动税务判断器。

### 11.2 AI 应做的事

- Weekly Brief
- Client Risk Summary
- Obligation Tips
- Rule Change Summary
- Suggested Next Step
- Why Affected explanation
- Draft client-friendly reminder copy
- Draft extension explanation copy

### 11.3 AI 不应做的事

- 自动修改正式 rule
- 自动判定客户是否适用某税法结论
- 自动计算税额
- 自动 filing
- 输出 tax opinion

### 11.4 AI 与三层工作流的结合

#### 对 Intake Readiness
- 解释为什么该事项当前不能推进
- 草拟催资料提醒
- 归纳缺失项

#### 对 Review Readiness
- 总结为何已经 ready for review
- 总结当前 blocker
- 草拟 handoff note

#### 对 Extension Decision
- 解释为何建议延期
- 区分 filing 和 payment 风险
- 草拟对客户的非法律化说明

---

## 12. 模块级功能需求

### 12.1 Dashboard 模块

必须支持：
- 本周到期
- 本月预警
- Overdue
- Waiting on Client
- Ready for Review
- Extension Candidates
- Recent Rule Changes
- Capacity warning

必须支持的动作：
- 快速筛选
- 批量状态变更
- 批量 reminder
- 批量 reassignment
- 打开 detail drawer

### 12.2 Workboard 模块

必须支持：
- 多条件筛选
- 多列排序
- 保存视图
- 批量选择
- 批量 edit
- split view

行级必须支持：
- 展示四套状态
- 展示 risk
- 展示 source
- 展示 days left
- 展示 exception badge

### 12.3 Detail Drawer 模块

标签结构建议：
- Overview
- Readiness
- Workflow
- Extension
- Sources
- Activity

### 12.4 Clients 模块

必须支持：
- client list
- client profile
- jurisdiction / entity snapshot
- upcoming obligations
- missing info summary
- review queue summary
- extension-sensitive items

### 12.5 Rules 模块

必须支持：
- rules list
- rule detail
- official source
- applicability
- reviewed status
- version notes

### 12.6 Alerts 模块

必须支持：
- alert feed
- affected clients list
- why affected
- review status
- create follow-up

### 12.7 Reports 模块

必须支持：
- overdue rate
- completion rate
- waiting-on-client rate
- review backlog
- extension rate
- team load summary
- exception trend

---

## 13. 关键用户流程

### 13.1 首次导入与建盘

1. 用户导入客户
2. 系统生成 obligations
3. 用户看到首个工作盘面
4. 用户开始设置 assignee、状态和重要客户

### 13.2 周一早晨分诊

1. 打开 Dashboard
2. 只看本周到期、高风险、例外
3. 按州 / assignee / client 筛选
4. 决定本周先做哪批事项

### 13.3 催资料流程

1. 在 Workboard 看到 `Requested` 或 `Partially Received`
2. 打开 detail drawer
3. 查看缺失项
4. 发送 reminder
5. 保留 `last nudge` 和记忆点

### 13.4 Prep -> Review handoff

1. preparer 完成准备
2. 标记 `Ready for Review`
3. manager / reviewer 在队列中看到
4. 若打回，则进入 `Changes Requested`
5. 再次准备后返回 `Ready for Review`

### 13.5 Extension 决策

1. 系统识别为 `Extension Candidate`
2. detail drawer 展示：
   - original due
   - current due
   - payment still due?
   - why recommend extension?
3. 用户标记 `Client Informed`
4. 用户记录 `Extension Filed` 或 `Follow-up Needed`

### 13.6 规则变化处理

1. 新 alert 进入 Alerts
2. 系统列出 affected clients
3. 用户查看 why affected
4. 用户决定 mark reviewed / create follow-up
5. Workboard 重新排序相关事项

### 13.7 Rollover

1. 某季度或某税年事项完成
2. 用户触发轻量 rollover
3. 复制 client / entity / jurisdiction / recurring pattern
4. 生成下一期间 placeholder

---

## 14. 用户故事

### User Story 01

- **Summary:** 作为 owner，我想在 30 秒内看清本周最重要事项

#### Use Case
- **As a** firm owner
- **I want to** 打开 Dashboard 就看到高风险、本周到期和 extension 候选事项
- **so that** 我能快速决定本周优先级

### User Story 02

- **Summary:** 作为 preparer，我想知道事项缺什么资料

#### Use Case
- **As a** preparer
- **I want to** 看到 obligation 的 intake readiness 和缺失项
- **so that** 我不会在资料没齐时盲目开工

### User Story 03

- **Summary:** 作为 manager，我想知道哪些事项已经 ready for review

#### Use Case
- **As a** manager
- **I want to** 筛出所有 `Ready for Review` 的事项
- **so that** 我能更顺畅地安排 review 节奏

### User Story 04

- **Summary:** 作为 owner，我想知道哪些事项应该进入 extension 决策

#### Use Case
- **As a** signing CPA
- **I want to** 看到 extension recommendation 和原因
- **so that** 我能及时与客户沟通并避免误判

### User Story 05

- **Summary:** 作为 client coordinator，我想快速催客户交资料

#### Use Case
- **As a** coordinator
- **I want to** 对 `Waiting on client` 的事项发送标准化提醒
- **so that** 我能减少手工追踪

### User Story 06

- **Summary:** 作为小所团队成员，我想知道规则变化影响了哪些客户

#### Use Case
- **As a** tax team member
- **I want to** 在 alert 中看到 affected clients 和 why affected
- **so that** 我能立刻采取行动

---

## 15. MVP 范围建议

### 15.1 P0：必须做

- Dashboard
- Workboard
- Client list + client detail
- Rules list + rule detail
- Alerts feed
- 四套状态系统
- Intake Readiness 轻量层
- Review Readiness 轻量层
- Extension Decision 轻量层
- Source traceability
- Audit trail
- Basic AI brief / tips / next step

### 15.2 P1：应做

- Affected clients 深化
- Apply update / mark reviewed
- 轻量 rollover
- 批量 reminder
- 保存视图
- 风险解释面板
- draft client copy

### 15.3 P2：后置

- 客户门户
- 文档管理系统
- e-sign
- 计费与支付
- deep integrations
- mobile app
- 复杂 RBAC

---

## 16. 明确不做

- direct e-file
- tax amount calculation
- 50 州完整覆盖
- 自动监控并自动改写规则
- 重型 client portal
- 重型 document management
- 计费 / 支付
- e-sign
- 深度 CRM
- AI tax opinion

原因不是它们没价值，而是它们不属于这版产品的核心命题：

> 先把税务忙季最关键的日常推进工作，放进一个现代化的 deadline workboard 里。

---

## 17. 成功指标

### 17.1 行为指标

- 用户每周主动打开 Dashboard
- 用户在 Workboard 中持续推进状态
- 用户使用 Intake / Review / Extension 三层状态，而不是只改 completed
- 用户对 alert 和 affected clients 有真实使用

### 17.2 价值指标

- Week-2 回访率
- overdue 事项占比下降
- waiting-on-client 可见率上升
- review backlog 可见率上升
- extension decision 明确率上升

### 17.3 认知指标

试点访谈中，用户是否明确表达：
- “这比 Excel 更清楚”
- “这比 File In Time 更现代”
- “我终于知道事情卡在哪”
- “我能区分资料问题、review 问题和 extension 问题”

---

## 18. 最终产品结论

如果目标只是做一个好看的 DueDateHQ Demo，那么 `deadline + risk + AI` 可能已经够了。

但如果目标是做 **File In Time 的真实竞品**，那产品必须更贴近日常工作。

这版 PRD 的核心结论就是：

> DueDateHQ 不应只是一个 deadline intelligence cockpit，  
> 它还必须是一个面向小型税务事务所的日常 deadline workboard。

它最关键的差异化，不是功能更多，而是把以下四件事收敛在同一个对象上：
- 截止日
- 资料 readiness
- review readiness
- extension decision

这才会让用户觉得：

> 这不是另一个“税务看板”。  
> 这是一个我真的能每天拿来工作的 File In Time 下一代替代品。
