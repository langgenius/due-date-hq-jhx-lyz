# DueDateHQ PRD v1.0 — The Glass-Box Deadline Copilot for US Tax Pros

- 版本：v1.0
- 日期：2026-04-22
- 状态：Competition / 14-day MVP PRD（Build-ready）
- 目标市场：美国独立 CPA 与 1–10 人小型税务事务所
- 对外语言：English-first（产品 UI、官网、邮件、Demo 均英文，内部注释英文）
- 平台：Web-first，响应式，不做原生 App
- 定位：File In Time 的现代化、AI-native、可审计云端替代品
- 阅读对象：PM / Design / Full-stack / GTM / 评委
- 来源依据：`docs/report/*.md`、`docs/DueDateHQ - ICP 痛点与两周 MVP 精准打击面.md`、`docs/DueDateHQ-PRD-FileInTime-Competitive-zh.md`

---

## 0. 为什么这份 PRD 与众不同（Pitch-in-60-seconds）

集训里所有人都会做一个 DueDateHQ。大多数团队会交出：**一个云端日历 + 风险三段式看板 + AI 周报 + 邮件提醒**。那是"能用"，不是"能卖"。

DueDateHQ v1.0 把产品打在一个别人不敢做的点上：

> **Tax is the only industry where AI must be auditable by law.** DueDateHQ is the first deadline copilot where every AI sentence, every deadline date, every risk score clicks back to its official source, rule version, human-verified timestamp, and reasoning trace.

对标一句话：

> **File In Time solved deadline tracking for the desktop era. DueDateHQ solves deadline intelligence for the AI / audit era.**

### 0.1 签名能力：**Clarity Engine™**

Clarity Engine 是 DueDateHQ 的产品心脏，由三个互相强化的组件构成。它们共享同一条"证据链"基础设施，这让其他团队 14 天内几乎无法复刻。

| 组件 | 一句话定义 | 对 File In Time 的杀伤点 |
|---|---|---|
| **Glass-Box AI** | 每一句 AI 输出都附带 inline citations、rule version、human-verified 时间戳，可一键展开 provenance 图 | File In Time 无 AI |
| **Regulatory Pulse™** | 实时摄取 IRS / CA FTB / NY DOR / TX Comptroller / FL DOR / WA DOR 公告 RSS & 新闻页，AI 抽取影响范围，自动匹配受影响客户，一键 Apply 并写 audit log | File In Time 靠年度维护包，无公告监控、无客户匹配 |
| **Penalty Radar™** | 每条 deadline 用 IRS/州 penalty 公式（5% / 月 failure-to-file、0.5% / 月 failure-to-pay、25% 上限、短期联邦利率）实时折算 **$ 美元风险敞口**，Dashboard 顶部显示 "This week: $12,400 at risk" | 所有人只谈"天数"，只有你用美元说话 |

这不是三个分散的功能，而是**一个**产品叙事：

> **"In DueDateHQ, AI doesn't just answer — it shows its work, in dollars, with the rulebook open."**

Demo 评委看完第 5 屏就应该记得 DueDateHQ，而且记得的是**这句话**。

### 0.2 第二条产品战线：**Migration Copilot™**（激活层亮点）

Clarity Engine 解决的是 **"为什么每周都回来用"**。但在那之前还有一道更致命的门槛：**"为什么在第一个 30 分钟就愿意录第 6 位客户"**。

调研里反复出现的信号：

- 目标用户故事 P0 场景：**"从 TaxDome / Drake / Karbon / QuickBooks 导出 CSV，30 分钟导入 30 个客户，自动生成全年 deadline"**
- 真正的一号竞品不是 File In Time，是 **Excel + Outlook + 税务软件 report 的缝合怪**
- 小所系统碎片化程度极高，不支持"从现状迁移过来"就是**天然 0% 转化**
- File In Time 最务实的能力就是 CSV 导入；其他云 PM 要么没有，要么需要配实施顾问

因此 DueDateHQ 必须把"把乱七八糟的数据吃进来"当成一个**独立产品模块**，而不是一个"上传按钮"。它的名字叫 **Migration Copilot™**，它和 Clarity Engine 共享同一条 Glass-Box 纪律：

> **AI 每动一次字段、每归一一次 state 缩写，都要说出"我是怎么判断的、置信度多少、原始列是什么"，并且所有导入都可 24h 内一键 Revert。**

| 能力 | 一句话定义 | 为什么杀伤对手 |
|---|---|---|
| **Paste-Anywhere Intake** | 不要求 CSV 格式，直接粘贴 Excel range / Google Sheets / 邮件表格 / 多列复制 | File In Time 只接规整 CSV；其他 PM 需导出规范 |
| **AI Field Mapper** | 读表头 + 前 5 行，LLM 推断每列是什么，给出置信度 + 示例 + 备选，人工一键确认 | File In Time 人工拖字段；其他队不会做 glass-box 版 |
| **AI Normalizer** | entity type / state / tax types 智能归一（`L.L.C.` → `LLC`，`California` → `CA`，`Corp (S)` → `S-Corp`） | CPA 的 Excel 永远是乱的，这里直接打穿 |
| **Preset Profiles** | TaxDome / Drake / Karbon / Lacerte / ProConnect / QuickBooks 导出模板预置 | 一键选预设，映射已搞定 |
| **Dry-Run Preview** | 导入前展示："将导入 X 位客户，生成 Y 条 deadline，预计本季度 $Z at risk" | 让用户在**点击 Import 之前**就看到产品价值 |
| **Live Deadline Genesis** | 导入完成瞬间屏幕上一条条 deadline 按州/日期滚动生成（动画） | Demo 最有戏剧性的 10 秒 |
| **Conflict Resolver** | 重名 / 重 EIN：合并 / 覆盖 / 跳过，每一条都显示 diff | 真实 CPA 导第二次就会遇到 |
| **One-Click Revert** | 24h 内一键撤销整次导入（原子事务 + audit event） | 消除 CPA "怕搞砸现状"的顾虑 |
| **Migration Report** | 导入后邮件 PDF：成功 N、跳过 M、需复核 K、客户级 $ 敞口摘要 | 给 owner 一个可发群的战报 |

### 0.3 两条战线如何协同

```
Day 0 — Migration Copilot:  30 分钟 → 30 客户 → 全年 deadline + $ 敞口 + Evidence
Day 7 — Clarity Engine:      周一 5 分钟分诊 + Pulse 处理 1 次公告
Day 14 —                    用户主动回来第三次 ✅ → 付费意愿 ≥ 30%
```

两者共享同一套底座：

- `Evidence Link` 子表既记录 AI 映射决策，也记录 AI 税务解释
- `Audit Event` 既留 Migration Revert，也留 Pulse Apply
- 同一套 Glass-Box UI 组件（source chip、Evidence drawer）在两个场景全量复用

### 0.4 亮点为何 14 天可落地

- **Glass-Box AI**：本质是 RAG + structured rule store + citation UI 组件（3 人天）
- **Regulatory Pulse**：6 条精选 RSS + LLM 抽取模板 + 1 条预置 Demo 场景（IRS CA 灾害延期）（4 人天）
- **Penalty Radar**：IRS penalty 是公开固定公式，pure function（1 人天）
- **Migration Copilot**：LLM 字段映射 + 归一 + 原子导入 + Revert（4 人天）
- 所有亮点共用同一个 `Obligation Instance` + `Evidence Link` + `Audit Event` 底座，代码复用度 > 70%

---

## 1. 执行摘要

### 1.1 产品一句话

> **DueDateHQ is the glass-box deadline copilot for US tax firms** — it doesn't just remind CPAs *when* things are due, it explains *why*, *how much money is at risk*, *which clients a new IRS bulletin just changed*, and backs every claim with a clickable official source.

### 1.2 对标与定位

| 维度 | File In Time | 通用 PM（TaxDome / Karbon / Canopy） | **DueDateHQ v1.0** |
|---|---|---|---|
| 核心定位 | Desktop deadline tracker | All-in-one firm OS | Deadline intelligence copilot |
| 部署形态 | Windows 桌面 + 网络盘 | Cloud SaaS | Cloud-native SaaS |
| 数据更新 | 年度维护包 | 规则由用户自己维护 | **24h 内 AI 捕获 + 人工复核的官方更新** |
| AI 能力 | 无 | 点缀型 | **Glass-Box，强制 provenance** |
| 风险表达 | 红色字体 | 仅天数 | **美元敞口 + 风险原因码 + 可解释评分** |
| 规则变化匹配 | 无 | 无 | **Pulse：自动匹配受影响客户 + 一键 Apply** |
| 目标用户 | 传统小所 | 中大型事务所 | **独立 CPA + 1–10 人事务所** |
| 价格锚点 | ~$199/user 许可 + 年费 | $600–1,500/席/年 | **Solo $39 / Firm $99 / Pro $199 / mo** |

### 1.3 北极星体验目标（产品必须达成的"铁 3 条"）

