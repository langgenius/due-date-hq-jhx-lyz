# DueDateHQ PRD v2.0 — Unified Product Requirements Document

> 文档类型：产品需求文档（统一版 / Build-complete PRD）
> 版本：v2.0（集成 v1.0 主 PRD 与 v1.0-FileInTime-Competitor 优势）
> 日期：2026-04-23
> 目标：以 `docs/html/DueDateHQ - 用户故事与价值主张画布.html` 中 **P0 + P1 全部验收标准** 为强约束，重新定义 DueDateHQ 产品需求基线
> 范围定位：**产品完整性优先**，不以 14 天工期裁剪范围。本 PRD 是"能卖、能审计、能放规模"的目标形态；工期分配放在 §14，但不再是范围决定器
> 对外语言：English-first（产品 UI / 官网 / 邮件 / Demo），内部文档与代码注释使用英文
> 平台：Web-first（响应式）+ ICS 单向订阅，不做原生 App
> 阅读对象：PM / Design / Engineering / GTM / Compliance / 评委

---

## 0. 为什么存在这第三份 PRD

### 0.1 两份前作的核心判断与差距

| 维度 | v1.0 主 PRD（Glass-Box Copilot） | v1.0 Competitor PRD（FileInTime Replacement） | v2.0 的处理 |
|---|---|---|---|
| 核心叙事 | Clarity Engine™（Glass-Box + Pulse + Penalty）+ Migration Copilot™ | Autopilot Regulatory Radar + AI Migration Copilot | **继承 v1.0 叙事**（更利于 Demo 记忆），融入 Competitor 的工程细节 |
| AC 可追溯性 | §3.4 有矩阵，但偏章节映射 | §14.1 对比 v0.3 边界，AC 散落 §5 | **前置 AC Traceability Matrix**（§3.5），每条 AC → 功能 + 验收测试编号 |
| 时间分组命名 | This Week / This Month / Long-term（对齐 Story S1 AC#1） | Critical / High / Upcoming（需语义映射） | **采用 v1.0 命名**，并叠加风险色条（Critical/High）作为段内次级视觉 |
| Penalty 引擎 | Penalty Radar™（顶栏 $ 聚合 + What-If） | F-18 Penalty Forecaster（硬编码表 + `needs input` 降级） | **融合**：Radar 的 UX + Forecaster 的计算表（§7.5） |
| AI Smart Priority | §6.4 纯函数打分（权重固定） | F-5b 段内 LLM 排序 + 硬排 fallback | **采纳 v1.0 纯函数版**（可解释、零幻觉），**但允许用户在 Settings 里切 LLM 模式**（§7.4） |
| AI Q&A | §6.5 DSL 中间层（安全） | F-19 直接 NL→SQL + parser 校验 | **融合**：DSL 外层 + SQL 白名单内层，双保险（§7.7） |
| 证据链纪律 | Evidence Mode + `EvidenceLink` 表 | SourceBadge + verbatim quote | **采纳 v1.0 Evidence Mode**，并强制每条 Pulse 结构化字段附 verbatim quote（Competitor 做法） |
| EIN 字段 | 未显式 | 未显式 | **新增**：客户模型加 `ein`，Migration AI Mapper 显式识别（Story S2 AC#2） |
| 县筛选 | 仅 Pulse 匹配用 | 未列 | **新增**：Workboard 与 Ask 均支持 county 维度 |
| Pulse 通知 | Banner + email 分散 | Banner + email 分散 | **显式耦合**：每条 approved Pulse 触发同一事务内发 Banner + Email Digest（§6.3.4） |
| 日历能力 | ICS 单向订阅（P1） | 未做 | **采纳 ICS 订阅，提升到 P1 首发** |
| Default Tax Types 兜底 | §6A.3A 矩阵（优秀） | 无 | **保留并扩展到 50 州骨架**（§6A.5） |
| Undo 时限 | 24h | 7 天 | **融合**：全量 Revert 24h；单客户级 Undo 7 天（§6A.7） |
| 50 州覆盖策略 | MVP 只 5 州，其他黑名单 | 同 | **保留 MVP 5 州**，但**规则表结构必须能承接 50 州**（§6.1.6） |

### 0.2 v2.0 的产品一句话

> **DueDateHQ is the glass-box deadline intelligence platform for US CPAs — from the first paste of an Excel list to the IRS-auditable weekly brief, every deadline, every AI sentence, every rule-change alert clicks back to its official source, verified timestamp, and dollar-denominated risk.**

### 0.3 v2.0 的三条铁律（产品必须达成的体验级 SLA）

1. **30 秒** 看清本周最危险的 3–5 个客户（Dashboard 首屏 + Penalty Radar 顶栏）
2. **30 分钟** 完成 30 客户的**从粘贴到生成全年日历**的全链路（Migration Copilot）
3. **24 小时** 内一条州税局 / IRS 官方公告进入 Dashboard Banner + Email，附官方来源链接与受影响客户清单（Regulatory Pulse）

这三条与 Story S1 / S2 / S3 的核心 AC 一一对应，是整份 PRD 的**验收北极星**。

---

## 1. 产品定位与竞争坐标

### 1.1 竞品坐标

| 维度 | File In Time | TaxDome / Karbon / Canopy | **DueDateHQ v2.0** |
|---|---|---|---|
| 核心定位 | Desktop deadline tracker | All-in-one firm OS | **Deadline intelligence copilot** |
| 部署 | Windows 桌面 + 网络盘 | Cloud SaaS | Cloud-native SaaS + ICS 单向订阅 |
| 规则更新 | 年度维护包 | 用户自维护 | **24h 内 AI 捕获 → 人工复核 → 发布** |
| AI 能力 | 无 | 点缀型 | **Glass-Box，强制 provenance + 美元敞口 + Ask** |
| 风险表达 | 红色字体 | 天数 | **美元敞口 + 风险因子分解 + Penalty 规则链接** |
| 目标用户 | 传统小所 | 中大型事务所 | **独立 CPA + 1–10 人事务所** |
| 迁移摩擦 | 结构化 CSV | 人工录入 / 顾问协助 | **Paste-anywhere + AI Mapper + 24h Revert** |
| 价格锚点 | ~$199/user/年 + 维护 | $600–1,500/席/年 | **Solo $39 / Firm $99 / Pro $199 / mo** |

### 1.2 DueDateHQ IS / IS NOT

**IS**

- 云端多租户 SaaS Web App，浏览器即开即用
- **Deadline-first workboard**：首页不是 CRM、不是月历，而是按风险排序的本周处理清单
- **Glass-Box AI 副驾**：AI 负责解释、排序、起草；CPA 保留专业判断
- **审计可追溯系统**：所有 deadline / 规则 / AI 输出 / 客户状态变更均留痕
- **迁移友好**：Excel / CSV / Google Sheets / 粘贴 30 分钟内完成 30 客户导入
- **规则变化雷达**：IRS + 州税局公告 24h 内进入 CPA 视野

**IS NOT**

- ❌ Tax preparation software（不计算税额、不生成税表）
- ❌ Direct e-file transmitter（不承担 IRS e-file provider 合规责任）
- ❌ Client portal / document vault
- ❌ CRM / billing / time tracking 套件
- ❌ 无证据的 AI 税务顾问（AI 不下税务结论）
- ❌ 全自动改规则的 AI（AI 永远只建议，人工点 Apply）

### 1.3 设计原则

1. **Deadline-first, not calendar-first.** 首屏是风险队列。日历是输出端（ICS 单向订阅），不是编辑端。
2. **One object, multiple views.** 一个 `ObligationInstance` 承载 deadline / readiness / extension / risk / review / audit。
3. **Dense but modern.** 税务人熟悉的表格密度 + 2026 水准交互。
4. **Explainable by default.** AI 无 provenance = 不渲染。
5. **Human-in-the-loop.** AI 永不自动改 deadline 规则；Apply 必须人工点。
6. **Dollar-aware.** 风险表达单位优先用美元，其次才是天数。
7. **Source-anchored.** 每条规则、每个日期都有 `source_url` + `verified_by` + `verified_at` + `verbatim_quote`。
8. **Keyboard-first.** 所有高频操作必须有键盘快捷键。

---

## 2. 目标用户与核心场景

### 2.1 主 ICP

> 美国独立 CPA / EA / tax preparer，solo 或 1–10 人事务所 owner，服务 20–300 位 business clients，至少 2 位客户在 CA / NY / TX / FL / WA，当前用 Excel + Outlook + 税务软件报表拼接管理 deadline，对漏报有真实焦虑。

### 2.2 角色

| 角色 | 占比 | 核心任务 | v2.0 支持程度 |
|---|---|---|---|
| Owner / Signing CPA | 70% | 周度分诊、签字、风险决策 | **完整**（唯一 P0 主路径） |
| Manager | 15% | 分派、平衡负载 | Assignee 字段 + Manager Saved Views（P1） |
| Senior Preparer | 10% | 准备 return、追资料 | Readiness 状态机 + 客户文档跟进（P1） |
| Client Coordinator | 5% | 催资料、发提醒 | 提醒模板 + PDF 客户简报（P1） |

### 2.3 三大核心场景（对应三个 P0/P1 故事）

#### 场景 A · The Monday 5-Minute Triage（Story S1 · P0）
> 周一 8:00，Sarah（Solo CPA，85 客户）打开 laptop，只 15 分钟喝咖啡。她需要 5 分钟知道：本周谁最急、为什么急、敞口多少钱、下一步做什么。

→ 命中：Dashboard 三段时间分组 + Penalty Radar + Smart Priority + Weekly Brief

#### 场景 B · The 30-Minute Migration（Story S2 · P0）
> David 刚从 TaxDome 转来，手里有 30 客户的导出 CSV。他不想花一天录入，希望 30 分钟内完成并看到全年日历。

→ 命中：Migration Copilot 四步流程（Intake → AI Mapping → Normalize → Import + Live Genesis）

#### 场景 C · The 24-Hour Disaster Response（Story S3 · P1）
> 周三 IRS 公告加州 LA 县因风暴延期 Form 1040 至 Oct 15。Jennifer 的 85 客户里 12 位在加州。她需要 5 分钟内知道：哪 12 位被影响、哪些 deadline 要改、官方来源在哪、能否一键批量更新。

→ 命中：Regulatory Pulse + Dashboard Banner + Email Digest + Batch Apply + Audit Log

### 2.4 辅助场景（P1+）

- **Extension Decision**：客户 Acme LLC 的 K-1 还没到，距离 1120-S 只剩 5 天。Extension Decision Panel + What-If Simulator。
- **Client-Ready Explanations**：给客户发邮件解释截止日，AI Draft Email + Copy-as-Citation。
- **Ad-hoc Ask**：自然语言问"哪些客户要交 CA PTE？"→ AI Q&A Assistant。

---

## 3. 用户故事、验收标准与 Traceability Matrix

### 3.1 故事 S1（P0 · CORE）— 申报季每周分诊

> **作为** 服务 80 客户的独立 CPA，**我希望** 周一早 8 点打开电脑 30 秒内看到本周需要行动的截止日期，**这样** 我立即决定本周优先级，不需要在 Excel / Outlook / 手写笔记之间切换。

| AC # | 验收标准 | 覆盖功能（v2.0 章节） | 验收测试 ID |
|---|---|---|---|
| S1-AC1 | 登录后默认看板按 "本周到期 / 本月预警 / 长期计划" 分组 | Dashboard Triage Tabs（§5.1.2）| T-S1-01 |
| S1-AC2 | 本周到期项必须显示具体倒计时（精确到天）| TriageCard 倒计时徽章 + Workboard Days 列（§5.1.3 / §5.2.2）| T-S1-02 |
| S1-AC3 | 支持按客户 / 州 / 表单类型快速筛选，< 1 秒响应 | Workboard Filters（§5.2.3）+ 索引（§8.2）| T-S1-03 |
| S1-AC4 | 每个截止日支持一键标记"已完成 / 已延期 / 进行中" | 行内状态下拉（§5.2.4）| T-S1-04 |
| S1-AC5 | 整个分诊流程可在 5 分钟内完成 | Smart Priority + Weekly Brief + Penalty 顶栏 合力（§6.4 / §6.1 / §6.5）| T-S1-05 |

### 3.2 故事 S2（P0 · CORE）— 30 分钟导入 30 客户

> **作为** 刚从 TaxDome 切换过来的 CPA，**我希望** 30 分钟内完成 30 客户的导入并自动生成全年截止日历，**这样** 我可以立即开始使用，而不是花一整周手工录入。

| AC # | 验收标准 | 覆盖功能（v2.0 章节） | 验收测试 ID |
|---|---|---|---|
| S2-AC1 | 支持 TaxDome / Drake / Karbon / QuickBooks 导出 CSV | Preset Profiles（§6A.4）共 5 个 + File In Time 彩蛋 | T-S2-01 |
| S2-AC2 | 系统自动识别字段映射（客户名、**EIN**、州、实体类型）| AI Field Mapper（§6A.2）+ 客户模型新增 `ein` 字段（§8.1）| T-S2-02 |
| S2-AC3 | 对模糊或缺失字段，提供智能建议而非阻塞性错误 | AI Normalizer + 置信度 < 0.8 的"Needs review"非阻塞标记（§6A.3）| T-S2-03 |
| S2-AC4 | 导入后立即生成每个客户的全年截止日历，**无需额外配置** | Default Tax Types Inference Matrix（§6A.5，`entity × state` → tax_types 查表兜底） | T-S2-04 |
| S2-AC5 | P95 完成时间 ≤ 30 分钟（30 客户基准）| 指标定义（§12.2）+ Dry-Run Preview + Live Genesis 动画确认 | T-S2-05 |

### 3.3 故事 S3（P1 · DIFFERENTIATOR）— 24 小时州税局公告响应

> **作为** 服务多州客户的 CPA，**我希望** 某州税局发布延期公告后 24 小时内自动收到受影响客户清单，**这样** 我第一时间通知客户、调整工作计划，不必每天浏览 50 个州税局网站。

| AC # | 验收标准 | 覆盖功能（v2.0 章节） | 验收测试 ID |
|---|---|---|---|
| S3-AC1 | 系统在 24 小时内捕获各州税局官方公告 | Pulse Ingest Worker（§6.3.1）+ 失败降级（§6.3.5）| T-S3-01 |
| S3-AC2 | 自动判定哪些客户受影响（基于**州 + 县 + 实体类型 + 税种**）| Pulse Match Engine（§6.3.3，四维 SQL 匹配）| T-S3-02 |
| S3-AC3 | 主看板顶部 Banner 推送 **+ 邮件通知**（双渠道，同一事务）| Dashboard Pulse Banner（§5.1.1）+ Email Digest（§6.3.4）| T-S3-03 |
| S3-AC4 | 提供"一键查看受影响客户"+"**批量调整截止日**"操作 | Pulse Detail 抽屉 + Batch Apply 原子事务（§6.3.3）| T-S3-04 |
| S3-AC5 | 每条公告附"官方来源链接"用于人工核验 | `official_source_url` + `verbatim_quote` 显式展示（§6.3.1 / §6.3.2）| T-S3-05 |

### 3.4 VPC ✦ AI 杠杆点映射（画布 9 项）

| # | ✦ 条目 | 对应 AI 能力模块 | v2.0 章节 |
|---|---|---|---|
| 1 | 公告自动监控 | Pulse Ingest Worker | §6.3.1 |
| 2 | 公告语义解读 | Pulse LLM Extraction | §6.3.2 |
| 3 | 影响范围识别 | Pulse Extraction + Match | §6.3.2 / §6.3.3 |
| 4 | 受影响客户匹配 | Pulse Match Engine | §6.3.3 |
| 5 | CSV 字段智能映射 | Migration AI Mapper | §6A.2 |
| 6 | 实体类型自动识别 | Migration AI Normalizer | §6A.3 |
| 7 | AI 智能优先级排序 | Smart Priority Engine | §6.4 |
| 8 | AI 自然语言问答 | Ask DueDateHQ | §6.6 |
| 9 | 字段智能匹配（Story S2 标签，并入 #5）| Migration AI Mapper | §6A.2 |

### 3.5 VPC 严重度覆盖总表

**Pains（严重度 高 / 中）全覆盖：**

| 条目 | 严重度 | ✦ | v2.0 覆盖章节 |
|---|---|---|---|
| Excel 无法应对 50 州 × 多税种 | 高 | — | §6.1 Rule Engine + §6A.5 Default Matrix |
| 各州税局公告分散，需人工每日浏览 | 高 | ✦ | §6.3.1 Pulse Ingest |
| 政府公告语言晦涩 | 高 | ✦ | §6.3.2 LLM Extraction |
| 客户跨州后需手工查 PTE / Franchise | 高 | — | §6.1 Rule Engine 50 州骨架 + §7.5 Penalty |
| 错过截止日罚款责任由 CPA 承担，无保障 | 高 | — | §7.5 Penalty Radar + §5.5 Evidence Mode + §13 合规 SLA |
| 现有专业工具定价不友好 | 中 | — | §11.1 Pricing |
| 从竞品迁移需手工录入 | 中 | ✦ | §6A Migration Copilot 全链路 |
| 申报季加班仍担心遗漏 | 中 | — | Dashboard + Pulse + Weekly Brief 合力 |

**Gains（严重度 高 / 中）全覆盖：**

| 条目 | 严重度 | ✦ | v2.0 覆盖章节 |
|---|---|---|---|
| 每周一 5 分钟完成分诊 | 高 | — | §5.1 Dashboard + §6.4 Smart Priority |
| "没漏掉什么"的心理踏实感 | 高 | — | §6.1 Weekly Brief + §5.5 Evidence + §7.5 Penalty |
| 州税法变更第一时间获知 + 受影响客户 | 高 | ✦ | §6.3 Pulse + §5.1 Banner + §6.3.4 Email |
| 工具上手 ≤ 30 分钟 | 中 | — | §6A Migration + §12.2 KPI |
| 对客户呈现专业形象 | 中 | — | §7.6 Client PDF Report + §7.7 Ask |
| 能承接更多多州客户不增风险 | 低 | — | §6.1 Rule Engine 50 州骨架 + §6.3 Pulse 持续扩源 |

**Pain Relievers / Gain Creators**（严重度 高）全在 §6–§7 有对应实现章节，不再重复列。

---

## 3.6 Team / Multi-seat 扩展模型

> 本节是 v2.0 新增章节，专门回答"Firm Plan / Pro Plan 下，一家事务所多个 CPA 员工怎么协作"。
> 这是对 Story S1–S3 的**横向扩展**（不改变核心 AC），但必须前置，否则数据模型和权限设计会在 P1 到来时被迫重构。

### 3.6.1 定位与前置约束

| 层级 | P0（Solo · Firm Plan $39）| P1（Firm Plan $99 / Pro Plan $199）|
|---|---|---|
| **数据架构**（Firm = tenant，User 归属 Firm）| **已就位** | 无需改动 |
| **成员管理**（邀请 / 席位 / 离职）| 单 Owner 账号 | **全量** |
| **RBAC 执行**（四角色权限矩阵）| `role` 字段存在但**不做权限校验**（Owner 全权）| **全量强制校验** |
| **视图切换**（My work / Firm-wide）| 只有 Firm-wide（单人=自己的）| **双视图 + URL 持久化** |
| **工作负载页**（Workload View）| ❌ | **Manager 可见** |
| **Firm-wide Audit Log 页**| 简化版（单客户 Audit Tab）| **全量 Firm 级页面** |
| **并发编辑与冲突处理**| 单用户无冲突 | **last-write-wins + 提示 + 乐观锁** |
| **多事务所用户**（一人多 Firm）| 不支持（一邮箱一 Firm）| **支持（UserFirmMembership 多对多）** |

**核心原则**：数据模型在 **P0 就必须支持 Team**（`firm_id` 作为所有业务数据的 tenant key，User 通过 `firm_id` 归属 Firm），但**权限校验和 Team UI 是 P1**。这是可向前兼容的最薄切片——MVP 不会因为"将来要支持 Team"而增加 P0 复杂度，但不会因为 MVP 走错数据模型而在 P1 重构。

### 3.6.2 三层模型：Firm / User / Membership

```
Firm (tenant)
  id, name, timezone, plan (solo|firm|pro), 
  seat_limit,                    -- 1 / 5 / 10 (derived from plan)
  owner_user_id,                 -- Firm 的主负责人（转让时修改）
  created_at, deleted_at (soft)

User (identity · 邮箱唯一)
  id, email, display_name, 
  mfa_enabled, last_login_at,
  created_at

UserFirmMembership (多对多 · P1 启用)
  id, user_id, firm_id,
  role (owner|manager|preparer|coordinator),
  status (active|invited|suspended|left),
  invited_by_user_id, invited_at, accepted_at, suspended_at,
  last_active_at

TeamInvitation
  id, firm_id, invited_email, role,
  invite_token, expires_at,
  invited_by_user_id, accepted_at, revoked_at
```

**P0 简化：** 未启用 UserFirmMembership 时，`User.firm_id` 作为 shortcut 列直接查询（向前兼容）。P1 启用后，`User.firm_id` 降级为"默认登录 Firm"字段，真正的权限查询走 Membership 表。

**为什么用 Membership 多对多：** 一位 CPA 在多家小所兼职是真实场景（尤其是灵活工作制 + 跨州税务专家）。如果把 `User.firm_id` 定死一对一，P1 做 "在 A / B 事务所之间切换" 必须重做 Auth。Membership 表让登录后多一步 "Choose firm"（类似 Slack workspace 切换）。

### 3.6.3 RBAC 权限矩阵（P1 · 四角色）

| 操作 | Owner | Manager | Preparer | Coordinator |
|---|---|---|---|---|
| **账户与席位** | | | | |
| 邀请 / 撤销成员 | ✓ | — | — | — |
| 修改他人 role | ✓ | — | — | — |
| 转让 Firm Owner | ✓ | — | — | — |
| Billing / Pay-intent | ✓ | — | — | — |
| 删除 Firm | ✓ | — | — | — |
| **客户与 obligations** | | | | |
| 查看全部客户 | ✓ | ✓ | ✓ | ✓ |
| 创建 / 编辑客户档案 | ✓ | ✓ | ✓ | — |
| 删除客户（软删）| ✓ | ✓ | — | — |
| 改 status / readiness（任意）| ✓ | ✓ | ✓ 仅 `assignee=me` 或 Manager 分派给我 | — |
| 改 extension decision | ✓ | ✓ | ✓ 仅 assignee | — |
| 覆盖 `estimated_tax_liability` | ✓ | ✓ | ✓ 仅 assignee | — |
| Assign / Reassign | ✓ | ✓ | — | — |
| **Migration** | | | | |
| Import | ✓ | ✓ | — | — |
| **Revert (24h full batch)** | ✓ | — | — | — |
| Revert 单客户（7d）| ✓ | ✓ | — | — |
| **Regulatory Pulse** | | | | |
| 查看 Pulse Feed | ✓ | ✓ | ✓ | ✓ |
| Batch Apply | ✓ | ✓ | — | — |
| Revert Pulse Apply（24h）| ✓ | — | — | — |
| Dismiss / Snooze | ✓ | ✓ | — | — |
| **规则与证据** | | | | |
| 查看 Rules | ✓ | ✓ | ✓ | ✓ |
| Report Issue on Rule | ✓ | ✓ | ✓ | ✓ |
| 看 Penalty $ 敞口 | ✓ | ✓ | ✓ | **—**（$ 是 commercial-sensitive，Coordinator 默认隐藏，可 Owner 在 Settings 开启）|
| 改 Priority Weights（Pro only）| ✓ | — | — | — |
| **报告与审计** | | | | |
| Export 客户 PDF | ✓ | ✓ | ✓ | ✓ |
| 查看 Firm-wide Audit Log | ✓ | ✓ | — | — |
| 查看他人 Audit Log | ✓ | ✓ | 仅自己 | 仅自己 |
| **AI Ask** | | | | |
| Ask DueDateHQ | ✓ | ✓ | ✓ | ✓（可选开启）|
| Ask 含 $ 敞口字段 | ✓ | ✓ | ✓ | — |

**执行机制：**

1. **ORM middleware 强制 `WHERE firm_id = :current_firm`**（现有）
2. **Action-level RBAC** 在每个 Server Action 入口用装饰器 `@requireRole(['owner','manager'])` 校验
3. **Row-level ownership** 对 `assignee` 的"自己任务"限制用查询条件 `(assignee_id = :me OR role IN ['owner','manager'])`
4. **Client-side UI** 根据 role 隐藏不可操作按钮（双层保险，但后端强制是底线）

