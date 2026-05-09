# DueDateHQ PRD v1.0 — File In Time 的 AI-Native 云端替代品

> 历史归档：本文保留早期竞品/产品构想，技术栈中的 Next.js / Vercel / Postgres / Upstash 不是当前工程决策。当前工程权威口径以 `docs/dev-file/*` 为准：`apps/marketing` Astro 公开站 + `apps/app` Vite SPA + `apps/server` Cloudflare Worker。

> 文档类型：产品需求文档（PRD）
> 版本：v1.0（14 天 MVP 冲刺版）
> 作者：Product
> 最后更新：2026-04-22
> 执行口径：本文档严格遵守 `docs/report/DueDateHQ - MVP 边界声明.md` 的"做/不做"边界，并在此基础上补齐现代化 UI、AI 能力与一项"其他人做不到"的差异化亮点。
> 语言：对外产品文案 English-first，本文档为内部 PRD 使用中文书写；所有代码注释统一使用英文。

---

## 0. 一句话说明

**DueDateHQ is the AI-native deadline intelligence console for US CPAs — it replaces File In Time's desktop deadline tracker with a cloud-first, AI-augmented weekly triage cockpit that doesn't just remind you of deadlines, but tells you which of your clients are about to be impacted by a rule change before you hear about it.**

---

## 1. 背景与机会

### 1.1 竞品 File In Time 的缺口

File In Time 验证了"deadline-first 工作流"对税务从业者的价值，但它是 Windows 桌面/网络盘时代的产物。根据 `docs/report/DueDateHQ_FileInTime_竞品分析.md` 的研究，它有六个无法弥补的结构性缺口：

| #   | 缺口                                                                                | 后果                                                               | DueDateHQ 的机会                                   |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| 1   | 桌面/网络盘部署                                                                     | 无远程协作、无多设备、无实时同步                                   | 云端 SaaS，浏览器即开即用                          |
| 2   | 缺少税务规则变化 → 受影响客户的自动链路                                             | CPA 要手动去 IRS/州税局官网盯公告                                  | **★ 亮点 A：Autopilot Regulatory Radar**           |
| 3   | **迁移摩擦高**：CSV 导入需手动字段映射，从 Excel/TaxDome/Drake 搬 80 个客户要数小时 | **trial-to-paid 转化被卡死**——用户嘴上说"好用"，但不愿花半天搬数据 | **★ 亮点 B：AI Migration Copilot**（见 §2.4）      |
| 4   | 无开放 API/生态                                                                     | 信息孤岛                                                           | 第二阶段接入 QBO/Calendar                          |
| 5   | AI 能力基本缺席                                                                     | 无法解释、无法摘要、无法优先级分诊                                 | AI Weekly Brief、Client Risk Summary、Deadline Tip |
| 6   | 安全与合规叙事不足                                                                  | 无 audit log、无 source traceability、无 version history           | Source-verifiable 证据链 + human-verified 徽章     |

**关于缺口 #3 的商业意义**：迁移摩擦不是"上手体验差"，而是"不愿从试用走到真实替代旧工具"的核心原因。竞品研究报告（`DueDateHQ_FileInTime_竞品分析.md` §6.1）明确把 CSV 导入 + AI 字段映射列为 P0-1。MVP 边界声明 v0.3 把它列入"当前不做"是为了 14 天瘦身，但这样做的代价是 trial-to-paid 转化被卡在"我得录 80 个客户"这一关。本 PRD 把它提升为 P0，并用 AI 把它做成第二差异化亮点。

### 1.2 目标市场

- **ICP（种子用户）**：还在用 Excel / Google Sheets / Outlook 管理多客户、多州税务截止日的美国独立 CPA 和 1–3 人小型事务所 owner。
- **客户组合**：服务 20–100 位活跃客户；至少 2 位客户落在 CA / NY / TX / FL / WA；客户包含 LLC / S-Corp / Partnership。
- **规模锚点**：NASBA 数据 2025 年全美 65.3 万活跃 CPA；AICPA 将 small firm 定义为独立执业到 30 人团队。

### 1.3 "为什么是现在"

- 每月 IRS / 州税局都会发布若干灾害延期、表格变更公告；过去 6 个月 IRS 分别对 WA、LA、TN 发布了新 deadline（见 `DueDateHQ_行业深度调研报告.md`）——这是一个每月都在真实发生的 CPA 痛点。
- GPT-4.1 级别的 LLM 已经能把官方公告稳定结构化为 `(jurisdiction, county, entity, form, new_date, source)` 元组。这是 2024 年之前做不到、2026 年刚好成熟的窗口。

---

## 2. 战略定位与脱颖而出的亮点

### 2.1 一句话定位

> **"File In Time solved deadline tracking for the desktop era. DueDateHQ solves deadline intelligence for the AI era."**

### 2.2 核心产品判断

DueDateHQ ≠ 更漂亮的日历；≠ 通用任务管理；≠ TaxDome / Karbon 式事务所操作系统。

**DueDateHQ = 每周税务截止日优先级分诊台 + 两大 AI 护城河：**

1. **★ 亮点 A · Autopilot Regulatory Radar**（§2.3）——AI 替 CPA 盯**外部**监管变化
2. **★ 亮点 B · AI Migration Copilot**（§2.4）——AI 替 CPA 搬**内部**历史数据

两个亮点一外一内：Radar 解决"**留存**"（客户来了有持续价值），Migration 解决"**转化**"（客户能真正落地搬进来）。都用 AI、都可防御、都是 File In Time 做不到的。

### 2.3 脱颖而出的亮点 A ★★★ — Autopilot Regulatory Radar

> 这是本 PRD 给你设计的**"其他人都做不到的亮点"**。单独给一节，是因为它是 14 天内就能交付骨架、但会成为未来内容+数据护城河的核心武器。

#### 2.3.1 它解决什么问题

传统 CPA 面对监管变化的工作流是：

1. 自己刷 IRS Newsroom / FTB / DOR 官网 → 2. 读英文公告 → 3. 自己想"我的哪些客户在这个县？是 S-Corp 还是 LLC？申报哪一张表？" → 4. 手动在 Excel 里更新日期 → 5. 手动发邮件通知客户 → 6. 祈祷自己没漏人。

**这个流程平均每次要消耗 CPA 30–90 分钟，且是"漏报风险"最大的来源**（因为他很可能根本没刷到那条公告）。

#### 2.3.2 Autopilot Regulatory Radar 的工作方式

```
官方公告流（IRS Newsroom + FTB + NY DTF + TX Comptroller + FL DOR + WA DOR）
        │
        ▼
[每日自动抓取 Worker]  ← cron + RSS + sitemap diff
        │
        ▼
[LLM 结构化抽取器]
 - 抽取字段：jurisdiction / counties / entity_types / forms / original_date / new_date / reason / source_url
 - 附带 confidence score + verbatim quote
        │
        ▼
[Client Impact Matcher（领域规则引擎）]
 - 基于每个 tenant 下真实客户档案的 (state, county, entity_type, tax_types) 做匹配
 - 输出"受影响客户清单" + "建议新日期" + "原规则引用"
        │
        ▼
[Human-in-the-Loop 审核抽屉]
 - CPA 看到：官方原文 + AI 摘要 + 置信度 + 匹配到的 N 个客户
 - 可以选择：Apply to all / Apply to some / Ignore / Mark as already handled
 - 每次应用都写入 audit log + 保留 source_url + human_verified_by
        │
        ▼
[首页"Radar Alert"横幅 + AI Weekly Brief 引用]
```

#### 2.3.3 为什么这是"别人做不到"的亮点

| 维度                                   | 为什么难                                                                  | DueDateHQ 的优势积累                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 内容护城河                             | 官方公告抓取需要持续人肉兜底（周末/节假日/格式变化）                      | MVP 已扩展到 IRS + 50 states + DC；每个 source/review 流程都是持续壁垒                                                                               |
| 领域建模难度                           | 必须同时建模 state / county / entity_type / form 四维匹配，错一个就会误报 | 我们的规则引擎就是核心资产                                                                                                                           |
| AI 可信度要求                          | 税务场景不允许"AI 黑箱自动改"，必须可核验                                 | **Source-verifiable chain**：每条 AI 输出都必须有 verbatim quote + official URL + 置信度 + human-verified 徽章，这是其他 AI tax 产品最容易偷工的地方 |
| File In Time 无法做                    | 它是桌面软件，根本无法做实时抓取 + 云端匹配                               | 天然差异化                                                                                                                                           |
| 通用 PM 平台（TaxDome / Karbon）不愿做 | 它们定位是事务所操作系统，不愿投入税务内容运营                            | 我们垂直聚焦，是唯一愿意做的                                                                                                                         |

#### 2.3.4 14 天 MVP 的交付形态（务实版）

为了 14 天真的做出来，且做出来**"看起来自动，实际上可靠"**，采用以下分层策略：