- **30 秒** 看清本周最危险的 3–5 个客户（Dashboard 首屏）
- **5 分钟** 完成周一早晨的全盘分诊（Workboard + Filters）
- **< 10 秒** 从任意 AI 提示或 deadline 数字回溯到官方来源（Evidence Mode）

### 1.4 成功判据（14 天 Demo Day）

- Demo 能完整跑通 5 个关键屏（§16）无 bug
- 有 ≥ 2 位真实美国 CPA 在 ≥ 15 分钟演示后口头说出 "I'd use this"
- 评委在 pitch 后能用一句话复述 DueDateHQ 的差异化（衡量叙事是否"咬"住）
- 付费意愿按钮点击率 ≥ 30%（试用用户层）

---

## 2. 产品定义（What it IS and IS NOT）

### 2.1 DueDateHQ IS

- 一个 **云端多租户 SaaS Web App**，CPA 用浏览器打开即用
- 一个 **deadline-first workboard**：首页不是 CRM、不是月历，而是按风险排序的本周处理清单
- 一个 **Glass-Box AI 副驾**：AI 负责解释、排序、起草；CPA 保留专业判断
- 一个 **审计可追溯系统**：所有 deadline、规则、AI 输出、客户状态变更均留痕
- 一个 **迁移友好工具**：Excel / CSV 30 分钟内可完成 30 客户导入

### 2.2 DueDateHQ IS NOT

- ❌ Tax preparation software（不计算税额、不生成税表）
- ❌ Direct e-file transmitter（不承担 IRS e-file provider 合规责任，14 天内绝不碰）
- ❌ Client portal / document vault（不做重门户）
- ❌ CRM / billing / time tracking 套件
- ❌ 无证据的 AI 税务顾问（AI 永远不下税务结论）
- ❌ 全 50 州真规则库（MVP 只真做 Federal + CA/NY/TX/FL/WA）

### 2.3 设计原则（Product Principles）

1. **Deadline-first, not calendar-first.** 首屏是风险队列，不是月历。
2. **One object, multiple views.** 一个 `Obligation Instance` 同时承载 deadline / readiness / extension / risk / review / audit。
3. **Dense but modern.** 保持税务人熟悉的表格密度，但交互是 2026 水准。
4. **Explainable by default.** AI 无 provenance = 不出现在 UI。
5. **Human-in-the-loop.** AI 永不自动改 deadline 规则，只能 *建议*；Apply 必须人工点。
6. **Dollar-aware.** 风险表达单位优先用美元，其次才是天数。
7. **Source-anchored.** 每条规则、每个日期都有 `source_url` + `verified_by` + `verified_at`。

---

## 3. 目标用户与场景

### 3.1 主 ICP

> 美国独立 CPA / EA / tax preparer，solo 或 1–10 人事务所 owner，服务 20–300 位 business clients，至少 2 位客户落在 CA / NY / TX / FL / WA，当前用 Excel + Outlook + 税务软件报表拼接管理 deadline，对漏报有真实焦虑。

### 3.2 角色分层（MVP 只真实支持 Owner/Solo；Manager 字段预留）

| 角色 | 占比 | 核心任务 | DueDateHQ 必须回答 |
|---|---|---|---|
| **Owner / Signing CPA（P0）** | 70% | 周度分诊、签字、风险决策 | 本周谁最危险？敞口多少美元？ |
| **Manager（P1）** | 15% | 分派、平衡负载 | 谁过载？谁卡住？ |
| **Senior Preparer（P1）** | 10% | 准备 return、追资料 | 我下一单做什么？缺什么？ |
| **Client Coordinator（P2）** | 5% | 催资料、发提醒 | 哪些客户要发标准化提醒？ |

### 3.3 三大核心场景

#### 场景 A：**The Monday 5-Minute Triage**（P0）

> 周一早 8:00，Sarah（Solo CPA，服务 85 位客户）打开 laptop，只有 15 分钟喝咖啡。她需要在这 5 分钟里知道：本周谁最急、为什么急、敞口多少钱、下一步做什么。

→ 命中：Dashboard + AI Weekly Brief + Penalty Radar

#### 场景 B：**The 24-Hour Disaster Response**（P0 & 亮点）

> 周三下午 IRS 发公告：加州 Los Angeles County 因风暴延期 Form 1040 至 Oct 15。Sarah 的 85 位客户里有 12 位在加州。她需要 5 分钟内知道：哪 12 位被影响、哪些 deadline 要改、官方来源在哪、是否一键更新。

→ 命中：**Regulatory Pulse™** + Affected Clients + One-Click Apply + Audit Log

#### 场景 C：**The Extension Decision**（P1）

> 周四客户 Acme LLC 的 K-1 材料还没到，距离 Federal 1120-S 只剩 5 天。Sarah 需要知道：如果申请 extension，payment 是否仍到期？敞口多少？要不要先估算 estimated tax？

→ 命中：Extension Decision Panel + What-If Simulator + Penalty Radar

---

## 4. 范围冻结（14-day MVP）

### 4.1 P0 — Demo Day 必须跑通（不做即 Demo 塌）

| # | 模块 | 必须能力 |
|---|---|---|
| P0-1 | Auth | Email magic link 登录、单租户（单 firm）、单用户 |
| P0-2a | **Migration — Intake** | Paste-anywhere（CSV / TSV / 粘贴 Excel / Google Sheets）；TaxDome / Drake / Karbon / QuickBooks 预设 profile |
| P0-2b | **Migration — AI Mapper** | LLM 字段映射：读表头 + 前 5 行 → 推断字段 + 置信度 + 示例 + 备选；CPA 一次确认 |
| P0-2c | **Migration — Normalizer + Dry-Run + Revert** | entity/state 归一；Dry-run preview（"将生成 N 条 deadline / $X at risk"）；Live deadline genesis 动画；24h Revert |
| P0-2d | Client CRUD | 手动添加与编辑；字段：name / state / county / entity type / tax types / importance / estimated annual revenue |
| P0-3 | Rule Engine v1 | Federal + CA/NY/TX/FL/WA 共 ~25 条核心规则，人工录入，带 source_url + verified_at |
| P0-4 | Obligation Instances | 客户入库后自动生成全年 instances |
| P0-5 | **Dashboard** | 首屏：This Week / Overdue / Waiting on Client / Recently Changed Rules + Penalty Radar 顶栏 |
| P0-6 | **Workboard**（表格） | 可筛选 / 排序 / 批量操作 / 密度切换；字段 ≥ 10 列 |
| P0-7 | Obligation Detail | 侧抽屉展示 readiness / extension / risk / evidence / audit |
| P0-8 | Status State Machine | Not started / In progress / Waiting on client / Needs review / Filed / Paid / Extended / Not applicable |
| P0-9 | **Glass-Box AI** | Weekly Brief / Client Risk Summary / Deadline Tip，全部 citation + source chip |
| P0-10 | **Regulatory Pulse™** | Demo 场景：预置 1 条 IRS 加州灾害公告 + 自动匹配 12 个受影响客户 + Apply + Audit |
| P0-11 | **Penalty Radar™** | 每个 obligation 即时计算 $ 敞口；Dashboard 顶部聚合 |
| P0-12 | Reminders | 应用内 + 邮件（30/7/1 天阶梯）；模板带上下文 |
| P0-13 | Evidence Mode | 任意 AI 句子 / 数字 / risk score 可点开 provenance 抽屉 |
| P0-14 | Audit Log | 状态变更 / Pulse Apply / 批量操作全留痕 |
| P0-15 | Pay-intent Button | "I'd pay $49/mo to keep using this"（不扣费） |
| P0-16 | Security Baseline | HTTPS、传输加密、静态加密、最小权限、WISP v0.5 文档 |

### 4.2 P1 — Nice-to-Have（时间富余再做）

- Light Rollover（Q1 paid → auto-create Q2）
- Extension Decision Panel + What-If Simulator
- CSV / ICS / PDF 导出
- Public State Tracker SEO page（落地页营销用）
- Readiness 字段（Ready / Waiting on client / Needs review）

### 4.3 P2 — 明确不做（14 天内写在 README）

完整 e-file 提交、税额计算、客户门户、文档存储、eSignature、支付、Stripe、短信、Google/Outlook 日历双向、团队 RBAC、多租户组织、完整 50 州、移动 App、Drake / QuickBooks / TaxDome 深度集成、25+ 报告中心。

---

## 5. 功能详述 — 核心页面

### 5.1 Dashboard（首屏）

**Goal:** 30s identify this week's top risks. 5min complete triage.

**Layout（上到下 5 层）：**

