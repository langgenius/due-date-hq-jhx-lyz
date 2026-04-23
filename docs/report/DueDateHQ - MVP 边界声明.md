# DueDateHQ MVP v0.3 单一执行口径

版本：v0.3
产品形态：Cloud SaaS Web App  
Build Window：14 天，不含后续观察  
目标种子用户：10 位独立 CPA  
观察窗口：Build 后 14 天
文档状态：当前 MVP 执行口径。其他行业、竞品、Demo 报告均为研究输入，不直接扩展本范围。

## 1. 一句话说明

DueDateHQ MVP 是一个面向独立 CPA 和小型会计事务所的云端 SaaS Web App，产品形态是**每周 deadline 优先级分诊台**。

用户打开首页时，第一眼看到的不是月历、客户 CRM、普通任务列表或 AI chat，而是一张按风险排序的本周处理清单，帮助 CPA 每周快速判断：

- 哪些客户本周要处理
- 哪些截止日有风险
- 为什么有风险
- 下一步要检查什么
- 依据来自哪里
- 哪些 deadline 已完成、进行中或延期

MVP 不做完整税务合规平台，也不做自动报税、客户门户、工作流系统或税务咨询产品。

内部一句话：

> 把可信的税务 deadline 数据，整理成 CPA 每周可执行的优先级分诊清单。

## 2. MVP 的核心问题

MVP 要回答的不是“能不能做出完整产品”，而是：

> 10 位真实 CPA 用了两周后，有几位会主动回来用第三周？

因此，两周只是 build window，不是完整验证周期。完整判断至少需要：

- 2 周构建
- 2 周观察
- 退出访谈
- 对照指标做 Proceed / Gray / Rethink 决策

## 3. 要做出来的产品

### 3.1 SaaS 基础形态

MVP 必须是一个真实的云端 SaaS Web App，而不是 demo、表格模板或内部工具。

必须具备：

- CPA 使用自己的账号登录
- 客户数据保存在云端
- 每个账号只能看到自己的客户和截止日
- MVP 只支持单用户账号
- 暂不支持团队、权限、组织、角色管理

### 3.2 客户录入

用户手动添加客户。

字段控制在最小范围：

- 客户姓名
- 州
- 实体类型：LLC / S-Corp / Partnership
- 适用税种

不做 CSV 导入，不做字段智能识别，不做 EIN 校验。

### 3.3 截止日生成

系统基于人工确认过的静态规则，为客户生成全年税务截止日。

MVP 覆盖范围：

- Federal
- CA
- NY
- TX
- FL
- WA

这些州的截止日必须人工录入、人工确认。AI 不能作为日期数据源，不能自动修改截止日规则。

### 3.4 主看板：优先级分诊台

首页必须是优先级分诊台，不是普通日历首页。

第一屏必须回答五个问题：

- Who needs attention this week?
- What is the deadline?
- Why is it risky?
- What should I check next?
- Where is the source?

首页按风险和时间组织，而不是只按日期平铺：

- Critical
- High Priority
- Upcoming

每条 deadline 必须显示：

- 客户
- 州
- 实体类型
- 税种 / filing / payment / extension 事项
- due date
- days remaining
- risk reason
- next check
- source link
- human verified 状态

支持基础筛选：

- 客户
- 州
- 税种

每条截止日支持状态管理：

- Not started
- In progress
- Completed
- Extended

MVP 可以加入最小 readiness 信号，用于表达真实税季中“客户材料是否卡住”的风险：

- Ready
- Waiting on client
- Needs review

允许用户可选填 `internal cutoff date`。这只是分诊信号，不是客户门户、文件收集、自动催客户或完整 workflow。

首屏示例：

```text
This Week

Critical
- Acme LLC · CA Franchise Tax · due in 3 days
  Waiting on client · Internal cutoff passed
  Why: deadline close + client not ready
  Next: confirm payment / decide whether extension workflow is needed
  Source: CA FTB · human verified
  [In progress] [Completed] [Extended]

High Priority
- Bright Studio S-Corp · Federal 1120-S extension · due in 7 days
  Needs review
  Why: extension changes filing timeline, not payment obligation
  Next: estimate tax due / confirm client approval
  Source: IRS Form 7004 · human verified
```

### 3.5 AI 分诊增强

AI 必须进入 MVP，但只能做解释和分诊增强。

