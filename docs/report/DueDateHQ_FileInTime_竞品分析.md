# DueDateHQ × File In Time 竞品分析：功能、技术与 MVP 优先级

> 文档状态：竞品研究输入。当前两周真实用户验证范围以 [DueDateHQ MVP v0.3 单一执行口径](./DueDateHQ%20-%20MVP%20边界声明.md) 为准。本文用于学习 File In Time 的 deadline-first workflow，不代表 DueDateHQ 要做 feature parity。

## 结论先讲

**你不需要、也不应该覆盖 File In Time 的所有功能。**  
你要覆盖的是它已经验证过的 **deadline-first 工作流内核**，然后用 DueDateHQ 的云端、AI、自动规则更新、受影响客户匹配，把它最落后的部分打穿。

File In Time 的价值不是“技术先进”，而是它非常清楚 CPA 真正怕什么：**漏截止日、漏延期、漏负责人、漏状态、漏滚转**。它的产品骨架值得继承；它的桌面安装、本地网络盘、手工导入导出、缺少 API、缺少自动公告监控、缺少现代协作体验，则是 DueDateHQ 的机会。

还有一个要修正的点：你们 DueDateHQ 商业计划书里提到 File In Time “起价 $199/月”，这个口径建议不要在 pitch 里直接使用。官方 flyer 更像是 **$199/user 授权 + 首年维护包含 + 之后 annual maintenance $100/user**，竞品报告里也指出 File In Time 价格公开信息存在冲突。更稳妥的表达是：“传统桌面授权 + 年度维护模式，当前公开价格口径不完全一致。”

---

## 1. File In Time 真正做得好的地方

### 1.1 它抓住了 CPA 的核心工作流，而不是泛泛做任务管理

File In Time 的核心不是 CRM，也不是客户门户，而是一个很清晰的闭环：

**客户 → 服务 / 表单 → 截止日 → 负责人 → 状态 → 延期 → 完成 → 滚转到下一周期**

这对税务行业非常关键。税务工作不是一次性项目，而是周期性、重复性、强约束的 compliance 工作。官方材料显示它支持到期日与项目追踪、任务筛选排序、roll-forward、延长期限、任务视图、工作量报告等，这些都直接服务于“别漏、别乱、能追责”的需求。

这点对 DueDateHQ 很重要。你不要把产品做成普通 Todo List，也不要做成普通 Calendar。你要做的是 **Tax Deadline Work Queue**。

---

### 1.2 它的“任务视图”很朴素，但很有效

File In Time 的任务视图是典型表格式数据库体验：客户、服务、到期日、状态、负责人、延期、备注等字段。这种设计不时髦，但非常符合 CPA 在申报季的使用方式：快速筛选、快速排序、批量查看、按负责人分配、按状态推进。竞品报告也明确指出，它的 UI 优势在于“足够直接”，任务视图适合按客户、服务、负责人、到期日和状态进行批量筛选。

这说明 DueDateHQ 的主界面不要一开始追求花哨。**表格视图必须有，而且要强。**  
卡片、AI chat、漂亮 dashboard 都可以做，但不能替代表格型工作队列。

---

### 1.3 红色临期提醒是低技术、高价值功能

File In Time 有一个非常简单但有效的提醒机制：到期日当天、提前一周、两周等时间点可以让 due date 变红。这个功能没有技术复杂度，但它切中了用户心理：CPA 不想“理解系统”，他只想一眼看到危险项。

DueDateHQ 不一定要复制“红色”这个具体表现，但必须做出同等强度的风险表达：

- Due soon
- Overdue
- Waiting on client
- Extension filed but payment still due
- Rule changed, needs review
- High penalty risk

File In Time 用颜色解决“注意力分配”。DueDateHQ 应该用 **风险分级 + 倒计时 + AI priority** 解决同一个问题。

---

### 1.4 Roll-forward / rollover 是税务行业的关键自动化

File In Time 支持把已完成任务 roll-forward 到下一期间或下一年度。这个功能非常重要，因为税务工作天然循环：月度 payroll、季度 estimated tax、年度 return、年度 extension、年度 K-1、年度 PTE election。