```text
┌──────────────────────────────────────────────────────────────────┐
│  Penalty Radar       $12,400 at risk this week   ▲ up $3,100    │
│  ─────────────────────────────────────────────────────────────  │
│  🔴 Critical (3)       🟠 High (7)       🟡 Upcoming (12)        │
├──────────────────────────────────────────────────────────────────┤
│  🚨 Regulatory Pulse — 2 new alerts                              │
│  ├─ IRS: CA storm relief → 12 of your clients affected  [Review] │
│  └─ NY DOR: PTET March 15 reminder → 3 clients          [Review] │
├──────────────────────────────────────────────────────────────────┤
│  AI Weekly Brief                                                 │
│  Top 3 clients to touch first:                                   │
│  1. Acme LLC (CA Franchise Tax, $4,200 at risk) ← source [FTB]   │
│  2. Bright Studio S-Corp (1120-S, 5 days) ← source [IRS]         │
│  3. Zen Holdings (Q1 Est. Tax, waiting on client) ← source [IRS] │
│  [Evidence Mode]  [Regenerate]  [Copy to Slack]                  │
├──────────────────────────────────────────────────────────────────┤
│  This Week (Workboard mini)    [Open full Workboard →]           │
│  Card 1 ... Card 2 ... Card 3 ...                                │
├──────────────────────────────────────────────────────────────────┤
│  Quick Actions: [+ Client] [Import CSV] [Verify Rules]           │
└──────────────────────────────────────────────────────────────────┘
```

**关键交互：**
- Penalty Radar 顶栏：永远在第一屏，数字实时刷新（隐性 polling 60s）
- Pulse Alert 卡片：点击 Review → 侧滑 affected clients 对比视图
- Weekly Brief 的**每一个客户名 / 数字 / 风险短语**都带 citation hover，点开进入 Evidence Mode
- Mobile breakpoint：堆叠纵向，保留 Penalty Radar + Pulse + Brief 三段

### 5.2 Workboard（表格）

**Goal:** 税务人熟悉的高密度表格 + 现代筛选与批量操作。

**列（默认可见 10 列，可自定义至 18 列）：**

`Client ▸ Entity ▸ State ▸ Form/Tax ▸ Original Due ▸ Current Due ▸ Days ▸ $ At Risk ▸ Status ▸ Readiness ▸ Assignee ▸ Last Verified ▸ Source`

**必须支持：**
- 多列排序（shift + click）
- 保存视图（Saved Views：e.g. "CA clients due in 14 days"）
- 批量选择 → 批量改 status / assignee / extended flag
- 密度切换：Comfortable / Standard / Compact（File In Time 用户友好）
- 键盘导航（J/K 上下，E 展开 Evidence，X Extended，F Filed）
- 右键 context menu：Open Detail / Apply Extension / Copy Evidence Link / Export Row

**筛选栏：**
State ∕ Entity ∕ Tax Type ∕ Status ∕ Readiness ∕ Assignee ∕ Verified ∕ At Risk ≥ $ ∕ Days ≤ N

### 5.3 Obligation Detail（侧抽屉）