| 层         | 14 天 MVP 交付形态                                                                                        | 4 周后交付形态             |
| ---------- | --------------------------------------------------------------------------------------------------------- | -------------------------- |
| 数据源抓取 | IRS Newsroom + CA FTB（手工 + 每日脚本拉 RSS）                                                            | 扩到 6 个州 + 自动 diff    |
| LLM 抽取   | 用 GPT-4.1 prompt + 人工复核（CPA 或 PM 每天 5 分钟 review）                                              | 全自动 + 人工抽查          |
| 客户匹配   | 实时基于现有客户档案做 SQL 匹配                                                                           | + 相似度 + 近似规则学习    |
| UI 展现    | 首页顶部"Radar"条 + 详情抽屉；**即使没有新公告，也展示一条"Last checked 2h ago, 0 new alerts"增强可信度** | 支持订阅、推送、规则自定义 |
| 演示数据   | 预置 3 条真实公告（WA / LA / TN）+ 3 条模拟公告用于 demo                                                  | 全部真实                   |

**关键产品原则：MVP 阶段不追求"AI 完全自动"，而追求"AI + 人工的审核流可信、可演示、可扩展"。**这符合 v0.3 边界里"AI 不能自动改截止日规则"的硬约束。

#### 2.3.5 Radar 的"哇塞时刻"剧本（Demo Script）

```
1. CPA 周一早 8:50 打开 DueDateHQ
2. 首页顶部红色 Radar 横幅："3 of your clients may be impacted by a new IRS alert"
3. 点击 → 抽屉展开：
   - 官方标题："IRS announces tax relief for Tennessee storm victims"
   - AI 摘要（2 句）+ 关键字段结构化展示
   - verbatim quote（可折叠）
   - Affected clients：
       ✓ Acme LLC (TN, Davidson County) — 1065 due pushed from Mar 15 → Jun 8
       ✓ Bright Studio S-Corp (TN, Shelby) — 1120-S ditto
       ✓ Miller Family Partnership (TN, Knox) — ditto
   - [Apply to all 3] [Review one by one] [Ignore — already handled]
4. CPA 点 Apply to all → 弹出"Confirm: this will update 3 deadlines and log this action"
5. 回到首页，这 3 个客户的 deadline 自动改色、自动重新排序、Brief 里自动加一行"Rule change applied by you at 8:52 AM on Apr 22"
```

**这个剧本是你给投资人/种子用户看的核心杀手锏。File In Time 永远演不出来这个，因为它没有这条数据链路。**

### 2.4 脱颖而出的亮点 B ★★★ — AI Migration Copilot

> 亮点 A 解决"留下来"，亮点 B 解决"搬进来"。如果说 Radar 是长期内容护城河，Migration Copilot 是短期激活护城河——**它直接决定 trial-to-paid 转化率**。

#### 2.4.1 它解决什么问题

CPA 从 Excel / TaxDome / Drake / Karbon / QuickBooks 导出 + 搬进新系统，是所有 SaaS 转化的最大摩擦点。File In Time 有 CSV 导入，但需要用户自己告诉它"Column A = client name, Column B = state"——**这是给工程师用的流程，不是给忙季焦头烂额的 CPA 用的**。

真实场景：一位 CPA 有 80 个客户分布在 3 个表里，格式各异、字段不统一、实体类型有的写 "LLC" 有的写 "Limited Liability"、州有的写 "California" 有的写 "CA"。他花半天搬完以后还要手动录 12 个月 × 80 个客户 = 近千条 deadline。这个成本**通常直接劝退他付费**。

#### 2.4.2 AI Migration Copilot 的工作方式

```
用户输入（任选其一）
 ├─ 上传 CSV / Excel / Google Sheets 文件
 ├─ 直接 Cmd+V 粘贴表格（可跨 Excel、Numbers、Sheets）
 └─ 选择"From TaxDome / Drake / Karbon / QBO"预配置模板
        │
        ▼
[LLM 字段识别器]  一次调用完成：
 - 列 → 字段映射（client_name / state / entity_type / tax_types / email / notes）
 - 值归一化：
     · "California" / "CA" / "Calif." → "CA"
     · "Limited Liability Company" / "LLC" / "L.L.C." → "LLC"
     · "S Corp" / "S-Corporation" / "S corp" → "S-Corp"
 - 从上下文推断缺失字段：
     · 客户名含 "LLC/Inc/Corp" → 反推 entity type
     · 地址含州缩写 → 反推 state
     · 实体类型 + 州 → 建议 tax_types（预览而非自动）
 - 输出 confidence + 每行标注
        │
        ▼
[可视化 Diff 确认页]
 ┌──────────────────────────────────────────────────┐
 │ We detected 78 clients. Here's what we mapped:  │
 │                                                  │
 │ ✓ 62 clients — high confidence, ready to import  │
 │ ⚠ 14 clients — please review entity type         │
 │ ✗ 2 clients — missing state, please fill in      │
 │                                                  │
 │ [Inline editable table with diff highlighting]   │
 └──────────────────────────────────────────────────┘
        │
        ▼
[批量导入 + 立即生成全年 deadline]
 78 clients × 约 10 条 deadline = 约 780 条 deadline 一次生成
        │
        ▼
[导入完成页]
 ┌──────────────────────────────────────────────────┐
 │ ✓ 78 clients imported                            │
 │ ✓ 782 deadlines generated for 2026              │
 │                                                  │
 │ [Go to Triage Console] [Undo this import]        │
 └──────────────────────────────────────────────────┘
```

#### 2.4.3 为什么这是"别人做不到"的亮点

| 维度                              | 为什么难                          | DueDateHQ 的优势                       |
| --------------------------------- | --------------------------------- | -------------------------------------- |
| 传统 CSV 导入只做字段映射         | 用户得自己知道哪列是什么          | AI 一次调用完成映射 + 归一化 + 推断    |
| 跨格式 Cmd+V 粘贴                 | 需要识别分隔符、列数、header 行   | LLM 对非结构化表格天然鲁棒             |
| 实体类型/州/税种推断              | 传统规则匹配会漏大量 case         | LLM + 规则兜底双层                     |
| 一次导入 + 一键撤销               | 传统产品很少做撤销                | 用事务 + 单次 import_id 聚合，撤销极简 |
| File In Time 导入只支持结构化 CSV | 模板固定、无 AI                   | 彻底差异化                             |
| 新玩家进入                        | 需要收集每种竞品的导出格式 + 测试 | 我们先做，后做者要追赶多月             |

#### 2.4.4 14 天 MVP 的交付形态

| 能力                                      | 14 天 MVP                  | Phase 2  |
| ----------------------------------------- | -------------------------- | -------- |
| CSV / Excel 文件上传                      | ✓                          |          |
| Cmd+V 粘贴表格                            | ✓                          |          |
| LLM 自动字段映射                          | ✓                          |          |
| 值归一化（state/entity）                  | ✓                          |          |
| 实体类型从客户名推断                      | ✓                          |          |
| 州从地址推断                              | ✓                          |          |
| Diff 预览 + 行内编辑                      | ✓                          |          |
| 批量导入 + 自动生 deadline                | ✓                          |          |
| 一键撤销整批导入                          | ✓                          |          |
| TaxDome / Drake / Karbon / QBO 预配置模板 | ✗                          | ✓        |
| 多表单 merge（同客户跨表合并）            | ✗                          | ✓        |
| 增量同步（重复导入 dedupe）               | ✗                          | ✓        |
| 导入进度条 + 大文件流式处理               | 简化版（< 500 行同步即可） | 流式异步 |

**工程约束**：MVP 只支持 ≤ 500 行的单文件一次导入（独立 CPA 的真实客户数 20–100 完全覆盖）。更大导入放 Phase 2。

#### 2.4.5 "哇塞时刻"剧本（Demo Script）

```
1. CPA 试用时听销售说"把你的客户表贴进来就行"
2. 他打开 Excel，选中 80 行 × 5 列，Cmd+C
3. 切到 DueDateHQ 的 "Add clients"，Cmd+V
4. 1 秒内弹出：
   "We detected 78 clients from your paste. Checking columns with AI..."
5. 3 秒后：
   ✓ 62 clients mapped with high confidence
   ⚠ 14 clients need entity type review (we guessed based on names)
   ✗ 2 clients missing state (please fill in)
6. CPA 扫一眼 14 个"review"——AI 给出了合理建议（"Acme Consulting LLC" → LLC）
   Tab 到下一个，全部确认，3 分钟搞定
7. 点 Import → 780 条 deadline 瞬间生成，直接跳到 Triage Console
8. CPA 第一次打开首页，不是空的 skeleton，而是"本周 3 个 Critical"
```

**这个 3 分钟体验，File In Time 要花半天；TaxDome 要花一小时。这就是 $49/mo 的直接变现理由。**

#### 2.4.6 两大亮点如何协同

```
┌─ Acquisition ──┐   ┌─ Activation ───┐   ┌─ Retention ────┐
│  Public        │   │ ★ Migration   │   │ ★ Radar       │
│  Tracker Pages │ → │   Copilot      │ → │   每周新价值    │
│  (SEO 种草)    │   │ (3 分钟导入)   │   │ (每周不同公告) │
└────────────────┘   └────────────────┘   └────────────────┘
     护城河 1            护城河 2            护城河 3
   (内容 + SEO)     (AI + 跨格式兼容)    (AI + 官方数据流)
```

---

## 3. 目标用户与 JTBD

### 3.1 用户画像