这不是普通“重复任务”。税务场景里的 rollover 需要保留客户、服务、实体类型、州、负责人、历史状态，同时生成新税年的任务。

所以 DueDateHQ 必须做一个轻量版 rollover，哪怕 MVP 只是：

> “Mark as filed” 后，系统自动生成下一 tax year / next quarter 的同类 deadline instance。

这会让产品看起来像真正懂税务行业，而不是套了税务皮的任务工具。

---

### 1.5 它的文件式导入 / 导出虽然老，但非常务实

File In Time 支持从 comma 或 tab delimited file 导入客户信息；官方博客也强调从 Excel 导入客户信息可以减少手工录入。

这件事很现实：小型 CPA 事务所的系统环境非常碎片化。有人用 TaxDome，有人用 Drake，有人用 QuickBooks，有人只有 Excel。**CSV 导入不是低级功能，是迁移转化的入口。**

DueDateHQ 用户故事也把“从 TaxDome / Drake / Karbon / QuickBooks 导出 CSV，30 分钟导入 30 个客户，并自动生成全年截止日日历”列为 P0 场景。

File In Time 做到了导入；DueDateHQ 应该做得更强：  
**AI 字段映射 + 实体类型识别 + 缺失字段建议 + 导入后自动生成 due dates。**

---

### 1.6 它在本地部署、备份、恢复、权限上的老派可靠性做得不错

File In Time 的公开 FAQ 显示，它支持本地硬盘、网络驱动器、多工作站访问、数据库备份、从备份恢复、自动每日备份、员工权限区分等。

这套技术架构在今天看不先进，但对传统小型事务所有吸引力：

- 数据在自己机器或网络盘里；
- 不依赖云服务；
- 出问题可以备份恢复；
- IT 管理方式简单；
- 成本低、运行轻。

DueDateHQ 不应该复制本地部署，但应该继承它背后的用户诉求：**CPA 要可控、可追溯、可恢复、可解释。**

在云端产品里，对应能力应该是：

- audit log；
- source history；
- rule version history；
- export backup；
- role-based access；
- data retention；
- manual review before applying AI-extracted rule changes。

---

## 2. File In Time 功能点里最值得学习的部分

下面按“你做竞品时是否要吸收”来分。

| File In Time 能力          | 做得好的原因                                     | DueDateHQ 是否要做 | DueDateHQ 的更好做法                                                         |
| -------------------------- | ------------------------------------------------ | -----------------: | ---------------------------------------------------------------------------- |
| 到期日追踪                 | 核心刚需，直接减少漏报风险                       |               必须 | 多客户、多州、多税种 deadline board                                          |
| 任务视图                   | CPA 申报季需要批量筛选和排序                     |               必须 | 表格 + 风险分组 + 过滤器                                                     |
| 状态管理                   | 只知道日期不够，必须知道是否完成、延期、等待客户 |               必须 | Not started / Waiting / In progress / Filed / Paid / Extended / Needs review |
| 延期管理                   | 税务场景核心流程                                 |               必须 | 区分“申报延期”和“付款仍到期”                                                 |
| Roll-forward               | 税务任务周期性强                                 |       必须做轻量版 | 自动生成下一季度 / 下一税年 instance                                         |
| CSV 导入                   | 降低迁移成本                                     |               必须 | AI 字段映射 + 智能纠错                                                       |
| Excel / PDF 导出           | CPA 要归档、汇报、发客户                         |                 P1 | PDF client report + CSV export                                               |
| 自定义服务 / 状态码        | 适配不同事务所流程                               |                 P1 | MVP 先预置少量规则，后续支持自定义                                           |
| 多员工权限                 | 小团队协作需要                                   |                 P2 | MVP 可不做完整 RBAC，但要预留 assignee                                       |
| 网络安装 / 本地数据库      | 旧时代的数据控制方案                             |               不做 | 用云端 + audit log + export backup 替代                                      |
| 25+ 报告                   | 管理层用途，非首屏价值                           |           不必全做 | 只做 1–2 个核心报告                                                          |
| 任意生日 / 会议 / 预约追踪 | 扩展用途，但会稀释定位                           |           不建议做 | 保持 tax compliance focus                                                    |
| 打印 extension forms       | 可能有价值，但实现复杂且区域差异大               |             暂不做 | 先做 extension status tracking                                               |