**结构：**

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
│  ────────────────────────────────────                │
│  If missed 90 days:  ~$4,200                         │
│  [Run What-If Simulator]                             │
├─────────────────────────────────────────────────────┤
│  AI Deadline Tip  [Evidence]                         │
│  "CA Franchise Tax applies to every LLC doing        │
│   business in California, regardless of income [1].  │
│   The $800 minimum is due by the 15th day of the     │
│   4th month after formation [2]..."                  │
│   Sources: [1] CA FTB Pub 3556 · verified 2026-04-12 │
│            [2] CA R&TC §17941 · verified 2026-04-12  │
│   [Human-verified ✓]                                 │
├─────────────────────────────────────────────────────┤
│  📎 Evidence Chain                                   │
│  Rule v3.2 → Client profile → Generated 2026-01-01   │
│  [Open Provenance Graph]                             │
├─────────────────────────────────────────────────────┤
│  🕑 Audit Log                                         │
│  2026-04-22 10:12  Sarah changed status → In progress│
│  2026-04-19 14:03  Pulse applied CA relief update    │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```

### 5.4 Regulatory Pulse Page（亮点页 1）

**入口：** Dashboard Pulse 卡片 / 左侧 Alerts 导航

**层次：**

1. **Alert Feed**（左）
   - IRS / CA FTB / NY DOR / TX Comptroller / FL DOR / WA DOR 公告时间线
   - 每条卡片：source logo · title · published_at · severity · affected_count

2. **Alert Detail**（右）
   - AI-generated 3-sentence summary（with citations）
   - 解析结果：affected jurisdiction / county / tax form / entity type / new deadline
   - 官方来源链接 + "Open original" 按钮
   - **Affected Clients Table**（核心）：before-deadline → after-deadline 两列对比
   - **Apply 按钮**：
     - ☑ Update deadlines for N clients
     - ☑ Add note + source to audit log
     - ☑ Send email summary to all assignees
     - ☑ Mark alert as reviewed
   - 支持 per-client 勾选（默认全勾）

3. **Apply 成功后：**
   - Toast：`Applied to 12 clients. View audit ↗`
   - 每条 obligation 的 Evidence Chain 自动追加这条 Pulse 事件

### 5.5 Evidence Mode（亮点页 2 — 全局浮层）

**触发：** 任意地方按 `E` 键 / 点击 source chip / 点击 "Why?" 按钮

**内容：**

```
┌─── Evidence for: "due in 3 days"  ────────────────┐
│                                                    │
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
│   Statutory basis                                  │
│   ────────────────                                 │
│   CA R&TC §17941                                   │
│                                                    │
│   Human verification                               │
│   ──────────────────                                │
│   Verified by  dueddatehq-ops                      │
│   Verified at  2026-04-12 09:21 PST                │
│   Next review  2026-07-12                          │
│   [✓ Human verified]                               │
│                                                    │
│   If anything above is wrong, [Report issue]       │
└────────────────────────────────────────────────────┘
```

Evidence Mode 必须支持：
- 规则层 → 立法层 → 官方页面 → 人工确认 → 应用到客户的**反向回溯**
- 每个 chip 都有 `from` / `verified` / `confidence`
- AI 生成内容展示 retrieval 到的原始 chunk
- "Copy as citation block" 按钮（把整段带来源复制给客户邮件）

### 5.6 Clients List / Client Detail

- **Clients List**：表格，列 = name / entity / state / tax types / active obligations / $ at risk / last touched
- **Client Detail**：
  - Header: 客户卡片（带 "Copy as email" 的客户级 briefing）
  - Tab 1: Obligations（此客户年度所有 deadlines，时间轴视图）
  - Tab 2: AI Risk Summary（Glass-Box）
  - Tab 3: Audit（此客户所有变更）

### 5.7 Rules（规则中心）

展示 MVP 覆盖的 ~25 条规则，每条：
`jurisdiction · entity · tax type · due-date logic · source_url · verified_by · verified_at · version`

CPA 可以点 "Report issue" 触发人工复核流。  
**MVP 不允许 CPA 自己编辑内置规则**，但允许 `custom_deadline`（手动添加到某客户）。

### 5.8 Migration Copilot Flow（亮点页 3 — 4 步向导）

**入口：** 首次登录自动进入 / Clients 页面右上 `Import` 按钮 / Cmd+K → "Import clients"。

**4 步向导（每步都可后退、每步都留中间态可续接）：**

#### Step 1 — Intake（粘贴即入）

```text
┌──────────────────────────────────────────────────┐
│  Import clients                        Step 1 / 4 │
├──────────────────────────────────────────────────┤
│  Where is your data coming from?                 │
│                                                  │
│   ○ Paste from Excel / Google Sheets (fastest)   │
│   ○ Upload CSV or TSV file                       │
│   ○ I'm coming from…                             │
│     [TaxDome] [Drake] [Karbon] [Lacerte]         │
│     [ProConnect] [QuickBooks] [File In Time]     │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  Paste here — any shape, we'll figure it   │  │
│  │  out. Include header row if you have one.  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│   💡 Tip: You can paste multiple tabs at once.   │
│                           [Continue →]           │
└──────────────────────────────────────────────────┘
```

- 支持：Excel copy（TSV with embedded headers）、CSV、Google Sheets copy、邮件表格 HTML
- 选预设 profile 后，系统自带该平台导出列的 mapping hint（大幅提升 Step 2 置信度）

#### Step 2 — AI Field Mapping（Glass-Box）

```text
┌────────────────────────────────────────────────────────────────┐
│  AI mapped your columns — review and confirm         Step 2/4  │
├────────────────────────────────────────────────────────────────┤
│  Your column       →  DueDateHQ field       Confidence  Sample │
│  ──────────────────────────────────────────────────────────────│
│  "Client Name"     →  client.name              99%     Acme LLC│
│  "Ent Type"        →  entity_type              94%     LLC  [?]│
│  "State/Juris"     →  state                    97%     CA      │
│  "Tax F/Y"         →  tax_year                 81%     2026    │
│  "Resp"            →  assignee_name            76%     Sarah   │
│  "status LY"       →  ⚠︎ ignored (last-year)   —              │
│  "Notes"           →  notes                    92%     …       │
│                                                                │
│  [Re-run AI]   [Export mapping]                                │
│                                           [← Back] [Continue →]│
└────────────────────────────────────────────────────────────────┘
```

- 每一行 hover → 展开 AI 的 reasoning：`"Header contains 'Juris' + 80% of rows match 2-letter state codes → mapped to 'state'"`
- 置信度 < 80% 的行黄色高亮，必须用户点击确认
- 所有字段都有下拉菜单手动覆盖
- `[?]` 对未知枚举值展开一个归一预览（见 Step 3）

#### Step 3 — Normalize & Resolve（AI 归一 + 冲突处理）

```text
┌─────────────────────────────────────────────────────────────┐
│  We normalized 47 values — review if needed       Step 3/4  │
├─────────────────────────────────────────────────────────────┤
│  Entity types                                               │
│    "L.L.C.", "llc", "LLC" (12 rows)   → LLC          [edit] │
│    "Corp (S)", "S Corp" (8 rows)      → S-Corp       [edit] │
│    "Partnership", "Ptnr" (5 rows)     → Partnership  [edit] │
│    ⚠︎ "LP" (2 rows)                    → [?] Needs review    │
│                                                             │
│  States                                                     │
│    "California", "Calif", "CA" (18)   → CA           [edit] │
│    "NY", "New York" (10)              → NY           [edit] │
│                                                             │
│  Conflicts (3)                                              │
│    • "Acme LLC" matches existing client ID 42              │
│      → [Merge] [Overwrite] [Skip] [Create as new]           │
│                                                             │
│                                        [← Back] [Continue →]│
└─────────────────────────────────────────────────────────────┘
```

#### Step 4 — Dry-Run Preview + Live Genesis

```text
┌────────────────────────────────────────────────────────────┐
│  Ready to import                                  Step 4/4 │
├────────────────────────────────────────────────────────────┤
│  You're about to create                                    │
│    • 28 clients                                            │
│    • 143 obligations (full tax year 2026)                  │
│    • Est. $18,400 total exposure this quarter              │
│                                                            │
│  Preview                                                   │
│    Top risk (this week):                                   │
│      Acme LLC — CA Franchise Tax    $4,200 — 3 days        │
│      Bright Studio — 1120-S         $2,800 — 5 days        │
│    [See all 143 →]                                         │
│                                                            │
│  Safety                                                    │
│    ✓ One-click revert available for 24 hours               │
│    ✓ Audit log captures every AI decision                  │
│    ✓ No emails will be sent automatically                  │
│                                                            │
│           [← Back]         [Import & Generate deadlines ▶] │
└────────────────────────────────────────────────────────────┘
```

点击后进入 **Live Genesis Animation**：屏幕中央一条条 deadline 卡片按州/日期涌出，伴随 "+$4,200"、"+$2,800" 的美元敞口浮现，约 4–6 秒后自动跳转 Dashboard，顶栏 Penalty Radar 滚动到本次导入后的总 `$`。

**这 4–6 秒动画是 Demo Day 最关键的情感钩子。**

**导入后 Toast 常驻 24h：**
```
✓ Imported 28 clients, 143 obligations, $18,400 at risk.
[View audit]    [Undo all]
```

---

## 6. 亮点深挖 — Clarity Engine™ 的三根支柱

### 6.1 Glass-Box AI（证据绑定型 AI）

#### 6.1.1 设计原则

- **No citation, no output.** 任何 AI 生成的句子必须带 `[n]` 索引；否则不渲染。
- **Retrieval-before-generation.** 所有 prompt 必须先从 `rule_store` 取 top-k chunk，把 chunk ID 传入；LLM 只能引用传入的 chunk。
- **Refuse gracefully.** 如果 retrieval 为空或置信度 < 0.5，AI 返回：`"I don't have a verified source for this. [Ask a human]"`
- **Never conclude, always check.** 文案白名单：`Confirm...` / `Check whether...` / `Source indicates...`；黑名单：`Your client qualifies...` / `No penalty will apply...` / `This is valid...`

#### 6.1.2 三个 AI 能力（MVP 全部上线）

| 能力 | 输入 | 输出形态 | Prompt 要素 |
|---|---|---|---|
| **Weekly Brief** | 用户所有 open obligations | 3–5 条客户摘要 + 风险原因 + source chip | date, role, rules, client_summary, top_k_rules |
| **Client Risk Summary** | 单客户未来 30 天 | 一段话 + 关键事项 bullet | client_profile, open_obligations, rule_chunks |
| **Deadline Tip** | 单 obligation | 3 段：What / Why / Usually prepare | rule_chunk, entity_type, state |
| **Source Translator（彩蛋）** | 官方公告原文 | 人话 summary（内嵌 Pulse 流程） | raw_text, extraction_schema |

#### 6.1.3 技术要点（§12 会展开）

- Embedding：`text-embedding-3-small`（成本低、够用）
- LLM：GPT-4o-mini（速度 + 成本平衡）；关键输出（Weekly Brief）用 GPT-4o
- Vector store：`pgvector`（Postgres 扩展，零运维）
- Prompt 模板：所有 prompt 版本化存 git（`/prompts/*.md`）
- 输出后处理：正则校验 citation 格式；未命中 → 回退 refusal 文案

### 6.2 Regulatory Pulse™（规则变化监测 + 客户匹配）

#### 6.2.1 监测源（MVP 只接 6 个权威源）

| Source | 类型 | 抓取方式 | 刷新频率 |
|---|---|---|---|
| IRS Newsroom | RSS | RSS → HTML 抽取 | 30 min |
| IRS Disaster Relief | 专题页 | Cheerio 抓列表 | 60 min |
| CA FTB News | RSS | RSS | 60 min |
| NY DTF Tax News | RSS | RSS | 60 min |
| TX Comptroller | 页面 | Cheerio | 60 min |
| FL DOR / WA DOR | 页面 | Cheerio | 120 min |

#### 6.2.2 AI 抽取流水线

```
Raw announcement
  ↓  LLM extraction (schema-first)
{
  "title": "...",
  "jurisdiction": "CA",
  "county": ["Los Angeles"],
  "affected_forms": ["1040", "1120-S"],
  "affected_entity_types": ["Individual", "S-Corp"],
  "new_due_date": "2026-10-15",
  "original_due_date": "2026-04-15",
  "effective_from": "2026-04-22",
  "official_source_url": "https://irs.gov/...",
  "confidence": 0.92,
  "requires_human_review": true
}
  ↓  Match engine
Find clients WHERE state = CA AND (county IN [LA] OR county IS NULL) AND tax_type IN [...]
  ↓  Human review queue
Flag → Ops reviews → Approve → Pulse goes live
```

**关键设计：**
- 所有 Pulse 条目默认 `requires_human_review = true`；MVP 由 ops 人工点 Approve 才进入 Feed
- Demo 时预置 1 条 `IRS CA storm relief` 已审通过，使评委看到完整闭环

#### 6.2.3 Apply 动作的原子事务

```
BEGIN
  FOR each selected client:
    UPDATE obligations SET current_due_date = new, source_ref = pulse_id
    INSERT evidence_link (obligation_id, pulse_id, applied_at, applied_by)
    INSERT audit_event (...)
  INSERT email_job (assignee, summary, obligations)
  UPDATE pulse SET status = 'applied', applied_at, applied_by
COMMIT
```

- 任何一步失败整体回滚
- Undo 支持：Apply 后 24h 内可 Revert（写反向 audit event）

### 6.3 Penalty Radar™（美元敞口引擎）

#### 6.3.1 为什么这件事必须做

CPA 的脑回路：**"客户会怪我什么？"** → 怪你让他多交了钱。DueDateHQ 把风险单位从"天数"换成"美元"，就是直接对接 CPA 的职业恐惧。

#### 6.3.2 敞口计算（纯函数，零幻觉）

```typescript
// All formulas from IRS IRC §6651 & public state statutes.
function estimateExposure(o: ObligationInstance): ExposureReport {
  const months_late = monthsBetween(o.current_due_date, today);
  const failure_to_file = min(0.05 * months_late, 0.25) * o.estimated_tax_due;
  const failure_to_pay  = min(0.005 * months_late, 0.25) * o.estimated_tax_due;
  const interest        = months_late * (AFR_SHORT_TERM / 12) * o.estimated_tax_due;
  const state_surcharge = lookupStatePenalty(o.state, o.tax_type, o.estimated_tax_due, months_late);
  return {
    failure_to_file, failure_to_pay, interest, state_surcharge,
    total: failure_to_file + failure_to_pay + interest + state_surcharge,
    assumptions: [...], // shown in UI
  };
}
```

`estimated_tax_due` 的来源：
- 若客户填过，用客户值
- 否则用行业中位数（按 entity + state + tax type 查 mock table）
- UI 清晰标注 `Based on industry median, edit to personalize`

#### 6.3.3 UI 呈现

- **Dashboard 顶栏聚合**：`This week: $X at risk` + up/down 箭头 + 上周对比
- **每条 obligation**：`$X at risk` 徽章，hover 显示细分
- **What-If Simulator**（P1）：滑块 30 / 60 / 90 / 180 天 → 实时敞口曲线

---

## 6A. 亮点深挖 — Migration Copilot™

### 6A.1 为什么必须作为独立亮点

调研结论一致指向：**CPA 不是被 deadline 教育吓跑的，是被"怎么把 80 个客户搬进来"劝退的。** 如果首次 Setup > 30 分钟，留存必崩。Migration Copilot 不是"一个上传按钮"，而是一条从**粘贴**到**生成全年 deadline + 美元敞口 + Evidence**的自动化流水线。

它的战略价值：

1. **First-run wow**：Demo Day 前 60 秒就能让评委看到产品的"魔法"
2. **获客杠杆**：外部内容可写 "Import from TaxDome in 5 minutes"、"From Excel in 3 minutes"
3. **Clarity Engine 的布道**：Glass-Box 不再是抽象概念，而是用户第一次接触就感受到的
4. **Demo 戏剧性**：**Live Deadline Genesis 动画 + Penalty Radar 数字实时跳动**

### 6A.2 AI Field Mapper 设计

#### 输入

- 表头（第 1 行）
- 前 5 行数据样本
- 可选：用户选的 preset profile（TaxDome / Drake / …）

#### Prompt 结构（schema-first，零幻觉）

```
You are a data mapping assistant for a tax deadline tool.
Given a spreadsheet's header and a sample of 5 rows, map each column to
the DueDateHQ client field set below. Output strict JSON only.

Target fields (schema):
  - client.name          (string, required)
  - entity_type          (enum: LLC / S-Corp / C-Corp / Partnership / Individual / Sole-Prop / LP / Other)
  - state                (enum: 2-letter US state code)
  - county               (string, optional)
  - tax_types            (array of enum)
  - assignee_name        (string, optional)
  - importance           (enum: high / med / low, optional)
  - notes                (string, optional)
  - IGNORE               (explicitly unused column)

For each source column, output:
  { "source": "<header>", "target": "<field|IGNORE>",
    "confidence": 0.0-1.0, "reasoning": "<one sentence>",
    "sample_transformed": "<example of first row after mapping>" }

Rules:
  - If unclear, set target=IGNORE and confidence below 0.5.
  - Never invent target fields not listed above.
  - Explain every decision in ≤ 20 words.
```

#### 后处理

- 正则校验输出 JSON schema
- 置信度 < 0.8 的行 UI 上高亮为"Needs review"
- 所有 mapping 存入 `migration_mapping` 表供 Revert 使用

### 6A.3 AI Normalizer 设计

**核心策略：枚举型字段走 LLM，自由字段走 fuzzy + 字典。**

| 字段 | 归一方式 |
|---|---|
| `entity_type` | LLM 把任意字符串映射到 8 个枚举值之一；未知 → 标 "Needs review" |
| `state` | 先试 2-letter / full name 字典；失败 → LLM 兜底 |
| `tax_types` | 字典表 + LLM（"Fed 1065" → `["federal_1065_partnership"]`） |
| `tax_year` | 正则 `(19|20)\d{2}` + LLM 兜底 |
| `importance` | "A" / "VIP" / "Priority" / "top" → `high`（字典） |
| `county` | 保持原始字符串，不强制归一（州内 county 表过大） |

**每一次归一决策都写进 `evidence_link`**：

```
{
  obligation_or_client_id,
  source_type: 'ai_migration_normalize',
  raw_value: 'L.L.C.',
  normalized_value: 'LLC',
  confidence: 0.97,
  model: 'gpt-4o-mini',
  applied_at: ...,
  applied_by: user_id,
}
```

这意味着 CPA 事后可以在 Client Detail → Audit Tab 看到 **"你这条 LLC 是 AI 从原始 L.L.C. 归一来的，置信度 97%"**。这是 Glass-Box 的一致性体验，不是 Migration 特殊的独立叙事。

### 6A.4 Preset Profiles（导入预设）

MVP 首发预设 **5 个**（对 r/taxpros 最常见的软件）：

| Preset | 来源列命中（示例） | 预设的 column → field 映射 |
|---|---|---|
| `TaxDome` | `Client Name, Entity Type, State, Tax Return Type, …` | 全字段已知 |
| `Drake` | `Client ID, Name, Entity, State, Return Type, …` | 全字段已知 |
| `Karbon` | `Organization Name, Country, …` | 部分已知 |
| `QuickBooks` | `Customer, Billing State, …` | 仅客户元数据 |
| `File In Time` | `Client, Service, Due Date, Status, Staff, …` | 最完整的 one-shot 迁移 |

Preset 的作用不是替代 AI Mapper，而是**给它一个强先验**，让置信度从 75% 跳到 95%+。

### 6A.5 原子导入 + One-Click Revert

#### 导入流程

```
BEGIN TRANSACTION
  INSERT migration_batch (id, user_id, source, row_count, status='pending')
  FOR each row in normalized_rows:
    try:
      INSERT client (... , migration_batch_id)
      generate_obligations_for_client(client)  -- rule engine call
      INSERT evidence_link[] for each AI decision
      INSERT audit_event (action='migration.client.created', batch_id)
    catch:
      INSERT migration_error (batch_id, row, error)
      continue
  UPDATE migration_batch SET status='applied', applied_at, stats_json
COMMIT
```

- 单行失败不阻塞整批（CPA 最讨厌"一条错导致整批不过"）
- 失败行进入 `/settings/migration/<batch_id>/errors` 可下载 CSV + 手改重导

#### Revert 流程（24h 内可用）

```
BEGIN TRANSACTION
  SELECT all client_ids, obligation_ids WHERE migration_batch_id = X
  DELETE obligations WHERE id IN (...)
  DELETE evidence_links WHERE migration_batch_id = X
  DELETE clients WHERE id IN (...) AND no foreign_ref exists
  INSERT audit_event (action='migration.reverted', batch_id, by_user)
  UPDATE migration_batch SET status='reverted'
COMMIT
```

- 24h 过后按钮灰化，理由：防止删除已被用户后续操作产生关联的数据
- Revert 不可再 Revert；但用户可以重新导入

### 6A.6 Migration Report（战报邮件）

导入完成 60 秒后发送给 owner：

```
Subject: DueDateHQ import complete — 28 clients, $18,400 at risk

Summary
  ✓ 28 clients created
  ✓ 143 obligations generated for tax year 2026
  ⚠ 3 rows skipped (see below)
  🔔 Next deadline: Acme LLC — CA Franchise Tax in 3 days

Top 5 at-risk this quarter
  1. Acme LLC ..................... $4,200
  2. Bright Studio S-Corp ......... $2,800
  3. Zen Holdings ................. $1,650
  4. …
  5. …

Skipped rows (3)
  Row 17: "state" = "—", could not be normalized
  Row 23: "entity_type" = "Trust", not in MVP scope
  Row 29: duplicate of existing Acme LLC, marked as skip

You can undo this import for the next 24 hours.
  https://app.duedatehq.com/settings/migration/batch_xx/revert
```

### 6A.7 安全与合规护栏

- MVP 仍坚持不收 SSN / 完整税额（§12.1）
- 如果 paste 内容中检测到类似 SSN 的模式（`\d{3}-\d{2}-\d{4}`），前端直接红色警示并拒绝该列导入
- 所有 AI mapping / normalize 调用在 **client-side redact PII → 仅发字段示例字符串到 LLM**，不发全表
- Prompt 中明示："Do not retain any data seen for training"，并使用 OpenAI 的 `zero data retention` endpoint（有 $$ 问题时可改为 Azure OpenAI）

---

## 7. 现代化 UI / UX 规范

### 7.1 视觉语言

- **字体**：Inter（正文）+ JetBrains Mono（数字、日期、金额）
- **主色**：Deep Indigo `#1E1B4B`（权威）+ Electric Emerald `#10B981`（安全）+ Amber `#F59E0B`（风险）+ Ruby `#EF4444`（危急）
- **暗黑模式**：一等公民，与浅色同开发量（税季凌晨 2 点友好）
- **圆角**：组件 8px，大卡片 16px
- **密度**：默认 Comfortable；提供 Compact 给重度用户（File In Time 用户心智）
- **阴影**：两级（hover / modal），其余零阴影
- **动效**：< 200ms；Penalty Radar 数字滚动 / Pulse 卡片脉冲高亮

### 7.2 交互亮点

- **Cmd / Ctrl + K** 全局命令面板（新建客户、跳转客户、触发 AI 重新生成 brief）
- **Cmd / Ctrl + E** 任意选中文本打开 Evidence Mode
- **/** 快捷唤起 AI 聊天抽屉（附带全上下文自动 RAG）
- **Hover-citation preview**：引用 chip hover 0.5s 弹出迷你来源卡
- **Copy as citation block**：一键复制"内容 + 来源 + 验证时间戳"给客户邮件（CPA 杀手锏）
- **Keyboard-first**：主流操作全部支持键盘（J/K/E/X/F/A）