| 画像             | 规模             | 核心任务                       | 主要痛点                                       | 优先级 |
| ---------------- | ---------------- | ------------------------------ | ---------------------------------------------- | ------ |
| 独立 CPA         | 20–100 客户      | 周一分诊、延期判断、截止日追踪 | Excel/日历/邮件碎片化；多州 PTE/延期规则记不住 | 最高   |
| 1–3 人小所 owner | 服务 50–200 客户 | 上述 + 轻量分派                | 缺少权威截止日层；盯公告耗时                   | 高     |
| 税务专员（次要） | 在上述小所内     | 具体执行、跟进客户资料         | 临期才发现资料不齐                             | 中     |

### 3.2 核心 JTBD

按优先级排列：

1. **Onboarding / Migration**（注册第一天）："我的 80 个客户在 Excel/TaxDome 里，别让我一个个录进去——让我能直接粘贴或上传，剩下的你帮我搞定。"
2. **Weekly Triage**（每周一）："周一 8:45–8:55 这 10 分钟，让我一眼看清本周谁最急、**为什么这个比那个急**、下一步查什么。"（**对应 F-5 + F-5b + F-18**：三段分组 + AI 段内排序 + Penalty 金额让"为什么急"看得见）
3. **Regulatory Response**（每月不定期）："州税局/IRS 一发公告，我不想自己刷官网——告诉我我的哪些客户被影响，附官方出处。"
4. **Client-Ready Explanations**（有需要时）："我要给客户发邮件，别让我自己想措辞；给我一个带官方链接的草稿，我改两句就能发。"
5. **Ad-hoc Query**（随时）："我想知道'哪些客户要交 PTE？'、'这月有多少条 1120-S？'——别让我自己写筛选，让我直接问。"（**对应 F-19 AI Ask**）

JTBD #1 之前被 v0.3 视为"测试阶段不是瓶颈"，但真实商业上它是 **trial-to-paid 的转化开关**，必须做好。

### 3.3 不做什么（严守边界）

继承自 MVP v0.3：不做 50 州、不做自动催客户、不做 Stripe、不做文档/签名/工作流、不给税务建议、不自动改截止日规则（只能 AI 建议 + 人工确认）。

**本 PRD 相对 v0.3 的两处升级（见 §14.1 对照表）**：

1. 把 **AI Migration Copilot**（含 CSV/Excel 导入 + AI 字段映射）从 v0.3 "不做" 提升到 P0，理由见 §1.1 与 §2.4。
2. 把 **Autopilot Regulatory Radar** 以"半自动 + 强制人工确认"的形态纳入 P0（AI 不自动改规则，仍守住 v0.3 硬约束）。

---

## 4. 功能范围 —— 14 天 MVP

### 4.1 P0（14 天内必须做完，否则不 Launch）

| ID       | 功能                                                                                                                                                                                         | 关键验收点                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| F-1      | 邮箱 + 密码注册登录 + 租户隔离                                                                                                                                                               | 单用户账号，数据不互通                                                                                                       |
| F-2      | 手动添加客户（Name / State / Entity Type / Tax Types）                                                                                                                                       | 字段最小化，5 秒录入                                                                                                         |
| **F-2b** | **★ AI Migration Copilot（详见 §5.8）**：文件上传 + Cmd+V 粘贴 + AI 字段映射 + 值归一化 + 缺失字段推断 + Diff 预览 + 批量导入 + 一键撤销                                                     | **从 Excel 粘贴 80 个客户到完成导入 ≤ 5 分钟**                                                                               |
| F-3      | 人工确认 deadline 规则库（`FED + 50 states + DC` source-backed rules/candidates）                                                                                                            | 每条规则有 source_url + verified_by + verified_at                                                                            |
| F-4      | 客户 → Deadline 自动生成（当年 + 下年度）                                                                                                                                                    | 至少生成 2026/2027 两年；Migration 导入后立即生成                                                                            |
| F-5      | **首页 Weekly Triage Console**（Critical / High Priority / Upcoming 三段）                                                                                                                   | 第一屏必须回答"who/what/why/next/where"五个问题                                                                              |
| **F-5b** | **★ AI 智能优先级排序（Critical / High 内部）**：基于 Penalty 金额估算 + 客户重要性（客户数活跃度、deadline 密度）+ 历史延误模式，在 Rule-Based 三段分组之上对每段**内部顺序**做 AI 建议排序 | 不改变 v0.3 硬约束（分组仍由规则决定）；每条卡片有 `✨ Why this order` 可展开解释；用户可一键切换回"按 due date 排序"        |
| F-6      | Deadline 状态（Not started / In progress / Completed / Extended） + Readiness（Ready / Waiting on client / Needs review） + 可选 internal cutoff date                                        | 一键切换                                                                                                                     |
| F-7      | 基础筛选（客户 / 州 / **税种 / 表单类型**）                                                                                                                                                  | 前端本地筛选即可；**form 维度来自 rule 表（如 1040/1065/1120-S/PTE/Franchise Tax）**，< 1 秒响应                             |
| F-8      | AI Weekly Brief（每周一 8am 生成，首页顶部展示）                                                                                                                                             | 3–5 句话概括本周最需关注的 3 个事项                                                                                          |
| F-9      | AI Deadline Tip（每条 deadline 展开时即时生成）                                                                                                                                              | 解释这是什么、为什么重要、准备什么                                                                                           |
| F-10     | AI Client Risk Summary（客户详情抽屉）                                                                                                                                                       | 列出该客户近期 deadline 风险                                                                                                 |
| F-11     | Source link + human-verified 徽章（每条 deadline 必显示）                                                                                                                                    | 点击跳转官方 URL                                                                                                             |
| F-12     | 邮件提醒（30/7/1 天阶梯） + 应用内提醒                                                                                                                                                       | 使用 Postmark/Resend                                                                                                         |
| F-13     | **★ Autopilot Regulatory Radar — MVP 版（详见 §5.2）**                                                                                                                                       | 首页顶部 Radar 横幅 + 受影响客户匹配 + Apply 流 + audit log                                                                  |
| F-14     | $49/mo 付费意愿按钮（不接 Stripe，只埋点）                                                                                                                                                   | 点击记录到 events 表                                                                                                         |
| F-15     | 最小 audit log（所有 Apply / 状态变更 / Migration Import）                                                                                                                                   | 可在客户详情页和 Imports 看到时间线                                                                                          |
| **F-18** | **★ Penalty Dollar Forecaster（详见 §5.9）**：基于 IRS 5%/月 + 0.5%/月规则和 source-backed state formulas 估算每条 Critical / High deadline 若漏报的最大罚款金额区间                         | 每条 Critical/High 卡片右下角显示 `~$1,200–$3,000 at risk` 胶囊；点击展开计算依据与官方规则链接；作为 F-5b AI 排序的核心输入 |

### 4.2 P0-Stretch（如果有余力，demo 会更炸）

| ID       | 功能                                                                                                                                                             | 理由                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| F-16     | AI Draft Client Email（Radar 抽屉里，"Generate client email" 按钮，可 copy）                                                                                     | 把 "Regulatory Response" JTBD 闭环做完                                                                                                           |
| F-17     | 公开 SEO 页 `/tracker/california` `/tracker/federal`                                                                                                             | 内容护城河的起点                                                                                                                                 |
| **F-19** | **AI Ask（自然语言问答，详见 §5.10）**：Cmd-K 右侧"Ask" tab，输入自然语言（"哪些客户要交 PTE?"、"本月内有几条 1120-S?"），返回结构化答案 + 客户清单 + 可直接筛选 | 覆盖 VPC 中的 AI Gain Creator（"AI 助手回答自然语言问题"）；复用 rule / client / deadline schema，一次 LLM 调用转 SQL 即可；不做写操作，只读安全 |

### 4.3 P1（Day 15 之后）

**Migration 增强**：TaxDome / Drake / Karbon / QBO 预配置模板、多表单 merge、增量同步 dedupe、大文件流式导入。
**其他**：50 州扩展、团队多席位、assignee、Stripe、延期状态机、CSV/PDF/ICS 导出、Calendar 集成、Zapier。

### 4.4 P2（Phase 3）

TaxDome/Drake/QBO 集成、文档存储、电子签名、Direct e-file。

---

## 5. 核心功能详细规格

### 5.1 Weekly Triage Console（首页）

#### 5.1.1 信息架构

```
┌─ Top Bar ─────────────────────────────────────────────────────┐
│  DueDateHQ    [Clients] [Deadlines] [Rules]     [avatar] [?]  │
├─ Radar Strip (sticky) ────────────────────────────────────────┤
│  🔴  2 new regulatory alerts may impact 4 of your clients  →  │
│       Last checked 18 min ago                                 │
├─ Weekly Brief (AI) ───────────────────────────────────────────┤
│  "This week, focus on Acme LLC (CA Franchise Tax, 3 days      │
│   left, client not ready) and Bright Studio S-Corp extension. │
│   3 other clients are on track."                 [Regenerate] │
├─ Triage Stacks ───────────────────────────────────────────────┤
│  ┌─ 🔴 Critical (3) ──────────────────────────────────┐       │
│  │ Acme LLC · CA Franchise Tax · in 3 days · Waiting  │       │
│  │    Why: deadline close + client not ready          │       │
│  │    Next: confirm payment / extension decision      │       │
│  │    Source: CA FTB · ✓ Human verified               │       │
│  │    [In progress] [Completed] [Extended]  [⋯]       │       │
│  │ ...                                                │       │
│  └────────────────────────────────────────────────────┘       │
│  ┌─ 🟡 High Priority (5) ────────────────────────────┐       │
│  │ ...                                                │       │
│  └────────────────────────────────────────────────────┘       │
│  ┌─ ⚪ Upcoming (12) ────────────────────────────────┐       │
│  │ ...                                                │       │
│  └────────────────────────────────────────────────────┘       │
├─ Filters Drawer (right) ──────────────────────────────────────┤
│  Client: [all ▾] · State: [all ▾] · Tax: [all ▾] · Status ... │
└───────────────────────────────────────────────────────────────┘
```