---

## 3. File In Time 落后的地方：DueDateHQ 的机会在哪里

### 3.1 桌面 / 网络盘架构落后于现代协作

File In Time 的公开材料和 FAQ 指向 Windows 桌面软件、本地目录、网络盘、多工作站安装、`fitwin` 目录、备份文件恢复等模式。这不是“错”，但它限制了现代协作：

- 远程办公体验差；
- 多设备访问差；
- 客户侧协作弱；
- 多人实时状态同步弱；
- 数据更新依赖安装包 / 维护更新；
- 很难做 API、webhook、自动通知、实时规则同步。

DueDateHQ 的商业计划书明确把产品定位为云端 SaaS，用来替代桌面软件与零散 Excel。这就是最大技术差异。

你的 pitch 可以这样讲：

> File In Time solved deadline tracking for the desktop era. DueDateHQ solves deadline intelligence for the AI/cloud era.

---

### 3.2 它缺少“税务规则变化 → 受影响客户”的自动链路

File In Time 有预置日期、任务提醒、roll-forward，但公开资料没有显示它能自动监控 IRS / 50 州税局公告，并在 24 小时内判断哪些客户受影响。相反，DueDateHQ 用户故事把“州税局突发延期通知 24 小时响应”定义为 P1 差异化场景：自动捕获公告、识别州/县/实体/税种、生成受影响客户清单，并附官方来源链接。

这是 DueDateHQ 真正应该赢 File In Time 的地方。

File In Time 的范式是：

> 我已经知道一个日期，所以提醒你。

DueDateHQ 的范式应该是：

> 官方规则变了，我知道哪些客户受影响，并告诉你下一步该做什么。

---

### 3.3 它的集成方式偏“文件导入导出”，不是开放生态

竞品报告指出，File In Time 公开可见的集成方式主要是 CSV/Tab 导入和 Excel 导出，没有看到公开 API、Webhook、原生邮件/日历双向同步、支付或文档签署接口说明。

这对小事务所初期可能够用，但会限制长期扩展。DueDateHQ 不需要两周内做 API，但产品方案里应该明确未来路径：

- Google Calendar / Outlook calendar sync；
- Gmail / Outlook reminder；
- Zapier / Make；
- TaxDome / Karbon / QuickBooks import；
- compliance calendar API；
- webhooks for rule update / deadline status change。

DueDateHQ 商业计划书里已经提到 Phase 4 的合规日历 API，这个方向正确。

---

### 3.4 它的 AI 能力基本缺席

File In Time 的价值来自预置规则和手动工作流；DueDateHQ 的价值主张画布则明确把 AI 作为核心战略资产：将分散、晦涩、高维度的政府数据，转化为针对 CPA 客户组合的可执行情报，并认为没有 AI 就难以在 $49/月价格点覆盖 50 州合规数据维护成本。

这意味着你做竞品时不应该只说“我也能追踪截止日”。那只是追平。你要突出：

- AI 解析公告；
- AI 抽取适用州、县、表格、实体、税年、延期日期；
- AI 匹配客户；
- AI 生成客户通知草稿；
- AI 解释“为什么这个客户受影响”；
- AI 字段映射导入。

但要注意：AI 不应该直接替 CPA 做税务法律结论。产品里应该有 **official source + CPA review required**。

---

### 3.5 安全与合规叙事不足

File In Time 能看到的是备份、恢复、权限、本地数据控制。但现代 SaaS 买方会问更多问题：MFA、SSO、加密、审计日志、数据隔离、数据保留、SLA、SOC 2、访问记录等。竞品报告也指出，File In Time 公开资料没有充分说明这些现代安全能力。

