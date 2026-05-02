# DueDateHQ 对照 1040 报税工作流的缺陷分析

## 分析边界

本文参考 `/Users/hanxujiang/Documents/New project/TAX-Report.md` 中的 1040 报税服务线
11 环节框架，评估 DueDateHQ 当前项目相对“报税生产线”的能力缺口。

这不是税务、法律或执业意见。本文只分析产品和工程模块差距：当前 DueDateHQ 更像“截止
日、罚金风险、政府来源变更、证据链和团队排队操作台”，还不是完整的 1040 tax prep
workflow / practice management / client portal / delivery 系统。

## 结论摘要

DueDateHQ 当前最强的能力集中在三段：

- 把客户和义务导入系统，并生成 deadline / risk / evidence 队列。
- 监控 IRS、州税务机构、FEMA 等来源变化，通过 Pulse 推送给事务所复核。
- 让团队在 Dashboard / Workboard / Audit 中分诊截止日、风险、证据和负责人。

但 TAX-Report 强调的效率瓶颈主要在“签约、排期、资料收集、工作底稿、补资料、录入、
review、billing、delivery”。这些环节中，DueDateHQ 目前覆盖最多的是排期的截止日视角和
资料缺口的初级状态，尚未覆盖完整报税服务线。因此最大缺陷不是某个按钮缺失，而是产品
对象模型仍以 `client + obligation_instance` 为中心，缺少 `engagement / organizer / document / binder / return / review / delivery / client invoice` 这些报税生产对象。

## 当前项目与 11 环节对照

| TAX-Report 环节              | 当前覆盖   | 主要缺陷                                                                                                                          |
| ---------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1. 客户签约 / 续约           | 基本未覆盖 | 只有 DueDateHQ 自身订阅计费，没有事务所对客户的 engagement、proposal、三档报价、服务范围、自动扣款授权                            |
| 2. 排期                      | 部分覆盖   | Workboard 有 due date 和负责人，但没有客户资料提交窗口、目标交付周、产能排班、season wave                                         |
| 3. 资料收集 Intake           | 很弱       | Migration intake 是导入客户，不是 tax organizer；没有上一年个性化资料清单、文件上传、自动分类、缺件追踪                           |
| 4. 工作底稿准备              | 基本未覆盖 | Evidence link 不是 workpaper binder；没有 PDF 拆分、tickmark、source document 到 tax input 的核对链                               |
| 5. 补资料请求                | 半成品雏形 | readiness contract/schema/repo/server handler 已出现，但缺迁移、公开 portal 路由、Workboard detail 挂载、前端操作入口和端到端验证 |
| 6. 税务软件录入              | 未覆盖     | 没有 Drake、ProConnect、UltraTax、Lacerte 等 handoff/export/pre-entry queue                                                       |
| 7. Self-review               | 很弱       | 有 `review` / `needs_review` 状态，但没有 preparer 自查 checklist、结果对比、异常校验                                             |
| 8. First review              | 很弱       | 没有 return complexity level、reviewer capability matrix、review assignment、review notes                                         |
| 9. Partner review / sign-off | 未覆盖     | 角色权限存在，但没有签字责任、最终批准、复核豁免、签字人与实际复核人一致性                                                        |
| 10. Client billing           | 未覆盖     | Billing 是 SaaS 订阅，不是客户项目收费；没有按 engagement 自动收费、超范围审查、交付前收款                                        |
| 11. Delivery                 | 很弱       | 有导出和客户邮件草稿，但没有 taxpayer copy、Form 8879 tracking、e-sign、交付包、acceptance/rejection ack                          |

## 缺陷一：产品核心对象不是“报税项目”

当前模型围绕：

- `client`
- `obligation_instance`
- `migration_batch`
- `pulse_announcement` / `pulse_firm_alert`
- `audit_event` / `evidence_link`
- `reminder` / `in_app_notification`

这套模型适合 deadline intelligence，但 TAX-Report 描述的生产线需要另一层对象：

- `tax_engagement`：年度、服务层级、价格、范围、签约状态、付款授权。
- `tax_return_project`：客户、tax year、form family、复杂度、target delivery week、当前阶段。
- `tax_organizer`：上一年驱动的个性化资料清单、客户问题、缺件状态。
- `source_document`：W-2、1099、brokerage statement、K-1、ID、payment record 等文件对象。
- `workpaper_binder`：文档归档、tickmark、review comments、source-to-input reconciliation。
- `review_assignment`：preparer self-review、first reviewer、partner sign-off。
- `delivery_package`：客户 copy、签署文件、付款指引、action checklist、acknowledgment。
- `client_invoice`：事务所向客户收费，不应混在 DueDateHQ SaaS billing 里。