#### 5.1.2 优先级分组算法（两层：硬规则分组 + AI 子排序）

**第一层 · 硬规则分组**（决定一条 deadline 进哪一段，不由 AI 决定）：

```
Critical     = 剩余 ≤ 7 天 且 (Readiness == Waiting OR internal_cutoff 已过)
High Priority = 剩余 ≤ 14 天 且 不在 Critical
Upcoming     = 剩余 15–60 天
```

**第二层 · ★ AI 智能子排序（F-5b）**——段内顺序由 LLM 建议：

```
输入：段内所有 deadline 的 (penalty_estimate, client_activity_score, historical_delay_rate, readiness, days_remaining)
LLM 任务：输出段内 1..N 的顺序 + 每条一句话 rationale
输出契约：{ ordering: [deadline_id], rationale: { deadline_id: "e.g. highest penalty + client waiting" } }
兜底：LLM 失败 → 回退按 (penalty_estimate DESC, days_remaining ASC) 硬排
```

- 用户可一键切换 `Smart sort ✨` / `By due date` / `By penalty`
- 每张 TriageCard 右下角有 `✨ Why this order` hover 显示 rationale
- **v0.3 硬约束保护**：AI **不改变分组归属**、**不改变 due date**、**不触发 Apply**——只影响排列顺序，属于纯展示层优化

**时间标签对照（与用户故事 Story 1 AC 对齐）**：

| 用户故事语义 | PRD 实现                              |
| ------------ | ------------------------------------- |
| 本周到期     | Critical + High Priority 中 ≤ 7 天项  |
| 本月预警     | High Priority + Upcoming 中 8–30 天项 |
| 长期计划     | Upcoming 中 31–60 天项                |

#### 5.1.3 每条 deadline 必显字段（见 `MVP 边界声明.md` §3.4）

client / state / entity_type / tax_type or filing / payment / extension / due_date / days_remaining / risk_reason / next_check / source_link / human_verified / status / readiness

### 5.2 Autopilot Regulatory Radar（★ 核心差异化）

详见 §2.3。此处只补充字段与状态机：

#### 5.2.1 `regulatory_alerts` 表字段

| 字段                | 类型     | 说明                                                                                                  |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| id                  | uuid     |                                                                                                       |
| source              | enum     | `irs_newsroom` / `ca_ftb` / `ny_dtf` / `tx_cpa` / `fl_dor` / `wa_dor`                                 |
| source_url          | text     | 官方链接                                                                                              |
| official_title      | text     | 原标题                                                                                                |
| published_at        | datetime |                                                                                                       |
| ai_summary          | text     | AI 生成的 2 句摘要                                                                                    |
| ai_extracted_fields | jsonb    | `{ jurisdictions: [], counties: [], entity_types: [], forms: [], new_date: ..., original_date: ... }` |
| ai_confidence       | float    | 0–1                                                                                                   |
| verbatim_quote      | text     | 原文节选                                                                                              |
| human_review_status | enum     | `pending / verified / rejected`                                                                       |
| human_reviewed_by   | text     |                                                                                                       |
| ingested_at         | datetime |                                                                                                       |

#### 5.2.2 `alert_client_matches` 表

```
alert_id, client_id, tenant_id, match_reason, suggested_new_date, status
status ∈ {pending, applied, dismissed}
```

#### 5.2.3 UI：Radar 详情抽屉

```
┌──────────────────────────────────────────────────┐
│  IRS announces tax relief for TN storm victims   │
│  Official: irs.gov/newsroom/...  ·  Apr 15, 2026 │
│  AI confidence: 94% · ✓ Verified by DueDateHQ   │
├──────────────────────────────────────────────────┤
│  AI summary:                                     │
│  "IRS extends filing deadlines for all 95 TN    │
│   counties to June 8, 2026, covering 1040, 1065, │
│   1120-S forms for affected taxpayers."          │
│                                                  │
│  [View verbatim quote ▾]                         │
├─ Affected clients (3) ───────────────────────────┤
│  ☑ Acme LLC (TN, Davidson)                      │
│     1065 · Mar 15 → Jun 8                        │
│  ☑ Bright Studio S-Corp (TN, Shelby)            │
│     1120-S · Mar 15 → Jun 8                      │
│  ☑ Miller Family Partnership (TN, Knox)         │
│     1065 · Mar 15 → Jun 8                        │
├──────────────────────────────────────────────────┤
│  [Apply to all 3]  [Dismiss]  [Generate email]   │
└──────────────────────────────────────────────────┘
```

### 5.3 AI 能力层（统一规格）

| AI 输出                          | 触发                                   | 输入                                                       | 输出契约                                                          | 兜底                                                                                 |
| -------------------------------- | -------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Weekly Brief                     | 每周一 8:00 AM 定时；用户点 Regenerate | 本租户所有 Critical/High Priority deadlines                | 3–5 句话，≤ 500 字符                                              | 兜底模板 "You have N items due this week."                                           |
| Deadline Tip                     | 点击单条 deadline 展开时（异步加载）   | deadline + rule + source                                   | 3 小段：What / Why / What to prepare                              | 从 rule.default_tip 兜底                                                             |
| Client Risk Summary              | 客户详情抽屉打开时                     | 该客户所有 deadlines                                       | "3 upcoming deadlines, 1 critical, 1 waiting on client"           | 纯 SQL 聚合兜底                                                                      |
| Radar Extraction                 | 每日 cron / 手动上传                   | 官方公告 HTML + URL                                        | 结构化 JSON + confidence + verbatim quote                         | 置信度 < 0.7 标记 pending review                                                     |
| **Priority Ranking（F-5b）**     | 首页加载 / 数据变更                    | 段内 deadlines + penalty_estimate + readiness + 客户活跃度 | `{ ordering: [id], rationale: {id: text} }`                       | 回退按 `(penalty DESC, days_remaining ASC)` 硬排                                     |
| **Penalty Estimate（F-18）**     | Deadline 创建 / 状态变更 / 夜间批处理  | form + entity + due_date + 估算 tax_owed                   | `{ low, high, currency, basis_note, source_url }`                 | 规则表硬编码常见表单（1040/1065/1120-S/PTE）；命中不了返回 `null`                    |
| **AI Ask（F-19, P0-stretch）**   | Cmd-K Ask tab 输入                     | 自然语言 query + 只读 schema                               | SQL（白名单 SELECT-only）→ 执行 → 结构化答案 + 客户/deadline 列表 | 解析失败返回"Try rephrasing"；**禁止 DDL/DML，prompt 硬约束 + 后端 parser 二次校验** |
| Client Email Draft（P0-stretch） | Radar 抽屉点 Generate email            | alert + 受影响客户                                         | 英文邮件草稿（问候 / 背景 / 行动 / 签名位）                       | 返回固定模板                                                                         |

**AI 统一约束**：

1. 所有 AI 输出必须有 `source_refs: [url]` 字段，UI 必须可点击验证。
2. 所有 AI 输出必须有"Generated by AI · Please verify"徽章。
3. Prompt 模板统一放 `prompts/` 目录，版本化。
4. LLM 采用 GPT-4.1 / Claude Sonnet 4.5 二选一，通过 LiteLLM 抽象，方便切换。
5. 所有 LLM 调用必须记录到 `llm_logs` 表（输入、输出、成本、延迟）。
6. 不把客户 PII 发给 LLM——客户名用占位符 `{{client_1}}`，生成后在后端回填。这是 IRC §7216 与 FTC Safeguards Rule 的硬要求。

### 5.4 客户档案

字段：`name, state, entity_type (LLC/S-Corp/Partnership/C-Corp/Individual), tax_types[], county(optional), notes`
操作：创建、编辑、删除（删除为软删除）、详情抽屉、生成年度 deadline。

### 5.5 Deadline 状态 & Readiness

- **状态**：Not started / In progress / Completed / Extended（4 种，与 v0.3 一致）。
- **Readiness**：Ready / Waiting on client / Needs review（3 种，进入分诊算法）。
- **Internal cutoff date**：可选日期字段，早于 due date，若超过且 Readiness ≠ Ready 则进入 Critical。

### 5.6 提醒

- 邮件提醒：在 due date 前 30 / 7 / 1 天自动发；Radar 匹配到客户时立即发。
- 应用内提醒：Top Bar 铃铛图标 + 未读计数。
- 用户可在 Settings 里关闭某类提醒。

### 5.7 $49/mo 付费意愿按钮

位置：设置页底部 + 首页 Weekly Brief 下方。点击弹出：

```
We're launching paid plans soon. Would you pay $49/mo to keep this?
[Hell yes]  [Maybe, email me]  [Not now]
```

全部记到 events 表，不接 Stripe。

### 5.8 ★ AI Migration Copilot（详细规格）

#### 5.8.1 入口位置

1. **首次登录的 Welcome 卡片**（首页空状态）：三个选项并列，Migration 是默认推荐