DueDateHQ 的 MVP 不需要真的拿 SOC 2，但产品方案里应该写清楚：

- 所有规则更新保留 audit trail；
- 所有 AI 解读都附官方来源；
- 所有 deadline 修改可回滚；
- 人工确认后才批量更新客户截止日；
- 用户可导出完整数据；
- 税务建议免责声明。

这会比“我们用了 AI”更让 CPA 信任。

---

## 4. 你是否要覆盖 File In Time 的所有功能？

## 不要。

原因有三个。

第一，集训交付目标不是完整商业产品，而是“两周内交付产品方案 + 可演示前端产品”，能让真实 CPA 看懂你解决什么问题、怎么解决。你如果试图覆盖 File In Time 的全部功能，会变成浅层功能堆叠，Demo 反而失焦。

第二，File In Time 有很多功能是它的时代产物，不是 DueDateHQ 的竞争核心。例如网络盘安装、CD / download、手动备份恢复、打印大量报告、任意事件跟踪。这些不是你要复制的东西。

第三，DueDateHQ 的关键不是 feature parity，而是 **workflow parity + intelligence superiority**。也就是说，基础工作流要追平，但智能化和现代化要明显超过。

你应该把 File In Time 拆成三层：

---

### 4.1 必须覆盖：否则 CPA 会觉得你“不懂业务”

这些是 DueDateHQ 的底层可信度。

| 必须功能                   | 为什么必须                                            |
| -------------------------- | ----------------------------------------------------- |
| 客户档案                   | 没有客户，就无法生成客户级 due dates                  |
| 实体类型 / 州 / 县 / 税种  | 截止日适用性取决于这些字段                            |
| Due date list / task table | CPA 需要批量查看，不是只看日历                        |
| 本周 / 本月 / 逾期分组     | 对应用户故事中的每周分诊                              |
| 倒计时                     | 用户要一眼知道风险紧迫性                              |
| 状态管理                   | Filed、Extended、Waiting on client 等比日期本身还重要 |
| 筛选和排序                 | 按客户、州、表单、状态、负责人筛选                    |
| CSV 导入                   | 迁移入口，不做就无法试用转化                          |
| 基础规则库                 | 至少支持几个常见联邦表单和 1–2 个州规则               |
| 延期状态                   | 税务场景核心                                          |
| 官方来源链接               | 信任与免责基础                                        |
| 受影响客户匹配             | DueDateHQ 区别于 File In Time 的关键                  |

---

### 4.2 应该覆盖但可以简化：Demo 做轻量版即可

| 功能         | MVP 简化方式                                            |
| ------------ | ------------------------------------------------------- |
| Roll-forward | 只支持 quarterly estimated tax 或下一 tax year 自动生成 |
| 报告导出     | 先做 CSV 或 PDF mock，不做完整报表中心                  |
| 自定义服务   | 先允许手动添加 custom deadline，不做完整模板系统        |
| 多员工协作   | 先有 assignee 字段，不做复杂权限                        |
| 通知         | 先做 in-app alert 和 email mock，不做短信               |
| 历史记录     | 先展示一条 audit trail，不做完整审计系统                |
| 客户报告     | 先做“Generate client summary”按钮和预览                 |

---

### 4.3 不建议 MVP 覆盖：会分散注意力

| File In Time 功能 / 形态 | 为什么不建议做                                        |
| ------------------------ | ----------------------------------------------------- |
| 本地 Windows 安装        | 与 DueDateHQ 云端 SaaS 定位冲突                       |
| 网络盘部署               | 旧架构，不是现代差异化                                |
| 手动备份 / restore UI    | 云端产品应做数据导出和审计，不复制旧备份流程          |
| 任意生日 / 会议追踪      | 稀释税务合规定位                                      |
| 25+ 标准报告             | 两周内没有必要，容易变成空壳                          |
| 40 个 tracking fields    | 复杂但不一定高价值                                    |
| 打印 extension forms     | 法域和表单复杂，MVP 风险高                            |
| 客户门户 / 电子签名      | 不是 File In Time 强项，也不是 DueDateHQ 第一阶段核心 |
| 全量 50 州数据库         | Demo 不需要真覆盖，重点是规则引擎和更新逻辑           |