如果不补这些对象，系统只能回答“哪个 deadline 风险高”，很难回答“这份 return 卡在哪个
生产环节、缺什么资料、谁能复核、能不能交付、是否已收费”。

## 缺陷二：排期只有截止日，没有产能控制

TAX-Report 的重点是 fully scheduled work：先决定每个客户的资料提交窗口和目标交付窗口，
再倒推提醒和内部处理节奏。

当前 DueDateHQ 有：

- Dashboard 的 This Week / This Month / Long-term。
- Workboard 的 due date、days、status、readiness、assignee。
- Team Workload 的 owner-level open / due soon / overdue / waiting / review。

缺的是：

- Client-level tax season window：例如 organizer opens、docs due、prep starts、review week、
  delivery target。
- Firm capacity calendar：按 preparer、reviewer、partner 角色规划每周可承载量。
- Intake cutoff policy：某个客户错过资料窗口后自动进入 extension / later wave。
- Target delivery week，而不是只看 statutory due date。
- Admin queue：让 coordinator/admin 主导资料窗口和提醒，而不是让 CPA 在 Workboard 中手工判断。

建议新增 `season_schedule` 或 `return_project_schedule` 模块，让 Workboard 的 due date 视角叠加
内部产能和交付承诺。

## 缺陷三：Intake 被误用为“迁移导入”

项目里的 Migration Copilot 很强，但它解决的是从 TaxDome、Drake、Karbon、QuickBooks、
File In Time 等旧系统导入客户和义务，不是向客户收集本年报税资料。

实际 1040 intake 需要：

- 根据上一年 return / organizer 生成个性化 checklist。
- 区分 expected、received、accepted、rejected、not applicable。
- 自动识别 W-2、1099、1098、brokerage statement、K-1、estimated payment record 等文件。
- 检查年份错误、重复上传、缺页、客户名不匹配。
- 对客户发送安全请求和自动提醒。
- 对 admin 显示“可整理、可标注、可追问”的队列。

当前代码有 PII/SSN blocking 和 AI mapper redaction，这是好的基础，但还没有文档对象、上传
入口、文件分类、缺件追踪、客户 portal，也没有与 Workboard 的 `readiness` 做成闭环。

## 缺陷四：客户补资料请求已有雏形，但产品闭环仍不完整

当前工作区已经出现 readiness 相关改动：

- `packages/contracts/src/readiness.ts`
- `packages/db/src/schema/readiness.ts`
- `packages/db/src/repo/readiness.ts`
- `packages/ports/src/readiness.ts`
- `apps/server/src/procedures/readiness`
- `packages/contracts/src/workboard.ts` 中的 `readinessRequests`
- `packages/contracts/src/obligations.ts` 中的 extension decision 字段

这说明“补资料请求”方向已经开始进入代码层，不再只是概念。但从当前代码看，仍有明显断点：

- `packages/db/migrations` 未包含 `client_readiness_request` / `client_readiness_response`
  建表迁移，也未包含 extension 字段迁移。
- `apps/server/src/procedures/workboard/index.ts` 仍没有实现 contract 里的 `getDetail`，root router
  也未挂载 `workboard.getDetail`。
- `apps/server/src/lib/readiness-token.ts` 已有 token helper，但当前没有公开 `/readiness/:token`
  portal route 来展示和提交客户响应。
- `apps/app/src/routes/workboard.tsx` 仍只暴露 readiness 状态筛选和更新，尚未提供“生成
  checklist、发送客户请求、查看响应、撤销请求”的 UI。
- 目前缺少围绕 readiness request、portal submit、邮件发送、audit/evidence 和 Workboard
  状态同步的端到端测试。

因此 readiness 已经是正确方向，但仍是半成品状态。继续开发前应先把 migration、public
portal、Workboard detail、UI 和测试闭环，否则会扩大类型和运行时漂移。

## 缺陷五：缺少 workpaper binder 和 admin 可执行工作

TAX-Report 反复强调 admin 不只是行政支持，而是可以承担资料整理、PDF 拆分、标注、基础核对、
预录入和 self-review 辅助。