```
 Let's get your clients in:
 ┌──────────────────┬──────────────────┬──────────────────┐
 │ ★ AI Import      │ Paste from Excel │ Add one by one   │
 │ (upload file)    │ (Cmd+V)          │ (manual form)    │
 └──────────────────┴──────────────────┴──────────────────┘
```

2. **Clients 页右上角** 永久按钮：`+ Add clients ▾` → { Import file, Paste, Add one }
3. **Cmd+K 命令**：`import clients` / `paste clients`

#### 5.8.2 三步流程

**Step 1 · Input**

| 输入方式     | 支持格式                      | 行数上限 (MVP) |
| ------------ | ----------------------------- | -------------- |
| 文件上传     | `.csv` `.xlsx` `.xls` `.tsv`  | 500 行         |
| Cmd+V 粘贴   | 任何带 Tab / Comma 分隔的文本 | 500 行         |
| 手动添加一个 | 表单                          | 1              |

粘贴区 UI：一个虚线框 textarea，placeholder：

> _Paste from Excel, Numbers, Google Sheets, or any table. We'll figure out the columns._

**Step 2 · AI Mapping（核心 LLM 调用）**

一次 LLM 调用同时完成四件事：

```json
// Prompt input
{
  "headers": ["Name", "ST", "Type", "Email"],
  "sample_rows": [
    ["Acme LLC", "CA", "LLC", "john@acme.com"],
    ["Bright Studio Inc", "NY", "S Corp", "..."],
    ["Miller Family Partnership", "TX", "", ""]
  ],
  "target_schema": ["client_name", "state", "entity_type", "tax_types", "email", "county", "notes"],
  "allowed_values": {
    "state": ["US state codes"],
    "entity_type": ["LLC", "S-Corp", "Partnership", "C-Corp", "Individual"]
  }
}
```

LLM 输出：

```json
{
  "column_mapping": {
    "Name": "client_name",
    "ST": "state",
    "Type": "entity_type",
    "Email": "email"
  },
  "per_row": [
    {
      "row_index": 0,
      "values": {
        "client_name": "Acme LLC",
        "state": "CA",
        "entity_type": "LLC",
        "email": "john@acme.com"
      },
      "confidence": 0.98,
      "notes": "all fields directly mapped"
    },
    {
      "row_index": 2,
      "values": {
        "client_name": "Miller Family Partnership",
        "state": "TX",
        "entity_type": "Partnership"
      },
      "confidence": 0.75,
      "notes": "entity_type inferred from name 'Partnership'; email missing"
    }
  ],
  "global_confidence": 0.91
}
```

**Prompt 关键约束**（见 §5.3 AI 统一约束）：

- 客户 PII 只发样本 5 行给 LLM 做 mapping，不发全部数据 → 满足 IRC §7216
- 全部 80 行的值归一化在后端用规则表完成（`"California" → "CA"`、`"Limited Liability" → "LLC"` 等），**不依赖 LLM 逐行调用**
- 规则表查不到的 fallback 才用 LLM
- 每次调用的输入 / 输出都记录到 `llm_logs`

**Step 3 · Diff 预览 & 确认**

UI 关键元素：

```
┌─ We mapped 78 clients from your paste ──────────────────┐
│                                                          │
│  Summary:                                                │
│  ✓ 62 high confidence (>0.9)                            │
│  ⚠ 14 need review (0.6 – 0.9)                           │
│  ✗ 2 missing required fields                            │
│                                                          │
│  Column mapping (click to change):                       │
│  [Name → client_name ✓] [ST → state ✓] [Type → entity_type ✓] │
│                                                          │
│  ┌ Table ────────────────────────────────────────────┐  │
│  │  ✓ Acme LLC              CA  LLC          [edit]  │  │
│  │  ⚠ Miller Partnership    TX  Partnership  [edit]  │  │
│  │  ✗ [missing state]       ??  LLC          [fix]   │  │
│  │  ...                                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  [Back]                    [Import 78 clients]           │
└──────────────────────────────────────────────────────────┘
```

行为：

- 默认折叠"high confidence"，只展开"review"和"missing"行
- 行内编辑：直接在表格里改，按 Tab 到下一个需要 review 的行
- 底部按钮在所有"missing"行填完前禁用
- 每个字段的"review"标签解释为什么：鼠标悬停显示 `Why? → Inferred from name "Miller Family Partnership"`

**Step 4 · 导入 + 副作用**

事务内完成：

1. 创建 `import_batch` 记录 `{ id, tenant_id, source: csv/paste/file_name, row_count, created_at }`
2. 批量插入 `client` 行，每行带 `import_batch_id` 外键
3. 触发每个新 client 的 deadline 生成（2026 + 2027 两年，约 10 条/客户）
4. 写 audit_log: `action: migration_import, metadata: { batch_id, client_count, deadline_count }`
5. 跳到 Triage Console，首页顶部 banner：`✓ Imported 78 clients · 782 deadlines generated · [Undo import]`

#### 5.8.3 Undo Import

- 位置：导入后 7 天内，Imports 页每条记录右侧有 Undo 按钮
- 行为：事务内删除 `import_batch_id = X` 的所有 clients 和级联 deadlines
- 状态变化需提示：如果其中某客户已被手动改过（有 audit log），Undo 按钮变"Undo with warning"，弹出提示"2 clients have been edited since import"
- 7 天后 Undo 按钮变灰（数据已"稳定落地"），需走删除单个客户流程

#### 5.8.4 数据模型增量

```
import_batch
  - id, tenant_id
  - source          enum(file_upload, paste, manual)
  - original_filename
  - row_count, success_count, failed_count
  - ai_global_confidence
  - status          enum(pending_review, imported, undone)
  - created_at, imported_at, undone_at

client (existing)
  + import_batch_id  (nullable, FK)
```

#### 5.8.5 验收标准（Acceptance Criteria）

| #     | AC                                                         |
| ----- | ---------------------------------------------------------- |
| AC-1  | 上传一份 80 行 Excel 到确认导入 ≤ 5 分钟（P50）            |
| AC-2  | Cmd+V 粘贴从 Excel / Numbers / Google Sheets 都能识别列    |
| AC-3  | 字段映射准确率（headers 明确时）≥ 95%                      |
| AC-4  | 实体类型从客户名推断准确率 ≥ 80%（测试集：100 个典型名字） |
| AC-5  | 州缩写/全称归一化覆盖 50 州 + DC                           |
| AC-6  | 任何 AI 不确定的字段都必须在 Diff 页标出，不能静默导入     |
| AC-7  | Undo 操作 ≤ 2 秒，能回滚所有 clients 和 deadlines          |
| AC-8  | 客户 PII 不发给 LLM（只发 header + 5 样本行）              |
| AC-9  | 导入过程中断网或失败，不能留下半导入状态（事务）           |
| AC-10 | 每次 import 在 `llm_logs` 和 `audit_log` 都有记录          |

#### 5.8.6 Demo 剧本（与 §2.4.5 对应）

销售讲：

> _"Show me your client list in whatever format you have."_

CPA 打开 Excel，选 80 行 × 5 列，Cmd+C，切回浏览器 Cmd+V。3 秒后看到 78 个客户已映射好。确认 3 分钟，点 Import。跳到 Triage Console 时首页已经不是空的，而是"本周 3 个 Critical"——**CPA 第一次进入就感受到真实价值**，而不是"还要再花半天录入"。

### 5.9 Penalty Dollar Forecaster（F-18）

直接覆盖 VPC 中的**高严重度痛点**："错过截止日的罚款责任最终由 CPA 承担，但工具不提供任何保障"。

#### 5.9.1 UI

Critical / High Priority 的每张 TriageCard 右下角追加一个胶囊：

```
~$1,200 – $3,000 at risk   [i]
```

hover / 点击展开：

```
┌─ Penalty estimate · Acme LLC · Form 1065 ──────────┐
│ Base: failure-to-file 5%/month, max 25%           │
│ Plus: failure-to-pay 0.5%/month                   │
│ Assumed tax liability: $24,000 (from client note) │
│ → Max 25% = $6,000 · Typical 2-month lag = $2,400 │
│ Source: IRS §6651 · irs.gov/...                   │
│ [ Edit assumed liability ]                         │
└────────────────────────────────────────────────────┘
```

#### 5.9.2 计算口径（MVP · 硬编码规则表）

| 表单                       | 基础规则（硬编码）                   | Liability 来源                                                     | 状态 |
| -------------------------- | ------------------------------------ | ------------------------------------------------------------------ | ---- |
| 1040                       | 5%/月 FTF + 0.5%/月 FTP              | 客户字段 `estimated_tax_liability`（可选，无则返回 "needs input"） | ✓    |
| 1065 / 1120-S              | $245/partner/月（2026 档）× up to 12 | 客户字段 `num_partners / shareholders`                             | ✓    |
| 1120                       | 5%/月 FTF + 0.5%/月 FTP              | 客户字段 estimated_tax_liability                                   | ✓    |
| CA Franchise Tax           | $800 最低 + 5%/月                    | fixed                                                              | ✓    |
| NY / TX / FL / WA 常见表单 | 查 rule 表 `penalty_formula` 字段    | 按表单                                                             | ✓    |
| 命中不了                   | 返回 `null`，UI 不显示胶囊           | —                                                                  | —    |