---

## 5. File In Time 的“技术做得好”与“技术落后”要分开看

### 5.1 技术做得好的地方

#### A. 低复杂度、高稳定性的本地工作组架构

File In Time 的本地 / 网络盘模式对传统事务所很友好。它不要求复杂 IT，不要求云账号，不要求浏览器生态，备份恢复路径也清晰。FAQ 中能看到它可以安装到网络驱动器，多工作站通过映射盘访问，并通过备份文件迁移数据。

这说明它的技术选择符合早期目标用户：小型事务所、Windows 环境、低预算、低 IT 成熟度。

#### B. 数据模型抓住了领域对象

它至少有这些对象意识：

- client；
- service / filing；
- due date；
- status；
- staff / key person；
- extension；
- report；
- historical data；
- service group。

这些对象是你做 DueDateHQ 数据模型的参考。不要从 UI 开始设计，应该从这些领域对象开始。

#### C. Rollover 是一个很实用的领域自动化

Rollover 本质上是把税务周期制度化。很多 SaaS 做 recurring task，但税务 rollover 还要带上 tax year、entity、jurisdiction、extension、status history。File In Time 把这件事变成核心功能，是很好的产品判断。

#### D. Import / Export 是正确的边界策略

对小型 CPA 来说，彻底替换现有系统很难。File In Time 用 CSV/Tab 和 Excel 解决迁移、归档和报表，是务实策略。DueDateHQ 也应该先支持文件式迁移，再谈 API。

---

### 5.2 技术落后的地方

#### A. 不是云端多租户

这会影响远程访问、多人实时协作、跨设备使用、自动更新、集中权限、安全审计和持续数据服务。DueDateHQ 的云端 SaaS 定位正好反击这一点。

#### B. 没有公开 API / Webhook / 生态集成

竞品报告没有找到 File In Time 公开 API、Webhook、原生日历邮件同步等材料。这意味着它更像孤立工具，而不是平台组件。DueDateHQ 后续可以把 calendar API 做成平台化路径。

#### C. 更新机制更像年度维护，而不是实时合规情报

TimeValue 的 “What’s New” 显示 File In Time 2026.1 仍可用，并包含 2025 税年的表单 / 期限更新，说明它仍在维护，不是死产品。但这类“版本更新 + 年度维护”与 DueDateHQ 想做的“24 小时内捕获州税局公告并匹配客户”不是一个层级。

#### D. AI 缺席

它能告诉你“某任务快到期了”，但没有公开证据表明它能回答：

- 这条 IRS/州税局公告影响哪些客户？
- 这条公告是否包括 payment deadline？
- 哪些客户在受灾 county？
- 哪些 S-Corp / Partnership 需要 PTE action？
- 哪些字段导入有歧义？

这正是 DueDateHQ 的技术壁垒。

#### E. 现代安全叙事不足

File In Time 的安全更多是传统本地控制：权限、备份、网络盘。DueDateHQ 作为 SaaS，必须补上更现代的表达：MFA、审计日志、source traceability、rule versioning、human review、data export、role-based access。

---

## 6. DueDateHQ 的必做功能清单

下面分成 **两周集训 P0** 和 **真实商业化 P0**。你现在最该看前者。

---

### 6.1 两周集训版本：必须做

#### P0-1：客户导入

这是试用转化入口，也是用户故事明确列出的 P0。

最低要求：

- 上传 CSV；
- 展示字段映射；
- 自动识别 client name、entity type、state、county、tax type；
- 对缺失字段给出 suggested mapping；
- 导入后生成客户列表。

Demo 里可以 mock AI，但体验必须像真的。

---

#### P0-2：客户档案

每个客户至少有：

- client name；
- entity type：Individual / Partnership / S-Corp / C-Corp / LLC；
- state；
- county；
- tax types；
- responsible CPA / assignee；
- importance / risk level。

没有客户档案，就无法做“受影响客户匹配”。

---