### 7.3 无障碍

- 遵循 WCAG 2.2 AA：色盲友好的风险色 + 双编码（颜色 + 图标）、键盘完整可达、焦点可见、ARIA landmarks
- 所有 AI 输出有 `lang="en"` 声明，屏幕朗读器友好

### 7.4 响应式

- Desktop（主场）：≥ 1280px 三栏
- Laptop：1024–1279 两栏
- Tablet：768–1023 单栏 + 可折叠侧栏
- Mobile：< 768 只读优先，Dashboard 顶三段 + Workboard 简化卡片列表

---

## 8. 信息架构

一级导航 **6 项**，绝不超：

```
┌────────────────────────────────┐
│  [Logo] DueDateHQ              │
│                                │
│  ● Dashboard                   │
│    Workboard                   │
│    Clients                     │
│    🚨 Alerts   ← Pulse         │
│    Rules                       │
│    Reports (P1)                │
│                                │
│  ─────                         │
│  [+ Import]   ← Migration 入口 │
│  ─────                         │
│  [firm name] ▾                 │
│  Settings / Audit / Sign out   │
└────────────────────────────────┘
```

不建 Intake / Review / Extension 独立导航，它们是 obligation 的 **状态层**，内嵌在 Workboard / Client Detail / Obligation Detail。