AI 要做：

- 每周 Brief：总结本周最需要关注的客户和事项
- 客户风险摘要：指出某个客户近期有哪些 deadline 风险
- 单条截止日 Tips：解释这是什么、为什么重要、通常要准备什么
- 来源摘要：把人工确认过的官方来源翻译成人话
- 下一步检查建议：把风险转成 CPA 可以核验的 action

AI 必须基于已确认的截止日数据和来源链接生成内容。

AI 不能做：

- 自动监控州税局公告
- 自动改截止日规则
- 自动判断灾害延期是否适用
- 自动判断某个客户是否适用某项税务规则
- 给结论性税务建议
- 自动判断客户材料是否齐全
- 自动发送客户催办

AI 输出的定位是：

> 摘要、提示、待核验事项、来源解释、下一步检查建议。

不是：

> 合规结论、税务建议、官方规则替代品。

### 3.6 提醒

MVP 做：

- 应用内提醒
- 邮件提醒
- 30 / 7 / 1 天阶梯提醒

使用托管邮件服务即可。

不做：

- 短信提醒
- 移动 App 推送
- Google Calendar / Outlook 集成

### 3.7 付费意愿探针

产品内放一个按钮：

```text
I'd pay $49/mo to keep using this
```

按钮不扣费，不接 Stripe，只作为弱信号。

真实付费验证放到 MVP 之后。

## 4. 明确不做什么

MVP 不做：

- 50 州完整覆盖
- AI 自动监控州税局公告
- AI 自动维护税务数据库
- CSV 导入
- AI 字段映射
- 规则变化 alert / 受影响客户自动匹配
- 批量更新 deadline
- TaxDome / Drake / QuickBooks 集成
- Google Calendar / Outlook 集成
- 多用户、团队权限、Team 版
- Stripe 付款
- 发票
- 短信提醒
- 移动 App
- 延期申请状态机
- 自动催客户 / client request / follow-up log
- PDF 客户报告
- CSV 导出
- SEO 页面
- 客户门户
- 文档存储
- 工作流任务分配
- 报税自动化
- 时间追踪和计费
- 开放 API

## 5. 目标用户画像

MVP 不面向“所有 CPA”。

第一批用户必须非常窄：

> 还在用 Excel / Google Sheets / Outlook 管理多客户、多州税务截止日的独立 CPA 或 1-3 人小型事务所。

### 5.1 最匹配的人

理想种子用户：

- 美国独立 CPA
- 独立执业或 1-3 人小型事务所 owner
- 服务 20-100 位活跃客户
- 至少有 2 位客户落在 CA / NY / TX / FL / WA
- 客户包含 LLC / S-Corp / Partnership
- 需要追踪州级所得税、季度预估税、franchise tax、PTE election 或延期相关 deadline
- 现在主要靠 spreadsheet、calendar、email inbox 拼起来管理截止日
- 对漏 deadline 有真实焦虑
- 愿意在两周内录入至少 5 位真实客户
- 愿意接受 45 分钟退出访谈

### 5.2 不适合的人

MVP 不优先服务：

- 大型事务所员工
- 已经深度使用 Karbon / Canopy / TaxDome 的团队
- 只有本州客户、deadline 很少的 CPA
- 主要做简单个人 1040 的 CPA
- 期待产品自动报税的人
- 期待 AI 给税务建议的人
- 不愿意把客户数据录入云端的人

## 6. 两周构建节奏

### Week 1, D1-D3

- 并行启动招募和开发
- PM 邀请 30+ 位 CPA
- 目标筛出 12-15 位合格候选
- 开发基础登录、客户录入、优先级分诊首页

### Week 1, D4-D7

- 人工录入 Federal + 5 州核心截止日
- 补齐来源链接和人工确认状态
- 继续开发筛选、状态切换、readiness / internal cutoff 最小字段
- 准备 AI Tip 输入素材
- 确认 10 位种子用户

### Week 2, D8-D11

- 打通邮件提醒
- 打通 AI 每周 Brief
- 打通单条 deadline Tips
- 加入付费意愿按钮
- 做数据准确性自查
- 让 2-3 位 CPA 做 friends & family 试用

### Week 2, D12-D14

- 修复阻塞 bug
- 10 位种子用户依次 onboarding
- PM 做 15 分钟一对一演示
- 记录 setup 耗时
- Build window 结束，功能冻结