#### P0-3：基础 due date rule engine

不要做 50 州。先做 6–8 条规则：

- Form 1040；
- Form 1065；
- Form 1120-S；
- Form 1120；
- estimated tax quarterly payments；
- payroll tax / Form 941；
- California PTE mock；
- 一个 disaster relief mock rule。

关键不是数量，而是展示系统能从：

> 客户属性 + 规则库 → 生成 deadline instances

---

#### P0-4：主看板 / 每周分诊

这是第一用户故事的核心。用户要在 30 秒内看到本周要处理什么，并在 5 分钟内完成分诊。

主看板至少分：

- Due this week；
- Due this month；
- Overdue；
- Waiting on client；
- Recently changed rules。

每条任务显示：

- client；
- form / tax type；
- jurisdiction；
- due date；
- days remaining；
- status；
- assignee；
- source；
- risk level。

---

#### P0-5：状态管理

至少支持：

- Not started；
- In progress；
- Waiting on client；
- Filed；
- Paid；
- Extended；
- Needs review；
- Not applicable。

File In Time 的强项之一就是状态和任务视图。DueDateHQ 如果只有日期，没有状态，会显得不专业。

---

#### P0-6：延期与原始截止日 / 当前截止日区分

必须区分：

- original due date；
- current due date；
- extension filed；
- payment due date；
- filing due date；
- official source。

这在税务产品里非常关键。很多延期只是延期申报，不一定延期付款。

---

#### P0-7：规则变化 alert + 受影响客户清单

这是 DueDateHQ 超越 File In Time 的核心演示点。

Demo 可以设计一个场景：

> California storm relief announced. Filing deadline extended to Oct 15 for taxpayers in Los Angeles County.

系统展示：

- AI summary；
- affected jurisdiction；
- affected county；
- affected tax forms；
- new deadline；
- official source；
- affected clients；
- “Apply update” button；
- “Mark as reviewed” button。

这就是用户故事里的“州税局突发延期通知 24 小时响应”。

---

#### P0-8：官方来源链接 / 审核状态

每一条 AI 解读必须有：

- official source link；
- extracted fields；
- confidence；
- reviewed / unreviewed；
- last checked at；
- applied by。

DueDateHQ 商业计划书也把数据错误列为高风险，并建议通过官方来源链接、一键核验、服务条款、保险等方式缓释。

---

#### P0-9：轻量 rollover

做一个简单但能演示的功能：

- 标记 Q1 estimated tax 为 Paid；
- 系统生成 Q2 estimated tax task；
- 或标记 2025 Form 1120-S Filed；
- 系统生成 2026 tax year planning placeholder。

这能直接对标 File In Time 的 roll-forward，并显示你理解行业的周期性。

---

## 7. 真实商业化版本：必须补齐

如果不是两周 Demo，而是要真的商业化，必须补这些：

| 模块                     | 为什么商业化必须有                                |
| ------------------------ | ------------------------------------------------- |
| 规则版本管理             | 税务规则会变，必须知道哪版规则生成了哪条 due date |
| Human-in-the-loop review | AI 抽取不能直接无审核更新客户任务                 |
| Notification engine      | Email / SMS / in-app reminders                    |
| Calendar sync            | CPA 很可能仍依赖 Outlook / Google Calendar        |
| Bulk actions             | 一次影响 20 个客户时，不能逐条更新                |
| Audit log                | 税务合规产品必须可追溯                            |
| Data export              | 降低客户对 SaaS lock-in 的担忧                    |
| Role-based access        | 小团队协作需要最基本权限                          |
| Custom deadline          | 规则库覆盖不到时允许手动添加                      |
| Client report            | CPA 需要给客户解释本月要准备什么                  |
| Security page            | MFA、加密、数据隔离、备份策略、隐私说明           |

---

## 8. 你做竞品时的推荐定位

不要说：

> “我们是 File In Time 的云端版。”

这太弱，也容易把自己限制在它的功能边界里。

应该说：

> **DueDateHQ is a deadline intelligence layer for small CPA firms. It combines File In Time’s deadline-first workflow with AI-powered regulatory monitoring and client impact analysis.**

