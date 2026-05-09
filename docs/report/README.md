# DueDateHQ 文档口径说明

更新时间：2026-04-21

## 当前执行口径

当前产品与两周构建范围以这份文档为准：

- [DueDateHQ MVP v0.3 单一执行口径](./DueDateHQ%20-%20MVP%20边界声明.md)

一句话：

> DueDateHQ 两周 MVP 是独立 CPA 的每周 deadline 优先级分诊台。用户打开首页后，应一眼看懂本周谁最急、为什么急、下一步检查什么、依据来自哪里。

## 文档分层

| 文档                                                                                                            | 状态                  | 使用方式                                                            |
| --------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------- |
| [DueDateHQ MVP v0.3 单一执行口径](./DueDateHQ%20-%20MVP%20边界声明.md)                                          | 执行口径              | 决定两周内做什么、不做什么、怎么验收。                              |
| [DueDateHQ - ICP 痛点与两周 MVP 精准打击面](../DueDateHQ%20-%20ICP%20痛点与两周%20MVP%20精准打击面.md)          | 产品北极星 / 调研解释 | 解释 ICP、痛点、为什么首页必须是 weekly triage。                    |
| [DueDateHQ\_行业深度调研报告](./DueDateHQ_行业深度调研报告.md)                                                  | 行业研究输入          | 用于理解市场、法规、竞品和长期机会。不要直接转成两周需求。          |
| [DueDateHQ 截止日与合规负载控制台行业与产品调研报告](./DueDateHQ%20截止日与合规负载控制台行业与产品调研报告.md) | 行业与产品研究输入    | 其中“负载、风险、规则中心”等是长期方向；MVP 只取 weekly triage。    |
| [DueDateHQ MVP深度调研报告](./DueDateHQ%20MVP深度调研报告.md)                                                   | Demo / 扩展方案输入   | 包含 CSV、导出、审计、公开页等建议；这些不自动进入 v0.3 MVP。       |
| [DueDateHQ 深入调研报告](./DueDateHQ%20深入调研报告.md)                                                         | 长期产品与技术输入    | 可用于 Phase 2/3 roadmap、合规、安全、技术架构讨论。                |
| [DueDateHQ*FileInTime*竞品分析](./DueDateHQ_FileInTime_竞品分析.md)                                             | 竞品研究输入          | 学习 File In Time 的 deadline-first workflow；不做 feature parity。 |
| [File In Time 产品介绍与竞品分析研究报告](./%20File%20In%20Time%20产品介绍与竞品分析研究报告.md)                | 竞品资料              | 用于确认 File In Time 的定位、能力和价格口径。                      |

## 范围收敛原则

两周真实用户验证 MVP 只服务一个主场景：

> 周一早上，CPA 用 5 分钟完成本周 deadline 分诊。

因此，首页必须是风险优先级 work queue，而不是：

- 月历首页
- 客户 CRM 首页
- 普通 task list
- AI chat 首页
- 完整 practice management dashboard

## 当前做

- 单用户 SaaS 登录。
- 手动添加客户。
- `FED + 50 states + DC` 的 source-backed deadline rules/candidates；生产提醒仍需人工确认 active rule。
- 自动生成客户 deadline。
- 首页 `Critical / High Priority / Upcoming` 优先级分诊。
- 状态：`Not started / In progress / Completed / Extended`。
- 最小 readiness 信号：`Ready / Waiting on client / Needs review`。
- 可选 `internal cutoff date`。
- AI Weekly Brief、Deadline Tip、Client Risk Summary。
- Source link 与 human verified。
- 应用内提醒与邮件提醒。
- `$49/mo` 付费意愿按钮。

## 当前不做

- CSV 导入 / AI 字段映射。
- 50 州完整覆盖。
- AI 自动监控州税局公告。
- 规则变化 alert / 受影响客户自动匹配。
- 批量更新 deadline。
- 团队、权限、assignee、负载看板。
- 客户门户、文档上传、电子签名。
- 自动催客户 / follow-up log。
- Stripe、发票、正式付费。
- CSV / PDF / ICS 导出。
- 公开 SEO tracker。
- Direct e-file、税额计算、税务建议。

## 后续候选

只有当 v0.3 验证“用户会每周回来用”之后，再讨论：

- CSV 导入与 AI 字段映射。
- File In Time 式 rollover。
- 规则变化 alert 与受影响客户匹配。
- 团队版和负载看板。
- 审计日志与规则版本管理。
- 导出、报告、公开 tracker。
- Calendar sync / API。

任何新增需求都必须先回答：

> 它是否直接帮助用户打开首页后一眼看懂本周优先级？

如果答案不是明确的“是”，默认后置。