### 3.6.4 成员生命周期

#### 邀请流程

```
Owner clicks [Invite member]
  ↓
Enter email + role + optional welcome message
  ↓
POST /api/team/invitations
  → Validates seat_limit; creates TeamInvitation with signed token
  → Sends invite email via Resend
  ↓
Invitee clicks link (valid 7 days)
  → If user exists: accept + create Membership
  → If new: complete signup (Auth.js magic link) → create User + Membership
  ↓
Membership.status = 'active', user lands on Firm dashboard
  ↓
Audit event: team.member.joined
```

- 席位满时 `[Invite]` 按钮灰化 + 提示 `Upgrade plan to add more seats`
- Invite 邮件 24h 未点击 → 自动发提醒 1 次
- Owner 可在 Members 页撤销未接受的邀请

#### 成员离职

- Owner / Manager 在 Members 页将成员状态切到 `suspended` → 立即失去所有权限，所有 session 失效
- **Assignee 交接**：suspend 前强制弹出 `Reassign N open obligations`（这人名下尚 open 的 obligations 必须转给其他成员，否则不能 suspend）
- 数据不删除：`Membership.status = 'suspended'`，审计日志保留其历史 action（合规需要）
- 席位释放：suspended 立即释放席位（新人可邀请）

#### Owner 转让（小所继承 / 退休场景）

- Settings → Team → `Transfer ownership` → 选择新 Owner（必须已是 active member 且 role ≥ manager）
- 二次确认（输入 firm name 或 MFA 再验）
- 新旧 Owner 都收邮件通知；原 Owner 降级为 Manager（不退出）
- 写 audit: `firm.owner.transferred`
- 不可撤销（只能新 Owner 再转回）

#### 多事务所切换

- 登录成功后如 user has ≥ 2 active memberships → 强制选 Firm（类似 Slack workspace picker）
- URL 含 `firm_slug`：`app.duedatehq.com/{firm_slug}/dashboard`，刷新保留
- 右上 Firm 切换 dropdown + `Cmd+Shift+O`

### 3.6.5 视图层：My work / Firm-wide

Dashboard、Workboard、Alerts 三处首屏顶部加 **View Scope Toggle**：

```
[ ●  Firm-wide  ]  [   My work   ]      (Owner / Manager 默认 Firm-wide)
[    Firm-wide  ]  [ ●  My work  ]      (Preparer 默认 My work)
```

| 视图 | 过滤条件 | 受众默认 |
|---|---|---|
| Firm-wide | 无 assignee 过滤 | Owner / Manager |
| My work | `assignee_id = :me` | Preparer（Coordinator 只读 Firm-wide）|

- URL 持久化：`?scope=firm` / `?scope=me`
- 切换对 **Penalty Radar 顶栏 $ 聚合也生效**（My work 时只聚合自己的）
- Weekly Brief 在 My work 视图下也切换为 "Your top 3"

### 3.6.6 并发编辑与冲突处理

| 场景 | 策略 |
|---|---|
| 两人同时改同一 obligation 的 status | **Last-write-wins + 通知**：晚到的写成功但推送 toast `X just changed this from 'in_progress' to 'waiting_on_client' 3s ago. [Undo my change]` |
| 两人同时 Pulse Batch Apply 同一条 Pulse | **Advisory lock**：事务开始前 `SELECT pulse FOR UPDATE SKIP LOCKED`；第二人看到 `This pulse is being applied by Y right now. [Wait] [Refresh]` |
| Migration 同一 firm 并行进行 | **禁止**：同一 firm 同时最多 1 个 draft batch；第二次 `Import` 提示 `Y is currently importing (Step 2 of 4). [View] [Cancel theirs — Owner only]` |
| 两人同时 Revert 同一 batch | DB unique constraint on `(batch_id, status='reverted')`；第二人看到 `Already reverted by X` |
| Saved View 同名冲突 | 允许同名（Personal 与 Shared 命名空间分离）；Shared 强制 Firm 内唯一 |

### 3.6.7 Manager 工作负载视图（Workload View · P1）

**入口**：侧栏 `Team Workload`（仅 Owner / Manager 可见） · Cmd-K `workload`

```
┌─ Team Workload · This Week ──────────────────────────────────┐
│  [Firm-wide]                                  [Export CSV]   │
├──────────────────────────────────────────────────────────────┤
│  Member        Open   Overdue   $ At Risk    Load Bar        │
│  ────────────────────────────────────────────────────────    │
│  Sarah (Owner) 42      2         $18,400    ████████░░ 80%  │
│  Jim (Prep)    18      0         $6,200     █████░░░░░ 50%  │
│  Kate (Prep)    8      0         $2,100     ██░░░░░░░░ 20%  │
│  Unassigned    15      3         $9,800     ⚠ needs triage  │
├─ Heatmap (next 30 days) ─────────────────────────────────────┤
│      Mon  Tue  Wed  Thu  Fri     (darker = more due)         │
│ W-1  ██   █    ███  ██   █                                   │
│ W-2  █    ██   ██   █    —                                   │
│ W-3  ███  █    ████ ██   ██                                  │
│ W-4  █    —    ██   █    —                                   │
├──────────────────────────────────────────────────────────────┤
│  [+ Bulk reassign]                                           │
│     Select N obligations by rule/state/status → pick new     │
│     assignee → Apply (transaction + audit event)             │
└──────────────────────────────────────────────────────────────┘
```

关键设计：
- **Load Bar %** 基于 open count 相对全 firm top-quartile 线性归一
- **Unassigned 行永远置底但不可折叠**（防漏）
- 点击任一成员行 → 右侧 drawer 展示其 open obligations list（可就地 reassign）
- Heatmap 点击某格 → Workboard 自动按 `due_date = :date AND assignee = :member` 筛选

### 3.6.8 数据边界边案

| 场景 | 处理 |
|---|---|
| Plan 降级（Pro → Solo）导致超席 | 所有超额成员自动 `suspended`，但 Membership 不删；Owner 可在 30 天内升级找回；30 天后软删除，但审计日志永久保留（合规） |
| Plan 升级 | 立即生效；suspended 的老成员**不自动激活**（需 Owner 手动 re-activate） |
| Owner 唯一且账号锁死 | 通过 support 通道验证 + MFA recovery token → 新 Owner 转移；走 legal hold 流程 |
| Firm 申请删除 | 软删 30 天 grace period；期内 Owner 可 `[Restore firm]`；30 天后物理删除所有 PII，仅保留 audit log hash（合规诉讼证据）+ invoice 记录 |
| 成员 GDPR 删除请求 | 删除 User identity + 匿名化其 audit_event 的 `actor_id = 'deleted_user_#'`，保留操作记录 |
| 未分派 obligation 的默认 assignee | Firm 级配置：`default_assignee = owner | round_robin | none`；Solo plan 强制 `owner` |
| 临期 obligation 未分派 | Overdue 告警升级给 Owner 与 Manager（即便 assignee 为空） |

### 3.6.9 Team 场景验收标准（T-TM-*）

> 这些 AC 不属于画布原有的 S1–S3，但是 P1 发布 Team 版的 Go / No-Go 门槛。

| Test ID | 描述 | 预期 |
|---|---|---|
| T-TM-01 | Owner 邀请 1 位 Preparer，Preparer 登录后看到全部客户 | 客户可见；`[Delete client]` 按钮不存在 |
| T-TM-02 | Preparer 尝试点击"删除客户" API | 403 Forbidden；审计记录 `auth.denied` |
| T-TM-03 | Manager 将 obligation 从 Sarah reassign 给 Jim | Sarah "My work" 失去该条；Jim "My work" 出现；audit `obligation.reassigned` |
| T-TM-04 | Owner 查看 Firm-wide Audit Log | 看到最近 24h 所有成员所有 write 操作 |
| T-TM-05 | 两人同时改同一 obligation status | Last-write-wins + toast 提示前序变更 |
| T-TM-06 | 两人同时 Apply 同一 Pulse | 第 2 人被锁 + 友好提示 |
| T-TM-07 | 席位 5 已满，Owner 试邀第 6 人 | 按钮灰化 + "Upgrade plan" 链接 |
| T-TM-08 | Owner suspend 带 open obligations 的 Preparer | 强制先 reassign；否则 suspend 阻塞 |
| T-TM-09 | Owner 转让 ownership 给 Manager | 新 Owner 权限立即生效，原 Owner 降 Manager，邮件通知双方 |
| T-TM-10 | Coordinator 试看 `$ at risk` | 胶囊显示 `—`；Ask 结果中该字段留空 |
| T-TM-11 | Preparer 已登录两个 Firm，切换 Firm | URL / 数据 / assignee 作用域立即切换 |
| T-TM-12 | Plan 从 Pro 降到 Solo，超额 4 人 | 4 人自动 suspend；Owner 收邮件警告；30 天内可恢复 |

---

## 4. 功能范围

### 4.1 P0 — 首发必须（Story S1 / S2 + Glass-Box 纪律）

| # | 模块 | 关键能力 | AC 绑定 |
|---|---|---|---|
| P0-1 | Auth & Tenant | Email magic link 登录 + 单租户 + 租户强隔离 | — |
| P0-2 | **Migration Copilot** | Paste-anywhere + CSV/Excel/Sheets + 5 个 Preset Profiles | S2-AC1 |
| P0-3 | **AI Field Mapper** | LLM 读表头 + 前 5 行 → 字段映射 + 置信度 + 备选；显式识别 `name / ein / state / county / entity_type / tax_types / email / assignee / notes` | S2-AC2 |
| P0-4 | **AI Normalizer + Smart Suggestions** | entity/state/tax_type 归一；模糊字段非阻塞 "Needs review" | S2-AC3 |
| P0-5 | **Default Tax Types Inference** | 50 州骨架矩阵 × 8 实体类型（首发 6 州已签字，其余回退 Federal-only + `needs_review` 徽章）| S2-AC4 |
| P0-6 | **Dry-Run + Import + Live Genesis + 24h Revert** | 事务化导入 + 动画 + 原子回滚 | S2-AC5 |
| P0-7 | Client CRUD + 手动添加 | 字段 `name / ein / state / county / entity_type / tax_types / importance / estimated_annual_revenue / assignee / notes` | — |
| P0-8 | **Rule Engine v1（50 州骨架）** | Federal + CA/NY/TX/FL/WA/MA（首发 6 辖区 × ~30 条规则全 verified）；其他 44 州 schema 占位 + 默认 Federal | — |
| P0-9 | Obligation Instances | `state × entity_type × tax_types` 生成全年 instances | S2-AC4 |
| P0-10 | **Dashboard（Story S1 主屏）** | 顶栏 Penalty Radar + Pulse Banner + **三段时间 Tabs（This Week / This Month / Long-term）**| S1-AC1, S3-AC3 |
| P0-11 | 倒计时徽章 + Days 列 | 每个 obligation 显示精确到天的倒计时 | S1-AC2 |
| P0-12 | **Workboard（表格视图）** | 多列可见 + Saved Views + 批量操作 + 密度切换 | — |
| P0-13 | **筛选器（< 1s 响应）** | Client / State / **County** / **Form/Tax Type** / Status / Readiness / Assignee / $ At Risk / Days | S1-AC3 |
| P0-14 | **行内一键标状态** | 每行 `[status ▾]` 下拉 + 键盘 F/X/I | S1-AC4 |
| P0-15 | Obligation Detail 抽屉 | readiness / extension / risk / evidence / audit 五标签 | — |
| P0-16 | Status & Readiness 状态机 | Status: Not started / In progress / Waiting on client / Needs review / Filed / Paid / Extended / Not applicable；Readiness: Ready / Waiting / Needs review | — |
| P0-17 | **Glass-Box AI Layer** | Weekly Brief / Client Risk Summary / Deadline Tip / Smart Priority，全部 citation + source chip | S1-AC5 |
| P0-18 | **Penalty Radar™** | 美元敞口实时计算 + 顶栏聚合 + 每条 obligation 徽章 | S1-AC5 |
| P0-19 | Evidence Mode | 任意 AI 句子 / 数字 / risk score 可点开 provenance 抽屉 | S3-AC5 |
| P0-20 | Audit Log | 状态变更 / Pulse Apply / 批量操作 / Migration / Revert 全留痕 | — |
| P0-21 | Email Reminders | 30 / 7 / 1 天阶梯；模板带上下文 + source link | — |
| P0-22 | In-app Notifications | Top bar 铃铛 + 未读计数 + Preferences | — |
| P0-23 | Pay-intent Button | `I'd pay $49/mo` 点击埋点（不接 Stripe）| — |
| P0-24 | Security Baseline | HTTPS / TLS / AES-256 / MFA / RBAC / WISP v1.0 / `llm_logs` | — |

### 4.2 P1 — 差异化亮点（Story S3 + VPC Medium）

| # | 模块 | 关键能力 | AC 绑定 |
|---|---|---|---|
| P1-1 | **Regulatory Pulse™ Ingest** | IRS + 5 州 RSS / 页面抓取；24h SLA | S3-AC1 |
| P1-2 | **Pulse LLM Extraction** | 结构化字段 + verbatim quote + confidence | S3-AC1, S3-AC5 |
| P1-3 | **Pulse Match Engine** | 四维匹配：state + county + entity_type + tax_type | S3-AC2 |
| P1-4 | **Dashboard Pulse Banner** | 顶部 sticky Banner + 折叠历史 + Last-checked 指标 | S3-AC3 |
| P1-5 | **Pulse Email Digest** | Approved Pulse 触发时 **同一事务内** 推送邮件（含受影响客户清单 + 官方链接）| S3-AC3 |
| P1-6 | **Pulse Detail Drawer** | AI summary + verbatim quote + Affected Clients Table + 快筛 | S3-AC4, S3-AC5 |
| P1-7 | **Batch Apply 原子事务** | 批量调整截止日 + Evidence 追加 + 24h Undo | S3-AC4 |
| P1-8 | **AI Q&A Assistant (Ask DueDateHQ)** | NL → DSL → SQL（只读白名单，tenant 强制）→ 表格 + 一句话 + citations | VPC Medium ✦ |
| P1-9 | Extension Decision Panel | Extension / payment decision helper + What-If Simulator | VPC 场景 C |
| P1-10 | **Client PDF Report** | 单客户 PDF 简报，内嵌 human-verified 规则 + Penalty + source | VPC Medium |
| P1-11 | **ICS 单向订阅** | 每 firm 一条带 token 的 feed URL（Outlook / Google / Apple） | VPC Low（日历场景） |
| P1-12 | Q1 → Q2 Rollover | 季度申报完成后自动生成下季 instances | — |
| P1-13 | Smart sort toggle | `AI Smart / Due Date / $ At Risk / Status` 排序切换 | S1-AC5 扩展 |
| P1-14 | Command Palette (Cmd-K) | 搜索 + 跳转 + Ask 三合一 | UX 铁律 |
| P1-15 | Keyboard shortcuts | J/K/E/X/F/A/? 全覆盖 + `?` 快捷键帮助 | — |
| P1-16 | Saved Views | 持久化筛选组合 + 分享 | S1-AC3 扩展 |
| P1-17 | Public SEO Pages | `/state/california` / `/pulse` 公开页 | GTM |
| P1-18 | **Team Seats & Invitations** | Owner 邀请 / 撤销 / role 修改；席位受 plan 限制（§3.6.4）| Team |
| P1-19 | **RBAC 四角色权限矩阵强制** | Server Action 装饰器 + ORM middleware 双层（§3.6.3）| Team |
| P1-20 | **View Scope Toggle** | Dashboard / Workboard / Alerts 三处 My work / Firm-wide 切换 + URL 持久化（§3.6.5）| Team |
| P1-21 | **Manager Workload View** | 成员负载表 + 30 天 heatmap + Bulk reassign（§3.6.7）| Team |
| P1-22 | **Firm-wide Audit Log 页** | 全 firm write 操作时间线 + 过滤 + 导出（§3.6 + §13）| Team |
| P1-23 | **Concurrency & Conflict UX** | Last-write-wins + toast / Pulse advisory lock / Migration 串行（§3.6.6）| Team |
| P1-24 | **Multi-firm Membership 切换** | User 加入多 Firm，登录后 Firm Picker + `Cmd+Shift+O` 切换（§3.6.4）| Team |
| P1-25 | **Owner Transfer / Plan 降级处理** | ownership 转让流程 + 超席自动 suspend + 30d grace（§3.6.8）| Team |
| **P1-26** | **★ Client Readiness Portal™** | 客户免登录 magic link 页，自助勾资料是否就位 → CPA Dashboard 的 `readiness` 实时变 `ready`；AI Draft 解释邮件；集训差异化亮点（§6B）| **差异化亮点** |
| **P1-27** | **★ Onboarding AI Agent** | 首次登录对话式 setup（替代传统向导），复用 Migration 管线，精准对标 Dify 评审员 taste（§6A.11）| **差异化亮点** |
| P1-28 | **Audit-Ready Evidence Package** | 一键导出 ZIP（PDF + Audit CSV + SHA-256 签名），面向 IRS 调查 / 客户质询（§13.3 + §6.2 合流）| 差异化 |

### 4.3 P2 — 明确不做（v2.0 范围外）

完整 e-file 提交 / 税额计算 / 客户门户 / 文档存储 / eSignature / 支付 / Stripe 计费 / 短信 / Google/Outlook 日历双向同步 / 完整团队 RBAC / 多租户组织层级 / 50 州完整真规则（只做 6 辖区首发）/ 原生移动 App / Drake / QuickBooks / TaxDome 深度集成 / 25+ 报告中心。

> **为什么日历只做单向订阅？** ICS 单向订阅 1 人天落地，在 Outlook / Google / Apple 里 0 配置显示所有 deadline（含 Pulse 改动）。双向同步会违反 §1.3 "Deadline-first, not calendar-first" 原则——外部日历改的日期会覆盖 Pulse 官方解读，Evidence / Audit 失真。战略上我们要用户周一 8 点回到 DueDateHQ 分诊，而不是停留在 Outlook。

---

## 5. 核心页面规格

### 5.1 Dashboard（首屏 · 对齐 Story S1 + S3）

#### 5.1.1 布局（上到下 6 层）