### Week 3

- 被动观察
- 每日复盘埋点
- 只处理功能障碍，不临时加功能

### Week 4

- 做 10 场退出访谈
- 对照指标做 Proceed / Gray / Rethink 决策

## 7. 要测量的指标

指标控制在 7 个以内：

| 指标              | 定义                                                 | 目标           |
| ----------------- | ---------------------------------------------------- | -------------- |
| Setup 耗时        | 从完成登录到录入第 1 位客户并看到其本周/本月分诊清单 | P50 ≤ 15 分钟  |
| Week-1 主动登录   | onboarding 后 1-7 天内自发登录次数                   | ≥ 2 次 / 用户  |
| Week-2 主动回访   | 第 8-14 天内至少登录 1 次的人数                      | 10 人中 ≥ 5 人 |
| 分诊 session 耗时 | 非首次登录的 session 时长中位数                      | ≤ 10 分钟      |
| 日历条目编辑率    | 用户修改或删除系统生成截止日的比例                   | < 20%          |
| AI Brief 有用率   | 访谈中认为 AI Brief / Tips 提升分诊效率的人数        | ≥ 5 / 10 人    |
| 付费意愿按钮点击  | 点击 $49/mo 意愿按钮的周活用户比例                   | ≥ 30%          |

这些都是 leading indicators，不能单独作为结论。最终判断必须结合退出访谈。

## 8. 成败判据

### Proceed

继续做，进入 Phase 1+。

必须全部满足：

- Week-2 回访人数 ≥ 5
- 至少 3 人明确表示愿意付 $49/月试用
- 至少 5 人认为 AI Brief / Tips 明确提升每周分诊效率
- 日历编辑率 < 30%

### Gray

有使用价值，但可能不值 $49/月。

典型情况：

- Week-2 回访 5-7 人
- 几乎无人主动谈付费
- 用户说“好用，但不至于付 $49”
- AI 有帮助，但不够强到形成差异化

下一步讨论：

- 是否换 ICP
- 是否改定价
- 是否必须强化 AI 分诊价值
- 是否必须捆绑 Phase 2 功能才能支撑价格

### Rethink

JTBD 或 ICP 选错。

任一触发：

- Week-2 回访 < 4 人
- 超过 50% 用户说不如现在的 Excel
- 超过 50% 用户认为 AI 内容泛泛、不可用或增加核验负担
- 日历编辑率 > 40%

Rethink 状态下不继续堆功能，先重新做发现期。

## 9. 关键产品边界

这个 MVP 最重要的边界是：

> 截止日可信度来自人工确认的数据，AI 只负责让这些数据更容易理解和行动。

因此，产品差异化不是“AI 自动替 CPA 做合规判断”，而是：

> AI 把分散、难读、难排优先级的 deadline 信息，整理成 CPA 每周可执行的优先级分诊情报。

如果目标用户愿意每周回来用这个看板，说明方向值得继续。

如果目标用户不愿意回来，先不要扩州、不要做集成、不要做 Stripe，也不要继续加 AI 花活。

## 10. 研究输入与后续候选

以下能力在其他报告中反复出现，方向正确，但不进入两周真实用户验证 MVP：

| 能力                             | 当前处理                                                 |
| -------------------------------- | -------------------------------------------------------- |
| CSV 导入 / AI 字段映射           | Phase 2 候选。若 MVP 留存成立，再用于降低迁移摩擦。      |
| File In Time 式 rollover         | Phase 2 候选。先验证 weekly triage，再做周期滚转。       |
| 规则变化 alert / 受影响客户匹配  | Demo/Pitch 可 mock；真实产品需单独验证数据和法律责任。   |
| 团队负载看板 / assignee / RBAC   | 小团队版候选。MVP 保持单用户。                           |
| 审计日志 / 规则版本管理          | 商业化必需，但两周 MVP 只保留 source 与 human verified。 |
| CSV / PDF / ICS 导出             | Phase 2 候选。MVP 不做导出。                             |
| 公开 50-state tracker / SEO 内容 | 增长实验候选，不进入 MVP build window。                  |

当前执行原则：

> 任何新增功能，必须能直接提升“用户打开首页后一眼看懂本周优先级”的能力；否则默认后置。