中文表达就是：

> DueDateHQ 继承 File In Time 已经验证过的截止日工作流，但不复制它的桌面软件形态。我们做的是云端的税务截止日期智能分诊系统：不仅提醒 CPA 什么快到期，还告诉他官方规则发生了什么变化、哪些客户受影响、下一步该处理什么。

---

## 9. Demo 里最该展示的 5 个画面

### 画面 1：CSV Import

用户上传 TaxDome / Excel 导出的客户表。系统自动映射字段，识别 entity type、state、county、tax type。

**目的：证明上手快。**

---

### 画面 2：Dashboard

展示 Due this week、Due this month、Overdue、Recently changed rules。

**目的：证明解决每周分诊。**

---

### 画面 3：Client Detail

打开一个客户，看到全年 due dates、状态、来源、延期情况。

**目的：证明不是普通日历，而是客户级 compliance profile。**

---

### 画面 4：Regulatory Alert

展示一条州税局 / IRS 延期公告，AI 摘要影响范围。

**目的：证明区别于 File In Time。**

---

### 画面 5：Affected Clients + Apply Update

系统列出 6 个受影响客户，点击后批量更新 deadline，并留下 official source 和 audit trail。

**目的：证明 AI 不是装饰，而是工作流杠杆。**

---

## 10. 最后给你的功能优先级表

### 现在必须做，Demo 不做会失焦

| 优先级 | 功能                        |
| ------ | --------------------------- |
| P0     | CSV 导入 + AI 字段映射      |
| P0     | 客户档案                    |
| P0     | 基础税务规则库              |
| P0     | 自动生成 due date instances |
| P0     | 本周 / 本月 / 逾期看板      |
| P0     | 状态管理                    |
| P0     | 筛选 / 排序                 |
| P0     | 延期状态                    |
| P0     | 规则变化 alert              |
| P0     | 受影响客户匹配              |
| P0     | 官方来源链接                |

### 可以做，会明显加分

| 优先级 | 功能                                             |
| ------ | ------------------------------------------------ |
| P1     | 轻量 rollover                                    |
| P1     | PDF client report                                |
| P1     | Email reminder mock                              |
| P1     | Audit trail                                      |
| P1     | Bulk apply extension                             |
| P1     | 自然语言查询：“Which clients are due this week?” |
| P1     | Calendar export / ICS mock                       |

### 暂时不要做

| 优先级 | 功能                 |
| ------ | -------------------- |
| 暂缓   | 客户门户             |
| 暂缓   | 电子签名             |
| 暂缓   | 支付                 |
| 暂缓   | 完整权限系统         |
| 暂缓   | 25+ 报告             |
| 暂缓   | 全 50 州真实数据库   |
| 暂缓   | 原生移动 App         |
| 暂缓   | 本地安装 / 网络盘    |
| 暂缓   | 打印 extension forms |

---

## 最终判断

File In Time 的产品能力可以概括成一句话：

> **它把税务事务所的 deadline workflow 做对了，但没有把 deadline intelligence 做出来。**

所以你做 DueDateHQ 时：

1. **必须继承**：任务视图、截止日、状态、延期、roll-forward、导入导出、客户-服务-日期模型。
2. **必须超越**：云端协作、AI 字段映射、官方公告监控、受影响客户匹配、来源可核验、规则版本管理。
3. **不要复制**：本地安装、网络盘、备份恢复 UI、任意事件追踪、复杂报表堆叠、旧式权限管理。
4. **两周内最重要的 Demo 闭环**：  
   **导入客户 → 自动生成截止日 → 每周分诊 → 规则变更 alert → 匹配受影响客户 → 批量更新并保留官方来源。**

只要这条闭环演示顺畅，你就不是在做 File In Time 的功能复刻，而是在做它的现代化替代品。

---

## 附：本文件基于的材料

- File In Time 产品介绍与竞品分析研究报告
- 工程师集训说明
- 用户故事与价值主张画布
- DueDateHQ 商业计划书