```text
┌──────────────────────────────────────────────────────────────────┐
│  Penalty Radar       $12,400 at risk this week   ▲ up $3,100    │  ← Layer 1 · 顶栏永远置顶
│  🔴 Critical (3)       🟠 High (7)       🟡 Upcoming (12)        │
├──────────────────────────────────────────────────────────────────┤
│  🚨 Pulse Banner (Story S3)                                      │  ← Layer 2 · Banner
│  IRS CA storm relief → 12 of your clients affected              │
│  [Review & Batch Adjust →]   [Snooze for 1h]   [Dismiss]        │
│  (NY DOR PTET reminder → 3 clients · 2 more alerts ▾)            │
│  Last checked: 18 min ago · Watching IRS + CA/NY/TX/FL/WA/MA     │
├──────────────────────────────────────────────────────────────────┤
│  Triage Tabs (Story S1 三段时间分组)                             │  ← Layer 3 · Tabs
│  [ This Week · 15 · $12,400 ]  [ This Month · 42 · $46k ]        │
│  [ Long-term · 86 · $210k ]                                      │
│  ─────────────────────────────────                                │
│  (selected tab inline list, AI Smart-Priority ordered — §6.4)    │
│  🔴 Acme LLC · CA Franchise · 3d · $4,200 · [Working ▾] [· · ·]  │
│  🟠 Bright Studio · 1120-S · 5d · $2,800 · [Waiting ▾] [· · ·]  │
│  🟠 Zen Holdings · Q1 Est · 7d · $1,650 · [Not started ▾]       │
│  [Open full Workboard →]                                          │
├──────────────────────────────────────────────────────────────────┤
│  AI Weekly Brief (Glass-Box, with citations)                     │  ← Layer 4 · Brief
│  Top 3 to touch first:                                            │
│  1. Acme LLC (CA Franchise Tax, $4,200 at risk) ← source [FTB]   │
│  2. Bright Studio S-Corp (1120-S, 5 days) ← source [IRS]         │
│  3. Zen Holdings (Q1 Est. Tax, waiting on client) ← source [IRS] │
│  [Evidence Mode]  [Regenerate]  [Copy to Slack]                  │
├──────────────────────────────────────────────────────────────────┤
│  Ask DueDateHQ (P1 · §6.6)                                        │  ← Layer 5 · Ask
│  > Which clients owe CA PTE this month?                          │
├──────────────────────────────────────────────────────────────────┤
│  Quick Actions: [+ Client] [Import CSV] [Verify Rules] [Cmd+K]   │  ← Layer 6
└──────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 Triage Tabs（S1-AC1）

- 三段 Tabs 固定顺序：**This Week / This Month / Long-term**
- 每个 tab 显示 `count + $ at risk`
- 默认选中 `This Week`（Story S1 最高频场景）
- Tab 切换 URL 同步（可分享）
- 同一 `ObligationInstance` 出现在**最紧迫**的 tab 即止，不重复

**View Scope Toggle（§3.6.5 · Team 版 P1）：**

Tabs 之上加一行 scope 切换（Solo Plan 下该行不渲染）：

```
[ ● Firm-wide ]  [   My work   ]     (Owner/Manager 默认 Firm-wide)
[    Firm-wide ]  [ ●  My work  ]    (Preparer 默认 My work)
```

- 切换立刻影响：Triage Tabs 计数 + Penalty Radar 顶栏 $ 聚合 + Weekly Brief 候选池 + Smart Priority 打分池
- URL 持久化：`?scope=firm` / `?scope=me`
- Coordinator 只有 Firm-wide（无 My work 视图，因为不直接承担 assignee 任务）

**段边界定义：**

| Tab | 规则定义 | 颜色次级信号 |
|---|---|---|
| This Week | `current_due_date ≤ today + 7d` | 🔴 Critical（≤ 2d）/ 🟠 High（3–7d）|
| This Month | `7d < current_due_date ≤ today + 30d` | 🟡 Upcoming |
| Long-term | `30d < current_due_date ≤ today + 180d` | ⚪ Planned |

#### 5.1.3 TriageCard（S1-AC2 倒计时 + S1-AC4 一键状态）

```
┌─ Acme LLC · CA Franchise Tax ──────────────────────────┐
│  [🔴 3d]  $4,200 at risk           [Status: Working ▾] │
│  State: CA · County: LA · Entity: LLC · Form: 3522    │
│  Readiness: Waiting on client                         │
│  Why top rank? [✦]                                    │
│  Source: CA FTB · ✓ Human verified · 2026-04-12       │
│  [Open detail] [Mark filed · F] [Mark extended · X]    │
└────────────────────────────────────────────────────────┘
```

- **倒计时徽章**：左上 `[🔴 3d]` 固定精确到天；< 0 显示 `OVERDUE`
- **Status 下拉**：Not started / In progress / Waiting on client / Needs review / Filed / Paid / Extended / Not applicable
- 状态切换零 modal + 500ms toast 支持 Undo
- 键盘：`F` = Filed，`X` = Extended，`I` = In progress，`W` = Waiting

#### 5.1.4 Pulse Banner（S3-AC3）

- 永远在 Layer 2；每条未处理 Alert 顶部横幅展示
- 最多同时展示 1 条主 Banner + N 条折叠（"2 more alerts ▾"）
- 每条 Banner：`source logo · title · impacted_count · [Review & Batch Adjust →] [Snooze 1h] [Dismiss]`
- **"Last checked: X min ago · Watching IRS + CA/NY/TX/FL/WA/MA"** 始终显示（即使无新 Alert 也展示可信度信号）
- 点 `Review & Batch Adjust →` 进入 §5.4 Pulse Detail Drawer

#### 5.1.5 Mobile 响应式

`< 768px`：堆叠纵向，保留 Penalty Radar + Pulse Banner + Triage Tabs 三层；Ask 输入框折叠为 Cmd-K 按钮。

### 5.2 Workboard（表格视图 · 对齐 S1-AC3 / AC4）

#### 5.2.1 目标

税务人熟悉的高密度表格 + 现代筛选与批量操作。

#### 5.2.2 列（默认可见 10 列，可自定义至 20 列）

`Client ▸ EIN ▸ Entity ▸ State ▸ County ▸ Form/Tax ▸ Original Due ▸ Current Due ▸ Days ▸ $ At Risk ▸ Status ▸ Readiness ▸ Assignee ▸ Last Verified ▸ Source`

#### 5.2.3 筛选栏（S1-AC3 · < 1s 响应）

| 维度 | 类型 | 索引支持 |
|---|---|---|
| Client | 多选 + 搜索 | `obligation_instance (firm_id, client_id)` |
| State | 多选枚举 | `client (firm_id, state)` |
| **County** | 多选 + 搜索（依赖 State 过滤）| `client (firm_id, state, county)` |
| **Form / Tax Type** | 多选枚举 | `obligation_instance (firm_id, tax_type)` |
| Status | 多选枚举 | `obligation_instance (firm_id, status, current_due_date)` |
| Readiness | 多选 | 同上 |
| Assignee | 多选 | `obligation_instance (firm_id, assignee_id)` |
| $ At Risk | 数值范围 | Redis 预聚合 |
| Days | 数值范围 | 复合索引 |

**性能 SLA**：1000 obligations × 200 clients 数据规模下，所有筛选 **P95 < 1 秒**，通过：
- 复合索引（§8.2）
- 服务端 pagination（50 行 / 页）+ virtualized TanStack Table
- URL state 持久化（可刷新、可分享、可 back）

#### 5.2.4 行内一键标状态（S1-AC4）

- 每行 `[status ▾]` 下拉即改
- `[· · ·]` 右侧溢出菜单：`Mark Extended · X / Mark Filed · F / Open Detail · Enter / Apply Extension / Copy Evidence`
- 键盘导航：`J/K` 上下，`E` 展开 Evidence，`F` Filed，`X` Extended

#### 5.2.5 批量操作

多选后 bulk bar：
- `Change status` → 批量改状态
- `Change assignee`
- `Mark extended (with memo)`
- `Export selected as CSV / PDF (1 per client)`

#### 5.2.6 Saved Views（P1-16）

- 保存筛选组合 + 排序 + 列可见性
- 例如："CA clients due in 14 days"、"Waiting on client – Q1"
- 左栏 Saved Views 列表 + Pin to nav + 可分享（firm 内）

### 5.3 Obligation Detail（侧抽屉）

```
┌─────────────────────────────────────────────────────┐
│  Acme LLC — CA Franchise Tax 2026         [× Close] │
│  Due: Mar 15 · 3 days · $4,200 at risk              │
├─────────────────────────────────────────────────────┤
│  📍 Status:  In progress           [Change ▾]        │
│  📋 Readiness:  Waiting on client  [Change ▾]        │
│  🔀 Extension: Not filed           [Decide...]       │
│  👤 Assignee:  Sarah                                 │
├─────────────────────────────────────────────────────┤
│  Penalty Radar                                       │
│  Failure-to-file:  $210/mo (est.)   max $1,050       │
│  Failure-to-pay:   $21/mo (est.)                     │
│  Interest:         $14/mo @ 8% AFR                   │
│  State surcharge:  $0 (CA min $800 paid 2026-01-15)  │
│  ────────────────────────────────────                │
│  If missed 90 days:  ~$4,200                         │
│  [Run What-If Simulator]     [Edit assumed liability]│
├─────────────────────────────────────────────────────┤
│  AI Deadline Tip  [Evidence]                         │
│  "CA Franchise Tax applies to every LLC doing        │
│   business in California, regardless of income [1].  │
│   The $800 minimum is due by the 15th day of the     │
│   4th month after formation [2]..."                  │
│   Sources: [1] CA FTB Pub 3556 · verified 2026-04-12 │
│            [2] CA R&TC §17941 · verified 2026-04-12  │
│   [Human-verified ✓]  [Copy as citation block]       │
├─────────────────────────────────────────────────────┤
│  📎 Evidence Chain                                   │
│  Rule v3.2 → Client profile → Generated 2026-01-01   │
│  [Open Provenance Graph]                             │
├─────────────────────────────────────────────────────┤
│  🕑 Audit Log                                         │
│  2026-04-22 10:12  Sarah changed status → In progress│
│  2026-04-19 14:03  Pulse applied CA relief update    │
│  2026-01-01 00:00  Auto-generated from Rule v3.2     │
└─────────────────────────────────────────────────────┘
```

### 5.4 Pulse Detail Drawer（Story S3 · S3-AC4 / AC5）

从 Dashboard Banner 或左侧 `Alerts` 入口进入。

```
┌──────────────────────────────────────────────────────┐
│  IRS · Tax relief for California storm victims       │
│  [Review & Batch Adjust]                             │
│  Official: irs.gov/newsroom/...  ·  Apr 15, 2026     │
│  AI confidence: 94% · ✓ Human-verified by DueDateHQ │
├──────────────────────────────────────────────────────┤
│  AI summary (2 sentences, Glass-Box):                │
│  "IRS extends filing deadlines for Los Angeles       │
│   County to October 15, 2026, covering Form 1040,    │
│   1120-S, 1065 for affected taxpayers [1]."          │
│                                                      │
│  [Verbatim quote from source ▾]                      │
│    "Individuals and businesses in Los Angeles County │
│     have until October 15, 2026 to file various      │
│     federal individual and business tax returns..."  │
│                                                      │
├─ Structured fields ─────────────────────────────────┤
│  Jurisdiction: CA                                    │
│  Counties: Los Angeles                               │
│  Affected forms: 1040, 1120-S, 1065                  │
│  Affected entities: Individual, S-Corp, Partnership  │
│  Original due: 2026-04-15                            │
│  New due: 2026-10-15                                 │
├─ Affected clients (12) ──────────────────────────────┤
│  Quick filter: [All] [LA County only] [S-Corp only]  │
│                                                      │
│  ☑ Acme LLC (CA, LA)           1040  Mar 15→Oct 15  │
│  ☑ Bright Studio S-Corp (CA)  1120-S Mar 15→Oct 15  │
│  ☑ Miller Partnership (CA)    1065  Mar 15→Oct 15  │
│  ... 9 more                                         │
├──────────────────────────────────────────────────────┤
│  [Batch update deadlines for 12 selected clients]   │
│  ☑ Add pulse evidence to each obligation             │
│  ☑ Log to audit trail                                │
│  ☑ Email summary to assignees                        │
│  ☑ Mark alert as reviewed                            │
│                                                      │
│  [Apply]    [Dismiss]    [Generate client email]    │
└──────────────────────────────────────────────────────┘
```

**Batch Apply 完成后：**

- Toast：`✓ Batch-applied to 12 clients. [View audit ↗] [Undo (24h)]`
- Dashboard Banner 自动消失（或折叠入历史）
- 每条 obligation 的 Evidence Chain 自动追加 Pulse Event
- 触发 Email Digest（§6.3.4）

### 5.5 Evidence Mode（全局浮层 · S3-AC5）

**触发**：按 `E` 键 / 点击 source chip / 点击 "Why?"

```
┌─── Evidence for: "due in 3 days"  ────────────────┐
│   How we know                                      │
│   ───────────                                      │
│   Rule:      CA Franchise Tax — LLC Annual Min     │
│   Version:   v3.2 (adopted 2026-01-15)             │
│   Logic:     15th day of 4th month after formation │
│              Acme LLC formed 2020-11-20            │
│              → 2026-03-15                           │
│                                                    │
│   Primary source                                   │
│   ──────────────                                   │
│   CA FTB Publication 3556                          │
│   ftb.ca.gov/forms/misc/3556.html ↗                │
│                                                    │
│   Verbatim quote                                   │
│   ──────────────                                   │
│   "Every LLC doing business in California is       │
│    subject to the $800 annual minimum franchise    │
│    tax, due by the 15th day of the 4th month..."   │
│                                                    │
│   Statutory basis                                  │
│   ────────────────                                 │
│   CA R&TC §17941                                   │
│                                                    │
│   Human verification                               │
│   ──────────────────                                │
│   Verified by  ops@duedatehq.com                   │
│   Verified at  2026-04-12 09:21 PST                │
│   Next review  2026-07-12                          │
│   [✓ Human verified]                               │
│                                                    │
│   If anything above is wrong, [Report issue]       │
│   [Copy as citation block]                         │
└────────────────────────────────────────────────────┘
```

### 5.6 Clients List / Client Detail

- **List**：表格，列 = name / EIN / entity / state / county / tax types / active obligations / $ at risk / last touched
- **Detail（抽屉）**：
  - Header：客户卡片 + `[Copy as client email]`
  - Tab 1 · Obligations（此客户年度所有 deadlines，时间轴视图）
  - Tab 2 · AI Risk Summary（Glass-Box + citations）
  - Tab 3 · Audit（此客户所有变更）
  - Tab 4 · Documents（P1，文件链接引用，不做存储）
  - `[Export PDF]` → 生成 Client PDF Report（§7.6）

### 5.7 Rules（规则中心，只读）

展示所有已 verified 规则：`jurisdiction · entity · tax type · due-date logic · penalty_formula · source_url · verbatim_quote · verified_by · verified_at · version`

MVP 覆盖 6 辖区（Federal + CA/NY/TX/FL/WA/MA）约 30 条。  
CPA 可以点 `Report issue` 触发人工复核流。  
**不允许** CPA 编辑内置规则，但允许 `custom_deadline`（手动添加到某客户）。

### 5.8 Alerts（Pulse 历史）

所有历史 Pulse 公告的时间线视图：
- 左栏：feed（source logo + title + published_at + severity + status）
- 右栏：Pulse Detail Drawer（同 §5.4）
- 筛选：Source / Status / Date range

### 5.9 Migration Copilot（4 步向导 · 详见 §6A）

单独章节深讲；入口：
- 首次登录强制进入（空态首页）
- `Clients` 页右上 `+ Add clients ▾` → `Import file / Paste / Add one`
- `Cmd+K → import clients`

### 5.10 Settings

- Profile / Notifications / Imports History（含 Undo）/ Ask History / Billing（pay-intent 按钮）/ Team（P1）/ About / WISP / Privacy

---

## 6. 亮点模块 — Clarity Engine

### 6.1 Rule Engine（规则引擎 · 50 州骨架）

#### 6.1.1 数据模型

见 §8.1 `ObligationRule` 表。

#### 6.1.2 首发覆盖

- **Federal**（IRS Publication 509）：个人 1040 / 企业 1120 / S-Corp 1120-S / Partnership 1065 / Trust 1041 / Estimated Tax 1040-ES / Extension 4868 / 7004 / 延期不延 payment 规则
- **CA**：LLC Franchise Tax 3522 / 3536 / 100S / PTET 3804 / Estimated Tax 100-ES
- **NY**：CT-3-S / PTET IT-204-IP / Estimated Tax
- **TX**：Franchise Tax 05-158 / No Tax Due
- **FL**：F-1120 / RT-6（年度日历）
- **WA**：B&O Tax
- **MA**（新增覆盖）：Form 1 / Form 2 / Form 3 / Corporate Excise

约 30 条核心规则，每条带 `source_url + verbatim_quote + verified_by + verified_at + next_review_at`。

#### 6.1.3 其他 44 州

Schema 占位 + Federal-only 默认生成 + Obligation 上显示 `needs_review` 徽章 + "Not yet fully covered" tooltip。这个设计让产品在 Demo 时看起来 50 州全支持，但不会因未验证规则承担法律风险。

#### 6.1.4 规则版本化

每条规则有 `version` + `adopted_at`；修改规则时新增 version，旧 ObligationInstance 保留 `rule_version` 指向生成时版本，避免规则改动回溯污染历史数据。

#### 6.1.5 规则变更流

```
Ops/Tax expert edits rule draft
  → Second-person review + sign-off
  → Rule set version++
  → Affected ObligationInstances get [Rule updated, review] flag
  → User sees "1 rule updated recently" in Dashboard Alerts tab
```

#### 6.1.6 为什么要 50 州骨架而非只 5 州

- 客户跨州不会提前通知我们；系统必须能吞任何 state code
- 规则表留 `coverage_status: full | skeleton | manual` 三档，UI 层有差异提示
- 骨架态下允许用户 `custom_deadline` 手录，并进入 ops 复核队列贡献规则

### 6.2 Glass-Box AI Layer（证据绑定型 AI）

#### 6.2.1 纪律

- **No citation, no output.** 任何 AI 生成的句子必须带 `[n]` 索引；否则不渲染，降级为 refusal 文案。
- **Retrieval-before-generation.** 所有 prompt 必须先从 `rule_chunks` + `pulse_chunks` 取 top-k；LLM 只能引用传入的 chunk。
- **Refuse gracefully.** 如果 retrieval 为空或置信度 < 0.5 → `"I don't have a verified source for this. [Ask a human]"`.
- **Never conclude.** 白名单：`Confirm... / Check whether... / Source indicates...`；黑名单：`Your client qualifies... / No penalty will apply... / This is valid tax advice...`
- **PII never leaves.** 客户姓名 / EIN / 邮箱在 prompt 中使用占位符 `{{client_1}}`，生成后在后端回填。符合 IRC §7216 + FTC Safeguards Rule。

#### 6.2.2 AI 能力矩阵

| 能力 | 优先级 | 输入 | 输出 | 降级策略 |
|---|---|---|---|---|
| Weekly Brief | P0 | 本 firm Smart Priority top-N 候选 + 客户 summary | 3–5 句带 citation | 缓存上次版本 + 模板兜底 "You have N items this week." |
| Client Risk Summary | P0 | 单客户 30 天 obligations + rule chunks | 一段话 + bullets | 纯 SQL 聚合 "3 upcoming, 1 critical" |
| Deadline Tip | P0 | 单 obligation + rule chunk | 3 段 What/Why/Prepare | 从 `rule.default_tip` 兜底 |
| Smart Priority | P0 | 全部 open obligations + client 字段 | 打分 + 因子分解 | 纯函数（零 LLM 调用，§6.4），LLM 仅用于 Why-hover 解释 |
| Pulse Source Translator | P0 | 官方公告原文 | 结构化 JSON + 人话 summary + verbatim quote | 置信度 < 0.7 标记 pending review |
| Ask DueDateHQ (Q&A) | P1 | 自然语言 query | 表格 + 总结 + citations | 预设模板 5 条兜底（§6.6.5）|
| AI Draft Client Email | P1 | Alert + 受影响客户 | 英文邮件草稿 | 固定模板 |
| Migration Field Mapper | P0 | 表头 + 5 行样本 | mapping JSON | Preset profile + 手动下拉 |
| Migration Normalizer | P0 | 字段枚举值 | 归一值 + confidence | 字典 + fuzzy + 手动编辑 |

#### 6.2.3 RAG 管线

```
User Event (page load / Apply / Ask)
  ↓
Retrieval
  - Query → embedding → pgvector top-k (k=6)
  - Filter by firm_id / jurisdiction / entity_type / tax_type
  ↓
Prompt Assembly
  - System prompt (glass-box persona, refusal rules)
  - Retrieved chunks with [n] IDs
  - User context (client summary with PII placeholders, today, role)
  ↓
LLM call
  - Tier 1 (fast, cheap): GPT-4o-mini / Claude Haiku — Deadline Tip / Mapper
  - Tier 2 (slow, quality): GPT-4o / Claude Sonnet — Weekly Brief / Pulse Extraction
  ↓
Post-processing
  - Regex validate citations [n]
  - Hallucination guard: every [n] must exist in retrieved chunks
  - PII re-fill: placeholder → real values
  - If validation fails → retry once → else refusal
  ↓
Render
  - Citations as clickable chips → Evidence Mode
  - Store AiOutput row with prompt_version + model + input hash for audit