DueDateHQ 当前的 Evidence / Audit 很适合解释“某个 deadline 或 Pulse 变更为什么发生”，但
它不是报税工作底稿系统：

- Evidence link 不是客户上传文件的主存储。
- Audit package 不是 workpaper binder。
- Workboard export PDF 不是 return preparation packet。
- 当前没有 tickmark、review note、document-to-line-item mapping、prepared-by / reviewed-by。

建议新增 `Document Inbox + Binder` 能力，但不要一上来做完整税务软件。MVP 可先做：

- 安全上传和文件对象表。
- 文件分类和年份校验。
- 按客户 / tax year / form family 生成 binder。
- Admin tickmark 和 missing-info request。
- 从 binder 推送 Workboard readiness 状态。

## 缺陷六：review 只有状态，没有分级生产系统

当前 `obligation_instance.status` 支持 `review`，`readiness` 支持 `needs_review`，Team Workload
也能统计 review 压力。但 TAX-Report 里的 review 是生产线瓶颈，需要按 return 复杂度释放高级
reviewer。

缺口包括：

- Return complexity level，例如 Level 1 government forms、Level 2 Schedule A、Level 3
  Schedule E、Level 4 Schedule C/F、更高层 pass-through。
- Reviewer capability：每个成员能 review 哪些 level、哪些 form、哪些州。
- Review routing：低复杂度 return 自动给 junior reviewer，高复杂度才进入 senior / partner。
- Self-review checklist：preparer 完成后才能进入 first review。
- Review comments 和 clear/reopen workflow。
- Partner sign-off 和责任归属。

建议把 review 从 obligation status 中抽出来，建立 `return_review_stage` / `review_assignment`
对象。否则 review 会继续只是一个筛选标签，而不是高级税务人员保护机制。

## 缺陷七：Billing 与 Delivery 都是“平台能力”，不是“客户交付能力”

当前 Billing 页面处理 DueDateHQ 的 SaaS 订阅、seat limit、checkout 和 provider portal。这对产品
商业化有用，但不解决事务所“完工后给客户收费”的问题。

报税生产线需要：

- Engagement quote / price band。
- Client payment authorization。
- Out-of-scope review。
- Delivery hold until paid。
- Invoice / payment status。
- Delivery package 生成和发送。

Delivery 还需要处理 e-file 授权和客户 copy。IRS 的 Form 8879 页面说明，Form 8879 是通过 ERO
电子申报时的签名授权文件；IRS Publication 1345 也要求 ERO 保留相关授权和确认文件，并向
纳税人提供完整 return copy。这意味着 Delivery 模块不能只是“导出 PDF”，还要跟签署、交付、
回执和保留策略相连。

## 缺陷八：AI 能力方向偏 deadline intelligence，未覆盖 workflow automation

当前 AI 包支持：

- migration mapper / normalizer。
- dashboard brief。
- Pulse extraction。
- PII redaction 和部分 guard。

TAX-Report 中 AI 最有价值的场景还包括：

- proposal 服务描述初稿。
- 基于会议转写生成 proposal。
- 客户沟通邮件。
- 客户上传文件自动识别和分类。
- 检查资料年份错误。
- 把 cover letter 改写成客户行动清单。

这些都不是“替代税务判断”，而是 admin / coordinator / preparer 的流程自动化。当前项目可以
复用 AI Gateway、schema validation、guard、audit/evidence 模式，但需要新增 prompt registry、
任务级成本控制、source document guard 和客户可见文案安全边界。

## 缺陷九：安全合规需要从 deadline 数据提升到 taxpayer document 数据

当前项目已经有好的安全基础：

- tenant-scoped repo。
- RBAC。
- audit append-only。
- PII redaction。
- coordinator dollar visibility。
- email suppression。

但如果进入客户资料收集和 delivery，数据敏感度会明显上升。IRS 的 taxpayer data security
资料强调 tax professionals 需要保护客户数据并建立 Written Information Security Plan；IRS
Publication 4557 也围绕 taxpayer data safeguarding、stored client data、phishing、incident
response 和 FTC Safeguards Rule 提供清单。

因此新模块不能只加上传表。至少需要：

- 文档对象的访问审计。
- 上传、预览、下载、删除和保留策略。
- R2 object lifecycle 和 per-firm prefix。
- client portal token 生命周期、撤销和重发。
- 文件级病毒/格式检查策略。
- AI 文件分类前的敏感字段边界。
- 数据泄露响应 runbook。