**所有规则都要求 `source_url` 指向官方，UI 必显示**。

#### 5.9.3 作为 F-5b 的输入

Penalty Estimate 的中位数（`(low + high)/2`）是 F-5b AI 排序的**第一权重输入**——金额越高越靠前。这让"智能优先级排序"在视觉和逻辑上都立得住。

#### 5.9.4 验收标准

| #     | AC                                                                    |
| ----- | --------------------------------------------------------------------- |
| AC-P1 | source-backed 表单命中率 ≥ 80%（联邦 + 州级常见表单）                 |
| AC-P2 | 每个估算必须显示 `source_url` + 计算依据，不能黑箱                    |
| AC-P3 | 客户未填 `estimated_tax_liability` 时，胶囊显示 `needs input` 而非 $0 |
| AC-P4 | 用户可手动覆盖（per-deadline override），override 写 audit_log        |

### 5.10 AI Ask · 自然语言问答（F-19, P0-stretch）

#### 5.10.1 入口

Cmd-K 命令面板右侧新增 `Ask` tab：

```
┌─ Cmd-K ─────────────────────────────────────────┐
│  [Search] [Ask ✨] [Navigate]                   │
│  > Which clients need to file PTE this month?   │
└──────────────────────────────────────────────────┘
```

#### 5.10.2 流程

```
Natural query
   │
   ▼
[LLM to SQL]  prompt 只含 schema（rule/client/deadline 白名单字段）
   │ 约束：只允许 SELECT；FROM 白名单；where 必含 tenant_id
   ▼
[Backend SQL parser 校验]  拒绝 DDL/DML/JOIN 出白名单
   │
   ▼
[执行 SQL + LLM 总结]  返回 { answer_text, result_table, filter_deeplink }
   │
   ▼
[UI]  一句话答案 + 客户/deadline 表格 + "Open with this filter →" 按钮
```

#### 5.10.3 合规与安全

- **只读**：prompt 和 parser 双层拦截写操作
- **强制 tenant 隔离**：SQL 未带 `tenant_id = $current` 直接 reject
- **不给 LLM 真实 PII**：只给 schema 和 query，PII 在后端 SQL 执行后回填到答案
- 所有调用记录到 `llm_logs`，用户可在 Settings 看到最近 Ask 历史

#### 5.10.4 典型 query（验收用例）

| query                                       | 期望行为                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Which clients need to file PTE this year?   | 返回 state ∈ (CA/NY) 且 entity_type ∈ (LLC/S-Corp/Partnership) 的客户清单 |
| How many 1120-S deadlines do I have in May? | 返回 count + 列表                                                         |
| Show me clients waiting on documents        | readiness = 'Waiting on client'                                           |
| Drop the clients table                      | **拒绝**，返回 "AI Ask is read-only"                                      |

#### 5.10.5 降级

若 D11 工期吃紧，P0-stretch 可降级为**预设模板问答**（下拉 5 个常见问题，每个对应一个固定 SQL），保留 UI 不变，后期再接 LLM。

---

## 6. 信息架构与核心页面

```
App (after login)
 ├─ Home / Weekly Triage Console  ← 默认登录后页
 ├─ Clients
 │   ├─ List (table)
 │   ├─ + Add clients ▾  →  { Import file, Paste, Add one }   ← ★ Migration 入口
 │   └─ Client Detail (drawer)
 │       ├─ Profile
 │       ├─ All deadlines timeline
 │       └─ AI Client Risk Summary
 ├─ Import Wizard (modal / full-screen)                        ← ★ Migration Copilot
 │   ├─ Step 1: Upload / Paste
 │   ├─ Step 2: AI Mapping & Diff Preview
 │   └─ Step 3: Confirm → Import
 ├─ Deadlines
 │   └─ Full table view（备用，给爱看表格的用户）
 ├─ Rules （只读 + source/verified/last_checked + penalty_formula）
 ├─ Radar （所有历史公告 + 状态）
 ├─ Cmd-K
 │   ├─ Search (clients / deadlines / rules)
 │   └─ Ask ✨ (自然语言问答 · F-19, P0-stretch)               ← ★ VPC AI Gain 覆盖
 └─ Settings
     ├─ Profile
     ├─ Notifications
     ├─ Imports （历史导入批次 + Undo 按钮）                    ← ★ Migration 回溯
     ├─ Ask History （最近自然语言问答，F-19）
     └─ About
```

---

## 7. 现代化 UI 设计规范

### 7.1 设计语言

- **风格**：Linear + Notion + Vercel Dashboard 的交叉产物。克制、高信噪比、空间感强、AI elements 有微弱发光 / gradient 边框。
- **不要**：拟物、过多插画、卡通、营销 dashboard 风格的大块渐变、icon 花里胡哨。

### 7.2 色板（Tailwind 值）

| 用途                 | Light                                           | Dark          |
| -------------------- | ----------------------------------------------- | ------------- |
| Background           | `zinc-50`                                       | `zinc-950`    |
| Surface              | `white`                                         | `zinc-900`    |
| Border               | `zinc-200`                                      | `zinc-800`    |
| Text primary         | `zinc-900`                                      | `zinc-50`     |
| Text secondary       | `zinc-500`                                      | `zinc-400`    |
| Brand                | `indigo-600`                                    | `indigo-400`  |
| Critical             | `red-600`                                       | `red-400`     |
| High priority        | `amber-500`                                     | `amber-400`   |
| Success / verified   | `emerald-600`                                   | `emerald-400` |
| AI accent (gradient) | `from-indigo-500 via-violet-500 to-fuchsia-500` | 同            |

AI 生成的内容统一用浅紫/靛蓝渐变细边框 + 一个 ✨ 图标，让"AI 参与"在视觉上一眼可辨。

### 7.3 Typography

- 主字：Inter（var）
- Mono：JetBrains Mono（用于显示官方 URL、日期、规则 ID）
- 正文：14px / 1.5；标题 16–24px；标号字 11px uppercase tracking-wide。

### 7.4 关键组件

- **TriageCard**：带左侧色条（red/amber/gray）+ 右上角 days-remaining 胶囊（倒计时颜色随紧迫度变化）+ 底部一行 pill 按钮（状态切换，单击即改，无 modal）。
- **AIHighlight**：浅紫渐变边框 + ✨ + 右上角"Verify"链接。
- **SourceBadge**：`🔗 CA FTB · ✓ Human verified · last checked 2d ago` —— 这个小组件就是 DueDateHQ 的信任符号，在每一条 deadline / rule / alert 都必须出现。
- **RadarStrip**：首页顶部 sticky 条，默认 gray（"Last checked X min ago, 0 new alerts"），有新 alert 时变 red pulse 动画。
- **CommandPalette（Cmd-K）**：搜索客户、deadline、规则；Ship in MVP（Linear 风格，半天可实现）。

### 7.5 交互原则

1. **一切可操作物体都应有键盘快捷键**（`?` 列出全部）。
2. **状态切换零 modal**：单击 pill 即改，500ms 内 undo toast。
3. **Skeleton loader**，不要 spinner。
4. **Optimistic UI**：本地先更新，后端失败再回滚 + toast。
5. **Dark mode 默认跟随系统**。
6. **空状态有价值**：空 Radar 写 "We're watching IRS + 5 state authorities for you. Last check 3 min ago."，让用户感到产品在"为他工作"。

### 7.6 响应式

MVP 桌面端优先（≥1280）+ 平板可用（≥768）。手机端 Phase 2。

---

## 8. 技术架构

### 8.1 整体选型

| 层       | 选择                                                            | 理由                                              |
| -------- | --------------------------------------------------------------- | ------------------------------------------------- |
| 前端     | Next.js 15 (App Router) + React 19 + Tailwind 4 + shadcn/ui     | 现代化组件、SSR、未来做公开 tracker 页 SEO 有用   |
| 后端     | Next.js API Routes + Node 20（或独立 Fastify 服务，团队偏好选） | 14 天极速迭代，避免多进程复杂度                   |
| 数据库   | PostgreSQL 16（Supabase 或 Neon）                               | 关系模型天然贴合 rule / deadline / alert / client |
| ORM      | Prisma 或 Drizzle                                               | Prisma 更稳，Drizzle 更快；团队熟谁就谁           |
| 队列     | Inngest（serverless）或 BullMQ + Redis                          | 每日 Radar crawl、reminder email、AI 定时任务     |
| LLM 网关 | LiteLLM 或直连 OpenAI / Anthropic                               | 可切换模型                                        |
| 邮件     | Resend                                                          | DX 最好，14 天内可搞定                            |
| 认证     | Clerk 或 Auth.js                                                | Clerk 最省事                                      |
| 部署     | Vercel + Supabase/Neon                                          | 0 DevOps                                          |
| 监控     | Sentry + Axiom                                                  |                                                   |
| 抓取器   | node-cron 或 Inngest scheduled + cheerio / Playwright           | 每日 1 次                                         |

### 8.2 核心数据模型