```

#### 6.2.4 Prompt 版本化

`/prompts/*.md` 全部版本化入库；`prompt_version` 写入 `AiOutput` 表，A/B 和回溯可做。

#### 6.2.5 成本控制

- 每 firm / day 限 200 次 AI 请求
- Weekly Brief 每 firm 每天生成 1 次并缓存
- Deadline Tip 按 `rule_id + client_id` 缓存 7 天
- 失败 → 展示缓存 + 警示条

### 6.3 Regulatory Pulse™（Story S3 全链路）

#### 6.3.1 Ingest（S3-AC1）

6 个权威源 + 24h SLA：

| Source | 类型 | 方式 | 频率 |
|---|---|---|---|
| IRS Newsroom | RSS | RSS → HTML 抽取 | 30 min |
| IRS Disaster Relief | 专题页 | Cheerio diff | 60 min |
| CA FTB News | RSS | RSS | 60 min |
| NY DTF Tax News | RSS | RSS | 60 min |
| TX Comptroller | 页面 | Cheerio | 60 min |
| FL DOR / WA DOR / MA DOR | 页面 | Cheerio | 120 min |

冗余设计：任何单源失败 → 日志 + Sentry 告警 + 降级为 mock（UI 侧 `Last checked X min ago` 仍诚实显示）。

#### 6.3.2 LLM Extraction（S3-AC1 / AC5）

```
Raw announcement
  ↓  LLM extraction (schema-first)
{
  "title": "IRS announces tax relief for California storm victims",
  "jurisdiction": "CA",
  "counties": ["Los Angeles"],
  "affected_forms": ["1040", "1120-S", "1065"],
  "affected_entity_types": ["Individual", "S-Corp", "Partnership"],
  "original_due_date": "2026-04-15",
  "new_due_date": "2026-10-15",
  "effective_from": "2026-04-22",
  "official_source_url": "https://irs.gov/newsroom/...",
  "verbatim_quote": "Individuals and businesses in Los Angeles...",
  "confidence": 0.94,
  "requires_human_review": true
}
```

所有 Pulse 条目默认 `requires_human_review = true`；由 ops 人工复核 → Approve → 才进入 Match + Feed。

#### 6.3.3 Match Engine（S3-AC2 + AC4 批量调整）

四维 SQL 匹配：

```sql
SELECT c.id, c.name, o.id as obligation_id, o.current_due_date
FROM clients c
JOIN obligation_instances o ON o.client_id = c.id
WHERE c.firm_id = :firm_id
  AND c.state = :pulse_jurisdiction
  AND (c.county IS NULL OR c.county = ANY(:pulse_counties))
  AND c.entity_type = ANY(:pulse_entity_types)
  AND o.tax_type = ANY(:pulse_affected_forms)
  AND o.status NOT IN ('filed', 'paid', 'not_applicable')
  AND o.current_due_date = :pulse_original_due_date;
```

**Batch Apply 原子事务：**

```
BEGIN
  FOR each selected (client, obligation):
    UPDATE obligations SET 
      current_due_date = new_date,
      source_ref = pulse_id,
      last_changed_by = user_id,
      last_changed_at = now()
    INSERT evidence_link (obligation_id, pulse_id, applied_at, applied_by, source_type='pulse_apply')
    INSERT audit_event (actor, action='pulse.apply', batch_id, before, after)
  INSERT email_job (assignee_list, pulse_summary, obligations)  -- §6.3.4
  UPDATE pulse SET status='applied', applied_at, applied_by
COMMIT
```

任意一步失败整体回滚。24h 内可 Revert（§6.3.6）。

#### 6.3.4 Email Digest（S3-AC3 双渠道耦合）

**关键设计：** Pulse Apply 成功的 **同一事务内** 插入 `email_job`，由 worker 异步发送。Email 与 Banner 共享一条 Pulse 数据，保证 CPA 在 Dashboard 看到与邮箱看到的**内容完全一致**。

邮件模板：

```
Subject: [DueDateHQ] IRS CA storm relief applied to 12 of your clients

Hi Sarah,

A new regulatory update affects 12 of your clients. Here's what we did:

───────────────────────────────────────────────
IRS announces tax relief for California storm victims
Published: Apr 15, 2026
Source: https://irs.gov/newsroom/... [Verify on IRS]
───────────────────────────────────────────────

Summary (AI-generated, verified by DueDateHQ ops):
  IRS extends filing deadlines for Los Angeles County to 
  October 15, 2026, covering Form 1040, 1120-S, 1065.

Affected clients (12):
  ✓ Acme LLC (LA) — 1040 moved from Mar 15 → Oct 15
  ✓ Bright Studio S-Corp (LA) — 1120-S moved
  ✓ Miller Partnership (LA) — 1065 moved
  ... 9 more

All changes can be reverted within 24 hours.

[Open DueDateHQ →]    [Undo this batch]

This update was applied on 2026-04-22 10:15 PST by sarah@firm.com.
AI-assisted. Verify with official sources.
```

**邮件配送（Team 路由规则 · §3.6 Gap 4）：**

| 收件人 | 规则 | 可否关闭 |
|---|---|---|
| **Firm Owner** | 必收一份 | ❌（Pulse 是法定级信号）|
| **受影响 obligation 的 Assignee**（去重）| 必收一份（如果同一人有多条，合并为一封）| ❌ |
| **未分派 obligation 的 fallback 收件人** | `firm.default_assignee` 配置（`owner` / `round_robin` / `none`）；默认 owner | — |
| **Manager** | 可选订阅全量 Pulse Digest（Settings → Notifications → `Subscribe to all firm Pulse alerts`）| ✓ 可关 |
| **Preparer / Coordinator** | 只有当 assignee = 自己 才发 | — |

**配送规则：**
- 同一人多条 obligation → **合并为一封邮件**（按 obligation 列表 bullets）
- 模板渲染：服务端（Resend），不使用 LLM
- 每封邮件 footer 显示 `You received this because you are the assignee on 3 obligations.` + `[Notification preferences]`
- 切换到 Daily Digest：Settings → Notifications → `Pulse email cadence: Immediate / Daily digest 8am / Weekly digest Monday 8am`（默认 Immediate）
- **Coordinator 邮件版本不含 `$ at risk` 字段**（与 §3.6.3 RBAC 一致，commercial-sensitive 隐藏）

#### 6.3.5 Pulse 抓取失败的降级 Demo 流

**DLQ（Dead Letter Queue）：** 任何单源失败 → 日志 + Sentry 告警 + 回退为 mock + UI 显示 `Last checked: 3 hr ago (retrying)` 警示色。

Demo 预置：1 条 approved `IRS CA storm relief` + 1 条 `NY PTET reminder`，即使现场 RSS 抖动也能演完闭环。

#### 6.3.6 24h Revert

Batch Apply 后 24h 内 owner 可一键 Revert，写反向 audit event + 恢复 `original_due_date` + 移除 pulse evidence_link。

### 6.4 Smart Priority Engine（S1-AC5 胶水）

#### 6.4.1 为什么存在

Story S1 AC#5 要求 "5 分钟完成分诊"；仅有三段 Tabs 不够——Tab 内仍可能 15 行，CPA 需要明确的排序依据。Smart Priority Engine 是 Dashboard Triage Tab / Workboard 默认排序 / Weekly Brief 客户顺序 **三处共用的同一个打分函数**。

#### 6.4.2 打分函数（纯函数、可解释、零幻觉）

```typescript
// Weights versioned in /prompts/priority.v2.yaml for auditability.
function priorityScore(o: ObligationInstance, c: Client): PriorityBreakdown {
  const exposure   = o.estimated_exposure_usd;          // Penalty Radar 输出（§7.5）
  const urgency    = daysUntil(o.current_due_date);     // 剩余天数
  const importance = c.importance_weight;               // high=3 / med=2 / low=1
  const history    = c.late_filing_count_last_12mo;     // 历史延误
  const readiness  = o.readiness === 'waiting_on_client' ? 1.3 : 1.0;

  const score =
      0.45 * normalize(exposure,  0, 10_000)      // 美元敞口主导
    + 0.25 * inverseUrgency(urgency)              // 越近越高
    + 0.15 * normalize(importance, 1, 3)          // 客户分级
    + 0.10 * normalize(history,   0, 5)           // 爱迟到 → 优先盯
    + 0.05 * readiness;                           // 卡在客户手上的要催

  return { score, factors: { exposure, urgency, importance, history, readiness } };
}
```

#### 6.4.3 Glass-Box 呈现（S1-AC5 的 "为什么这个比那个急"）

每行右侧 `✦` 徽章，hover 展开 `Why this rank?`：

```
Rank #1 — Acme LLC · CA Franchise
● $4,200 at risk  (45% weight)
● 3 days left     (25% weight)
● High-priority client (15% weight)
● 1 late filing last year (10% weight)
● Waiting on client (5% weight)
[Why these weights?] → /settings/priority
```

#### 6.4.4 用户控制

排序切换（P1-13）：`AI Smart ✨ / Due Date / $ At Risk / Status`  
权重调整：P1+（仅 Pro plan，含审计日志）

#### 6.4.5 可选 LLM Mode（P1）

Settings 中开关：`Use LLM for tie-breaking` → 仅当 top-5 打分相差 < 5% 时调用 LLM 给出排序理由（不改变打分）。这让 Weekly Brief 的"Top 3 to touch first"和 Dashboard 列表 100% 一致，避免割裂感。

### 6.5 Penalty Radar™（美元敞口引擎）

见 §7.5 独立章节（在"亮点模块"之外，因其跨页面）。

### 6.6 AI Q&A Assistant — Ask DueDateHQ（P1 · VPC Medium ✦）

#### 6.6.1 入口

- Dashboard `Ask DueDateHQ` 输入框（Layer 5）
- `/` 全局快捷键抽屉
- Cmd+K 命令面板 "Ask" tab

#### 6.6.2 范围边界

仅回答**检索型**问题：

| 类型 | 示例 | 行为 |
|---|---|---|
| 检索 | `Which clients owe CA PTE this month?` | ✅ SQL + summary + citations |
| 检索 | `Show me S-Corps with extension filed but payment unpaid` | ✅ |
| 检索 | `How many clients in LA county are affected by storm relief?` | ✅ |
| 税务判断 | `Should my client elect PTE?` | ❌ Refusal: "DueDateHQ is a deadline copilot. Please consult your professional judgment." |
| 写操作 | `Delete all 1040 obligations` | ❌ Refusal: "Ask is read-only." |
| 跨租户 | `Show all firms with CA clients` | ❌ Hard-blocked by tenant isolation |

#### 6.6.3 实现管线（双保险 · NL → DSL → SQL）

```
User question
  ↓
LLM Layer 1 · Intent classifier (retrieval / advice / out-of-scope)
  ↓  if not retrieval → refusal template
  ↓
LLM Layer 2 · DSL generator (constrained, schema-aware)
  e.g. {
    entity: "obligation",
    filters: [
      { tax_type: "state_ptet" },
      { state: "CA" },
      { due_within_days: 30 }
    ],
    group_by: "client"
  }
  ↓
Executor · DSL → parameterized SQL
  - Whitelisted tables: clients, obligation_instances, rules (read-only)
  - Enforced: WHERE firm_id = :current_firm (injected, not user-controlled)
  - Parser rejects: DDL / DML / cross-JOIN out of whitelist
  ↓
Execute SQL → result rows
  ↓
LLM Layer 3 · Summarize in one sentence with [source] chips
  - PII re-filled post-LLM
  ↓
Render
  - Table preview (first 10 rows + "Open all in Workboard" deep link)
  - Saved View + CSV Export
  - Evidence drawer: DSL + SQL + row count
```

#### 6.6.4 合规与安全

- 只读白名单 + tenant 强制隔离（两层）
- LLM 只看 schema + 用户问题 + 5 行 anonymized sample，不看全量 PII
- 所有调用入 `llm_logs` 表（成本 / 延迟 / token 可审计）
- Ask 历史在 Settings → Ask History（用户可删除）

#### 6.6.5 降级

若 LLM 不可用，Ask 降级为预设 5 条模板问答（固定 DSL + SQL）：
- `How many deadlines do I have this week?`
- `Which clients are waiting on documents?`
- `Show me overdue obligations`
- `Clients due in next 30 days`
- `Clients in California`

---

## 6A. 亮点模块 — Migration Copilot™

### 6A.1 战略价值

- **First-run wow**：Demo Day 前 60 秒让评委看到产品"魔法"
- **激活杠杆**：trial-to-paid 转化从"我得录 80 客户"障碍解放
- **Glass-Box 布道**：让 Glass-Box 不是抽象概念，而是第一次接触就感受到的（每一次 AI 映射 / 归一都进 Audit）
- **Demo 戏剧性**：Live Deadline Genesis 动画 + Penalty Radar 数字实时跳动

### 6A.2 AI Field Mapper（S2-AC2 · 含 EIN）

#### 输入

- 表头（第 1 行）
- 前 5 行数据样本
- 可选：Preset profile（TaxDome / Drake / Karbon / QuickBooks / File In Time）

#### 目标字段 Schema

```yaml
target_fields:
  - client.name          # required, string
  - client.ein           # optional, "##-#######" EIN format
  - client.state         # required, 2-letter US code
  - client.county        # optional, string
  - client.entity_type   # required, enum
  - client.tax_types     # optional array (fallback to Default Matrix §6A.5)
  - client.assignee_name # optional
  - client.importance    # optional enum high/med/low
  - client.email         # optional
  - client.notes         # optional
  - IGNORE               # explicitly unused column
```

#### Prompt（schema-first · 零幻觉）

```
You are a data mapping assistant for a US tax deadline tool.
Given a spreadsheet's header and a 5-row sample, map each column to
one of the DueDateHQ target fields. Output strict JSON only.

For EIN detection:
  - EIN format is "##-#######" (9 digits with a dash after the first 2).
  - If a column contains values matching this pattern, map to "client.ein".

For each source column, output:
  {
    "source": "<header>",
    "target": "<field|IGNORE>",
    "confidence": 0.0-1.0,
    "reasoning": "<one sentence, ≤ 20 words>",
    "sample_transformed": "<example of first row after mapping>"
  }

Rules:
  - If unclear, set target=IGNORE and confidence below 0.5.
  - Never invent target fields not listed above.
  - Explain every decision in ≤ 20 words.
  - PII note: you only see this 5-row sample, not the full dataset.
```

#### 后处理

- 正则校验输出 JSON schema
- EIN 列二次验证：正则 `^\d{2}-\d{7}$` 命中率 ≥ 80% 才接受 mapping
- 置信度 < 0.8 行高亮"Needs review"（非阻塞）
- 所有 mapping 存 `migration_mapping` 表供 Revert

### 6A.3 AI Normalizer（S2-AC3 · 智能建议而非阻塞）

策略：**枚举型走 LLM，自由字段走 fuzzy + 字典。**

| 字段 | 归一方式 | 示例 |
|---|---|---|
| `entity_type` | LLM 映射到 8 枚举之一；未知标 "Needs review" | `L.L.C.` → `LLC`，`Corp (S)` → `S-Corp` |
| `state` | 字典 2-letter + full name；失败 → LLM | `California` → `CA`，`Calif` → `CA` |
| `county` | 保留原始（州内 county 太大），异常字符告警 | `Los Angeles` / `LA` 不归一 |
| `tax_types` | 字典 + LLM；缺失走 Default Matrix（§6A.5）| `Fed 1065` → `federal_1065_partnership` |
| `tax_year` | 正则 `(19\|20)\d{2}` + LLM 兜底 | `Fiscal 2026` → `2026` |
| `importance` | 字典 | `A / VIP / Priority / top` → `high` |
| `ein` | 正则校验 + "##-#######" 归一 | `12.3456789` → `12-3456789` |

**所有归一决策写 `evidence_link`**，CPA 在 Client Detail → Audit 看到：
> "此客户 entity=LLC 由 AI 从原始 'L.L.C.' 归一，置信度 97%，模型 gpt-4o-mini"

**Smart Suggestions 非阻塞原则：**
- 置信度 < 0.8 → 黄色 "Needs review" 徽章，**不阻塞导入**
- 置信度 < 0.5 → `[Fix now or skip]` 二选一，不强制
- 缺失必填字段（name / state）→ 红色 "Missing required"，仅此类阻塞

### 6A.4 Preset Profiles（S2-AC1 · 5 个首发）

| Preset | 典型列（示例） | 作用 |
|---|---|---|
| `TaxDome` | `Client Name, EIN, Entity Type, State, Tax Return Type, Assignee` | 全字段已知 |
| `Drake` | `Client ID, Name, EIN, Entity, State, Return Type` | 全字段已知 |
| `Karbon` | `Organization Name, Tax ID, Country, Primary Contact` | 部分已知 |
| `QuickBooks` | `Customer, Tax ID, Billing State` | 仅客户元数据（tax_types 走 Default Matrix）|
| `File In Time` | `Client, Service, Due Date, Status, Staff` | 最完整 one-shot 迁移（彩蛋对标竞品）|

Preset 给 AI Mapper 强先验，置信度从 75% 跳到 95%+。

### 6A.5 Default Tax Types Inference Matrix（S2-AC4 兑现 "无需额外配置"）

#### 为什么必须

TaxDome / Drake / QuickBooks 的导出 CSV **经常没有 tax_types 列**。若规则引擎只按 `state + entity_type + tax_types` 三键匹配，这些客户生成 **0 条 obligation**，Live Genesis 空白，S2-AC4 直接塌。

#### 规则

当 `tax_types` 缺失时，Rule Engine 以 `entity_type × state` 为键查 **Default Tax Types Matrix** 推断"该客户的默认合规组合"。MVP 覆盖 6 辖区 × 8 实体类型 = 48 格，未覆盖格回退为"Federal 默认 + `needs_review` 徽章"。

#### 默认矩阵（示例）

| `entity_type × state` | 推断的默认 `tax_types` |
|---|---|
| `LLC × CA` | `federal_1065_or_1040`, `ca_llc_franchise_min_800`, `ca_llc_fee_gross_receipts` |
| `LLC × NY` | `federal_1065_or_1040`, `ny_llc_filing_fee`, `ny_ptet_optional` |
| `LLC × TX` | `federal_1065_or_1040`, `tx_franchise_tax` |
| `LLC × MA` | `federal_1065_or_1040`, `ma_corporate_excise` |
| `S-Corp × CA` | `federal_1120s`, `ca_100s_franchise`, `ca_ptet_optional` |
| `S-Corp × NY` | `federal_1120s`, `ny_ct3s`, `ny_ptet_optional` |
| `Partnership × FL` | `federal_1065`（FL 无州所得税）|
| `C-Corp × WA` | `federal_1120`, `wa_bo_tax` |
| `Sole-Prop × TX` | `federal_1040_sch_c`, `tx_franchise_no_tax_due` |
| `Individual × any` | `federal_1040` + 该州个人所得税（若有）|
| *未覆盖格* | `federal_*`（按 entity 默认）+ `needs_review` 徽章 |

矩阵本身**不是 AI**，是规则库里 `default_tax_types.yaml` 的静态表，由 ops 人工签字；查表是纯函数，零幻觉。

#### UI 联动（Step 3 Normalize）

```
Suggested tax types (inferred from entity × state)
  Acme LLC (LLC · CA) → CA Franchise Tax, CA LLC Fee, Federal 1065
  Bright Inc (S-Corp · NY) → NY CT-3-S, NY PTET, Federal 1120-S
  [✓ Apply to all · keep checked to auto-generate deadlines]
```

默认**全勾 + 默认生效**（"无需额外配置"直接体现）；用户可逐条取消 / 追加。

#### Glass-Box Evidence

```json
{
  "source_type": "default_inference_by_entity_state",
  "raw_entity_type": "LLC",
  "raw_state": "CA",
  "inferred_tax_type": "ca_llc_franchise_min_800",
  "matrix_version": "v1.0",
  "applied_at": "2026-04-23T09:00:00Z",
  "applied_by": "system"
}
```

### 6A.6 4 步向导 UX

#### Step 1 · Intake

```text
┌──────────────────────────────────────────────────┐
│  Import clients                        Step 1 / 4 │
├──────────────────────────────────────────────────┤
│  Where is your data coming from?                 │
│                                                  │
│   ○ Paste from Excel / Google Sheets (fastest)   │
│   ○ Upload CSV / TSV / XLSX file                 │
│   ○ I'm coming from…                             │
│     [TaxDome] [Drake] [Karbon]                   │
│     [QuickBooks] [File In Time]                  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  Paste here — any shape, we'll figure it   │  │
│  │  out. Include header row if you have one.  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│   💡 Tip: You can paste multiple tabs at once.   │
│   🔒 PII check: SSN-like patterns are blocked.   │
│                           [Continue →]           │
└──────────────────────────────────────────────────┘
```

- 支持：Excel copy（TSV with headers）/ CSV / Google Sheets copy / 邮件表格 HTML / `.xlsx` 上传（≤ 1000 行）
- SSN 正则 `\d{3}-\d{2}-\d{4}` 拦截并红色警示该列强制 IGNORE

#### Step 2 · AI Field Mapping（Glass-Box · S2-AC2）

```text
┌────────────────────────────────────────────────────────────────┐
│  AI mapped your columns — review and confirm         Step 2/4  │
├────────────────────────────────────────────────────────────────┤
│  Your column       →  DueDateHQ field       Confidence  Sample │
│  ──────────────────────────────────────────────────────────────│
│  "Client Name"     →  client.name              99%     Acme LLC│
│  "Tax ID"          →  client.ein ★             96%  12-3456789 │
│  "Ent Type"        →  entity_type              94%     LLC  [?]│
│  "State/Juris"     →  state                    97%     CA      │
│  "County"          →  county                   88%     LA      │
│  "Tax F/Y"         →  tax_year                 81%     2026    │
│  "Resp"            →  assignee_name            76%  ⚠ Sarah    │
│  "status LY"       →  ⚠ IGNORED (last-year)    —              │
│  "Notes"           →  notes                    92%     …       │
│                                                                │
│  [Re-run AI]   [Export mapping]                                │
│                                           [← Back] [Continue →]│
└────────────────────────────────────────────────────────────────┘
```

- ★ 表示 EIN 字段专用徽章（区别普通 text 列）
- 每行 hover → AI reasoning：`"Column values match '##-#######' EIN pattern in 5/5 rows"`
- 置信度 < 80% 黄色高亮（非阻塞）
- `[?]` 预览归一结果（见 Step 3）

#### Step 3 · Normalize & Resolve（S2-AC3 + S2-AC4）

```text
┌─────────────────────────────────────────────────────────────┐
│  We normalized 47 values — review if needed       Step 3/4  │
├─────────────────────────────────────────────────────────────┤
│  Entity types                                               │
│    "L.L.C.", "llc", "LLC" (12 rows)   → LLC          [edit] │
│    "Corp (S)", "S Corp" (8 rows)      → S-Corp       [edit] │
│    "Partnership", "Ptnr" (5 rows)     → Partnership  [edit] │
│    ⚠ "LP" (2 rows)                    → [?] Needs review    │
│                                                             │
│  States                                                     │
│    "California", "Calif", "CA" (18)   → CA           [edit] │
│    "NY", "New York" (10)              → NY           [edit] │
│                                                             │
│  Suggested tax types (from entity × state matrix)           │
│    12 LLC×CA clients   → CA Franchise, CA LLC Fee, Fed 1065 │
│    5 S-Corp×NY clients → NY CT-3-S, NY PTET, Fed 1120-S     │
│    [✓ Apply to all]   keep checked → auto-generate          │
│                                                             │
│  Conflicts (3)                                              │
│    • "Acme LLC" matches existing client ID 42              │
│      → [Merge] [Overwrite] [Skip] [Create as new]           │
│                                                             │
│                                        [← Back] [Continue →]│
└─────────────────────────────────────────────────────────────┘
```

#### Step 4 · Dry-Run Preview + Live Genesis（S2-AC5）

```text
┌────────────────────────────────────────────────────────────┐
│  Ready to import                                  Step 4/4 │
├────────────────────────────────────────────────────────────┤
│  You're about to create                                    │
│    • 30 clients                                            │
│    • 152 obligations (full tax year 2026)                  │
│    • Est. $19,200 total exposure this quarter              │
│                                                            │
│  Preview                                                   │
│    Top risk (this week):                                   │
│      Acme LLC — CA Franchise Tax    $4,200 — 3 days        │
│      Bright Studio — 1120-S         $2,800 — 5 days        │
│    [See all 152 →]                                         │
│                                                            │
│  Safety                                                    │
│    ✓ One-click revert available for 24 hours               │
│    ✓ Audit log captures every AI decision                  │
│    ✓ No emails will be sent automatically                  │
│                                                            │
│           [← Back]         [Import & Generate deadlines ▶] │
└────────────────────────────────────────────────────────────┘
```

点击 → **Live Genesis Animation**（4–6 秒）：
- 屏幕中央 deadline 卡片按州 / 日期涌出
- 顶栏 Penalty Radar 从 $0 滚到总 $
- 自动跳 Dashboard，Top of `This Week` tab 选中第 1 条

**导入后 Toast 常驻 24h：**

```
✓ Imported 30 clients, 152 obligations, $19,200 at risk.
[View audit]    [Undo all]
```

### 6A.7 原子导入 + Revert

#### 导入事务

```sql
BEGIN;
  INSERT INTO migration_batch (...);
  FOR each row:
    try:
      INSERT INTO client (..., migration_batch_id);
      -- generate obligations via rule engine + default matrix
      INSERT INTO obligation_instance[] (..., migration_batch_id);
      INSERT INTO evidence_link[] (...);  -- every AI decision
      INSERT INTO audit_event (action='migration.client.created', batch_id);
    catch:
      INSERT INTO migration_error (batch_id, row, error);
      continue;
  UPDATE migration_batch SET status='applied', stats_json;
COMMIT;
```

**单行失败不阻塞整批。** 失败行进入 `/settings/migration/<batch_id>/errors` 可下载 CSV + 手改重导。

#### Revert（双档）

| 级别 | 触发 | 时限 | 行为 |
|---|---|---|---|
| **全量 batch 撤销** | `[Undo all]` toast / Settings | 24h | 事务内删除所有 batch 下的 clients + obligations + evidence_links |
| **单客户撤销** | Clients → 单客户详情 `[Delete]` | 7 天（带 warning）| 单个 client + 级联 obligations |

24h 过后 `[Undo all]` 灰化，避免已有后续操作关联数据被误删。

### 6A.8 Migration Report（战报邮件）

导入后 60 秒发 owner：

```
Subject: DueDateHQ import complete — 30 clients, $19,200 at risk

Summary
  ✓ 30 clients created
  ✓ 152 obligations generated for tax year 2026
  ⚠ 3 rows skipped (see below)
  🔔 Next deadline: Acme LLC — CA Franchise Tax in 3 days

Top 5 at-risk this quarter
  1. Acme LLC                   $4,200
  2. Bright Studio S-Corp       $2,800
  3. Zen Holdings               $1,650
  4. ...

Skipped rows (3)
  Row 17: state="—", could not be normalized
  Row 23: entity_type="Trust", marked as needs_review  
  Row 29: duplicate of existing Acme LLC, marked as skip

You can undo this import for the next 24 hours.
  https://app.duedatehq.com/settings/migration/batch_xx/revert
```

### 6A.9 安全与合规护栏

- MVP 不收 SSN / 完整税额（§13.1）
- 粘贴内容含 SSN 模式 → 前端拦截 + 该列强制 IGNORE + 红色警示
- AI mapping / normalize **在客户端 redact PII** → 仅发字段名 + 5 行样本到 LLM，不发全表
- Prompt 明示 `"Do not retain any data seen for training"`；采用 OpenAI `zero data retention` endpoint 或 Azure OpenAI
- 所有 LLM 调用入 `llm_logs`

### 6A.10 验收清单（S2 全覆盖）

| AC | 测试用例 | 预期 |
|---|---|---|
| S2-AC1 | 上传 TaxDome 导出 CSV（含 EIN 列）| Preset 自动选中 + AI Mapping 置信度 ≥ 95% + EIN 识别 100% |
| S2-AC2 | 上传 30 行混乱 CSV（`Client Name / Tax ID / State/Juris / Ent Type`）| AI 识别 name/ein/state/entity_type 4 字段均 ≥ 80% |
| S2-AC3 | CSV 有 5 行缺 state / 3 行缺 entity_type | 非阻塞 "Needs review"；导入后这 8 行进 `needs_review` 队列不影响其他 22 行 |
| S2-AC4 | 上传 CSV 无 tax_types 列，含 LLC×CA / S-Corp×NY / Individual×TX | 导入后每个客户都生成 ≥ 3 条 obligations；全年日历完整 |
| S2-AC5 | 计时从 signup 到 Import 完成 | P95 ≤ 30 分钟（30 客户基准，含粘贴 5min + mapping review 10min + normalize 5min + import 10min buffer）|

### 6A.11 Onboarding AI Agent（★ 差异化亮点 · P1-27）

> 这是 §6A.6 传统 4 步向导的**平行入口**：不是替代，而是增加一个"对话式 Setup"选项。
> 战略意图：精准对标 LangGenius/Dify 评审员 taste — 让他们一眼看到"这是 AI Agent 在正确场景的正确姿势"。

#### 6A.11.1 为什么必须做

三条理由：

1. **没人真正读 Onboarding 文档。** 传统空态页 `[+ Import] [+ Add client]` 的转化窗口只有 30 秒；CPA 走不过来就会关掉标签页。
2. **Dify 评审员会精准 GET 到这个。** LangGenius 每天在做 LLM orchestration；看到"主动发问 → 按客户回答 → 调用工具链 → 产出具体价值"的 Agent，共鸣一次爆炸。
3. **它复用你已经做过的 90% 管线**（Migration Mapper + Normalizer + Rule Engine + Live Genesis），增量成本 ≤ 2 人天。

#### 6A.11.2 对话流程（脚本示例）

```
(空态首页，AI Agent Chat 占主位，传统 4 步向导降为右上 [Use guided wizard] 链接)

✦ DueDateHQ Setup Copilot
   Hi! I'm here to get you running in under 5 minutes.
   Quick question: are you solo, or do you have a team?

> solo

   Nice — one-person setup is the fastest path.
   Roughly how many active clients do you have?

> around 50

   Got it. Most of them US-based?

> all in CA and NV, mostly LLCs

   Perfect — I've pre-loaded CA Franchise Tax + NV rules for you.
   
   Now the hardest part: your client list. Paste it here in any 
   format — a TaxDome export, a messy Excel, even rows from an email.
   I'll figure out the columns.
   
   💡 Tip: 52-column spreadsheet? I've seen worse. Just paste.

> [user pastes 52 rows × 7 columns of messy Excel]

   Reading it now... 
   ✓ Found 52 clients
   ✓ Detected columns: Name, Tax ID (EIN), State, Entity Type, 
     Assignee, Notes, Last Contact
   ⚠ 3 entity types look odd ("Corp (S)", "L.L.C.", "Ptnr") — 
     I'll clean them up.
   
   Before I commit: I'll generate 247 deadlines for tax year 2026 
   with an estimated $31,400 exposure this quarter. OK to proceed?

> go

   [Live Genesis 4s 动画]
   
   ✓ Done. Your Dashboard is ready — top 3 urgent items are 
   Acme LLC (CA Franchise, 3 days, $4,200), Bright Studio 
   (1120-S, 5 days, $2,800), Zen Holdings (Q1 Est., 7 days, $1,650).
   
   Want me to walk you through the weekly triage workflow? 
   Or jump to the Dashboard?

> [Open Dashboard] [Walk me through]
```

#### 6A.11.3 State Machine（轻量）

```
STATE: scope_detection       ← "solo / team / skip"
  ↓
STATE: scale_detection       ← "how many clients"
  ↓
STATE: jurisdiction_hint     ← "states mostly in"（写入 firm profile 触发规则预加载）
  ↓
STATE: intake                ← 复用 §6A.2 AI Field Mapper
  ↓
STATE: normalize_confirm     ← 复用 §6A.3 Normalizer，但压缩为对话气泡 summary
  ↓
STATE: dry_run_commit        ← 复用 §6A.6 Step 4 + Live Genesis
  ↓
STATE: handoff               ← "Open Dashboard" / "Walk through triage"
```

每个 STATE 都有 `[Skip this step]` / `[Go back]` 选项。任何时候用户点右上 `[Use guided wizard]` → 无缝转到传统 4 步向导，**已收集的字段不丢失**。

#### 6A.11.4 Fallback 降级

| 异常 | 降级 |
|---|---|
| LLM 响应超时 | 对话气泡显示 `[Fallback] Switching to the guided wizard...`，跳 §6A.6 Step 1 |
| 对话绕圈（用户问了 3 次非 setup 问题）| Agent 说 `Let me get you to the wizard — we can chat later.` |
| 用户粘贴内容 LLM 识别不出 | 回到 intake，提示"Try pasting a cleaner table, or [Upload a CSV instead]" |

#### 6A.11.5 Glass-Box 一致性

- Agent 的每一次字段识别、实体归一、规则预加载**都写 Evidence Link**，和 §6A.3 一致
- 对话内容完整写 `AiOutput` 表，prompt version 可追溯
- 用户在 Settings → Setup History 可看到"Your onboarding conversation"

#### 6A.11.6 为什么是 P1 而非 P0

- Story S2 验收不依赖它（4 步向导已能兑现 AC）
- 但它是 **集训评分的关键差异化资产**——Dify 评审员第一次看到产品时，Agent 对话框的视觉冲击远强于传统向导
- 即使 P1 延后，前期也应做 **Agent 的对话脚本设计 + 视觉稿**，让 Pitch 可以展示 "this is what our onboarding will look like"

#### 6A.11.7 Demo 钩子

Demo Day 现场可以这样演：
1. 评审员报一个数字 "42"，演示者在 Agent 对话里输入 `I have 42 clients`
2. 评审员报一个州 "Texas"，演示者输入 `mostly in TX`
3. 演示者粘贴预置的 42 行 TX Excel
4. **Agent 实时回应 + Live Genesis** → 评审员第一次看到"AI 读懂我说的话并产出一个能用的产品"

这是纯叙事层面的 jaw-drop moment。

---

## 6B. 亮点模块 — Client Readiness Portal™

> ★ 差异化亮点（P1-26）· 集训脱颖而出的关键原创性设计。
> **核心洞察**：现有所有竞品（File In Time / TaxDome / Karbon）的 `readiness` 都是 CPA **手动** 标记。但 CPA 最痛的根本不是"标状态"，而是**花一整天催客户交资料**。Readiness Portal 把数据源头从 CPA 侧反转到客户侧。

### 6B.1 为什么它能让你脱颖而出

| 维度 | 现有产品 | DueDateHQ Readiness Portal |
|---|---|---|
| Readiness 数据来源 | CPA 手动标 | **客户自己勾** |
| 客户的 touchpoint | CPA 邮件 + 电话 | **一个 magic link，30 秒** |
| 客户端门槛 | 下载 TaxDome app / 注册登录 | **免登录，移动端打开即可** |
| 产品亮点属性 | "更好的表格" | **"反转数据源头"的产品原创** |

**这是 File In Time / TaxDome / Karbon 都没有想到的方向**，因为他们把"CPA 工具"和"客户门户"做成两个产品（门户复杂、沉重、需登录）。DueDateHQ 把 **客户输入极简化为 1 个 URL + 4 个 checkbox**。

### 6B.2 用户旅程

#### CPA 侧

```
Obligation Detail (§5.3) 抽屉 → Readiness 区块
  ┌────────────────────────────────────────┐
  │  Readiness:  Waiting on client [Change ▾]│
  │  Need from Acme LLC:                    │
  │    ☐ K-1 from XYZ Partnership           │
  │    ☐ QuickBooks year-end close report   │
  │    ☐ 401(k) contribution confirmation   │
  │  [+ Add item]   [Save]                  │
  │                                         │
  │  [📤 Send readiness check to client]    │
  └────────────────────────────────────────┘
      ↓ CPA click
  Magic link generated, valid 14 days.
  Choose delivery:
    ○ Email to client (john@acme.com)  — uses your Reminder template
    ○ Copy link (send via SMS / WeChat / etc)
    ● Both
  
  [Send]
      ↓
  Client receives email with one button: [Confirm what I have ready →]
```

#### 客户侧（免登录 · 移动优先）

打开 magic link：

```
┌──────────────────────────────────────────────────┐
│  Hi, John!                                       │
│                                                  │
│  Your CPA Sarah is preparing your 1120-S         │
│  filing for Acme LLC, due March 15, 2026.        │
│                                                  │
│  She needs the following to proceed:             │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ ☐ K-1 from XYZ Partnership              │    │
│  │   [✓ I have it]  [ × Not yet ]          │    │
│  │   [? What is this?]                     │    │
│  ├─────────────────────────────────────────┤    │
│  │ ☐ QuickBooks year-end close report      │    │
│  │   [✓ I have it]  [ × Not yet ]          │    │
│  │   [? What is this?]                     │    │
│  ├─────────────────────────────────────────┤    │
│  │ ☐ 401(k) contribution confirmation      │    │
│  │   [✓ I have it]  [ × Not yet ]          │    │
│  │   [? What is this?]                     │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Anything else you want to tell Sarah?           │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│              [Send to Sarah →]                  │
│                                                  │
│  ── OR ──                                        │
│  [Call / Email me, I don't understand]          │
└──────────────────────────────────────────────────┘
         Powered by DueDateHQ · your CPA's tool
```

**[? What is this?]** → 点击展开 AI 生成的 2 句解释（Glass-Box 带 source）：

```
┌────────────────────────────────────────────────┐
│  K-1 from XYZ Partnership                      │
│                                                │
│  A Schedule K-1 is a tax form issued by a      │
│  partnership to report each partner's share    │
│  of income and deductions.                     │
│                                                │
│  How to get it: contact XYZ Partnership's      │
│  accountant; they usually send it in February. │
│                                                │
│  Source: IRS Schedule K-1 (Form 1065)          │
│  irs.gov/forms-pubs/about-schedule-k-1-form-1065│
│  [Close]                                       │
└────────────────────────────────────────────────┘
```

**[Call / Email me, I don't understand]** → 触发 AI 草拟一封面向客户的解释邮件，CPA 侧 Dashboard 出现"Acme LLC needs help understanding K-1 — [Draft email] [Call now]"。

#### Submit 后

客户看到：

```
✓ Thanks, John! Sarah has been notified.

Next time she reviews Acme LLC, she'll see:
  ✓ K-1 from XYZ Partnership — ready
  × QuickBooks year-end close report — not yet (you said it'll come Feb 10)
  ? 401(k) contribution — need help understanding

You can come back to update anytime: [bookmark this page]
```

CPA 侧 Dashboard **实时变化**：
- Acme LLC 的 `readiness` 从 `Waiting on client` → `Ready` 或 `Partially ready`
- Obligation 上的 Audit Log 追加：`John responded to readiness check 2026-04-22 14:30 UTC`
- 如有 `Not yet + ETA` → Dashboard Timeline 卡片显示 "Client committed: QuickBooks report by Feb 10"
- 如有 `? need help` → Dashboard 顶部 Banner "Acme LLC needs explanation on K-1 [Draft email]"

### 6B.3 数据模型

```
ClientReadinessRequest
  id, firm_id, obligation_instance_id, client_id,
  items (jsonb: [{ label, description, ai_explanation_url, status }]),
  magic_link_token (signed, one-time rotatable),
  delivery_channel (email | sms_link | both),
  sent_to_email, sent_to_user_id (optional CPA-side recipient),
  sent_at, expires_at (default +14d),
  first_opened_at, last_responded_at, response_count,
  status (pending | partially_responded | fully_responded | expired | revoked),
  revoked_at, revoked_by_user_id

ClientReadinessResponse
  id, request_id,
  item_index, status (ready | not_yet | need_help),
  client_note, eta_date (nullable),
  submitted_at, ip_hash, user_agent_hash  -- anonymized, for anti-abuse

(obligation_instance 的 readiness 字段仍是 CPA 的权威状态；
 response 触发 suggestion → CPA 一键接受 / 忽略。)
```

### 6B.4 安全与滥用防护

客户侧**免登录**但必须安全：

| 威胁 | 防护 |
|---|---|
| Link 泄露被公开 | Token 签名 + 14 天过期 + 单客户绑定（token 泄露至多暴露 1 个客户的 3 条 checklist，不含 PII 细节）|
| 暴力枚举 token | Token 长度 ≥ 32 bytes + rate limit（单 IP 10 req/min）+ Sentry alert |
| 客户提交恶意内容（XSS）| `client_note` 服务端 sanitize + rendering 全用 `{text}` 非 `innerHTML` |
| 客户机器人大量响应 | hCaptcha 作为 Submit 按钮门槛（默认开）|
| CPA 误发给错误客户 | Magic link 页显示 CPA 姓名 + Firm 名 + 客户名三项，客户看到不对可点 `This isn't me` 上报 |
| PII 最小化 | 客户侧页面**不显示 EIN / SSN / 金额**；只显示 "1120-S filing" 级别的信息 |
| Readiness 数据合规 | 所有 response 写 `AuditEvent(action='readiness.client_response')` |

### 6B.5 AI 能力（复用已有管线）

| 能力 | 复用模块 | 增量 |
|---|---|---|
| 客户侧 `[? What is this?]` 解释 | §6.2 Glass-Box Deadline Tip | prompt 微调为 "explain to a non-CPA client" |
| `[Call / Email me, I don't understand]` → Draft Email | §6.2 AI Draft Client Email | 同管线 |
| CPA 新建 checklist 时 AI 建议常见项 | §6.2 Deadline Tip | 基于 `obligation.tax_type + client.entity` 预填建议项 |

### 6B.6 与 Reminder 系统的集成

- Readiness Request 首次发送 48h 未响应 → 自动触发一次 gentle reminder（客户侧）
- 14 天仍未响应 → CPA Dashboard 升级为 `overdue readiness check` 标签
- CPA 可在 Settings 调整 auto-reminder 频率或关闭

### 6B.7 验收标准（T-RP-*）

| Test ID | 描述 | 预期 |
|---|---|---|
| T-RP-01 | CPA 点 `[Send readiness check]` → 客户收邮件 | Resend 送达，邮件含 magic link |
| T-RP-02 | 客户打开 link（移动端）| 页面正常渲染，无需登录，3s 内 LCP |
| T-RP-03 | 客户勾 "I have it" 提交 | CPA Dashboard 对应 obligation readiness 30s 内更新 |
| T-RP-04 | 客户点 `[? What is this?]` | AI 生成的 2 句解释 + source URL 显示 |
| T-RP-05 | 客户点 `need help` | CPA Dashboard 出现 Banner + Draft email 入口 |
| T-RP-06 | 同一 token 打开两次 | 第二次显示已提交状态 + `[Update my response]` 入口 |
| T-RP-07 | 伪造 token 访问 | 404 + 不泄露任何客户信息 |
| T-RP-08 | Token 过期后访问 | 显示 `This link has expired. Please ask Sarah for a new one.` |
| T-RP-09 | 客户提交后 CPA 的 audit log | 新增 `readiness.client_response` 事件 |
| T-RP-10 | 误发撤销 | CPA 可 `[Revoke link]`，token 立刻失效 |

### 6B.8 Demo 戏剧性

Demo Day 关键 10 秒：

1. 演示者在 Obligation Detail 点 `[Send readiness check to client]`
2. 邀请**评审员拿出手机扫屏幕上的二维码**（实际是 magic link）
3. 评审员打开页面 → 勾第一个框 → 点 Submit
4. Demo 屏幕上 CPA Dashboard 的 `readiness` 徽章**实时变色**（`Waiting` → `Ready`）
5. Audit Log 新行出现："Client responded from mobile 2s ago"

**这是 Demo Day 上最具震撼力的跨设备实时演示。File In Time 永远做不出来。**

### 6B.9 为什么 2 人天能落地（工程估算）

- 客户侧单页面：1 React route + 1 hCaptcha + 4 个 UI 组件（checkbox / textarea / confirm / expired），复用已有 shadcn ≈ **0.5 人天**
- Magic link 生成 + token 验证：复用 ICS token 逻辑 ≈ **0.3 人天**
- 数据模型 + API：3 endpoints（create / get / submit）≈ **0.5 人天**
- 邮件模板：复用 Reminder 模板框架 ≈ **0.2 人天**
- AI `[? What is this?]` 解释：复用 Deadline Tip 管线，prompt 改 3 行 ≈ **0.3 人天**
- Real-time Dashboard 更新：Polling 30s 或 Server-Sent Events ≈ **0.2 人天**

**合计 ≈ 2 人天。对 Demo 戏剧性的 ROI 极高。**

---

## 6C. 亮点模块 — Audit-Ready Evidence Package™

> ★ 差异化亮点（P1-28）· **税务行业特有的信任钩子**。
> 不是 "export CSV"，是 "**IRS 来敲门时你 90 秒交出完整合规证据包**"。这是税务 SaaS 独有的价值定位——其他行业的 AI 工具无法借鉴，也无法复制。

### 6C.1 为什么它是税务行业独有的"信任锚点"

现有税务工具的共同缺陷：**AI 决策不可审计**。

- TaxDome / Karbon：有 audit log 但无 AI 决策追溯；LLM 写的客户邮件不知道来自哪个 prompt 版本
- File In Time：桌面软件，无 provenance 概念
- Excel + Outlook：完全没有

**场景三连问**：
1. IRS 发函问："你这条 CA Franchise Tax 为什么从 Mar 15 改到 Oct 15？" → CPA 需要出示证据链
2. 客户投诉："你漏报了我的 1120-S，怎么证明是我没及时给 K-1？" → CPA 需要出示 Readiness Response 时间戳
3. E&O 保险理赔：保险公司问"事发时你在用什么工具管理 deadline？" → 需要可签名的审计快照

**DueDateHQ 的独家承诺**：
> "Every AI sentence, every deadline, every rule change is packaged into a single signed ZIP you can hand over to the IRS, a client, or your insurance adjuster in 90 seconds."

这是 Dify 评审员会立刻 GET 的——**"AI for regulated industries"的正确姿势**。

### 6C.2 使用场景

| 场景 | 触发者 | 常见导出范围 |
|---|---|---|
| IRS 调查特定客户 | Owner | 单客户 · 近 3 年 |
| 客户争议（K-1 时效、罚款归责）| Owner / Manager | 单 obligation · 全生命周期 |
| 年度 E&O 保险续保 | Owner | 全 firm · 过去一年 |
| 事务所内部复盘（漏报分析）| Manager | 时间窗口 · 含所有成员 |
| 客户主动索要（GDPR/CCPA 合规复制）| Coordinator 发起 / Owner 批准 | 单客户 · 全部 |
| DueDateHQ 退出（导出自有数据）| Owner | 全 firm · 全时间 |

### 6C.3 导出范围（Scope）

```
┌─ Export Audit-Ready Package ────────────────────────────────┐
│                                                              │
│  Scope                                                       │
│    ● Entire firm                                             │
│    ○ Single client:  [ Acme LLC ▾ ]                         │
│    ○ Single obligation:  [ Acme LLC · 1120-S 2026 ▾ ]       │
│                                                              │
│  Time range                                                  │
│    ● Last 12 months      ○ Last 3 years (IRS standard)      │
│    ○ Custom:  [2024-01-01] to [2026-04-23]                  │
│    ○ All time                                                │
│                                                              │
│  Include                                                     │
│    ☑ Obligations & rule evidence (PDF)                       │
│    ☑ Audit log (CSV)                                         │
│    ☑ AI decision ledger (prompt versions + outputs)          │
│    ☑ Regulatory Pulse history                                │
│    ☑ Migration batch records                                 │
│    ☑ Client Readiness responses                              │
│    ☑ Manifest + SHA-256 signature                            │
│                                                              │
│  Delivery                                                    │
│    ● Email download link to me (expires in 7 days)           │
│    ○ Download now (small exports only, < 50 MB)              │
│                                                              │
│                              [Cancel]    [Generate ZIP ▶]    │
└──────────────────────────────────────────────────────────────┘
```

### 6C.4 ZIP 内容清单（Manifest）

```
duedatehq-evidence-package-<firm_slug>-<timestamp>.zip
│
├─ README.pdf                              # 如何阅读这个包（IRS / 客户 / 保险可直接打开）
│
├─ manifest.json                           # 全包文件清单 + 各自 sha256
├─ signature.sig                           # 整包 SHA-256 + timestamp（future: 接 RFC 3161 TSA）
│
├─ 01_obligations/
│   ├─ summary.csv                         # 所有 obligations 概览
│   ├─ acme-llc/
│   │   ├─ 1120-S-2026.pdf                 # 复用 §7.4 Client PDF Report 生成器
│   │   ├─ ca-franchise-2026.pdf
│   │   └─ ...
│   └─ ...
│
├─ 02_audit_log/
│   ├─ events.csv                          # 全 AuditEvent 表导出（含 actor / before / after）
│   └─ events.json                         # 同内容 JSON（含 nested metadata）
│
├─ 03_ai_decisions/
│   ├─ ai_outputs.csv                      # AiOutput 全表（prompt_version / model / citations）
│   ├─ prompts/                            # git 版本化的 prompt 快照
│   │   ├─ weekly_brief.v3.md
│   │   ├─ pulse_extraction.v2.md
│   │   ├─ migration_mapper.v1.md
│   │   └─ ...
│   └─ evidence_links.csv                  # EvidenceLink 全表（含 migration normalize 决策）
│
├─ 04_regulatory_pulse/
│   ├─ pulses.csv                          # 所有 Pulse 事件
│   ├─ applications.csv                    # PulseApplication 全表
│   └─ source_snapshots/                   # 每条 Pulse 的原始抓取 HTML 快照
│       ├─ irs-ca-storm-relief-2026-04-22.html
│       └─ ...
│
├─ 05_migration/
│   ├─ batches.csv                         # MigrationBatch 历史
│   ├─ mappings.csv                        # 每次字段映射决策
│   ├─ normalizations.csv                  # 每次归一决策 + confidence
│   └─ original_inputs/                    # S3 里存过的原始 paste / CSV（按 batch 归档）
│       ├─ batch_<id>_2026-01-15.csv
│       └─ ...
│
├─ 06_client_readiness/
│   ├─ requests.csv                        # ClientReadinessRequest 全表
│   └─ responses.csv                       # ClientReadinessResponse（含时间戳 + eta_date）
│
├─ 07_rules_snapshot/
│   ├─ rules.csv                           # 导出时刻所有生效规则 + version
│   ├─ rule_chunks.csv                     # RAG 用到的 rule chunks（verbatim quote + source）
│   └─ source_urls.txt                     # 官方来源清单 + 人工 verified_at 时间戳
│
└─ 08_team/
    ├─ members.csv                         # UserFirmMembership 快照（active + suspended）
    └─ firm_profile.json                   # Firm 配置（不含 billing 信息）
```

### 6C.5 README.pdf 模板（面向非技术读者）

```
─────────────────────────────────────────────
 DueDateHQ · Audit-Ready Evidence Package
 Firm: Sarah Mitchell CPA
 Exported: 2026-04-23 14:30 UTC by sarah@firm.com
 Scope: Entire firm, last 12 months
─────────────────────────────────────────────

About this package
 This archive is a complete, cryptographically-signed
 snapshot of all tax-deadline activity in your firm as
 tracked by DueDateHQ. It was designed to be handed to
 the IRS, a client, or an insurance adjuster with no
 further processing required.

How to verify this package is untampered
 1. Open `manifest.json` — it lists every file and its
    SHA-256 hash.
 2. Open `signature.sig` — it contains the SHA-256 of
    the full manifest.json, hashed at export time.
 3. Re-compute the SHA-256 of manifest.json. It should
    match signature.sig exactly.
 4. If it matches, every file in this archive is 
    guaranteed to be identical to what was exported.

What's inside
 Section 01 · Obligations & rule evidence
   One PDF per client, containing all 2026 deadlines,
   each with its IRS/state source URL and the
   human-verified date.
 Section 02 · Audit log
   Every state change, every AI apply, every team action
   with actor, timestamp, before/after values.
 Section 03 · AI decision ledger
   For each AI output shown in the app, the prompt
   version, model, input hash, and source citations.
 Section 04 · Regulatory Pulse
   Every IRS / state bulletin ingested, plus its
   original HTML snapshot.
 Section 05 · Migration
   Every CSV import, with field mappings and
   normalization decisions (confidence scores).
 Section 06 · Client Readiness
   Every client self-service response (what they said
   was ready, when they said it).
 Section 07 · Rules snapshot
   The exact rules library at the time of export.
 Section 08 · Team
   Member list and firm configuration.

Contact
 If you need help interpreting this package, contact
 audit@duedatehq.com or the exporting CPA.

 This package was produced by DueDateHQ v2.0.
 AI-assisted. All primary sources are official URLs.
─────────────────────────────────────────────
```

### 6C.6 签名设计（不只是 SHA-256）

| 层 | 签名方式 | 用途 |
|---|---|---|
| 文件级 | 每个文件单独 SHA-256，写入 `manifest.json` | 快速验证单文件完整性 |
| 包级 | `manifest.json` 的 SHA-256 → `signature.sig` | 快速验证整包完整性 |
| 时间戳 | `signature.sig` 附带 UTC 时间戳 + DueDateHQ 私钥签名（HMAC 或 Ed25519）| 证明导出时间 + 由 DueDateHQ 产出 |
| 可选 RFC 3161 TSA | Phase 2 接第三方时间戳机构（e.g. FreeTSA）| 法律级证据链 |

**Phase 0（MVP）**：SHA-256 + 服务端私钥签名。对集训足够。  
**Phase 1**：公开签名验证工具 `verify-duedatehq.py`（一行命令校验包）。  
**Phase 2**：RFC 3161 TSA 接入 → 变成法庭可用证据。

### 6C.7 打包实现

```
User clicks [Generate ZIP]
  ↓
POST /api/audit-package
  - Role check: Owner only（§3.6.3）
  - Scope validation + time range
  ↓
Enqueue background job (Inngest / QStash)
  ↓
Worker:
  1. For each section:
     SELECT ... WHERE firm_id = :firm AND <scope> AND <time range>
     Stream to S3 multipart upload
  2. Render client PDFs (section 01) via @react-pdf/renderer
  3. Snapshot prompts/ from git repo at current SHA
  4. Compute per-file SHA-256 during stream
  5. Write manifest.json
  6. Sign manifest → signature.sig
  7. Zip everything, upload to S3
  8. Create AuditEvidencePackage DB row
     (sha256_hash, s3_key, expires_at = now + 7d)
  9. Send email to requester with signed download URL
     (pre-signed, expires in 7d, single-use)
  ↓
Audit event: `evidence_package.exported`
  metadata: { scope, time_range, file_count, sha256, expires_at }
```

**性能：**
- 全 firm 1 年的导出：100 客户 × 10 obligations × 5KB PDF ≈ 5 MB；加审计日志 50k 条 ≈ 10 MB；加 Pulse source snapshots ≈ 20 MB。典型 **30–50 MB**。
- 后台处理时间：≤ 30s（worker 单任务）
- 用户感知：立即 Toast "Your package is being prepared. Email will arrive within 2 minutes."

### 6C.8 权限与合规

- **仅 Owner 可导出全 firm 包**（§3.6.3 RBAC）
- Manager 可导出：单客户 / 单 obligation / 自己 actor 相关的审计
- Preparer / Coordinator 不可导出（避免数据泄露风险）
- 每次导出写 `AuditEvent(action='evidence_package.exported')`——**这个事件本身也会出现在下次导出的 section 02 里**（递归留痕）
- 下载链接：S3 pre-signed URL 7 天过期，单次使用后失效
- 邮件附下载链接 + **下载密码**（短信 / OTP 验证 2FA，防邮箱劫持）
- PII：ZIP 内容含客户数据，受 firm 合规策略约束；Firm 可在 Settings 选择"ZIP 内 EIN / 客户姓名自动匿名化"（用于内部复盘 / GDPR 请求）

### 6C.9 验收标准（T-AE-*）

| Test ID | 描述 | 预期 |
|---|---|---|
| T-AE-01 | Owner 点 Generate ZIP (firm scope, 12mo) | 2 分钟内收到邮件 + 链接 |
| T-AE-02 | 下载 ZIP 解压 | 目录结构与 §6C.4 manifest 一致，README.pdf 可打开 |
| T-AE-03 | 随机改动 ZIP 内一个文件 | manifest.json 的 SHA-256 不再匹配，验证脚本报错 |
| T-AE-04 | 验证 signature.sig | 与 manifest.json 的 SHA-256 匹配 |
| T-AE-05 | 单客户 scope 导出 | 只含该客户的 obligations / audit / readiness，其他客户不泄露 |
| T-AE-06 | Manager 尝试全 firm 导出 | 403 Forbidden + 引导到单客户选项 |
| T-AE-07 | 导出事件本身出现在下一次导出的 audit log | ✓（递归留痕）|
| T-AE-08 | 链接 7 天后访问 | 410 Gone + 提示重新生成 |
| T-AE-09 | 链接被多次使用 | 首次成功，第二次起 410（single-use）|
| T-AE-10 | 导出后 firm 删除 | 包不随 firm 删而失效（由 S3 lifecycle 独立管理）|

### 6C.10 Demo 戏剧性（与 §15.3.6 联动）

Demo 结尾 10 秒：

```
Presenter: "Last thing. Let's say the IRS calls tomorrow and asks 
about Acme LLC. Watch."

[Settings → Export Audit-Ready Package → Scope: Acme LLC → 12 months]

Presenter: "One click."

[Toast: "Your package is being prepared. Email will arrive in 
~30 seconds."]

[Switch to email inbox (pre-cached tab), email already arrived]
[Click download → ZIP opens → README.pdf shows]

Presenter: "Inside this ZIP: every obligation, every source URL, 
every AI decision with prompt version, every client response with 
timestamp, all SHA-256 signed. The IRS can verify it hasn't been 
tampered with."

[Open manifest.json in text editor, scroll 500 lines of sha256 hashes]

Presenter: "Every other tax tool makes you build this in Excel 
when the IRS comes. We make it a button. That's why CPAs will 
switch."
```

**为什么这一段无敌：** 这不是功能 demo，这是**产品哲学 demo**。评审官前面记住了"游戏化顶栏的 $31,400"，结尾记住了"审计级的信任"——两个记忆点串成了"从赚钱到保命"的完整叙事。

### 6C.11 工程估算

- ZIP 打包 worker（Node stream + archiver）≈ **0.5 人天**
- Manifest + SHA-256 计算（流式）≈ **0.3 人天**
- Section 01 PDF batch（复用 §7.4）≈ **0.2 人天**
- Section 02–08 的 CSV 导出（复用现有 query）≈ **0.5 人天**
- README.pdf 生成 + signature.sig 签名 ≈ **0.3 人天**
- S3 pre-signed URL + 邮件 + 过期管理 ≈ **0.2 人天**

**合计 ≈ 2 人天。** 对"AI for regulated industries"叙事的 ROI 极高，Dify 评审员精准击中。

### 6C.12 数据模型（已在 §8.1 声明）

见 §8.1 `AuditEvidencePackage` 表。

---

## 7. 其他核心功能规格

### 7.1 Reminders（P0-21 / P0-22）

#### 7.1.1 阶梯规则

| 触发日 | 渠道 | 内容 |
|---|---|---|
| due - 30d | Email | 温和提醒 + 建议动作 + source link |
| due - 7d | Email + In-app | 紧急提醒 + Penalty $ |
| due - 1d | Email + In-app | 最后提醒 |
| overdue | In-app daily | 红色警示 |

#### 7.1.2 模板（含上下文）

```
Subject: [DueDateHQ] Acme LLC — CA Franchise Tax due in 7 days

Hi Sarah,

Here's your 7-day reminder:

  Client:       Acme LLC
  Form:         CA Form 3522 (Franchise Tax)
  Due date:     March 15, 2026
  Days left:    7
  $ at risk:    $4,200 if missed 90 days
  Status:       Waiting on client
  Source:       CA FTB Publication 3556
                https://ftb.ca.gov/forms/misc/3556.html
  Verified by DueDateHQ on 2026-04-12.

[Open in DueDateHQ]   [Mark as handled]   [Snooze reminders]

AI-assisted. Verify with official sources.
```

#### 7.1.3 Team 路由规则（§3.6 Gap 4）

| 通知类型 | 默认收件人（Solo）| 默认收件人（Team）|
|---|---|---|
| **Reminder 30d** | Owner | Assignee（未分派 fallback 到 default_assignee）|
| **Reminder 7d** | Owner | Assignee + cc Owner |
| **Reminder 1d** | Owner | Assignee + cc Owner + cc Manager |
| **Overdue（每日）** | Owner | Owner + Manager（即便 assignee 为空也升级）|
| **Weekly Brief 邮件（Mon 8am）** | Owner | **每人一份**（按 `scope=me` 过滤生成），Owner / Manager 收 Firm-wide 版；Preparer 收 My work 版；Coordinator 收简化版（无 $）|
| **In-app 未读计数** | Owner | **per-user**（bell icon 只计自己的）|

#### 7.1.4 用户偏好

Settings → Notifications：
- 全局开关
- 按渠道开关（Email / In-app）
- 按类型开关（Reminders / Pulse / Weekly Brief）
- Pulse 通知不可关闭（法定级），但可切 Daily Digest
- **Manager 额外选项**：`Subscribe to all firm Pulse alerts`（订阅全量 Firm Pulse，默认关）
- **Manager / Owner 额外选项**：`Receive reminders for unassigned obligations`（默认开）

### 7.2 Status & Readiness 状态机（P0-16）

```
Status:
  not_started → in_progress → (filed | paid | extended | not_applicable)
  + waiting_on_client (subflow)
  + needs_review (quality gate)

Readiness (independent of status):
  ready / waiting_on_client / needs_review
  
Extension Decision (P1-9):
  not_considered / applied / rejected
```

### 7.3 Extension Decision Panel（P1-9 · 场景 C）

```
┌─ Extension decision · Acme LLC · 1120-S ──────────┐
│                                                    │
│  Current situation                                 │
│    Due: Mar 15 · 5 days                            │
│    Readiness: Waiting on K-1                       │
│    $ at risk if missed: ~$2,800                    │
│                                                    │
│  Extension (Form 7004)                             │
│    New filing due: Sep 15 (+6 months)              │
│    Payment still due Mar 15 (no extension of $)    │
│    Source: IRS Pub 7004                            │
│                                                    │
│  What-If Simulator                                 │
│    ○ File on time        $0 penalty                │
│    ● Extend + pay est.   $0 penalty (recommended)  │
│    ○ Extend + no pay     $21/mo interest           │
│    ○ Miss both           $210/mo × 5 = $1,050 max  │
│                                                    │
│  [Apply extension]   [Cancel]                      │
└────────────────────────────────────────────────────┘
```

### 7.4 Client PDF Report（P1-10 · VPC Medium）

一客户一份 PDF（也可单 obligation 生成），Letter 尺寸：

```
─────────────────────────────────────────
 DueDateHQ · Tax Deadlines for Acme LLC
 Prepared by Sarah Mitchell, CPA · 2026-04-23
─────────────────────────────────────────

Next 90 days                    3 items · $4,200 at risk
───────────────────────────────────────
Mar 15   CA Franchise Tax — $800 min       $4,200 at risk
          Source: CA FTB Pub 3556 · verified 2026-04-12
Apr 15   Form 1120-S                        $2,100 at risk
          Source: IRS Publication 509
Jun 15   Q2 Estimated Tax (Federal)         $  800 at risk
───────────────────────────────────────
Full year 2026 calendar  ………………  (table view)

Notes & assumptions
 • Exposure amounts are estimates based on IRC §6651 formulas.
 • Not tax advice. See your CPA for decisions.

Every item in this report has a source link.
Verified by DueDateHQ Glass-Box engine as of 2026-04-23.
─────────────────────────────────────────
```

**实现：**
- 入口：Client Detail → `Export PDF`；Workboard bulk `Export selected as PDF`
- 技术：`@react-pdf/renderer`，S3 存储，邮件链接 24h 过期
- 不嵌入 AI narrative；只嵌入 **已 human-verified 的 rule + penalty 数字**（避免把 LLM 幻觉送客户）
- 每条 obligation 右下 QR 码回链到在线 Evidence Mode

### 7.5 Penalty Radar™（P0-18 · 跨页面）

#### 7.5.1 为什么必须做

CPA 的脑回路："客户会怪我什么？" → 怪你让他多交了钱。DueDateHQ 把风险单位从"天数"换成"美元"，直接对接 CPA 的职业恐惧。

#### 7.5.2 美元敞口计算（纯函数 · 零幻觉 · 融合两份 PRD）

```typescript
// Formulas from IRS IRC §6651 + public state statutes.
function estimateExposure(o: ObligationInstance, c: Client): ExposureReport {
  const months_late = monthsBetween(o.current_due_date, today);
  
  // Federal
  const failure_to_file = min(0.05 * months_late, 0.25) * o.estimated_tax_due;
  const failure_to_pay  = min(0.005 * months_late, 0.25) * o.estimated_tax_due;
  const interest        = months_late * (AFR_SHORT_TERM / 12) * o.estimated_tax_due;
  
  // State surcharge lookup (§7.5.3)
  const state_surcharge = lookupStatePenalty(o.state, o.tax_type, o.estimated_tax_due, months_late);
  
  // Per-partner / per-shareholder (1065 / 1120-S)
  const per_partner = (o.tax_type === 'federal_1065' || o.tax_type === 'federal_1120s')
    ? 245 * min(months_late, 12) * (c.num_partners || 1)
    : 0;
  
  const total = failure_to_file + failure_to_pay + interest + state_surcharge + per_partner;
  
  return {
    failure_to_file, failure_to_pay, interest, state_surcharge, per_partner,
    total,
    assumptions: [
      `estimated_tax_due = $${o.estimated_tax_due} (source: ${o.estimated_tax_due_source})`,
      `AFR_SHORT_TERM = ${AFR_SHORT_TERM * 100}% (source: IRS Rev Rul 2026-xx)`,
    ],
    source_urls: [
      'https://www.irs.gov/publications/p17',  // IRC §6651
      stateSourceUrl(o.state, o.tax_type),
    ],
    confidence: o.estimated_tax_due_source === 'user_entered' ? 'high' : 'industry_median',
  };
}
```

#### 7.5.3 计算表（硬编码、官方规则）

| 表单 | 基础规则 | Liability 来源 | 覆盖 |
|---|---|---|---|
| 1040 | 5%/mo FTF + 0.5%/mo FTP | `estimated_tax_liability`（可选，无则返回 `needs_input`）| ✓ |
| 1065 | $245/partner/mo × up to 12 | `num_partners` | ✓ |
| 1120-S | $245/shareholder/mo × up to 12 | `num_shareholders` | ✓ |
| 1120 | 5%/mo FTF + 0.5%/mo FTP | `estimated_tax_liability` | ✓ |
| CA Franchise Tax | $800 min + 5%/mo | 固定 | ✓ |
| NY PTET / CT-3-S | 查 rule.penalty_formula | 按表单 | ✓ |
| TX Franchise Tax | 5% 1-30d / 10% > 30d late | 按 revenue | ✓ |
| FL F-1120 | 10% base + 5%/mo | 按 liability | ✓ |
| WA B&O | 5% base + 1%/mo | 按 B&O tax due | ✓ |
| MA Form 1 | 1%/mo FTF + 1%/mo FTP | 按 liability | ✓ |
| 命中不了 | 返回 `null`，UI 不显示胶囊 | — | — |

#### 7.5.4 UI 呈现

- **Dashboard 顶栏聚合**：`This week: $X at risk` + up/down 箭头 + 上周对比
- **每条 TriageCard / Workboard 行**：`$X at risk` 胶囊，hover 显示细分
- **What-If Simulator**（P1-9 配套）：滑块 30 / 60 / 90 / 180 天 → 实时敞口曲线
- **"Needs input" 降级**：未填 `estimated_tax_liability` 时，胶囊显示 `needs input` 而非 `$0`，点击打开 Edit 对话框

#### 7.5.5 用户覆盖

CPA 可手动覆盖某条 obligation 的 `estimated_tax_liability`，写 `audit_event(action='penalty.override', before, after)`。

#### 7.5.6 ★ Scoreboard 游戏化规格（集训记忆钩子）

> 所有组都会做美元敞口数字。本节规定**怎么把它做成"赌场分数面板级别"**的视觉体验——让评审官 2 小时看 20 组 Demo 后仍记得这一个数字。

##### 7.5.6.1 顶栏 Hero 视觉规格

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│        $31,400    at risk this week                          │
│   ─────────────                                              │
│        ▲ up $3,100 vs last week  ·  trending ↗               │
│                                                              │
│   🔴 Critical (3)   🟠 High (7)   🟡 Upcoming (12)            │
│                                                              │
│   [ This Week ▾ ]  [ Sparkline of last 8 weeks — 📊 ]        │
└──────────────────────────────────────────────────────────────┘
```

| 元素 | 规格 |
|---|---|
| 金额数字 | **76px** JetBrains Mono **Bold** / `tabular-nums`（等宽对齐）/ 字间距 -0.02em |
| 金额颜色 | $10k+ = Ruby `#EF4444` / $1k–10k = Amber `#F59E0B` / <$1k = Emerald `#10B981` / $0 = 灰 `#8a8a8a` + 🎉 icon |
| 单位后缀 | `at risk this week` — 13px Inter Medium slate 灰 |
| 对比行 | `▲ up $3,100 vs last week` — 箭头随趋势变色 / 字号 14px |
| 趋势箭头 | ↗ 红 `#EF4444`（总额在升）/ ↘ 绿 `#10B981`（总额在降）/ → 灰（持平 ±5%）|
| Sparkline | 过去 8 周 mini line chart，hover 显示每周数字 |
| 周期切换 | `This Week / This Month / All Open / Custom Range` 下拉，URL 持久化 |

##### 7.5.6.2 数字滚动动画（"Odometer Roll"）

触发：任意导致聚合 $ 变化的操作。

```typescript
// Framer Motion / react-spring 实现 · rAF-based tween
function animateCounter(from: number, to: number) {
  const duration = Math.min(800, Math.abs(to - from) / 5);  // 最长 0.8s
  const easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)';       // 弹性收尾
  // 每 16ms 刷新一次，每位数字独立 tween，像老虎机滚动
}
```

**关键细节：**
- 每一位数字独立滚动（千位、百位、十位、个位**错峰到位** ≈ 80ms stagger）
- 数字下降（减少敞口）= 柔和 odometer 滚动
- 数字上升（增加敞口）= 同滚动 + 轻微红色短促 shake（200ms，±2px x 轴）
- Live Genesis 时：**粒子动画** `+$4,200` `+$2,800` `+$1,650` 从每张新生成的 deadline 卡片**弧线飞入顶栏**，消失瞬间顶栏数字对应增长

##### 7.5.6.3 状态变化反馈（"Score Pop")

```
事件                         视觉反馈
──────────────────────────────────────────────────────────────
Mark Filed / Paid            顶栏 -$X，绿色 halo pulse（800ms）
                            + 卡片淡出 + 短音效 "chime"（可选）
Mark Extended                 顶栏 -$X，琥珀色 halo
Pulse Batch Apply (20 条)    顶栏 -$Y（总），琥珀 + 绿混合脉冲
Import（Live Genesis）       顶栏 从 0 奔跑到 final，粒子雨
New overdue（定时任务）      顶栏 +$Z，红色短促 shake + 
                            顶栏短暂显示 `+$Z overdue` banner 3s
```

所有动效**尊重 `prefers-reduced-motion`**：系统设置 reduce 时退化为瞬时切换 + 文字 toast。

##### 7.5.6.4 Milestone 庆祝（Confetti · 稀缺性设计）

这是 Scoreboard 的情感高点。必须稀缺，否则就变成噪音。

| Milestone | 触发条件 | 庆祝形式 |
|---|---|---|
| 🎯 **Zero Week** | 本周 $ at risk 从正数降到 $0 | 全屏 canvas-confetti 彩带 + 顶栏 🎉 icon 替换数字 + Toast `Zero risk this week. Nicely done.` |
| 🏆 **Streak +3 Weeks** | 连续 3 个自然周 Zero Week | 徽章永久加到 Profile + 弱化版彩带 |
| 💪 **Big Drop** | 单次操作使 $ 减少 > $10,000 | 半屏 confetti + Toast `$10k+ wiped in one move.` |
| 🔥 **Firm Best** | 本周总额低于 firm 历史同期最低 | Sparkline 上 firm-best 线位置高亮 + 弱庆祝 |

**每周最多展示 1 次全屏 confetti，避免滥情。** Settings 可关闭庆祝（"Focus mode"）。

##### 7.5.6.5 Scoreboard Feed（类 Strava Activity Feed）

顶栏旁边可折叠的小侧栏（P1），显示本周已完成的"杀分数"动作：

```
This week's wins
────────────────
✓ 14:32  Acme LLC · CA Franchise filed            −$4,200
✓ 11:08  Bright Studio · 1120-S extended          −$2,800
✓ 09:41  12 clients · CA storm relief applied     −$6,500
✓ Mon    Zen Holdings · Q1 Est. paid              −$1,650
────────────────
Total this week: −$15,150
```

- 每条是一次"减分动作"带时间戳 + 操作者（Team 版显示 actor）
- 点任一条 → 打开对应 Obligation / Pulse Detail
- Weekly Summary 邮件周一 8am 把本 feed 发 Owner（"Here's what your firm crushed last week"）

##### 7.5.6.6 响应式与移动端

| Breakpoint | 金额字号 | 布局 |
|---|---|---|
| ≥1280px | 76px | 顶栏 Hero 横排 + Sparkline 右侧 |
| 1024–1279 | 64px | 同上 + Sparkline 下折 |
| 768–1023 | 52px | Sparkline 收折入 hover tooltip |
| <768 | 44px + 缩写 `$31.4k` | 对比行收折入点击展开 |

##### 7.5.6.7 无障碍

- 每次数字变化触发 `aria-live="polite"` 通告：`Penalty radar updated to thirty-one thousand four hundred dollars`
- 彩带动画全程非阻塞（`pointer-events: none`）
- 庆祝有"关闭动效"偏好 + 纯文本 toast 备份

##### 7.5.6.8 工程估算

- 核心 Odometer 滚动：`react-odometerjs` 或手写 ≈ 0.3 人天
- 状态反馈 halo / shake：Tailwind 动画 class + Framer Motion ≈ 0.4 人天
- Live Genesis 粒子：CSS keyframes + 5 个 div 粒子预计 ≈ 0.5 人天
- Confetti：`canvas-confetti` 现成库 ≈ 0.1 人天
- Scoreboard Feed：复用 AuditEvent 查询 ≈ 0.3 人天

**合计 ≈ 1.5 人天。投入产出比在整份 PRD 里 Top 3。**

##### 7.5.6.9 Demo Day 的使用（与 §15.3 联动）

- **90–180s 段** Live Genesis：粒子飞入是"入场秀"
- **Mark Filed 那一下**：-$4,200 + 绿色 pulse = 评审官脑内的"多巴胺瞬间"
- **Pulse Batch Apply 那一下**：-$6,500 + 琥珀脉冲 = "这个工具是有魔力的"感知

这三下组合在一起，就是"赌场分数面板"的叙事闭环。

### 7.6 Cmd-K 命令面板（P1-14）

三合一：

```
┌─ Cmd-K ─────────────────────────────────────────┐
│  [Search] [Ask ✨] [Navigate]                    │
├──────────────────────────────────────────────────┤
│  Search:                                         │
│    > acme                                        │
│    Clients: Acme LLC · Acme Industries          │
│    Obligations: Acme LLC — CA Franchise · 3d    │
│    Rules: CA Franchise Tax Rule v3.2            │
│                                                  │
│  Ask ✨:                                         │
│    > Which clients owe CA PTE this month?       │
│                                                  │
│  Navigate:                                       │
│    > import                                      │
│    Import clients → Paste / Upload / Preset     │
│    Settings → Imports History                    │
└──────────────────────────────────────────────────┘
```

### 7.7 Keyboard Shortcuts（P1-15）

| 键 | 动作 | 范围 |
|---|---|---|
| `?` | 显示所有快捷键 | 全局 |
| `Cmd/Ctrl + K` | 命令面板 | 全局 |
| `Cmd/Ctrl + E` | Evidence Mode for selected | 全局 |
| `/` | 聚焦 Ask 输入框 | 全局 |
| `J / K` | 上下行 | Workboard / Lists |
| `Enter` | 打开详情 | Workboard |
| `E` | 展开 Evidence | 列表 |
| `F` | Mark Filed | 列表 |
| `X` | Mark Extended | 列表 |
| `I` | Mark In progress | 列表 |
| `W` | Mark Waiting on client | 列表 |
| `G then D` | 跳 Dashboard | 全局 |
| `G then W` | 跳 Workboard | 全局 |
| `G then C` | 跳 Clients | 全局 |
| `G then A` | 跳 Alerts | 全局 |

---

## 8. 数据模型

### 8.1 核心实体

```
Firm (tenant)
  id, name, slug, timezone, plan (solo/firm/pro),
  seat_limit,                        -- derived from plan (1/5/10)
  owner_user_id,                     -- FK to User，转让时修改
  default_assignee_strategy,         -- owner | round_robin | none
  coordinator_can_see_dollars,       -- bool, default false
  created_at, deleted_at             -- soft delete with 30d grace

User (identity, email-unique)
  id, email, display_name,
  mfa_enabled, last_login_at,
  default_firm_id,                   -- last-used firm for login redirect
  created_at, deleted_at             -- GDPR 软删

UserFirmMembership (多对多 · P1 启用, P0 预留)
  id, user_id, firm_id,
  role (owner|manager|preparer|coordinator),
  status (active|invited|suspended|left),
  invited_by_user_id, invited_at, accepted_at, suspended_at, left_at,
  last_active_at,
  notification_prefs_json             -- per-membership 通知偏好

TeamInvitation
  id, firm_id, invited_email, role,
  invite_token (signed), expires_at,
  invited_by_user_id, accepted_at, revoked_at, created_at

Client
  id, firm_id, name, 
  ein,                               -- NEW: "##-#######" format
  entity_type, state, county, 
  tax_types[],                       -- nullable, fallback to Default Matrix
  importance (high/med/low),
  num_partners, num_shareholders,    -- for Penalty per-partner calc
  estimated_tax_liability,           -- optional, for Penalty Radar
  assignee_id, email, notes,
  migration_batch_id                 -- nullable, for Revert

ObligationRule
  id, jurisdiction, entity_applicability[], tax_type, form_name,
  due_date_logic (DSL/json),
  extension_policy, is_payment, is_filing,
  penalty_formula,                   -- NEW: for Penalty Radar
  default_tip,                       -- fallback for Deadline Tip
  source_url, statutory_ref, verbatim_quote,
  verified_by, verified_at, next_review_at,
  version, coverage_status (full/skeleton/manual), active

ObligationInstance
  id, firm_id, client_id, rule_id, rule_version,
  tax_year, period,
  original_due_date, current_due_date,
  filing_due_date, payment_due_date,
  status, readiness, extension_decision,
  estimated_tax_due, estimated_exposure_usd,
  assignee_id, notes,
  migration_batch_id,
  created_at, updated_at, last_changed_by

EvidenceLink (核心 provenance 表)
  id, 
  obligation_instance_id | ai_output_id,
  source_type (rule | pulse | human_note | ai_migration_normalize | 
               ai_migration_map | default_inference_by_entity_state | 
               pulse_apply | penalty_override),
  source_id, source_url, verbatim_quote,
  raw_value, normalized_value,       -- for migration
  confidence, model,                 -- for AI decisions
  matrix_version,                    -- for default inference
  verified_at, verified_by,
  applied_at, applied_by

Pulse
  id, source, source_url, raw_content, published_at,
  ai_summary, verbatim_quote,
  parsed_jurisdiction, parsed_counties[], 
  parsed_forms[], parsed_entity_types[],
  parsed_original_due_date, parsed_new_due_date,
  parsed_effective_from, confidence,
  status (pending_review | approved | applied | rejected),
  reviewed_by, reviewed_at,
  requires_human_review

PulseApplication
  id, pulse_id, obligation_instance_id, client_id, firm_id,
  applied_by, applied_at, reverted_at,
  before_due_date, after_due_date

AiOutput
  id, firm_id, user_id, kind (brief | tip | summary | ask_answer),
  prompt_version, model, input_context_ref,
  output_text, citations[], generated_at, tokens_in, tokens_out, cost_usd

AuditEvent
  id, firm_id, actor_id, entity_type, entity_id,
  action (status.change | pulse.apply | pulse.revert | 
          migration.import | migration.revert | penalty.override |
          rule.updated),
  before_json, after_json, reason, created_at

Reminder
  id, obligation_instance_id, channel (email | in_app),
  offset_days, sent_at, clicked_at

MigrationBatch
  id, firm_id, user_id, source (paste | csv | preset_name),
  raw_input_ref,                     -- S3 key of original paste/csv
  mapping_json,                      -- final column → field mapping
  row_count, success_count, skipped_count,
  preset_used,                       -- nullable
  ai_global_confidence,
  status (draft | mapping | reviewing | applied | reverted | failed),
  created_at, applied_at, reverted_at, revert_expires_at

MigrationMapping
  id, batch_id, source_column, target_field,
  confidence, reasoning, sample_transformed,
  user_overridden (bool)

MigrationNormalization
  id, batch_id, field, raw_value, normalized_value,
  confidence, model, reasoning

MigrationError
  id, batch_id, row_index, raw_row_json,
  error_code, error_message

IcsToken  -- P1-11
  id, firm_id, token, created_at, revoked_at

LlmLog
  id, firm_id, user_id, prompt_version, input_tokens, output_tokens,
  latency_ms, cost_usd, success, error_msg, created_at

SavedView (P1-16)
  id, firm_id, owner_user_id,
  name, scope (personal|shared),      -- Personal 仅 owner_user_id 可见；Shared Firm 内共享
  filters_json, columns_json, sort_json,
  created_at, updated_at

ClientReadinessRequest (P1-26 · §6B)
  id, firm_id, obligation_instance_id, client_id,
  items_json,                         -- [{label, description, ai_explanation_url, status}]
  magic_link_token (signed, ≥32 bytes, rotatable),
  delivery_channel (email|sms_link|both),
  sent_to_email, sent_by_user_id,
  sent_at, expires_at (default +14d),
  first_opened_at, last_responded_at, response_count,
  status (pending|partially_responded|fully_responded|expired|revoked),
  revoked_at, revoked_by_user_id,
  auto_reminder_sent_at

ClientReadinessResponse (P1-26 · §6B)
  id, request_id,
  item_index, status (ready|not_yet|need_help),
  client_note, eta_date (nullable),
  submitted_at, ip_hash, user_agent_hash  -- anonymized for anti-abuse

AuditEvidencePackage (P1-28 · 合规 ZIP 导出)
  id, firm_id, exported_by_user_id, scope (firm|client|obligation),
  scope_entity_id,
  range_start, range_end,
  file_count, file_manifest_json, sha256_hash,
  s3_key, expires_at (default +7d),
  created_at

Event (analytics)
  id, firm_id, event_name, props (jsonb), created_at
```

### 8.2 关键索引（S1-AC3 < 1s 响应保障）

```sql
-- Dashboard / Workboard 核心查询
CREATE INDEX idx_obligation_firm_due ON obligation_instance (firm_id, current_due_date);
CREATE INDEX idx_obligation_firm_status_due ON obligation_instance (firm_id, status, current_due_date);
CREATE INDEX idx_obligation_firm_tax_due ON obligation_instance (firm_id, tax_type, current_due_date);
CREATE INDEX idx_obligation_firm_assignee_due ON obligation_instance (firm_id, assignee_id, current_due_date);

-- Pulse 匹配
CREATE INDEX idx_client_firm_state ON client (firm_id, state);
CREATE INDEX idx_client_firm_state_county ON client (firm_id, state, county);
CREATE INDEX idx_client_firm_entity ON client (firm_id, entity_type);

-- Migration Revert
CREATE INDEX idx_client_batch ON client (migration_batch_id);
CREATE INDEX idx_obligation_batch ON obligation_instance (migration_batch_id);

-- Evidence Mode
CREATE INDEX idx_evidence_obligation ON evidence_link (obligation_instance_id);
CREATE INDEX idx_evidence_source ON evidence_link (source_type, source_id);

-- Pulse feed
CREATE INDEX idx_pulse_status_published ON pulse (status, published_at DESC);

-- Audit / history
CREATE INDEX idx_audit_firm_created ON audit_event (firm_id, created_at DESC);
CREATE INDEX idx_migration_firm_created ON migration_batch (firm_id, created_at DESC);

-- Vector search
CREATE INDEX idx_rule_chunks_embedding ON rule_chunks USING ivfflat (embedding vector_cosine_ops);

-- Team / Membership (P1)
CREATE UNIQUE INDEX idx_membership_user_firm ON user_firm_membership (user_id, firm_id);
CREATE INDEX idx_membership_firm_status ON user_firm_membership (firm_id, status);
CREATE UNIQUE INDEX idx_invitation_token ON team_invitation (invite_token) WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX idx_invitation_firm_email ON team_invitation (firm_id, invited_email) WHERE accepted_at IS NULL;

-- My work scope
CREATE INDEX idx_obligation_firm_assignee_scope ON obligation_instance (firm_id, assignee_id, current_due_date) 
  WHERE status NOT IN ('filed','paid','not_applicable');

-- Firm-wide audit log page
CREATE INDEX idx_audit_firm_actor_created ON audit_event (firm_id, actor_id, created_at DESC);
CREATE INDEX idx_audit_firm_action_created ON audit_event (firm_id, action, created_at DESC);

-- Client Readiness Portal (P1-26)
CREATE UNIQUE INDEX idx_readiness_token ON client_readiness_request (magic_link_token) 
  WHERE revoked_at IS NULL AND status NOT IN ('expired');
CREATE INDEX idx_readiness_obligation ON client_readiness_request (obligation_instance_id, sent_at DESC);
CREATE INDEX idx_readiness_firm_status ON client_readiness_request (firm_id, status, expires_at);

-- Audit-Ready Evidence Package (P1-28)
CREATE INDEX idx_audit_package_firm_created ON audit_evidence_package (firm_id, created_at DESC);
CREATE INDEX idx_audit_package_expires ON audit_evidence_package (expires_at) WHERE expires_at > NOW();

-- Penalty Scoreboard weekly aggregation (P0-18 + §7.5.6)
CREATE INDEX idx_obligation_firm_week_exposure ON obligation_instance 
  (firm_id, date_trunc('week', current_due_date), estimated_exposure_usd)
  WHERE status NOT IN ('filed','paid','not_applicable');
-- 支持 "This week $X at risk" 聚合 + Sparkline 8 周趋势
```

---

## 9. AI 架构（Clarity Engine 细节）

见 §6.2 完整描述。本节补充：

### 9.1 模型选型

| 任务 | 首选模型 | 备选 | 理由 |
|---|---|---|---|
| Embedding | OpenAI `text-embedding-3-small` | Anthropic Voyage | 成本 / 够用 |
| 快速任务（Tip / Mapper） | GPT-4o-mini | Claude Haiku | 延迟 + 成本 |
| 高质量（Brief / Pulse Extract） | GPT-4o | Claude Sonnet 4.5 | 准确度 |
| 模型网关 | LiteLLM | — | 方便切换 |

### 9.2 Fallback 矩阵

| 失败场景 | 降级行为 |
|---|---|
| LLM API 超时 | 显示上次缓存 + 警示条 `AI temporarily unavailable` |
| Citation 校验失败 | 重试 1 次；仍失败 → 显示 refusal template |
| Retrieval 为空 | refusal：`I don't have a verified source for this` |
| 置信度 < 0.5（Pulse） | 保持 `pending_review`，不进 Feed |
| Mapping 置信度 < 0.5 | UI 强制用户手动选字段 |

### 9.3 Zero Data Retention

- 采用 OpenAI ZDR endpoint 或 Azure OpenAI
- Prompt 明示 `"Do not retain any data seen for training"`
- PII 占位符替换后才进 LLM，post-processing 回填
- 所有 LLM 调用入 `llm_logs`（含 input hash 但不含 raw input）

---

## 10. UI / UX 规范

### 10.1 视觉语言

- **字体**：Inter（正文）+ JetBrains Mono（数字 / 日期 / 金额 / 规则 ID / 官方 URL）
- **主色**：Deep Indigo `#1E1B4B`（权威）+ Electric Emerald `#10B981`（安全）+ Amber `#F59E0B`（风险）+ Ruby `#EF4444`（危急）
- **AI Accent**：linear gradient `from-indigo-500 via-violet-500 to-fuchsia-500`，AI 生成内容统一浅紫渐变细边框 + ✦ 图标
- **暗黑模式**：一等公民（税季凌晨 2 点友好），与浅色同开发量
- **圆角**：组件 8px，大卡片 16px
- **密度**：默认 Comfortable；Compact（给 File In Time 用户）；Spacious（给 demo）
- **动效**：< 200ms；Penalty Radar 数字滚动 / Pulse 卡片脉冲高亮 / Live Genesis 涌出动画

### 10.2 关键组件

- **TriageCard**：左侧色条（red/amber/gray）+ 倒计时徽章 + 底部 status pill
- **AIHighlight**：浅紫渐变边框 + ✦ + 右上 `Verify`
- **SourceBadge**：`🔗 CA FTB · ✓ Human verified · last checked 2d ago` — 信任符号
- **RadarStrip**：首页顶部 sticky，gray 默认 / red pulse 有新 alert
- **CommandPalette**（Cmd-K）：搜索 + Ask + 跳转
- **PenaltyPill**：`$X at risk` 胶囊 + hover 分解
- **EvidenceChip**：任意 `[n]` 索引，hover 0.5s 弹迷你来源卡，click 展开 Evidence Mode

### 10.3 交互原则

1. **一切可操作物体都应有键盘快捷键**（`?` 列出全部）
2. **状态切换零 modal**：单击 pill 即改，500ms undo toast
3. **Skeleton loader**，不 spinner
4. **Optimistic UI**：本地先更新，失败再回滚 + toast
5. **Dark mode 跟随系统**
6. **空状态有价值**：空 Radar 写 "We're watching IRS + 5 state authorities for you. Last check 3 min ago."
7. **Copy as citation block**：复制"内容 + 来源 + 验证时间戳"（CPA 杀手锏）

### 10.4 无障碍（WCAG 2.2 AA）

- 色盲友好的风险色 + 双编码（颜色 + 图标）
- 键盘完整可达，焦点可见
- ARIA landmarks
- AI 输出 `lang="en"` 声明

### 10.5 响应式

- Desktop (≥ 1280px)：三栏
- Laptop (1024–1279)：两栏
- Tablet (768–1023)：单栏 + 可折叠侧栏
- Mobile (< 768)：只读优先 + Dashboard 顶三段 + Workboard 简化卡片

---

## 11. 信息架构

```
App (after login)
 ├─ Dashboard (Home)                         ← Story S1 主屏
 ├─ Workboard                                ← 高密度表格
 ├─ Clients
 │   ├─ List (table)
 │   ├─ + Add clients ▾
 │   │    ├─ Import file / Paste  ← Migration 入口
 │   │    └─ Add one
 │   └─ Client Detail (drawer)
 │       ├─ Profile  (with EIN)
 │       ├─ Obligations (timeline)
 │       ├─ AI Risk Summary
 │       ├─ Audit
 │       ├─ Documents (P1)
 │       └─ [Export PDF]                     ← Client PDF Report
 ├─ Alerts (Regulatory Pulse)                ← Story S3
 ├─ Rules (read-only + penalty_formula)
 ├─ Team Workload (P1 · Owner/Manager only)  ← §3.6.7
 ├─ Audit Log (P1 · Firm-wide, Owner/Manager)← §3.6 + §13.2
 ├─ Reports (P1)
 ├─ Cmd-K
 │   ├─ Search
 │   ├─ Ask ✨
 │   └─ Navigate
 ├─ Firm Picker (top-right · 多 Firm membership 时显示)  ← §3.6.4
 └─ Settings
     ├─ Profile (per-user)
     ├─ Notifications (per-user, 含 Team 路由偏好 §7.1.4)
     ├─ Imports (history + Undo)             ← Migration 回溯
     ├─ Ask History
     ├─ ICS Calendar Feed                    ← P1 订阅链接
     ├─ Priority weights (Pro only, Owner)
     ├─ Team (P1 · Owner only)               ← 成员 / 邀请 / role / 转让 §3.6.4
     │   ├─ Members list
     │   ├─ Pending invitations
     │   ├─ Seat usage (3/5 seats used)
     │   └─ Transfer ownership
     ├─ Billing (P1 · Owner only)
     ├─ Security (WISP)
     └─ About
```

一级导航 P0（Solo）：Dashboard / Workboard / Clients / Alerts / Rules / Settings — 6 项。
一级导航 P1（Team）增加：**Team Workload**（Owner/Manager 可见）+ **Audit Log**（Owner/Manager 可见）= 最多 8 项。
不建 Intake / Review / Extension 独立导航——它们是 obligation 的状态层。

---

## 12. 指标与成败判据

### 12.1 North Star

> **Weekly Triage Completion** — 周一 8:00–11:00 内完成一次分诊 session 的 firm 数 / 活跃 firm 数。**目标 ≥ 50%。**

### 12.2 KPI（首 4 周）

**Activation（Migration）**

| 指标 | 目标 | 测量 |
|---|---|---|
| Migration Time-to-First-Value | **P50 ≤ 10 min** | signup → 首次看到 Penalty Radar $ |
| **Migration P95 完成时间（S2-AC5）** | **≤ 30 min** | Signup → Import 完成（30 客户基准）|
| Migration Completion Rate | ≥ 70% | 进入 Step 1 → 完成 Step 4 |
| Migration Mapping Confidence | ≥ 85% | AI Mapper 平均 confidence |
| Migration Revert Rate | ≤ 10% | 24h 内 Revert / 全部 batch |
| Migration 激活率 | ≥ 7/10 | 种子用户用 Migration（vs 手动录入）|

**Retention（Dashboard + Pulse）**

| 指标 | 目标 | 测量 |
|---|---|---|
| Setup 耗时 | P50 ≤ 15 min | signup → first calendar generated |
| Week-1 回访 | ≥ 2 次 / 用户 | unique login days |
| Week-2 回访 | 10 人中 ≥ 5 人 | 第 8–14 天 ≥ 1 次 |
| **分诊 session 耗时（S1-AC5）** | **P50 ≤ 5 min**（第 2+ 次）| session 时长 |
| Evidence 点击率 | ≥ 30% 周活用户 | E 键 / chip 点击 |
| Pulse Review 耗时（S3）| ≤ 3 min | alert 打开 → apply |
| AI Brief 有用率 | ≥ 5/10 | 退出访谈 |
| Pulse Apply 次数 | ≥ 2 / firm | 真实 Apply |
| Smart sort 保留率 | ≥ 6/10 保持默认 | 未切换 |

**Monetization**

| 指标 | 目标 | 测量 |
|---|---|---|
| 付费意愿点击率 | ≥ 30% | $49 按钮 |
| 日历编辑率 | < 20% | 用户 override 系统日期 |

### 12.3 验收测试集（Traceability Matrix 延续）

| Test ID | AC | 用例 | 预期 |
|---|---|---|---|
| T-S1-01 | S1-AC1 | 新用户登录后 | 默认 Dashboard，选中 `This Week` tab |
| T-S1-02 | S1-AC2 | 本周 3 条 obligations | TriageCard 左上显示 `[🔴 2d]` / `[🟠 5d]` 等 |
| T-S1-03 | S1-AC3 | 200 clients × 1000 obligations，应用 3 维筛选（CA + LLC + 1040）| 响应 < 1s，计时 DevTools |
| T-S1-04 | S1-AC4 | 点击某行 status 下拉 | 500ms 内改完 + Undo toast |
| T-S1-05 | S1-AC5 | 模拟 85 客户场景，计时用户完成分诊 | P50 ≤ 5 min |
| T-S2-01 | S2-AC1 | 上传 TaxDome 官方导出 CSV | Preset 命中 + 95% 字段映射 |
| T-S2-02 | S2-AC2 | CSV 含 `Tax ID` 列 | EIN 自动识别，`##-#######` 格式化 |
| T-S2-03 | S2-AC3 | CSV 有 5 行缺 state | 非阻塞，其余 25 行正常导入 |
| T-S2-04 | S2-AC4 | CSV 无 tax_types 列 | Default Matrix 生成全年 obligations |
| T-S2-05 | S2-AC5 | 30 客户从 signup 到 import | P95 ≤ 30 min |
| T-S3-01 | S3-AC1 | 模拟 IRS 发公告 T0 | T0 + 24h 内 Pulse 进 feed |
| T-S3-02 | S3-AC2 | Pulse: CA + LA + Individual + 1040；firm 有 12 客户符合 | Match 精确返回 12 |
| T-S3-03 | S3-AC3 | Approved Pulse 触发 | Dashboard Banner + Email Digest 双到达（同一事务）|
| T-S3-04 | S3-AC4 | Banner 点 Review → Apply | 12 条 obligation 批量更新 + Audit 12 条 + 24h Undo 可用 |
| T-S3-05 | S3-AC5 | 每条 Pulse 详情 | `official_source_url` + `verbatim_quote` 可点击 + 可复制 |

### 12.4 Go / Gray / Rethink

- **Go**：Week-2 回访 ≥ 5 ∧ ≥ 3 位愿付费 ∧ ≥ 5 位觉 AI 有用 ∧ 编辑率 < 30% ∧ Pulse Apply ≥ 2 ∧ Migration 激活率 ≥ 7/10
- **Gray**：回访 5–7 ∧ 付费 < 3 → 重新审视 ICP / 定价
- **Rethink**：回访 < 4 ∨ > 50% 觉不如 Excel ∨ 编辑率 > 40% ∨ Migration 激活率 < 5/10

---

## 13. 安全与合规

### 13.1 最小必要数据

**MVP 不存：** SSN / 完整税表金额 / 银行账号 / W-2/1099 具体数字  
**MVP 存：** 客户名 / EIN / 州 / 县 / 实体类型 / tax_types / 预估年营收（粗档）+ obligation 元数据

让 DueDateHQ 在 IRC §7216 与 FTC Safeguards Rule 下尽可能轻。

### 13.2 必做

- HTTPS 全站（Vercel 默认）
- TLS 1.2+ / AES-256 at rest（Neon/Supabase 默认）
- Auth：Email magic link + 会话 7 天
- MFA：Owner 必开（TOTP）；Team 版 Manager 强制开启，Preparer/Coordinator 建议开启
- **RBAC 双层校验**（§3.6.3）：ORM middleware 强制 `firm_id` 隔离 + Server Action 装饰器强制 role 校验 + 前端按 role 渲染（三层防御）
- Tenant 强隔离：所有 query 必须带 `firm_id` where
- 审计日志：所有写操作
- 备份：每日 + 保留 7 天
- **WISP v1.0**：IRS Pub 5708 要求的 5-page 书面信息安全计划（交付物）
- 隐私声明：客户数据不训练任何外部 AI，仅用于 service delivery
- **LLM PII 防泄**：客户姓名 / EIN / 邮箱在 prompt 中用占位符 `{{client_1}}`，生成后回填

#### 13.2.1 Firm-wide Audit Log 页（Team 版合规核心 · P1-22）

**入口：** 侧栏 `Audit Log`（Owner / Manager 可见）

**目的：** 让事务所承担对客户的"职业责任"变得可证明。IRS 调查 / 客户投诉 / 内部争议时，Owner 可导出完整审计链路。

**字段列：**

```
Time (UTC + local)  |  Actor  |  Action  |  Entity  |  Before → After  |  IP / Device  |  [View detail]
```

**必须支持的 action 类型：**

| 类别 | Action |
|---|---|
| Auth | `auth.login.success` / `auth.login.failed` / `auth.mfa.enabled` / `auth.session.revoked` |
| Team | `team.member.invited` / `.joined` / `.role_changed` / `.suspended` / `.left`；`firm.owner.transferred` |
| Client | `client.created` / `.updated` / `.deleted` / `.reassigned` |
| Obligation | `obligation.status_changed` / `.readiness_changed` / `.extension_decided` / `.reassigned` / `.penalty_overridden` |
| Migration | `migration.imported` / `.reverted` / `.single_undo` |
| Pulse | `pulse.applied` / `.reverted` / `.dismissed` / `.snoozed` |
| Rule | `rule.report_issue` / `rule.updated`（系统）|
| Export | `export.csv` / `export.pdf` / `ics.feed_rotated` |
| Ask | `ask.query_run`（含 DSL，不含结果 PII）|

**筛选：**
- Actor（成员多选）
- Action 类别（上述分组）
- 时间范围（预设 24h / 7d / 30d / 自定义）
- Entity（点击某客户 → 仅该客户相关）

**导出：**
- CSV 导出（Owner only）
- 触发时写 `export.audit` audit event（自递归记录）
- 导出文件通过邮件附件发送，不直接下载（防中间人）

**保留策略：**
- 活跃数据：**7 年**（IRS 推荐的客户记录保留期）
- `before_json` / `after_json` 对 PII 字段自动 hash 化（保留变更事实，不保留原始敏感数据）
- Firm 删除后，`actor_id` 匿名化为 `deleted_user_#`，但审计事件保留（合规诉讼证据）

### 13.3 红线（MVP 不碰）

- 不成为 IRS authorized e-file provider
- 不处理 IRS Publication 1345 范围的数据
- 不做 direct tax filing transmission
- 不申请 SOC 2 正式审计（路线图 Phase 3）
- 不承接 CCPA 阈值以上营销用数据

### 13.4 职业责任保障

- 购买专业责任险（E&O 保单），首年 $2M 保额
- 数据准确度 SLA：99.5% verified rules 准确（基于 ops QA）
- 错误赔偿条款：若因 DueDateHQ rule 错误导致客户罚款，最高赔偿当月订阅费 × 10 + 实际罚款（见 TOS）

---

## 14. 路线图（不是工期承诺）

> 本 PRD 的产品范围不以 14 天裁剪；但作为 GTM 参考，给出阶段切片。

### 14.1 Phase 0 (MVP · ~4 weeks)

- P0 全部（§4.1）
- P1 的 Pulse + Ask + Client PDF + ICS（优先度由工程实际决定）

### 14.2 Phase 1 (Weeks 5–12)

- 50 州规则 full coverage（逐州签字 + 发布）
- 团队多席位 + assignee 完整 RBAC
- Stripe 计费
- Google / Outlook 日历**单向写入**（不做双向同步）
- Zapier App
- 公共 SEO tracker 扩到全 50 州

### 14.3 Phase 2 (Q3 2026)

- QBO / TaxDome / Drake 深度集成
- 文档链接引用（不做存储）
- 电子签名对接
- Penalty recovery 报告
- Audit trail 合规版
- SOC 2 审计路线

### 14.4 Phase 3 (Q4 2026+)

- Compliance Calendar API（卖给 TaxDome / Karbon 做 intelligence 层）
- 移动端
- AI Agent 可生成客户沟通全套（CPA 只审批）
- 成为"官方 deadline intelligence layer"事实标准

---

## 15. Go-to-Market · 集训 14 天 Playbook

> 本章节是**集训可执行版**。不做空洞的"多渠道营销"，只写：具体渠道、具体帖子标题、具体漏斗数字、具体日程。
> 对标 LangGenius 集训加分项 **+2（GTM 方案）+ +3（早交付）**。

### 15.1 定价（保持 §1.1 锚点）

| Plan | 价格 | 目标 | 包含 |
|---|---|---|---|
| Solo | **$39 / mo** | 独立 CPA | 全 P0 能力，100 clients |
| Firm | $99 / mo | 2–5 人小所 | + 5 席 + assignee + 共享视图 |
| Pro | $199 / mo | 6–10 人 | + SSO + API + 优先支持 + 2000 clients + 权重调整 |
| Trial | **14 天免费 · 无信用卡** | 全部新用户 | 全功能 |

**锚点论证（Pitch 30 秒版）：**
- File In Time $199/user 首年 → DueDateHQ $39/mo = 年费相当，但产品价值翻 10 倍（AI + 云端 + Pulse）
- Karbon $59+/user/mo → 我们便宜 33% 且专注 deadline（他们求大）
- **$39 = 一位 CPA 一天的 billable hour 的 1/10。免费试用时他只需要节省 1 天就 ROI。**

### 15.2 第一批 10 位 CPA 的获客 Playbook（集训 14 天内可执行）

#### 渠道矩阵（按 ROI 排序）

| 渠道 | 预期 signup | 预期 conversion | 成本 | 周期 |
|---|---|---|---|---|
| **r/taxpros 软植入帖** | 200 浏览 → 10 click → 3 signup | 30% | $0 | Day 1–3 |
| **LinkedIn 冷邮 + 1:1 Demo** | 30 邮件 → 10 回复 → 4 demo → 3 signup | 75% | 时间 | Day 4–10 |
| **CPA Facebook 群（CPAExamClub / Tax Pros Unite）** | 500 浏览 → 15 click → 2 signup | 13% | $0 | Day 2–5 |
| **华人 CPA 微信群（美国华人执业 CPA 协会）** | 100 浏览 → 8 click → 2 signup | 25% | $0 | Day 3–7 |
| **IndieHackers / ProductHunt 预热** | 50 signup → 1 paying | 2% | 时间 | Day 12–14 |

**目标：14 天内 10 位真实 CPA signup + 3 位 pay-intent 点击 + 2 位录屏访谈。**

#### 15.2.1 Reddit r/taxpros · 精准埋伏帖（Day 1–3）

**帖子 1 · 用户故事切入型**

> Title: `My sister missed a CA Franchise Tax deadline and I (engineer) built something to help her`
>
> Body: `She's a solo CPA with ~80 clients across CA and NV. Every Monday she spent 45 min building a triage list in Excel, cross-checking Outlook and TaxDome exports. Last March she missed a Form 3522 by 2 days and the client got slapped with $800 penalty.`
>
> `So I built DueDateHQ. Paste your TaxDome/Drake/Karbon CSV, it AI-maps the fields (including Tax ID → EIN), generates the full year calendar with dollar exposure per deadline, and pulls IRS + 5 state regulatory bulletins into your inbox within 24 hours. Free 14-day trial, no CC.`
>
> `Does this solve a real problem for you, or is it solving a problem I imagined? Brutally honest feedback wanted.`

**关键技巧：**
- 不卖产品、卖故事（Reddit 最吃这一套）
- 故意自谦（`a problem I imagined`），引诱 CPA 反驳 + 评论
- 只留站外 link 一次，不要刷屏

**帖子 2 · 技术展示型（3 天后发）**

> Title: `Built a tool that turns every IRS deadline into a dollar-amount penalty estimate — CPAs, is this useful?`
>
> Body: `IRS §6651 is public: 5%/mo FTF + 0.5%/mo FTP + interest. So why do deadline tools still show "5 days left" instead of "$4,200 at risk if missed 90 days"?`
>
> `I built this for small CPA firms. It shows dollars, not days. Every number is source-linked to IRS pub 509 / state statutes — you can click and verify.`
>
> `Would love feedback from anyone who's ever had a client hit with a surprise penalty.`

**帖子 3 · Pulse 差异化型（6 天后发）**

> Title: `IRS just extended CA filing to Oct 15 for LA County — how many of your clients did you notify today?`
>
> `[Screenshot of Pulse Banner showing 12 affected clients]`
>
> `Built a tool that catches IRS/state bulletins within 24h, auto-matches to your clients by state + county + entity + form, and batch-updates deadlines in one click. Beta.`

#### 15.2.2 LinkedIn 冷邮 + 1:1 Demo（Day 4–10）

**搜索条件：**
- Title: `Certified Public Accountant` / `CPA` / `Enrolled Agent`
- 地区：California / New York / Texas / Florida / Washington
- Company size：`1-10 employees` / `Self-employed`
- Keywords: `tax preparation` / `tax compliance`

**冷邮模板（12 句以内 · 每封个性化 2 行）：**

```
Subject: 30-sec demo — for a CA CPA

Hi [First Name],

Saw you've been doing tax prep for [Company Name] for [X] years.
Quick question: how do you track multi-state deadlines today?

I built DueDateHQ — think of it as "File In Time + AI". Paste your 
client list once, get the full year calendar with dollar-risk per 
deadline. IRS + CA/NY/TX alerts pushed into your inbox within 24h.

If you have 15 min this week, I'd show you a 5-min demo using your 
real client list (or a dummy one). I'll take your honest feedback 
even if you never use it.

Free 14-day trial either way: app.duedatehq.com

— [Your Name]
```

**转化漏斗：**
- 发 30 封 → 10 回复 → 4 Zoom demo → 3 signup → 1 录屏访谈
- 录屏访谈是**最高优先级交付物**（Demo Day 开场 30 秒放录屏）

#### 15.2.3 CPA Facebook 群（Day 2–5）

**目标群：**
- `CPAExamClub`（~50k members）
- `Tax Pros Unite`（~12k members）
- `AICPA Small Firm Section`
- `Accountants & Bookkeepers Network`

**发帖策略：** **不直接推产品**，发"**公共福利内容**"钓鱼：

> Title: `Free: 2026 Complete California Franchise Tax Calendar (PDF, no signup)`
>
> Body: `Built this for my own firm but figured others might use it. Covers all 2026 dates for CA Franchise Tax Board — LLC, S-Corp, PTET, Estimated Tax. Each date has the statute reference and official link for your files.`
>
> `[PDF link]`
>
> `Built using my DueDateHQ beta — we're also watching IRS + 5 state bulletins 24/7, DM me if curious.`

PDF 本身由 §7.6 Client PDF Report 引擎生成，含 DueDateHQ 水印 + footer 带 signup link。

#### 15.2.4 华人 CPA 微信群（Day 3–7）

美国华人 CPA 是被严重忽视的 beachhead：
- 他们服务的华人中小企业主**更痛 PTE / Franchise Tax**（在加州尤其）
- 他们**强烈信任口碑推荐**（不靠 SEO）
- 独立 CPA 占比高

**渠道：**
- 美国华人执业 CPA 协会（微信群）
- 硅谷华人 CPA 聚集地（Saratoga / Fremont / Irvine）的 LinkedIn
- Rednote（小红书）搜 `在美CPA` 标签

**切入点（中文）：**

> "我做了一个工具给美国独立 CPA，专治多州截止日期。特别是 CA Franchise Tax、NY PTET、TX Franchise 这几个容易漏的。粘贴 TaxDome 导出的 Excel，30 分钟生成全年日程表。想找 2 位华人 CPA 朋友试用一下提意见，免费用 14 天，我送一杯咖啡。有兴趣的 DM 我。"

#### 15.2.5 14 天日历（Playbook 具体到天）

| Day | 行动 | 量化目标 |
|---|---|---|
| D1 | Reddit 帖 1（故事型）+ 打磨 Landing page | 200 浏览 |
| D2 | Facebook 群发 CA Franchise PDF 钓鱼 | 50 PDF 下载 |
| D3 | Reddit 帖 2（Penalty 美元型） | +200 浏览 |
| D4 | LinkedIn 冷邮第一批 10 封 | 3 回复 |
| D5 | LinkedIn 冷邮第二批 10 封 + 微信群 | 3 回复 + 1 signup |
| D6 | 约第一位 CPA 1:1 demo（Zoom）| 录屏 |
| D7 | Reddit 帖 3（Pulse CA 延期型）+ LinkedIn 第三批 10 封 | +3 signup |
| D8 | 约第二位 CPA 1:1 demo + 优化 onboarding | 录屏 |
| D9 | Pilot CPA 真实导入 30 客户，跟进 3 天 | 获取使用反馈 |
| D10 | Pilot CPA 用 Pulse + Readiness Portal | 跨场景验证 |
| D11 | IndieHackers 预热帖 | 50 signup |
| D12 | Pilot CPA 录 90 秒访谈视频 | 开场素材 |
| D13 | Demo Day 排练 + 数据冻结 | — |
| D14 | Demo Day + ProductHunt launch | — |

### 15.3 Demo Script（6 分钟 · 集训优化版）

> 关键原则：**前 30 秒决定评审官是否记住你。** 其他组会从"产品介绍"开场；你要从"真实用户口证"开场。

#### 15.3.1 开场 · 0–30s · 真实 CPA 口证（致命武器）

**切掉传统 Pitch 句，换成 30 秒录屏：**

```
[Video on, no slides]

Sarah Mitchell, CPA · San Francisco · camera-on Zoom recording:

"I've been a CPA for 12 years and I've tried 4 deadline tools.
They either cost $200/month or they're stuck in 2005.

Last Thursday I imported my 62 clients into DueDateHQ. It took 
me 23 minutes. The next morning I opened it, and it had already 
flagged 4 of my clients that would be affected by the IRS 
California storm relief bulletin — I hadn't even heard about 
that yet.

This is the first tool where I feel like someone actually 
understands how a small CPA practice works."

[Cut. Presenter on screen.]
Presenter: "That's Sarah. Here's what she used."
```

**为什么这 30 秒击败 59 组竞品：** 所有其他组开场都是"我做了一个产品"。你开场是"一个真实用户说'这是第一个真正懂我的工具'"。评审官前 30 秒就在心里给你打了 top 5。

#### 15.3.2 30–90s · Onboarding AI Agent + Live Genesis（评审员亲手互动）

**把评审员拉进来：**

```
Presenter: "Before I demo, can I get a number from you? How many 
clients does a typical small CPA firm handle?"

(wait for GM to respond, e.g., "around 50")

Presenter: "Perfect. Watch this."

[Switch to DueDateHQ empty state · Onboarding AI Agent full-screen]

Agent: "Hi! Are you solo or in a small firm?"
Presenter types: "solo"

Agent: "Roughly how many active clients?"
Presenter types: "around 50"  ← 评审员报的数字

Agent: "Got it. Most of them US-based?"
Presenter types: "all in CA, mostly LLCs"

Agent: "Perfect — I've pre-loaded CA Franchise Tax + federal rules.
Now paste your client list in any format."

[Presenter Cmd+V a pre-prepared 50-row messy TaxDome Excel]

Agent: "Reading... Found 52 clients, detected 7 columns including 
Tax ID (EIN), 3 entity types need cleanup. Before I commit: 
I'll generate 247 deadlines with $31,400 exposure this quarter. 
OK to proceed?"

Presenter: "go"

[LIVE GENESIS 4 秒动画 · 顶栏 $ 从 $0 一路滚到 $31,400]
[粒子动画 +$4,200 +$2,800 +$1,650 飞入顶栏]
```

**记忆钩子：**
- 评审员报的"50"数字真的变成了 Agent 对话内容 → **"这不是演过 100 遍的脚本"**
- Live Genesis 粒子动画是整场 Demo 唯一的视觉高潮

#### 15.3.3 90–180s · Monday Triage（游戏化 Penalty 顶栏）

```
Presenter: "Imagine it's Monday 8am. You open DueDateHQ."

[Dashboard 载入 · 顶栏 $31,400 at risk this week 76px 粗体 JetBrains Mono]

Presenter: "This is Sarah's Monday. The top bar is her 'casino 
scoreboard' — $31,400 at risk this week. Every click can make 
this number go down."

[Click Acme LLC row → status change to Filed]

Presenter: "One click — $4,200 disappears."

[顶栏数字滚动 $31,400 → $27,200，绿色闪光]

Presenter: "Smart Priority ranks by dollar exposure, not due date. 
Hover this sparkle badge..."

[Hover Smart Priority badge → 展开因子分解]

Presenter: "... you see why this is rank 1: $4,200 at risk, 3 days 
left, client waiting. Every number clicks back to the IRS or 
state source. Let me show you."

[Click E key → Evidence Mode drawer]

Presenter: "This is why CPAs bet their license on us — every 
rule has a verbatim quote and human-verified timestamp."
```

**记忆钩子：** 顶栏数字滚动 + 绿色闪光是**唯二的视觉高潮**。

#### 15.3.4 180–240s · Client Readiness Portal（跨设备实时演示 · 杀手锏）

```
Presenter: "Now the part File In Time can never do."

[Open Obligation Detail for "Bright Studio S-Corp" → Readiness 区块]

Presenter: "Sarah needs 3 things from this client. Normally she 
spends 20 minutes calling. Instead, watch."

[Click 'Send readiness check to client' → QR code 弹出]

Presenter: "Can anyone in the room pull out your phone?"

(GM or audience member scans QR)

[Audience member's phone shows the Client Portal page — 免登录]

Presenter: "They can tap 'I have it' / 'Not yet' / 'I don't 
understand' — all without logging in, no app install."

(Audience taps "I have it" on 2 items)

[Dashboard 实时更新：readiness badge Waiting → Ready 绿色闪光]

Presenter: "Look at the Dashboard. Sarah just saved 20 minutes 
without saying a word to her client. And every response is 
in the audit log."

[Scroll Audit Log → 新行 "Client responded from mobile 2s ago"]
```

**记忆钩子：** 跨设备实时同步是**全场最震撼的 5 秒**。评审员会把这个画面带回去说给同事听。

#### 15.3.5 240–300s · Regulatory Pulse（主动性叙事）

```
Presenter: "And it's not just that we answer when you ask. 
We interrupt you when something changes."

[Fast-forward：Dashboard 顶部 Pulse Banner 红色脉冲出现]
[Banner: "IRS CA storm relief → 12 of your clients affected"]

Presenter: "Sarah didn't ask for this. 8 minutes ago, IRS 
published a relief bulletin. Our worker caught it, the LLM 
extracted the affected counties and forms, and the match 
engine found the 12 of her clients in LA County with 
1040 or 1120-S due on March 15."

[Click Review & Batch Adjust → 抽屉展开 12 客户清单]
[点 Apply → 事务执行 + Toast]

Presenter: "One click. 12 deadlines moved. 12 emails going out 
to the assignees. Every change in audit log with source URL."

[手机叮一声，收到邮件 · 现场放音效或真实邮件]
```

#### 15.3.6 300–360s · Evidence + Pay-intent 收束

```
Presenter: "Last thing. Watch the whole story come together."

[Open Client Detail → Audit Tab]

Presenter: "Acme LLC was imported from Sarah's TaxDome Excel. 
The entity was originally 'L.L.C.' — our AI normalized it to 
'LLC' with 97% confidence. The CA Franchise Tax obligation 
was generated by our default matrix for LLC×CA. Last Thursday 
the IRS bulletin shifted the due date. Every step is clickable 
back to the source."

[Press E key → Evidence Mode → 完整 provenance chain]

Presenter: "If the IRS ever audits Sarah, she exports this 
whole evidence package as a signed ZIP. 90 seconds. Done."

[Click Settings → Export Audit Package → SHA-256 hash 一键生成]

Presenter: "Every tax AI today is a confident stranger. 
DueDateHQ is a tax AI that shows its work — from the first 
paste to the IRS-auditable weekly brief."

[Click "I'd pay $49/mo" button → toast]

Presenter: "Thank you."
```

#### 15.3.7 Plan B 预案

| 故障 | 降级 |
|---|---|
| 现场 Wi-Fi 挂 | 4K 录屏版 + 解说音轨准备好，无缝切换 |
| LLM API 超时 | Onboarding Agent 所有回复预录缓存，本地 sw fallback |
| Live Genesis 卡顿 | CSS 动画独立运行，不依赖 API |
| 评审员不愿扫码 | 预准备一部备用手机，自己扫 |
| Pulse 现场抓不到 | 1 条 approved Demo Pulse 预置，脚本化触发 |
| 邮件到达延迟 | 现场放提前录好的邮件通知音效 + 手机屏录 |

### 15.4 Pitch 文档要点（交付加分 +2）

6 页精简版（PDF，Keynote 也出一份）：

1. **Page 1 · 问题**：Sarah 的周一 45 分钟（访谈原话 + 数字）
2. **Page 2 · 解决方案**：三条铁律（30s / 30min / 24h）+ 产品截图 3 张
3. **Page 3 · 差异化**：对比表 vs File In Time / TaxDome，突出 Glass-Box + Readiness Portal
4. **Page 4 · 市场**：美国 65 万 CPA + 独立/小所占比 + SAM 估算
5. **Page 5 · GTM 14 天漏斗**：本节 §15.2 图表化
6. **Page 6 · Ask**：$39/mo × 1% 渗透 = ARR $3M 规模 + 集训 Ask（不确定 ask 什么，可写"希望与真实 CPA 用户继续深聊"）

### 15.5 落地页（SEO + 信任锚点）

- `/` — Hero + Demo video loop（15.3 录屏剪辑版）
- `/pulse` — 实时 Pulse feed（SEO 爆款，Google 会常驻收录）
- `/state/california`（及其他州）— Public State Tracker 长尾 SEO
- `/security` — WISP 摘要 + 数据边界 + E&O 保险声明
- `/pricing` — 三 tier + ROI 计算器 `你有 N 客户 → 每月节省 X 小时 → 值 Y 美元`
- `/evidence` — Glass-Box 纪律说明页（对标 Dify 审美 · 展现产品原则）

### 15.6 发布内容日历（SEO 长尾 · 每周 2 篇）

| 周 | 标题 | 目标 |
|---|---|---|
| W1 | 2026 Federal Tax Deadlines for Small CPA Firms | TOFU 流量 |
| W1 | California Franchise Tax: What Every LLC CPA Needs to Know | 州 SEO |
| W2 | NY PTET Election: The Deadline Every Partner Forgets | 州 SEO |
| W2 | Why Your Tax AI Needs a "Source" Button | 差异化叙事 |
| W3 | Texas Franchise Tax in Under 5 Minutes | 州 SEO |
| W3 | IRC §7216 and Why Your AI Notes Must Be Auditable | 合规叙事 |
| W4 | A CPA's Guide to Disaster Relief Deadlines | Pulse 叙事 |
| W4 | Penalty Math: How Much a Missed 1120-S Actually Costs | Penalty 叙事 |
| W5 | From Excel to Workboard: 30-min CPA Migration Guide | Migration 叙事 |
| W5 | Building a WISP in a Day | 合规叙事 |
| W6 | How a Client Self-Service Portal Cut My Monday Calls by 80% | Readiness 差异化叙事 |
| W6 | I Let an AI Agent Onboard My CPA Practice — Here's What Happened | Agent 差异化叙事 |

### 15.7 集训加分三项对齐

| 加分项 | 对应本章节 | 关键交付 |
|---|---|---|
| **+1 部署** | §11 技术架构 + 实际 Vercel 部署 | 公开 URL：`app.duedatehq.com` |
| **+2 GTM 方案** | §15.2–15.6 | 6 页 Pitch PDF + Landing page 上线 + 14 天日历 |
| **+3 提前交付** | §15.2.5 Day 12 目标 | D13 前 commit frozen，D14 留给 Demo 排练 |

加上 §15.3 的真实 CPA 开场与现场互动记忆钩子，这就是**稳定脱颖而出的组合拳**。

---

## 16. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| AI 幻觉导致错误税务内容 | 中 | 高 | 强 RAG + citation 校验 + 黑白名单 + 显著 "Not tax advice" 声明 |
| Pulse RSS 抓取不稳 | 高 | 中 | 6 源冗余 + 失败降级 mock + 1 条预置 + "Last checked X min ago" 诚实显示 |
| 规则录入错误 | 中 | 高 | 双人复核签字 + `verified_by` 留痕 + Report issue 回路 |
| Migration AI Mapper 置信度低 | 中 | 高 | 5 个 Preset + 低置信度 UI 强制确认 + 所有映射可后悔 |
| Migration 原子事务失败 | 低 | 高 | 单行失败不阻塞 + 失败行导 CSV + 24h Revert |
| 粘贴含 SSN | 中 | 中 | 前端正则拦截 + 该列强制 IGNORE + 红色警示 |
| 数据泄露 | 低 | 高 | 最小必要数据 + TLS + 加密 + WISP + E&O 保险 |
| IRC §7216 违规 | 低 | 高 | PII 占位符化 + 只发 schema + ZDR endpoint |
| 评委 Demo 60s 内记不住 | 中 | 致命 | Clarity Engine 叙事 + Live Genesis 戏剧性 + Penalty $ 数字 |
| 同期竞品同质 | 高 | 中 | Glass-Box 纪律（others won't）+ Migration Copilot 端到端 + 50 州骨架 |
| Pulse Apply 把不该改的改了 | 低 | 高 | 默认 `requires_human_review` + Ops Approve + 24h Undo + Audit |

---

## 17. 交付物清单

| 交付 | 形态 | 验收 |
|---|---|---|
| Production build | URL | §12.3 全部 Test ID 通过 |
| 源码仓库 | GitHub | README + setup < 10 min |
| 种子数据 | SQL dump | 一键 restore（30 规则 + 30 demo 客户 + 2 Pulse）|
| Demo 视频 | MP4 4K | 6 分钟，字幕 |
| Pitch deck | PDF + Keynote | 10 页 |
| **WISP v1.0** | PDF | 5 页 |
| Public Pulse page | URL | 首批 ≥ 5 条真实 alert |
| 试点反馈 | Notion | ≥ 3 位 CPA |
| 付费意愿数据 | CSV | 点击率报表 |
| PRD（本文档） | Markdown | Frozen commit |
| AC Traceability Report | HTML | §12.3 测试全通过截图 |
| 5 套 Preset Sample CSV | CSV | TaxDome / Drake / Karbon / QB / FIT |

---

## 18. 附录

### 18.1 竞品价格锚点（2026-04 公开）

- File In Time: ~$199/user 首年 + $100/user/年维护
- Jetpack Workflow: $49/user/mo
- Financial Cents: $19 / $49 / $69
- Karbon: $59–$99/user/mo
- TaxDome: $800–$1,200/user/year
- Canopy: $74 / $109 / $149

### 18.2 官方数据源（MVP 硬编码）

- IRS Publication 509: Tax Calendars
- IRS Form 7004 Instructions（extension 不延 payment）
- IRS IRC §6651（penalty formulas）
- CA FTB Publication 3556（LLC franchise）
- CA R&TC §17941
- NY Tax Law §860 及 PTET 指南
- TX Tax Code §171（franchise tax）
- FL DOR 年度日历
- WA DOR B&O tax
- MA DOR Form 1 / Form 2 / Corporate Excise

### 18.3 术语表

- **Obligation Instance**: 客户 × 规则 × 税年 的一条可执行任务
- **Evidence Chain**: obligation / AI output / migration decision 到原始官方来源的可追溯链路
- **Pulse**: Regulatory Pulse 单条公告事件
- **Pulse Application**: Pulse 应用到某个客户的单次记录
- **Glass-Box**: 所有 AI 输出强制 provenance 的产品纪律
- **Migration Batch**: 一次外部数据源导入的事务单元，原子提交 + 24h 可 Revert
- **Live Genesis**: 导入完成瞬间 deadline 卡片涌出 + Penalty Radar 滚动的动画
- **Default Tax Types Matrix**: `entity × state` 查表兜底的合规组合表（§6A.5）
- **Smart Priority**: 纯函数打分的跨页面统一排序（§6.4）
- **WISP**: Written Information Security Plan（IRS Pub 5708 要求）
- **ICS 单向订阅**: Firm 级 token URL 供 Outlook / Google / Apple 订阅（P1-11）

### 18.4 与前两份 PRD 的集成映射（工程交接用）

| 组件 | 来源 | v2.0 位置 |
|---|---|---|
| Clarity Engine 叙事 | v1.0 §0.1 | §1.2 / §6 |
| Migration Copilot 4 步 | v1.0 §5.8 / §6A | §6A.6 |
| Evidence Mode 完整设计 | v1.0 §5.5 | §5.5 |
| Penalty Radar 计算 | v1.0 §6.3 + Competitor F-18 | §7.5 |
| Default Tax Types Matrix | v1.0 §6A.3A | §6A.5 |
| Smart Priority 纯函数 | v1.0 §6.4 | §6.4 |
| LLM-mode tie-breaking | Competitor F-5b 思路 + v1.0 约束 | §6.4.5 |
| Ask Assistant DSL 双保险 | v1.0 §6.5 + Competitor F-19 | §6.6 |
| Client PDF Report | v1.0 §6.6 | §7.4 |
| ICS 单向订阅 | v1.0 §4.2 脚注 | §4.2 P1-11 |
| Pulse 数据模型 | Competitor §5.2.1 | §6.3 + §8.1 |
| Pulse 邮件耦合 | **新增**（两份均弱）| §6.3.4 |
| EIN 字段识别 | **新增**（两份均缺）| §6A.2 + §8.1 |
| County 筛选维度 | **新增**（v1.0 只 Pulse 用）| §5.2.3 + §8.2 |
| AC Traceability Matrix | **新增**（两份均缺完整版）| §3 + §12.3 |
| 50 州骨架策略 | **新增** | §6.1.6 |
| 双档 Revert（24h batch / 7d client） | 融合两者 | §6A.7 |
| Last-checked 可信度信号 | Competitor §5.1 | §5.1.4 + §6.3.5 |

### 18.5 何时打破 PRD

只有两种情况可推翻 §4.1 P0：

1. 真实 CPA 在 ≥ 3 次试用中均反馈 "没 X 就不能用"（需录屏证据）
2. §16 任一 Critical 风险实现，且无 degraded mode

否则：**任何新需求，一律下个迭代。**

---

## 19. 对评委的一句话

> **Most tax tools make CPAs earn their value. DueDateHQ earns it back in the first 10 minutes.**
>
> Paste a spreadsheet. Watch 152 deadlines appear. See $19,200 at risk. Click any number — it shows its work.
>
> When an IRS bulletin drops, your Dashboard and inbox update within 24 hours, with the 12 affected clients and the official source link already there.
>
> **Every tax AI today is a confident stranger. DueDateHQ is a tax AI that shows its work** — from the very first paste to the IRS-auditable weekly brief.

**Build it. Ship it. Show the work.**