**Migration 的入口策略：**
- **首次登录强制进 Migration Copilot**（空态首页 = Import 向导）
- 侧栏底部常驻 `+ Import` 按钮
- Settings → Migration 页列出历史 batches + Revert 按钮

---

## 9. 数据模型

### 9.1 核心实体（简化）

```
Firm (MVP 单租户单 firm)
  id, name, timezone, plan, created_at

User (MVP 单用户 owner)
  id, firm_id, email, role, mfa_enabled

Client
  id, firm_id, name, entity_type, state,
  county, tax_types[], importance, notes,
  estimated_annual_revenue, assignee_id

ObligationRule
  id, jurisdiction, entity_applicability[], tax_type,
  form_name, due_date_logic (DSL / json),
  extension_policy, is_payment, is_filing,
  source_url, statutory_ref,
  verified_by, verified_at, next_review_at,
  version, active

ObligationInstance
  id, firm_id, client_id, rule_id, rule_version,
  tax_year, period,
  original_due_date, current_due_date,
  filing_due_date, payment_due_date,
  status (enum), readiness (enum), extension_decision (enum),
  estimated_tax_due, estimated_exposure_usd,
  assignee_id, notes, created_at, updated_at

EvidenceLink (核心 provenance 表)
  id, obligation_instance_id | ai_output_id,
  source_type (rule / pulse / human_note),
  source_id, source_url,
  verified_at, verified_by,
  confidence, raw_snippet

Pulse (Regulatory Pulse)
  id, source, source_url, raw_content, published_at,
  parsed_jurisdiction, parsed_counties[], parsed_forms[],
  parsed_entity_types[], parsed_new_due_date,
  parsed_effective_from, confidence,
  status (pending_review / approved / applied / rejected),
  reviewed_by, reviewed_at

PulseApplication
  id, pulse_id, obligation_instance_id,
  applied_by, applied_at, reverted_at

AiOutput
  id, firm_id, user_id, kind (brief / tip / summary),
  prompt_version, model, input_context_ref,
  output_text, citations[], generated_at

AuditEvent
  id, firm_id, actor_id, entity_type, entity_id,
  action, before_json, after_json, reason, created_at

Reminder
  id, obligation_instance_id, channel (email / in_app),
  offset_days, sent_at, clicked_at

MigrationBatch
  id, firm_id, user_id, source (paste / csv / preset_name),
  raw_input_ref,           -- S3 key of original paste/csv (for revert)
  mapping_json,            -- final column → field mapping (after AI + user confirm)
  row_count, success_count, skipped_count,
  preset_used,             -- nullable
  status (draft / mapping / reviewing / applied / reverted / failed),
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

(All Clients / Obligations created via import carry nullable
 `migration_batch_id` for O(1) revert lookup.)
```

### 9.2 关键索引

- `obligation_instance (firm_id, current_due_date)` — Dashboard / Workboard 核心查询
- `obligation_instance (firm_id, status, current_due_date)`
- `client (firm_id, state)` — Pulse 匹配
- `client (migration_batch_id)` — Revert 用
- `obligation_instance (migration_batch_id)` — Revert 用
- `evidence_link (obligation_instance_id)` — Evidence Mode
- `evidence_link (source_type, source_id)` — Migration decision 反查
- `pulse (status, published_at desc)` — Alerts feed
- `migration_batch (firm_id, created_at desc)` — Settings 历史页
- pgvector 索引于 `rule_chunks.embedding`

---

## 10. AI 架构（Clarity Engine 细节）

### 10.1 RAG Pipeline

```
User Event (page load / Apply / Ask)
  ↓
Retrieval
  - Query builder → embedding → pgvector top-k (k=6)
  - Filter by firm_id / jurisdiction / entity_type
  ↓
Prompt Assembly
  - System prompt (glass-box persona, refusal rules)
  - Retrieved chunks with [n] IDs
  - User context (client list summary, today's date, role)
  ↓
LLM call (GPT-4o-mini for tips, GPT-4o for Weekly Brief)
  ↓
Post-processing
  - Regex validate citations [n]
  - Hallucination guard: every [n] must exist in retrieved chunks
  - If validation fails → retry once → else show refusal
  ↓
Render
  - Citations as clickable chips → Evidence Mode
  - Store AiOutput row with prompt_version + model + input hash for audit
```

### 10.2 Prompt Versioning

`/prompts/weekly_brief.v3.md` 等，prompt 文件在 git 里，`prompt_version` 入库。后续 A/B 测试和回溯都可做。

### 10.3 Fallback & Cost Control

- 所有 AI 调用包在 try-catch，失败 → 展示缓存的上次输出 + 警示条
- 每个 firm / day 限 100 次 AI 请求（MVP 防止烧钱）
- Weekly Brief 每 firm 每天生成 1 次并缓存

---

## 11. 技术架构

### 11.1 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 前端 | **Next.js 15 (App Router) + React 19 + TypeScript** | SSR / RSC 兼顾速度与 SEO；现代 UX 上限高 |
| UI kit | **shadcn/ui + Tailwind 4 + Radix primitives** | 组件质量现代 + 可深度定制 + 无锁定 |
| 数据表 | **TanStack Table v8** | Workboard 的虚拟滚动 / 排序 / 筛选刚需 |
| 图标 | **Lucide** | 轻量、一致性 |
| 状态 | **React Query** + URL state | 服务端状态为主，URL 驱动筛选 |
| 后端 | **Next.js Route Handlers / Server Actions** + **Hono**（若需 API 分离） | 14 天一套 stack；零 glue |
| 数据库 | **PostgreSQL 16** + **pgvector** | 关系 + 向量一体，零运维 |
| ORM | **Drizzle** | TS-first、schema 迁移可控 |
| 缓存 / 队列 | **Upstash Redis + QStash** | Serverless-friendly，Pulse / Reminder 异步 |
| 邮件 | **Resend** | 开发者体验最好，14 天够 |
| Auth | **Auth.js (NextAuth v5)** — Email magic link | 最快落地 |
| AI | **OpenAI `text-embedding-3-small` + GPT-4o-mini / GPT-4o** | 成本 + 质量 |
| 监控 | **Sentry + Axiom** | 前后端 + 日志 |
| 部署 | **Vercel**（主） + **Neon**（Postgres） + **Upstash**（Redis） | 全 Serverless，0 DevOps |

### 11.2 架构图

```
          ┌────────────────────────────────┐
          │          Browser (Next.js)      │
          │   Dashboard / Workboard / UI    │
          └────────────┬────────────────────┘
                       │ (HTTPS, RSC + actions)
          ┌────────────▼────────────────────┐
          │        Next.js Edge / Node      │
          │   Route Handlers · Server Acts  │
          └────┬────────────┬───────────┬───┘
               │            │           │
     ┌─────────▼───┐  ┌─────▼────┐  ┌──▼──────┐
     │  Postgres   │  │  Upstash │  │ OpenAI  │
     │ + pgvector  │  │ Redis +  │  │ GPT-4o  │
     │  (Neon)     │  │  QStash  │  │  +      │
     └─────────────┘  └─────┬────┘  │ embed   │
                            │       └─────────┘
                  ┌─────────▼──────────┐
                  │  Pulse Worker      │
                  │  (cron via QStash) │
                  │  - RSS ingest      │
                  │  - LLM extract     │
                  │  - Client match    │
                  └─────────┬──────────┘
                            │
                  ┌─────────▼──────────┐
                  │  Resend (Email)    │
                  └────────────────────┘
```

### 11.3 关键模块