## 优先级建议

### P0：先闭合正在出现的 readiness / extension 切面

目标：把“等待客户补资料”和“延期决策”做成真正可用的小闭环。

应补齐：

- Drizzle migration。
- Workboard detail handler。
- Root router 挂载 `workboard.getDetail`。
- Email outbox `readiness_request` flush。
- Client portal signed token route。
- Public portal submit route。
- Audit / evidence event。
- UI 入口：从 Workboard 行详情生成 checklist、发送请求、查看响应、撤销请求。

### P1：做 Tax Organizer，而不是先做完整报税软件

目标：把 TAX-Report 中最大的效率机会 intake 自动化落地。

MVP 边界：

- 每个 client + tax year 一个 organizer。
- 8-20 个 checklist item，而不是无限文档管理。
- 文件上传、分类、年份校验、缺件状态。
- admin queue 和自动提醒。
- Workboard readiness 自动同步。

### P2：补 Return Project 与 Schedule

目标：从 due-date queue 进化成 scheduled work。

应新增：

- return project。
- target delivery week。
- docs due window。
- prep/review/delivery stage。
- complexity level。
- owner/preparer/reviewer/partner assignment。
- capacity view。

### P3：补 Review 与 Delivery

目标：保护高级 reviewer，并把交付变成可追踪动作。

应新增：

- self-review checklist。
- first-review queue。
- partner sign-off。
- delivery package。
- Form 8879 / e-file authorization tracking。
- taxpayer copy delivery log。
- acceptance/rejection acknowledgment tracking。

### P4：再考虑 client billing / tax software integrations

目标：避免过早进入支付和税务软件深集成。

优先顺序：

- 先做 client invoice / delivery hold 的轻量状态。
- 再做 payment provider integration。
- 税务软件先做 export / packet / checklist handoff，不急于写回或 transmit。

## 建议的模块地图补充

如果项目决定从 deadline intelligence 扩到 tax prep workflow，建议新增以下模块文档和代码域：

| 建议模块        | 位置建议                                                                     | 关键对象                                                 |
| --------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| Tax Engagement  | `apps/app/src/features/engagements`, `packages/contracts/src/engagements.ts` | proposal、tier、scope、price、renewal、authorization     |
| Tax Organizer   | `features/organizers`, `contracts/organizers.ts`                             | checklist、question、expected docs、status               |
| Document Binder | `features/documents`, `db/schema/documents.ts`                               | source document、classification、binder item、tickmark   |
| Client Requests | `features/readiness`, `procedures/readiness`                                 | request、portal token、response、reminder                |
| Return Projects | `features/returns`, `contracts/returns.ts`                                   | tax year、form family、stage、complexity、target week    |
| Review Workflow | `features/review`, `db/schema/review.ts`                                     | self-review、first-review、partner sign-off、review note |
| Client Billing  | `features/client-billing`                                                    | quote、invoice、payment authorization、delivery hold     |
| Delivery        | `features/delivery`                                                          | package、8879/e-sign status、client copy、acknowledgment |

## 战略判断

如果 DueDateHQ 的定位保持为“合规截止日与风险操作台”，上述很多缺口可以通过集成 TaxDome、
Karbon、Soraban、SafeSend、Drake、ProConnect 等工具解决，不一定要自建。

如果目标升级为“会计事务所税季生产系统”，当前项目的最大缺陷就是缺少报税生产对象和客户
资料/交付闭环。建议按 P0-P2 逐步推进，先把 intake、client request 和 scheduled work 做实，
不要一开始承诺完整 tax software replacement。

## 参考来源

- 本地总结：`/Users/hanxujiang/Documents/New project/TAX-Report.md`
- IRS Form 8879: [https://www.irs.gov/forms-pubs/about-form-8879](https://www.irs.gov/forms-pubs/about-form-8879)
- IRS Publication 1345: [https://www.irs.gov/pub/irs-pdf/p1345.pdf](https://www.irs.gov/pub/irs-pdf/p1345.pdf)
- IRS taxpayer data security tips: [https://www.irs.gov/newsroom/tips-to-help-tax-professionals-protect-client-information](https://www.irs.gov/newsroom/tips-to-help-tax-professionals-protect-client-information)
- IRS Publication 4557: [https://www.irs.gov/pub/irs-pdf/p4557.pdf](https://www.irs.gov/pub/irs-pdf/p4557.pdf)