```
tenant (1:1 user in MVP)
  └─ user
  └─ client
       ├─ state, county, entity_type, tax_types[]
       └─ deadline (generated)
             ├─ rule_id, rule_version
             ├─ due_date, original_due_date
             ├─ status, readiness, internal_cutoff_date
             └─ source_url, human_verified

rule (global, not tenant-scoped)
  - id, jurisdiction, entity_type, tax_type, form
  - due_formula (e.g. "month=3, day=15")
  - source_url, verified_by, verified_at
  - version

regulatory_alert (global)
  - source, source_url, official_title, published_at
  - ai_summary, ai_extracted_fields(json), ai_confidence
  - verbatim_quote
  - human_review_status

alert_client_match (tenant-scoped)
  - alert_id, client_id, match_reason
  - suggested_new_date, status

audit_log (tenant-scoped)
  - actor, action, target_type, target_id, metadata, created_at

event (analytics)
  - tenant_id, event_name, props(json), created_at

llm_log
  - prompt_version, input_tokens, output_tokens, latency, cost, tenant_id
```

### 8.3 Radar Worker 流程（伪代码）

```ts
// scheduled daily 6am PT
async function radarDaily() {
  const sources = ['irs_newsroom', 'ca_ftb', 'ny_dtf', 'tx_cpa', 'fl_dor', 'wa_dor']
  for (const src of sources) {
    const newItems = await diffAndFetch(src) // via RSS or sitemap
    for (const raw of newItems) {
      const extracted = await llmExtract(raw) // returns { fields, confidence, quote }
      const alert = await saveAlert({ raw, extracted })
      if (alert.ai_confidence < 0.7) continue // wait for manual review
      const matches = await matchClientsAcrossTenants(alert)
      await notifyImpactedTenants(matches) // in-app + email
    }
  }
}
```

### 8.4 安全与合规基线（必做）

- TLS 全站；At-rest AES-256（Supabase 自带）。
- 密码 bcrypt；支持 MFA（Clerk 自带）。
- 租户强隔离：所有 query 都必须带 `tenant_id` where（用 Drizzle/Prisma middleware 强制）。
- Audit log：所有写操作都记录。
- LLM PII 防泄：客户名/邮箱/SSN 在发给 LLM 前用占位符替换，后端回填。满足 IRC §7216。
- WISP v0.1：一页文档 + MFA + 加密 + 日志 + 删除策略。
- 每条 deadline / rule / alert 都显示 source_url，用户可一键核验。
- Footer 永远有 "AI-assisted. Verify with official sources."

### 8.5 性能目标

- 首页 TTI ≤ 1.5s（冷启动 ≤ 3s）
- 100 个客户、1000 条 deadline 的筛选 p95 ≤ 200ms
- AI Deadline Tip 流式返回，首 token ≤ 1s
- Radar crawl 一次全量 ≤ 5 min

---

## 9. 14 天冲刺计划

| 日     | 里程碑                                                                                                                                                                                 | 关键产出                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| D1     | PRD 冻结、技术栈敲定、仓库初始化、Supabase/Vercel/Clerk 接通                                                                                                                           | 能跑通 hello world                                            |
| D2     | Auth + 租户 + Client CRUD                                                                                                                                                              | 用户能登录并添加第一个客户                                    |
| D3     | Rule DB seed（`FED + 50 states + DC` source-backed rules/candidates）+ Deadline 自动生成                                                                                               | 创建客户后立刻有 deadlines                                    |
| D4     | Weekly Triage Console 首页（Critical/High/Upcoming 三段 + 静态排序）+ **Penalty Forecaster 硬规则表（全辖区 source-backed 表单的 `penalty_formula` 入 rule 表）+ TriageCard 胶囊展示** | 首页可看 + 每条 Critical/High 有 `at risk $`                  |
| D5     | 状态 + Readiness + Internal cutoff + 筛选（**含表单类型维度**）                                                                                                                        | 核心 CRUD 闭环完成 + Story 1 AC 全覆盖                        |
| D6     | AI 层骨架（LiteLLM + prompts + llm_logs）+ Weekly Brief + Deadline Tip + Client Risk Summary + **AI Priority Ranking（F-5b，复用同一 prompt 框架）**                                   | AI 能出东西 + Smart sort 可演示                               |
| **D7** | **★ Migration Copilot Phase 1**：文件上传 + CSV/Excel 解析 + LLM 字段映射 prompt + 后端归一化表（50 州 + entity alias）+ Diff 预览页静态版                                             | 能把一份 Excel 映射到 schema（无批量写入）                    |
| **D8** | **★ Migration Copilot Phase 2**：Cmd+V 粘贴 + 实体/州推断 + 批量导入事务 + import_batch + Undo + 导入后自动生 deadlines + audit log                                                    | **Migration 端到端可用**，能演示 2.4.5 剧本                   |
| D9     | ★ Radar 数据模型 + 手动录入 3 条真实 alert + AI 抽取（GPT-4 + 人工复核）+ Client Matcher + 首页横幅 + 详情抽屉 + Apply 流                                                              | Radar 骨架能演示（比原计划压缩 1 天，通过复用 AI 层骨架达成） |
| D10    | Source Badge 系统 + Rules 页（只读） + Imports 页 + $49 意愿按钮 + events 埋点                                                                                                         | 信任链 + 回溯闭环                                             |
| D11    | 邮件提醒（Resend）+ 应用内提醒 + Cmd-K（含 **Ask tab · F-19 P0-stretch**，若吃紧则降级为预设模板问答）                                                                                 | 通知闭环 + Ask 可演示                                         |
| D12    | UI Polish：配色、字体、skeleton、dark mode、微交互、empty states + Radar Daily Worker（cron 抓 IRS + CA）                                                                              | 外观 demo-ready；Radar 自动跑                                 |
| D13    | Bug bash、QA、Migration 准确率测试（100 个典型客户名集）、2–3 位 CPA friends-and-family 试用                                                                                           | 无 P0 bug；AC-3/AC-4 达标                                     |
| D14    | 种子用户 onboarding + 演示脚本（**剧本顺序：Migration → Triage → Radar**）+ Launch tweet                                                                                               | 10 位 CPA 进来                                                |

**新时间表解释**：

- D7–D8 两天给 Migration Copilot（替换原 D7 给 Radar 的 2 天中的 1 天）
- D9 把 Radar 的 2 天压缩到 1 天（因为 D6–D8 的 AI 层骨架、prompt 框架、diff UI 可复用）
- D12 把 Radar Daily Worker 和 UI Polish 合并（Worker 是后端任务，可并行）
- 删除了原 D12 的 Penalty Forecaster（推 Phase 2）
- Demo 剧本顺序改为 **Migration 第一（3 分钟的震撼）→ Triage（核心价值）→ Radar（杀手锏）**，这是更符合真实 CPA 认知路径的叙事

---

## 10. 成功指标（与 MVP 边界声明 §7 对齐）

| 指标                                           | 目标                                                              | 说明                                   |
| ---------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------- |
| **Migration 激活率（新增）**                   | **≥ 7/10 种子用户使用 Migration Copilot（而非手动录入）**         | 如果低于 7 说明入口不够显眼或不好用    |
| **Migration 到首个 deadline 时间 P50（新增）** | **≤ 5 分钟**                                                      | 从登录到首页看到 Critical deadline     |
| **Migration 导入客户数中位数（新增）**         | **≥ 20**                                                          | 验证用户真的把整组客户搬进来           |
| Setup 耗时 P50                                 | ≤ 15 分钟                                                         | 与 v0.3 对齐                           |
| Week-1 主动登录 / 用户                         | ≥ 2 次                                                            |                                        |
| Week-2 回访人数（10 人中）                     | ≥ 5                                                               |                                        |
| 分诊 session 时长中位数                        | ≤ 10 分钟                                                         |                                        |
| 日历条目编辑率                                 | < 20%                                                             |                                        |
| AI Brief / Tips 有用率                         | ≥ 5/10                                                            |                                        |
| $49 意愿按钮点击率（周活）                     | ≥ 30%                                                             |                                        |
| **Radar Apply 行为数（新增）**                 | ≥ 2 次真实 Apply                                                  | 说明用户信任并使用                     |
| **Smart sort 开启率（F-5b）**                  | ≥ 6/10 用户保持默认 Smart sort                                    | 验证 AI 智能优先级排序被接受而非被关闭 |
| **Penalty 胶囊命中率（F-18）**                 | 首页 Critical/High 条目 ≥ 80% 有 penalty 估算（非 "needs input"） | 验证硬编码规则表覆盖足够               |
| **AI Ask 尝试率（F-19，若 ship）**             | ≥ 4/10 用户试过至少 1 次 Ask                                      | 验证自然语言入口被发现                 |

**指标逻辑**：Migration 3 指标验证"能进来"；Triage + Brief/Tips + **Smart sort + Penalty** 指标验证"每周有用"；Radar Apply + AI Ask 验证"AI 智能被接受"；$49 意愿验证"愿付费"。四层叠加才构成 Proceed 信号。

---

## 11. 风险与缓释