```
/app                        Next.js App Router
  /(dashboard)              主应用
  /(marketing)              外部营销页 / Public State Tracker
/components
  /ui                       shadcn primitives
  /evidence                 Evidence Mode 抽屉组件（复用）
  /penalty                  Penalty Radar 徽章 + 顶栏
  /pulse                    Alert feed + apply panel
  /workboard                TanStack Table 封装
/components
  ...
  /migration                Intake / Mapper / Normalize / Preview / Genesis animation
/lib
  /rules                    Rule engine + DSL parser
  /penalty                  IRS/state penalty formulas (pure fn)
  /ai                       RAG pipeline, prompt templates
  /pulse                    RSS fetchers + LLM extractor + matcher
  /migration                Parsers (CSV/TSV/paste) + AI Mapper + Normalizer + presets
/prompts                    Markdown prompt templates (git versioned)
/db
  /schema                   Drizzle schemas
  /seed                     Rules seed + demo client seed + sample CSVs (all 5 presets)
/workers                    QStash-triggered jobs (pulse, reminders, migration async)
```

---

## 12. 安全与合规

### 12.1 最小必要数据

**MVP 绝不存**：SSN、完整税表金额、银行账号、W-2/1099 具体数字。  
**MVP 只存**：客户名 / 州 / 实体类型 / tax types / 预估年营收（粗档）+ obligation 元数据。

这是关键战略决策：让 DueDateHQ 在 IRC §7216 与 FTC Safeguards Rule 下尽可能轻，**不碰红线**。

### 12.2 必须做

- HTTPS 全站（Vercel 默认）
- 传输加密 TLS 1.2+、静态加密（Neon 默认）
- Auth：Email magic link + 会话 7 天
- MFA：Owner 必开（Auth.js TOTP，14 天内做最小可用）
- RBAC：MVP 单用户也要有 role 字段 + 最小权限校验
- 审计日志：所有状态变更、Pulse apply、批量操作
- 备份：Neon 自动每日备份 + 保留 7 天
- **WISP v0.5**：交付一份 3-page 的 Written Information Security Plan（交付物）
- 隐私声明：客户数据不训练任何外部 AI、仅用于 service delivery

### 12.3 明确不碰的红线（14 天）

- 不成为 IRS authorized e-file provider（申请最长 45 天）
- 不处理 IRS Publication 1345 范围的数据
- 不做 direct tax filing transmission
- 不申请 SOC 2 正式审计
- 不承接 CCPA 阈值以上数据量的营销使用

---

## 13. 14 天极限计划

### 13.1 日程（2026-04-22 至 2026-05-05）

| 日 | 日期 | 交付物 | 关键风险 |
|---|---|---|---|
| D1 | 04/22 | PRD 冻结；技术选型冻结；仓库 init；Figma 主要线框 | 范围漂移 → 签字冻结 |
| D2 | 04/23 | Auth + Firm/User 模型；shadcn 主题；空壳页面 + 空态首页指向 Import 向导 | 认证卡住 → 先用 magic link |
| D3 | 04/24 | **Migration Copilot Step 1–2**：Paste-anywhere + CSV/TSV 解析 + AI Field Mapper（真跑）+ 5 个 preset profile | 粘贴解析奇葩数据 → 先抓 90% 的 TSV/CSV，剩余下周 |
| D4 | 04/25 | **Migration Copilot Step 3–4**：AI Normalizer + 冲突处理 + Dry-Run Preview + **原子导入** + **24h Revert** | 事务边界 → 写成一个 Server Action 单测 |
| D5 | 04/26 | Rule engine v1：25 条规则（Federal + 5 州）入库；导入后自动生成 instances；Live Genesis 动画 | 规则录错 → 双人复核签字 |
| D6 | 04/27 | Workboard 主表 + TanStack + 多列筛选 + 保存视图 | 表格性能 → 虚拟滚动 |
| D7 | 04/28 | Dashboard：三段式 + **Penalty Radar 顶栏** + Week Brief 占位 | Penalty 公式 → 单测覆盖 |
| D8 | 04/29 | **Glass-Box AI：Weekly Brief 真实可跑 + 引用校验 + Deadline Tip** | Hallucination → 强约束 prompt |
| D9 | 04/30 | Obligation Detail 抽屉 + **Evidence Mode v1**（对 Migration 与 Rule 双重复用） | UI 堆料 → 砍 nice-to-have |
| D10 | 05/01 | **Regulatory Pulse：RSS ingest + LLM extract + 匹配引擎 + 预置 1 条 Demo 场景** | Source 难抓 → 退回 mock + 真实 1 条 |
| D11 | 05/02 | Pulse Apply 原子事务 + Audit + Reminders（email + in-app）+ Migration Report 邮件 | Resend 限速 → 提前开通 |
| D12 | 05/03 | 全 P0 bug 扫除；Penalty Radar $ 聚合；WISP 文档；5 套 sample CSV 打磨 | 缺陷堆积 → P1 砍掉 |
| D13 | 05/04 | 3 位 friends&family CPA 试跑真实 Migration；Demo 脚本；pitch 幻灯片；**Live Genesis 动画打磨** | 反馈爆炸 → 只修 P0 |
| D14 | 05/05 | RC build；Demo day；Go/No-Go | 现场事故 → 录屏备份 |

**关键调度变更**：Migration Copilot 被提到 D3–D4 做完（比规则引擎更早），因为：
1. 它是首次登录路径，没有它后面所有功能都"没客户可测"
2. Rule engine 可以用种子数据跑，但 Live Genesis 动画必须靠真导入触发
3. D3–D4 完成后 D5 的 rule engine 可以**直接调试导入流**，天然联调

### 13.2 必须冻结的事

- D1 签字：§4.1 的 16 个 P0 即全部范围，之后任何新增需求 → D15+
- D7 end：所有 AI prompt 冻结（只修 bug）
- D11 end：所有 UI 冻结（只修文案与字号）
- D12 起禁止加新 commit 到 main 以外

### 13.3 风险缓冲

- 预留 2 天作为 "crash budget"（D13–D14 可作为 buffer）
- 每个 P0 模块有明确的 "degraded mode" 退路（如 Pulse 真抓不到就全 mock）

---

## 14. Go-to-Market（14 天内能准备的）

### 14.1 定价（首发建议）

| Plan | 价格 | 目标 | 包含 |
|---|---|---|---|
| **Solo** | $39 / mo | 独立 CPA | 全部 P0 能力，100 clients |
| **Firm** | $99 / mo | 2–5 人小所 | + 多席位（5）、assignee、共享视图 |
| **Pro** | $199 / mo | 6–10 人 | + SSO、API、优先支持、2000 clients |
| Trial | 14 天免费，无信用卡 | 全部新用户 | 全功能 |

### 14.2 着陆页（Public）

- `/` Product marketing（带 Demo video loop）
- `/pulse` Regulatory Pulse 实时流（SEO 爆款，内容自动更新）
- `/state/california` 之类：Public State Tracker（SEO 长尾）
- `/security` WISP 摘要 + 数据边界
- `/pricing` 三 tier

### 14.3 Demo 前 10 条可发布内容主题

1. 2026 Federal Tax Deadlines for Small CPA Firms
2. California Franchise Tax: What Every LLC CPA Needs to Know
3. NY PTET Election: The Deadline Every Partner Forgets
4. Texas Franchise Tax in Under 5 Minutes
5. Why Your Tax AI Needs a "Source" Button
6. IRC §7216 and Why Your AI Notes Must Be Auditable
7. A CPA's Guide to Disaster Relief Deadlines
8. From Excel to Workboard: 30-min CPA Migration Guide
9. Penalty Math: How Much a Missed 1120-S Actually Costs
10. Building a WISP in a Day

### 14.4 试点招募

- 发 30 封 cold email to r/taxpros active solo CPAs → 目标 10 位种子
- 1:1 demo 15 分钟，录屏
- 退出访谈 45 分钟

---

## 15. 指标与成败判据

### 15.1 North Star

> **Weekly Triage Completion** — 周一 8:00–11:00 内完成一次分诊 session 的 firm 数 / 活跃 firm 数。目标 ≥ 50%。

### 15.2 MVP KPI（首 4 周）

| 指标 | 目标 | 测量方式 |
|---|---|---|
| **Migration Time-to-First-Value** | **P50 ≤ 10 min** | signup → 第一次看到 Penalty Radar $ 数字 |
| **Migration Completion Rate** | **≥ 70%** | 进入 Step 1 的用户中，完成 Step 4 Import 的比例 |
| **Migration Mapping Confidence** | **≥ 85%** 平均自动字段置信度 | AI Mapper 返回的 confidence 均值 |
| **Migration Revert Rate** | **≤ 10%** | 24h 内 Revert 的 batch / 全部 batch |
| Setup 耗时 | P50 ≤ 15 min | signup → first calendar generated |
| Week-1 回访 | ≥ 2 次 / 用户 | unique login days |
| Week-2 回访 | 10 人中 ≥ 5 人 | 第 8–14 天 ≥ 1 次登录 |
| 分诊 session 耗时 | P50 ≤ 10 min | 第 2+ 次 session 时长 |
| Evidence 点击率 | ≥ 30% 周活用户 | `E` 键 / source chip 点击 |
| Pulse Review 耗时 | ≤ 3 min | alert 打开到 apply |
| AI Brief 有用率 | ≥ 5 / 10 人认为有价值 | 退出访谈 |
| 付费意愿点击率 | ≥ 30% | $49 按钮 |
| 日历编辑率 | < 20% | 用户 override 系统日期占比 |