| 风险                                         | 影响                     | 缓释                                                                                                                            |
| -------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| LLM 抽取错误，把不该延期的客户延期           | 用户信任崩塌             | 置信度 < 0.7 强制 pending review；所有 Apply 都需人工点按钮；audit log 可回滚                                                   |
| Radar 覆盖口径不清，用户误解为未覆盖其州     | 失望                     | UI 明确显示"Currently watching: IRS + 50 states + DC"，同时标注 candidate 需要 review                                           |
| AI 幻觉                                      | 信任 & 合规              | 所有 AI 输出必有 verbatim quote + source_url；UI 有 "Verify" 按钮                                                               |
| IRC §7216 违规                               | 法律                     | 客户 PII 不送 LLM；Migration prompt 只发 5 样本行做 mapping；归一化用后端规则表                                                 |
| 14 天做不完 Radar                            | Demo 失去杀手锏          | Radar 本身是分层交付：3 条手工录入 + 人工复核的 alert 已经足够 demo                                                             |
| **14 天做不完 Migration**                    | **trial-to-paid 没闭环** | **Migration 也是分层交付：D7 先做文件上传 + AI 映射 + 无归一化，D8 才加 Cmd+V / 推断 / Undo；最差情况只保留文件上传版本也能用** |
| **Migration AI 映射错误率高**                | **用户导错 80 个客户**   | **Diff 预览页强制所有置信度 < 0.9 的行显示 review；AC-6 验收：不能静默导入；一键撤销兜底**                                      |
| **粘贴表格来自怪异格式（空行、合并单元格）** | **解析失败**             | **MVP 只支持 Tab/Comma 规则表；粘贴前检测异常并提示"Please paste a clean table"；Phase 2 做复杂清洗**                           |
| 规则数据错误                                 | 失去专业形象             | 每条规则双人复核；UI 显示 verified_by + verified_at；争议显示"⚠ Under review"                                                   |

---

## 12. 决策判据（Week 4 退出访谈后）

复用 MVP 边界声明 §8：

- **Proceed**：Week-2 回访 ≥5 人、≥3 人愿付 $49、≥5 人觉得 AI Brief/Tips 有效、编辑率 <30%
- **Gray**：回访 5–7 但无人愿付 → 讨论换 ICP / 改价 / 加深 AI 差异化
- **Rethink**：回访 <4 / >50% 觉得不如 Excel / 编辑率 >40% → 重做发现期

新增两条硬信号：

- **Migration 激活率 ≥ 7/10** 作为"产品能真正替代旧工具"的门槛；若 < 5，说明入口/体验有问题，Triage 再好也没用（用户都搬不进来）。
- **Radar 被真实 Apply ≥ 2 次** 作为 AI 差异化的硬信号；若为 0，说明 Radar 虽炫但不被用，要重新思考"用户到底在意什么"。

---

## 13. 未来路线图（只做摘要，不是本 PRD 承诺）

- **Phase 2（Week 5–12）**：CSV 导入 + AI 字段映射、50 州扩展、团队多席位 + assignee、Stripe、CSV/PDF/ICS 导出、Google/Outlook Calendar 同步、SEO public tracker 扩到全 50 州。
- **Phase 3（Q3 2026）**：QBO/TaxDome 集成、API & Webhook、延期状态机、电子签、penalty recovery 报告、Audit trail 合规版、SOC 2 路线。
- **Phase 4（Q4 2026）**：Compliance Calendar API（卖给 TaxDome/Karbon 做 intelligence 层）、Zapier App、移动端。

---

## 14. 附录

### 14.1 与 MVP 边界声明 v0.3 的对照

| v0.3 规定                                            | 本 PRD 处理                                                                                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 云端 SaaS Web App                                    | ✓ Next.js on Vercel                                                                                                                       |
| 单用户账号                                           | ✓ Tenant 模型预留但 UI 仅单用户                                                                                                           |
| 手动客户录入                                         | ✓ F-2                                                                                                                                     |
| `FED + 50 states + DC` source-backed 人工复核规则    | ✓ F-3                                                                                                                                     |
| 首页优先级分诊台                                     | ✓ F-5                                                                                                                                     |
| 状态 4 种 + Readiness 3 种 + internal cutoff         | ✓ F-6                                                                                                                                     |
| AI Weekly Brief / Deadline Tip / Client Risk Summary | ✓ F-8/9/10                                                                                                                                |
| Source link + human verified                         | ✓ F-11                                                                                                                                    |
| 邮件 + 应用内提醒                                    | ✓ F-12                                                                                                                                    |
| $49/mo 按钮                                          | ✓ F-14                                                                                                                                    |
| AI 不改规则、不做合规结论                            | ✓ Radar / Migration 均强制人工 review + human Apply                                                                                       |
| 不做 50 州 / 团队 / Stripe                           | ✓ 放 Phase 2                                                                                                                              |
| **不做 CSV / AI 字段映射**                           | **⚠ 本 PRD 提升为 P0（见下）**                                                                                                            |
| **不做 AI 自动监控**                                 | **⚠ 本 PRD 提升为 P0 的半自动版（见下）**                                                                                                 |
| **AI 不决定优先级**                                  | **✓ 保留**：F-5b 仅在规则分组内部做**展示层**排序建议，不改变分组归属、不改 due date、不触发 Apply；用户可一键切回 By due date            |
| **Penalty Forecaster 推 Phase 2**                    | **⚠ 本 PRD 回升为 P0（F-18）**：直接覆盖 VPC 高严重度痛点"罚款责任兜底"，且是 F-5b AI 排序的核心输入（无 penalty 权重 AI 排序失去说服力） |

**本 PRD 在 v0.3 基础上共有四处明确升级（新增 #3 / #4）**：

**升级 #1：★ AI Migration Copilot（F-2b）** — 从 v0.3 "当前不做 CSV 导入 / AI 字段映射" 提升为 P0。

- **理由**：v0.3 为瘦身排除此项，但商业上它决定 trial-to-paid 转化率。用户愿意测试 5 个客户不代表愿意付费搬 80 个客户。竞品研究报告一致把它列为 P0-1。
- **合规守约**：Migration 的 LLM 只发 5 样本行做字段 mapping，全量 PII 不送 LLM；所有导入必须经 Diff 预览确认，不静默导入；7 天内可一键 Undo。
- **工程代价**：D7–D8 两天，通过 D9 压缩 Radar 的 1 天抵扣。

**升级 #2：★ Autopilot Regulatory Radar（F-13）** — 从 v0.3 "不做 AI 自动监控州税局公告" 提升为 P0 的"半自动 + 强制人工确认"版本。

- **合规守约**：AI 抽取后强制 pending_review；所有 Apply 必须人工点按钮；每条 alert 有 verbatim quote + source_url；audit log 可回滚。UI 上叫"Radar"但后端不假装完全自动。
- **降级预案**：若实施中判定仍超 v0.3 边界，可将 F-13 降级为"PM 每日手动录入 3 条 alert"版，Client Matcher + Apply 流不变，Demo 效果几乎一致。

**升级 #3：★ AI 智能优先级排序（F-5b）+ Penalty Dollar Forecaster（F-18）** — 把用户故事 Story 1 标签的 `✦ 智能优先级排序` 与 VPC 高 Gain Creator 和高 Pain 一次落地。

- **理由**：Story 1 AC 明确要求、VPC 将其标为高价值且 AI 可解；原 PRD 仅有 rule-based 三段分组但 CPA 仍要自己在 Critical 里挑"先做哪一个"——Penalty 估算 + AI 段内排序正好解决这个"看完仍要想"的残余痛点。
- **合规守约**：F-5b 只影响段内**排序**，不改分组、不改 due date、不触发 Apply；F-18 所有金额估算都有官方 `source_url` 和计算依据；用户可手动覆盖、覆盖写 audit log。
- **工程代价**：
  - F-18 `penalty_formula` 字段嵌入 rule 表 D4 完成（seed 时一次性填入联邦 + source-backed state formulas），前端胶囊 D4 完成；
  - F-5b 复用 D6 的 AI prompt 框架（和 Weekly Brief 同一通道），增量开发成本约半天。

**升级 #4：AI Ask 自然语言问答（F-19, P0-stretch）** — 覆盖 VPC 中"我哪些客户要交 PTE？"类自然语言问答。

- **合规守约**：只读白名单 SELECT；LLM 只看 schema、不看 PII；后端 parser 二次校验 `tenant_id` 隔离；所有调用入 `llm_logs`。
- **降级预案**：若 D11 工期吃紧，P0-stretch 降级为预设 5 条模板问答（固定 SQL），UI 不变，可在 Phase 2 接 LLM——对 VPC"中"严重度来说这是可接受的降级。

**请在 D1 开工前与合规/产品对齐这四处升级。** 最坏情况下的替代路径：Migration 降级为仅 CSV 文件上传 + 静态字段映射（无 AI）；Radar 降级为人工录入 alert；F-5b 降级为 `(penalty DESC, days ASC)` 纯硬排；F-19 降级为模板问答。

### 14.2 给投资人/用户的一句话 pitch

> **"DueDateHQ is File In Time for the AI era. Paste your client list from Excel and we import 80 clients in 3 minutes. Then every week, our AI tells you which of those clients are about to be impacted by a tax rule change — before you hear about it. $49 a month, in your browser."**

这一句话同时讲了 Migration（激活）和 Radar（留存）两个亮点——前 2 句是 Migration，后 2 句是 Radar。

### 14.3 竞争护城河 5 年演化

```
Year 1 (MVP)   : FED + 50 states + DC source-backed rules/candidates + AI Triage
Year 2         : 50 州规则 + 自动 diff + 用户贡献 correction loop
Year 3         : Compliance Calendar API 卖给 TaxDome / Karbon
Year 4         : AI Agent 可生成客户沟通全套，CPA 只审批
Year 5         : 成为"官方 deadline intelligence layer"的事实标准
```