**前 4 条 Migration 指标是核心获客漏斗**。如果 Migration Time-to-First-Value > 10min，后面所有 Clarity Engine 的指标都无法成立。

### 15.3 Go / Gray / Rethink

- **Go**：Week-2 回访 ≥ 5 ∧ ≥ 3 位愿付费 ∧ ≥ 5 位觉得 AI 有用 ∧ 编辑率 < 30%
- **Gray**：Week-2 回访 5–7 ∧ 付费意愿 < 3 → 重新审视 ICP / 定价
- **Rethink**：Week-2 回访 < 4 ∨ > 50% 觉得不如 Excel ∨ 编辑率 > 40%

---

## 16. Demo Day 脚本（6 分钟）

### 16.1 6 屏 × 60 秒节奏

| 秒 | 屏 | 解说 |
|---|---|---|
| 0–30 | **Landing / Pitch 句** | "File In Time solved deadlines for the desktop era. DueDateHQ solves deadline intelligence for the AI era. I'll show you two things no one else will: the only tax AI you can legally defend, and the fastest migration from Excel a CPA has ever seen." |
| 30–90 | **🎬 Migration Copilot（激活亮点）** | 打开空态首页 → Paste 一张"乱糟糟的 TaxDome Excel"（28 行，含 `L.L.C.`、`Calif`、`Corp (S)`）→ AI Mapper 秒出映射 + 置信度 → Step 3 归一 → **Step 4 Dry-Run**：`28 clients, 143 obligations, $18,400 at risk` → 点 Import → **Live Genesis 动画**：4 秒内满屏 deadline 卡片涌出，Penalty Radar 顶栏从 $0 滚到 $18,400 |
| 90–150 | **Monday Triage（Dashboard）** | Penalty Radar 顶栏 $18,400 → AI Weekly Brief 带 citation → hover 引用 chip 显示来源 → 展开 Evidence Mode |
| 150–240 | **Regulatory Pulse（日常亮点）** | 左侧 Alert Feed → 打开 IRS CA Storm Relief → 右侧 12 位受影响客户 before/after 对比 → 一键 Apply → Audit log 滚动 |
| 240–300 | **Obligation Detail + Penalty What-If** | 打开 Acme LLC → Penalty 分解 → 拖 What-If 滑块到 90 天 → $4,200 敞口动态变化 |
| 300–360 | **Evidence 收束 + 付费按钮** | 回到 Client Detail → Audit Tab → 显示**"此客户从 migration batch #1 导入，原始 entity 为 'L.L.C.'，AI 归一为 LLC，置信度 97%"** → 按 E 打开完整 Evidence Drawer → 点 "I'd pay $49/mo" → toast → 结束 |

**叙事闭环**：Migration 让你看到**第 1 秒**的价值，Clarity Engine 让你看到**第 7 天**的价值，Evidence Mode 证明**两者都能被 IRS 审计**。

### 16.2 Demo 必须预置

- 1 份"故意乱糟糟"的 TaxDome export Excel（28 行，包含 `L.L.C.`/`Calif`/`Corp (S)` 等脏数据）**— 现场粘贴演示用**
- 1 份干净 TaxDome preset Excel（备用 Plan B，防现场 AI 抖动）
- 1 条 approved IRS Pulse（CA storm relief）
- 1 条 NY PTET reminder
- 25 条规则全 verified
- 1 条预置 AI Weekly Brief 缓存（防现场 LLM 抖动）
- 1 段 4K 录屏版 Live Genesis 动画（防 Vercel 现场抖动）

### 16.3 录屏 Plan B

即使现场 Wi-Fi 挂掉，也有 4K 录屏 + 高质量解说音轨可直接播。

---

## 17. 交付物清单（D14）

| 交付 | 形态 | 验收标准 |
|---|---|---|
| Production build | URL（Vercel） | 5 屏跑通无错 |
| 源码仓库 | GitHub | README + setup < 10 min |
| 种子数据 | SQL dump | 一键 restore |
| Demo 视频 | MP4 4K | 5 分钟，字幕 |
| Pitch deck | PDF + Keynote | 10 页以内 |
| WISP v0.5 | PDF | 3 页 |
| Public Pulse page | URL | 首批 ≥ 5 条真实 alert |
| 试点反馈 | Notion | ≥ 3 位 CPA 反馈 |
| 付费意愿数据 | CSV | 点击率报表 |
| PRD（本文档） | Markdown | 冻结 commit |

---

## 18. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| AI 幻觉导致错误税务内容 | 中 | 高 | 强 RAG + citation 校验 + 黑白名单文案 + 显著"Not tax advice"声明 |
| Pulse RSS 抓取不稳 | 高 | 中 | 6 源冗余 + 失败降级为 mock + 1 条预置真实场景 |
| 规则录入错误 | 中 | 高 | 25 条人工复核双人签字 + verified_by 留痕 + report issue 回路 |
| **Migration AI Mapper 置信度低** | 中 | **高** | Preset profiles（5 个）给强先验 + 低置信度 UI 强制确认 + 所有映射可后悔 |
| **Migration 原子事务失败** | 低 | **高** | 单行失败不阻塞整批 + 失败行导出 CSV 可补录 + Revert 24h |
| **粘贴含 PII（SSN）** | 中 | 中 | 前端正则拦截 + 该列强制 IGNORE + 红色警示 |
| 14 天工期紧 | 高 | 高 | 每日站会 + P1 砍到零无悔 + 预留 crash budget |
| 现场 LLM 抖动 | 中 | 中 | 缓存 Weekly Brief + Migration Mapper 结果可缓存 + 录屏备份 |
| 数据泄露 | 低 | 高 | MVP 最小必要数据 + TLS + 加密 + WISP |
| 与其他参赛队伍同质 | **高** | **致命** | **Clarity Engine™ + Migration Copilot™ 双叙事 + Evidence Mode 视觉识别 + Penalty $ 数字** |
| 评委 Demo 60s 内记不住 | 中 | 致命 | Pitch 第一句话 + **Live Genesis 动画戏剧性** + Penalty Radar 顶栏 + Pulse 一键 Apply |
| **同期其他队也做 CSV 导入** | 高 | 中 | 对方必做"上传按钮级"；我们是 **粘贴即入 + AI 置信度 + Dry-Run Preview + Live Genesis + Revert** 的一整条流水线 |

---

## 19. 附录

### 19.1 竞品价格锚点（2026-04 公开信息）

- File In Time: ~$199/user 首年 + $100/user 年维护（flyer）
- Jetpack Workflow: $49/user/mo
- Financial Cents: $19 / $49 / $69
- Karbon: $59–$99/user/mo
- TaxDome: $800–$1,200/user/year
- Canopy: $74 / $109 / $149

### 19.2 官方数据源（MVP 硬编码）

- IRS Publication 509: Tax Calendars
- IRS Form 7004 Instructions（extension 不延 payment）
- CA FTB Publication 3556（LLC franchise）
- NY Tax Law §860 及 PTET 指南
- TX Tax Code §171（franchise tax）
- FL DOR 年度日历
- WA DOR B&O tax

### 19.3 术语表

- **Obligation Instance**: 客户 × 规则 × 税年 的一条可执行任务
- **Evidence Chain**: obligation / AI output / migration decision 到原始官方来源的可追溯链路
- **Pulse**: Regulatory Pulse 单条公告事件
- **Pulse Application**: Pulse 应用到某个客户的单次记录
- **Glass-Box**: 所有 AI 输出强制 provenance 的产品纪律
- **Migration Batch**: 一次从外部数据源导入的事务单元，原子提交 + 24h 可 Revert
- **Live Genesis**: 导入完成瞬间屏幕上 deadline 卡片涌出 + Penalty Radar 滚动的动画
- **WISP**: Written Information Security Plan（IRS Pub 5708 要求）

### 19.4 何时打破 PRD

只有两种情况可以推翻 §4.1 的 P0 冻结：

1. 真实 CPA 在 ≥ 3 次试用中均反馈"没 X 就不能用"（需录屏证据）
2. §18 任一 Critical 风险实现，且无 degraded mode

否则：**任何新需求，一律 D15+。**

---

## 20. 对评委的一句话

> **Most tax tools make CPAs earn their value. DueDateHQ earns it back in the first 10 minutes.**
>
> Paste a spreadsheet. Watch 143 deadlines appear. See $18,400 at risk. Click any number — it shows its work.
>
> **Every tax AI today is a confident stranger. DueDateHQ is a tax AI that shows its work** — from the very first paste to the IRS-auditable weekly brief.

**Build it. Ship it. Show the work.**
