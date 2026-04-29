# DueDateHQ PRD v2.0 — Unified PRD · Part 1B（§6A–§6D：亮点模块 Migration / Readiness / Audit / Rules）

> 文档类型：产品需求文档（统一版 / Build-complete PRD）· **Part 1B / 4**
> 版本：v2.0（集成 v1.0 主 PRD 与 v1.0-FileInTime-Competitor 优势）
> 日期：2026-04-23

> **📄 分册导航（4 册拆分版 · 原 Part 1/2 因渲染性能问题拆为 A/B）**
>
> - **Part 1A**：§0 版本对比 · §1 产品定位 · §2 用户与场景 · §3 用户故事与 AC · §4 功能范围 · §5 核心页面 · §6 Clarity Engine → 见 [`DueDateHQ-PRD-v2.0-Part1A.md`](./DueDateHQ-PRD-v2.0-Part1A.md)
> - **Part 1B（本册）**：§6A Migration Copilot · §6B Client Readiness Portal · §6C Audit-Ready Evidence · §6D Rules-as-Asset
> - **Part 2A**：§7 其他核心功能 · §8 数据模型 → 见 [`DueDateHQ-PRD-v2.0-Part2A.md`](./DueDateHQ-PRD-v2.0-Part2A.md)
> - **Part 2B**：§9 AI 架构 · §10 UI/UX · §11 信息架构 · §12 指标 · §13 安全合规 · §14 路线图 · §15 GTM Playbook · §16 风险 · §17 交付物 · §18 附录 · §19 产品一句话 → 见 [`DueDateHQ-PRD-v2.0-Part2B.md`](./DueDateHQ-PRD-v2.0-Part2B.md)

---

## 6A. 亮点模块 — Migration Copilot™

### 6A.1 战略价值

- **First-run wow**：Demo Day 前 60 秒让现场观众看到产品"魔法"
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
  - client.name # required, string
  - client.ein # optional, "##-#######" EIN format
  - client.state # required, 2-letter US code
  - client.county # optional, string
  - client.entity_type # required, enum
  - client.tax_types # optional array (fallback to Default Matrix §6A.5)
  - client.assignee_name # optional
  - client.importance # optional enum high/med/low
  - client.email # optional
  - client.notes # optional
  - IGNORE # explicitly unused column
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

策略：**枚举型走 AI SDK structured output，自由字段走 fuzzy + 字典。**

| 字段          | 归一方式                                                        | 示例                                    |
| ------------- | --------------------------------------------------------------- | --------------------------------------- |
| `entity_type` | AI SDK 映射到 8 枚举之一；未知标 "Needs review"                 | `L.L.C.` → `LLC`，`Corp (S)` → `S-Corp` |
| `state`       | 字典 2-letter + full name；失败 → Needs review                  | `California` → `CA`，`Calif` → `CA`     |
| `county`      | 保留原始（州内 county 太大），异常字符告警                      | `Los Angeles` / `LA` 不归一             |
| `tax_types`   | 字典 + AI SDK structured output；缺失走 Default Matrix（§6A.5） | `Fed 1065` → `federal_1065_partnership` |
| `tax_year`    | 正则 `(19                                                       | 20)\d{2}`，失败标 Needs review          |
| `importance`  | 字典                                                            | `A / VIP / Priority / top` → `high`     |
| `ein`         | 正则校验 + "##-#######" 归一                                    | `12.3456789` → `12-3456789`             |

**所有归一决策写 `evidence_link`**，CPA 在 Client Detail → Audit 看到：

> "此客户 entity=LLC 由 AI 从原始 'L.L.C.' 归一，置信度 97%，模型档位 fast-json"

**Smart Suggestions 非阻塞原则：**

- 置信度 < 0.8 → 黄色 "Needs review" 徽章，**不阻塞导入**
- 置信度 < 0.5 → `[Fix now or skip]` 二选一，不强制
- 缺失必填字段（name / state）→ 红色 "Missing required"，仅此类阻塞

### 6A.4 Preset Profiles（S2-AC1 · 5 个首发）

| Preset         | 典型列（示例）                                                    | 作用                                        |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `TaxDome`      | `Client Name, EIN, Entity Type, State, Tax Return Type, Assignee` | 全字段已知                                  |
| `Drake`        | `Client ID, Name, EIN, Entity, State, Return Type`                | 全字段已知                                  |
| `Karbon`       | `Organization Name, Tax ID, Country, Primary Contact`             | 部分已知                                    |
| `QuickBooks`   | `Customer, Tax ID, Billing State`                                 | 仅客户元数据（tax_types 走 Default Matrix） |
| `File In Time` | `Client, Service, Due Date, Status, Staff`                        | 最完整 one-shot 迁移（彩蛋对标竞品）        |

Preset 给 AI Mapper 强先验，置信度从 75% 跳到 95%+。

### 6A.5 Default Tax Types Inference Matrix（S2-AC4 兑现 "无需额外配置"）

#### 为什么必须

TaxDome / Drake / QuickBooks 的导出 CSV **经常没有 tax_types 列**。若规则引擎只按 `state + entity_type + tax_types` 三键匹配，这些客户生成 **0 条 obligation**，Live Genesis 空白，S2-AC4 直接塌。

#### 规则

当 `tax_types` 缺失时，Rule Engine 以 `entity_type × state` 为键查 **Default Tax Types Matrix** 推断"该客户的默认合规组合"。当前 Rules MVP coverage 是 Federal + CA/NY/TX/FL/WA；Default Matrix v1.0 仍是 Demo 子集，TX/FL/WA 自动推断进入 `needs_review`，未覆盖格回退为"Federal 默认 + `needs_review` 徽章"。

#### 默认矩阵（示例）

| `entity_type × state` | 推断的默认 `tax_types`                                                          |
| --------------------- | ------------------------------------------------------------------------------- |
| `LLC × CA`            | `federal_1065_or_1040`, `ca_llc_franchise_min_800`, `ca_llc_fee_gross_receipts` |
| `LLC × NY`            | `federal_1065_or_1040`, `ny_llc_filing_fee`, `ny_ptet_optional`                 |
| `LLC × TX`            | `federal_1065_or_1040`, `tx_franchise_tax`                                      |
| `LLC × MA`            | `federal_1065_or_1040`, `ma_corporate_excise`                                   |
| `S-Corp × CA`         | `federal_1120s`, `ca_100s_franchise`, `ca_ptet_optional`                        |
| `S-Corp × NY`         | `federal_1120s`, `ny_ct3s`, `ny_ptet_optional`                                  |
| `Partnership × FL`    | `federal_1065`（FL 无州所得税）                                                 |
| `C-Corp × WA`         | `federal_1120`, `wa_bo_tax`                                                     |
| `Sole-Prop × TX`      | `federal_1040_sch_c`, `tx_franchise_no_tax_due`                                 |
| `Individual × any`    | `federal_1040` + 该州个人所得税（若有）                                         |
| _未覆盖格_            | `federal`\_\*（按 entity 默认）+ `needs_review` 徽章                            |

矩阵本身**不是 AI**，是规则库里 `default_tax_types.yaml` 的静态表，由 ops 人工签字；查表是纯函数，零幻觉。

#### UI 联动（Step 3 Normalize）

```
Suggested tax types (inferred from entity × state)
  Acme LLC (LLC · CA) → CA Franchise Tax, CA LLC Fee, Federal 1065
  Bright Inc (S-Corp · NY) → NY CT-3-S, NY PTET, Federal 1120-S
  [✓ Apply to all] applies where imported rows do not already include tax types.
```

默认生效（"无需额外配置"直接体现）；DDL cut 支持按 `(entity_type, state)` cell 取消 `Apply to all`。取消后，该 cell 下缺 `tax_types` 的客户不会由 Default Matrix 自动补全，也不会据此生成 obligations；完整逐行 tax type override 留到 Phase 0。

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
│    [✓ Apply to all] Applies where tax types are missing.     │
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

**单行失败不阻塞整批。** 失败行进入 `/migration/<batch_id>/errors` 可下载 CSV + 手改重导。

#### Revert（双档）

| 级别                | 触发                            | 时限               | 行为                                                             |
| ------------------- | ------------------------------- | ------------------ | ---------------------------------------------------------------- |
| **全量 batch 撤销** | `[Undo all]` toast / Settings   | 24h                | 事务内删除所有 batch 下的 clients + obligations + evidence_links |
| **单客户撤销**      | Clients → 单客户详情 `[Delete]` | 7 天（带 warning） | 单个 client + 级联 obligations                                   |

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
  https://app.duedatehq.com/migration/batch_xx/revert
```

### 6A.9 安全与合规护栏

- MVP 不收 SSN / 完整税额（§13.1）
- 粘贴内容含 SSN 模式 → 前端拦截 + 该列强制 IGNORE + 红色警示
- AI mapping / normalize **在客户端 redact PII** → 仅发字段名 + 5 行样本到 `packages/ai`，不发全表
- Prompt 明示 `"Do not retain any data seen for training"`；运行时走 Vercel AI SDK Core + Cloudflare AI Gateway provider，retention 由网关上游配置和 provider 合同保障
- 所有 AI SDK 调用写内部 `ai_output` trace（prompt version / usage / latency / guard result），不存原文

### 6A.10 验收清单（S2 全覆盖）

| AC     | 测试用例                                                              | 预期                                                                                                    |
| ------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| S2-AC1 | 上传 TaxDome 导出 CSV（含 EIN 列）                                    | Preset 自动选中 + AI Mapping 置信度 ≥ 95% + EIN 识别 100%                                               |
| S2-AC2 | 上传 30 行混乱 CSV（`Client Name / Tax ID / State/Juris / Ent Type`） | AI 识别 name/ein/state/entity_type 4 字段均 ≥ 80%                                                       |
| S2-AC3 | CSV 有 5 行缺 state / 3 行缺 entity_type                              | 非阻塞 "Needs review"；导入后这 8 行进 `needs_review` 队列不影响其他 22 行                              |
| S2-AC4 | 上传 CSV 无 tax_types 列，含 LLC×CA / S-Corp×NY / Individual×TX       | 导入后每个客户都生成 ≥ 3 条 obligations；全年日历完整                                                   |
| S2-AC5 | 计时从 signup 到 Import 完成                                          | P95 ≤ 30 分钟（30 客户基准，含粘贴 5min + mapping review 10min + normalize 5min + import 10min buffer） |

### 6A.11 Onboarding AI Agent（★ 差异化亮点 · P1-27）

> 这是 §6A.6 传统 4 步向导的**平行入口**：不是替代，而是增加一个"对话式 Setup"选项。
> 战略意图：精准对标 LangGenius/产品受众 taste — 让他们一眼看到"这是 AI Agent 在正确场景的正确姿势"。

#### 6A.11.1 为什么必须做

三条理由：

1. **没人真正读 Onboarding 文档。** 传统空态页 `[+ Import] [+ Add client]` 的转化窗口只有 30 秒；CPA 走不过来就会关掉标签页。
2. **产品受众会精准 GET 到这个。** LangGenius 每天在做 AI orchestration；看到"主动发问 → 按客户回答 → 调用工具链 → 产出具体价值"的 Agent，共鸣一次爆炸。
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

| 异常                                   | 降级                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| AI SDK 调用超时                        | 对话气泡显示 `[Fallback] Switching to the guided wizard...`，跳 §6A.6 Step 1 |
| 对话绕圈（用户问了 3 次非 setup 问题） | Agent 说 `Let me get you to the wizard — we can chat later.`                 |
| 用户粘贴内容 AI Mapper 识别不出        | 回到 intake，提示"Try pasting a cleaner table, or [Upload a CSV instead]"    |

#### 6A.11.5 Glass-Box 一致性

- Agent 的每一次字段识别、实体归一、规则预加载**都写 Evidence Link**，和 §6A.3 一致
- 对话内容完整写 `AiOutput` 表，prompt version 可追溯
- 用户在 Setup history 可看到"Your onboarding conversation"

#### 6A.11.6 为什么是 P1 而非 P0

- Story S2 验收不依赖它（4 步向导已能兑现 AC）
- 但它是 **集训评分的关键差异化资产**——产品受众第一次看到产品时，Agent 对话框的视觉冲击远强于传统向导
- 即使 P1 延后，前期也应做 **Agent 的对话脚本设计 + 视觉稿**，让 Pitch 可以展示 "this is what our onboarding will look like"

#### 6A.11.7 Demo 钩子

Demo Day 现场可以这样演：

1. 现场观众报一个数字 "42"，演示者在 Agent 对话里输入 `I have 42 clients`
2. 现场观众报一个州 "Texas"，演示者输入 `mostly in TX`
3. 演示者粘贴预置的 42 行 TX Excel
4. **Agent 实时回应 + Live Genesis** → 现场观众第一次看到"AI 读懂我说的话并产出一个能用的产品"

这是纯叙事层面的 jaw-drop moment。

---

## 6B. 亮点模块 — Client Readiness Portal™

> ★ 差异化亮点（P1-26）· 集训脱颖而出的关键原创性设计。
> **核心洞察**：现有所有竞品（File In Time / TaxDome / Karbon）的 `readiness` 都是 CPA **手动** 标记。但 CPA 最痛的根本不是"标状态"，而是**花一整天催客户交资料**。Readiness Portal 把数据源头从 CPA 侧反转到客户侧。

### 6B.1 为什么它能让你脱颖而出

| 维度               | 现有产品                    | DueDateHQ Readiness Portal         |
| ------------------ | --------------------------- | ---------------------------------- |
| Readiness 数据来源 | CPA 手动标                  | **客户自己勾**                     |
| 客户的 touchpoint  | CPA 邮件 + 电话             | **一个 signed portal link，30 秒** |
| 客户端门槛         | 下载 TaxDome app / 注册登录 | **免登录，移动端打开即可**         |
| 产品亮点属性       | "更好的表格"                | **"反转数据源头"的产品原创**       |

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
  Signed portal link generated, valid 14 days.
  Choose delivery:
    ○ Email to client (john@acme.com)  — uses your Reminder template
    ○ Copy link (send via SMS / WeChat / etc)
    ● Both

  [Send]
      ↓
  Client receives email with one button: [Confirm what I have ready →]
```

#### 客户侧（免登录 · 移动优先）

打开 signed portal link：

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
  items_json (D1 JSON text: [{ label, description, ai_explanation_url, status }]),
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

| 威胁                    | 防护                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Link 泄露被公开         | Token 签名 + 14 天过期 + 单客户绑定（token 泄露至多暴露 1 个客户的 3 条 checklist，不含 PII 细节） |
| 暴力枚举 token          | Token 长度 ≥ 32 bytes + rate limit（单 IP 10 req/min）+ Sentry alert                               |
| 客户提交恶意内容（XSS） | `client_note` 服务端 sanitize + rendering 全用 `{text}` 非 `innerHTML`                             |
| 客户机器人大量响应      | hCaptcha 作为 Submit 按钮门槛（默认开）                                                            |
| CPA 误发给错误客户      | Signed portal link 页显示 CPA 姓名 + Firm 名 + 客户名三项，客户看到不对可点 `This isn't me` 上报   |
| PII 最小化              | 客户侧页面**不显示 EIN / SSN / 金额**；只显示 "1120-S filing" 级别的信息                           |
| Readiness 数据合规      | 所有 response 写 `AuditEvent(action='readiness.client_response')`                                  |

### 6B.5 AI 能力（复用已有管线）

| 能力                                                  | 复用模块                    | 增量                                                  |
| ----------------------------------------------------- | --------------------------- | ----------------------------------------------------- |
| 客户侧 `[? What is this?]` 解释                       | §6.2 Glass-Box Deadline Tip | prompt 微调为 "explain to a non-CPA client"           |
| `[Call / Email me, I don't understand]` → Draft Email | §6.2 AI Draft Client Email  | 同管线                                                |
| CPA 新建 checklist 时 AI 建议常见项                   | §6.2 Deadline Tip           | 基于 `obligation.tax_type + client.entity` 预填建议项 |

### 6B.6 与 Reminder 系统的集成

- Readiness Request 首次发送 48h 未响应 → 自动触发一次 gentle reminder（客户侧）
- 14 天仍未响应 → CPA Dashboard 升级为 `overdue readiness check` 标签
- CPA 可在 Settings 调整 auto-reminder 频率或关闭

### 6B.7 验收标准（T-RP-\*）

| Test ID | 描述                                         | 预期                                                          |
| ------- | -------------------------------------------- | ------------------------------------------------------------- |
| T-RP-01 | CPA 点 `[Send readiness check]` → 客户收邮件 | Resend 送达，邮件含 signed portal link                        |
| T-RP-02 | 客户打开 link（移动端）                      | 页面正常渲染，无需登录，3s 内 LCP                             |
| T-RP-03 | 客户勾 "I have it" 提交                      | CPA Dashboard 对应 obligation readiness 30s 内更新            |
| T-RP-04 | 客户点 `[? What is this?]`                   | AI 生成的 2 句解释 + source URL 显示                          |
| T-RP-05 | 客户点 `need help`                           | CPA Dashboard 出现 Banner + Draft email 入口                  |
| T-RP-06 | 同一 token 打开两次                          | 第二次显示已提交状态 + `[Update my response]` 入口            |
| T-RP-07 | 伪造 token 访问                              | 404 + 不泄露任何客户信息                                      |
| T-RP-08 | Token 过期后访问                             | 显示 `This link has expired. Please ask Sarah for a new one.` |
| T-RP-09 | 客户提交后 CPA 的 audit log                  | 新增 `readiness.client_response` 事件                         |
| T-RP-10 | 误发撤销                                     | CPA 可 `[Revoke link]`，token 立刻失效                        |

### 6B.8 Demo 戏剧性

Demo Day 关键 10 秒：

1. 演示者在 Obligation Detail 点 `[Send readiness check to client]`
2. 邀请**现场观众拿出手机扫屏幕上的二维码**（实际是 signed portal link）
3. 现场观众打开页面 → 勾第一个框 → 点 Submit
4. Demo 屏幕上 CPA Dashboard 的 `readiness` 徽章**实时变色**（`Waiting` → `Ready`）
5. Audit Log 新行出现："Client responded from mobile 2s ago"

**这是 Demo Day 上最具震撼力的跨设备实时演示。File In Time 永远做不出来。**

### 6B.9 为什么 2 人天能落地（工程估算）

- 客户侧单页面：1 React route + 1 hCaptcha + 4 个 UI 组件（checkbox / textarea / confirm / expired），复用已有 shadcn ≈ **0.5 人天**
- Signed portal link 生成 + token 验证：复用 ICS token 逻辑 ≈ **0.3 人天**
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

- TaxDome / Karbon：有 audit log 但无 AI 决策追溯；AI 生成的客户邮件不知道来自哪个 prompt 版本
- File In Time：桌面软件，无 provenance 概念
- Excel + Outlook：完全没有

**场景三连问**：

1. IRS 发函问："你这条 CA Franchise Tax 为什么从 Mar 15 改到 Oct 15？" → CPA 需要出示证据链
2. 客户投诉："你漏报了我的 1120-S，怎么证明是我没及时给 K-1？" → CPA 需要出示 Readiness Response 时间戳
3. E&O 保险理赔：保险公司问"事发时你在用什么工具管理 deadline？" → 需要可签名的审计快照

**DueDateHQ 的独家承诺**：

> "Every AI sentence, every deadline, every rule change is packaged into a single signed ZIP you can hand over to the IRS, a client, or your insurance adjuster in 90 seconds."

这是 产品受众会立刻 GET 的——**"AI for regulated industries"的正确姿势**。

### 6C.2 使用场景

| 场景                               | 触发者                        | 常见导出范围               |
| ---------------------------------- | ----------------------------- | -------------------------- |
| IRS 调查特定客户                   | Owner                         | 单客户 · 近 3 年           |
| 客户争议（K-1 时效、罚款归责）     | Owner / Manager               | 单 obligation · 全生命周期 |
| 年度 E&O 保险续保                  | Owner                         | 全 firm · 过去一年         |
| 事务所内部复盘（漏报分析）         | Manager                       | 时间窗口 · 含所有成员      |
| 客户主动索要（GDPR/CCPA 合规复制） | Coordinator 发起 / Owner 批准 | 单客户 · 全部              |
| DueDateHQ 退出（导出自有数据）     | Owner                         | 全 firm · 全时间           |

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
│   ├─ rule_chunks.csv                     # RAG 用到的 rule chunks（source excerpt + source）
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

| 层                | 签名方式                                                                | 用途                             |
| ----------------- | ----------------------------------------------------------------------- | -------------------------------- |
| 文件级            | 每个文件单独 SHA-256，写入 `manifest.json`                              | 快速验证单文件完整性             |
| 包级              | `manifest.json` 的 SHA-256 → `signature.sig`                            | 快速验证整包完整性               |
| 时间戳            | `signature.sig` 附带 UTC 时间戳 + DueDateHQ 私钥签名（HMAC 或 Ed25519） | 证明导出时间 + 由 DueDateHQ 产出 |
| 可选 RFC 3161 TSA | Phase 2 接第三方时间戳机构（e.g. FreeTSA）                              | 法律级证据链                     |

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

### 6C.9 验收标准（T-AE-\*）

| Test ID | 描述                                     | 预期                                                         |
| ------- | ---------------------------------------- | ------------------------------------------------------------ |
| T-AE-01 | Owner 点 Generate ZIP (firm scope, 12mo) | 2 分钟内收到邮件 + 链接                                      |
| T-AE-02 | 下载 ZIP 解压                            | 目录结构与 §6C.4 manifest 一致，README.pdf 可打开            |
| T-AE-03 | 随机改动 ZIP 内一个文件                  | manifest.json 的 SHA-256 不再匹配，验证脚本报错              |
| T-AE-04 | 验证 signature.sig                       | 与 manifest.json 的 SHA-256 匹配                             |
| T-AE-05 | 单客户 scope 导出                        | 只含该客户的 obligations / audit / readiness，其他客户不泄露 |
| T-AE-06 | Manager 尝试全 firm 导出                 | 403 Forbidden + 引导到单客户选项                             |
| T-AE-07 | 导出事件本身出现在下一次导出的 audit log | ✓（递归留痕）                                                |
| T-AE-08 | 链接 7 天后访问                          | 410 Gone + 提示重新生成                                      |
| T-AE-09 | 链接被多次使用                           | 首次成功，第二次起 410（single-use）                         |
| T-AE-10 | 导出后 firm 删除                         | 包不随 firm 删而失效（由 S3 lifecycle 独立管理）             |

### 6C.10 Demo 戏剧性（与 §15.3.6 联动）

Demo 结尾 10 秒：

```
Presenter: "Last thing. Let's say the IRS calls tomorrow and asks
about Acme LLC. Watch."

[Audit-ready export → Scope: Acme LLC → 12 months]

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

**为什么这一段无敌：** 这不是功能 demo，这是**产品哲学 demo**。现场观众前面记住了"游戏化顶栏的 $31,400"，结尾记住了"审计级的信任"——两个记忆点串成了"从赚钱到保命"的完整叙事。

### 6C.11 工程估算

- ZIP 打包 worker（Node stream + archiver）≈ **0.5 人天**
- Manifest + SHA-256 计算（流式）≈ **0.3 人天**
- Section 01 PDF batch（复用 §7.4）≈ **0.2 人天**
- Section 02–08 的 CSV 导出（复用现有 query）≈ **0.5 人天**
- README.pdf 生成 + signature.sig 签名 ≈ **0.3 人天**
- S3 pre-signed URL + 邮件 + 过期管理 ≈ **0.2 人天**

**合计 ≈ 2 人天。** 对"AI for regulated industries"叙事的 ROI 极高，产品受众精准击中。

### 6C.12 数据模型（已在 §8.1 声明）

见 §8.1 `AuditEvidencePackage` 表。

---

## 6D. 亮点模块 — Rules-as-Asset™（规则资产层）

> ★ 差异化亮点（P1-29 ~ P1-35）· **对 File In Time 的核心打击面**。
> 源文档：`docs/DueDateHQ-MVP-Deadline-Rules-Plan.md`。本章节把 Plan 的 10 大段内外翻译为产品：**对内按 Plan 严格建模，对外翻译为 CPA 5 秒能读懂的 4 类信任信号。**

### 6D.1 核心原则：Rules 是独立资产，产品只是第一消费方

**三条产品纪律（Plan §1、§9 对齐）：**

1. **Rule 独立于 UI**：规则资产可以被 DueDateHQ 消费，也可以被未来的 API、合规日历订阅服务、其他应用消费。UI 只负责呈现，不反向污染规则定义。
2. **Rule 独立于任何页面**：不存在"某页面的规则"，只存在"规则被哪些页面消费"。这是未来 Phase 3 `Compliance Calendar API` 能卖出去的前提。
3. **Rule 资产的"权威"问题永远有独立答案**：问一条 obligation "你的 due_date 依据什么规则"，数据层必须能回答 **base rule + active overlays**，不能靠 audit log 反推。

**外显承诺（Landing page / 产品文案一致口径）：**

> Rule Library is public, cross-verified, and versioned.
> Every rule clicks back to its primary official source, a source excerpt, and the date a human ops member last verified it.
> This is not an AI-generated calendar. This is a rule asset.

### 6D.2 Exception Rule Overlay（解决 Pulse 直接覆盖的审计歧义）

**背景（为什么必要）：**

v2.0 之前 Pulse 实现是"直接 UPDATE `obligation_instance.current_due_date`"。这导致以下歧义：

1. **归属歧义**：`rule_id` 指 base rule，但 `current_due_date` 是 Pulse 改的 → 数据层无法直答"这条 obligation 当前适用哪些规则组合"
2. **层级歧义**：多个 Pulse 叠加时，所有 evidence_link 都挂着但只有最后一个生效 → CPA 看不懂
3. **版本歧义**：base rule 从 v3.2 升到 v3.3，原 exception overlay 是否仍适用？数据层无答案
4. **撤销歧义**：IRS 撤销某条公告，过了 24h Revert 窗口后只能手动改 → 规则资产层丢失"撤销"事实
5. **可审计歧义**：规则资产层无法独立回答"这条 obligation 适用哪些规则"，必须跨表反推

**新模型（base + overlays，Plan §2.3 对齐）：**

```
┌──────────────────────────┐          ┌─────────────────────────────┐
│  ObligationRule (base)   │          │  ExceptionRule (overlay)    │
│  federal_1040_v3.2       │          │  irs_ca_storm_relief_2026   │
│  due: Apr 15             │          │  override: Apr 15 → Oct 15  │
└──────────┬───────────────┘          │  effective: Apr 22–Oct 15   │
           │                          │  status: verified | applied │
           │                          │         | retracted         │
           │                          └────────────┬────────────────┘
           │                                       │
           ▼                                       │
┌──────────────────────────────────────────────────┴────────────┐
│  ObligationInstance                                            │
│  base_due_date = rule.compute()                                │
│  current_due_date = apply(base_due_date, active_overlays)     │← 派生
│  overlays: [exception_rule_id_1, exception_rule_id_2, ...]    │
└────────────────────────────────────────────────────────────────┘
```

- `current_due_date` 变为**派生字段**：每次读取时重算（或写时缓存）
- `ExceptionRule.status` 变化 → 系统自动重算所有挂钩 obligation 的 `current_due_date`
- IRS 撤销公告 → `status = 'retracted'`，全系统自动回退 + 邮件通知
- Base rule 升级 → 系统标 `overlays[].needs_reevaluation = true`，ops 人工复核后重新启用

**对外呈现 · Obligation Detail 新 Tab 'Deadline History'：**

```
Acme LLC · Form 1040 · 2026

Current due:   Oct 15, 2026
Original due:  Apr 15, 2026
─────────────────────────────────────────────────────
Timeline

  Jan 01  ●  Deadline generated
              Rule: Federal 1040 v3.2 · due Apr 15
              [Source: IRS Pub 509]

  Apr 22  ●  🌩 Relief overlay applied
              IRS CA Storm Relief (LA County)
              Extends due date: Apr 15 → Oct 15
              [Source: irs.gov/newsroom/...]
              [Verified by DueDateHQ ops · Apr 22 09:15]

  (future)   If this relief is revoked, your deadline automatically
             reverts to Apr 15, and you'll be notified.
─────────────────────────────────────────────────────
Active overlays: 1
```

**打 FIT 的点**：FIT 里 deadline 被改了你不知道；我们把"改"拆成 **base + 可溯可撤的 overlay**，CPA 第一次感受到"日历是有历史的，不是被黑盒改写的"。

### 6D.3 Source Registry + `/watch` 公开页

工程归属：公开 `/watch` 属于 `apps/marketing` / `duedatehq.com`，不由 `app.duedatehq.com` 的 SaaS SPA fallback 承载。

**内部（Plan §7.3 第一重防漏）：**

`RuleSource` 表登记每一个必看官方来源：

```
RuleSource
  id, jurisdiction (federal|CA|NY|TX|FL|FL|WA|MA|...),
  name (e.g. "IRS Newsroom"),
  url, source_type (newsroom|publication|due_dates|emergency_relief|fema),
  cadence (30m|60m|120m|daily|weekly|quarterly),
  owner_user_id,                     -- 哪位 ops 负责
  priority (critical|high|medium|low), -- 低容错优先级
  is_early_warning (bool),           -- FEMA 等只作预警不生规则
  last_checked_at, last_change_detected_at,
  health_status (healthy|degraded|failing|paused),
  consecutive_failures, next_check_at,
  created_at, updated_at
```

**首发注册（MVP）：** Federal 5 源 + 6 州各 1–2 源 + FEMA = 约 15 条。

**对外三层呈现：**

**层 1 · Dashboard 顶栏 Freshness Badge（每次登录可见）：**

```
🟢 All watchers healthy · 15 sources · Last check 18 min ago
```

hover 展开：

```
Today 14:32
  ✓ IRS Newsroom         healthy · checked 2 min ago
  ✓ IRS Disaster Relief  healthy · checked 18 min ago
  ✓ CA FTB News          healthy · checked 22 min ago
  ...
  🟡 FEMA declarations   early-warning only · daily

This week
  Scheduled: base rule recheck · Friday 9am PT

Upcoming
  Quarterly full audit · 2026-06-15 by ops team
```

**层 2 · 公开 `/watch` Landing Page（SEO + 获客）：**

```
What We Watch For You

IRS sources                                  Cadence    Health
  ✓ IRS Newsroom                             30 min     🟢
  ✓ IRS Disaster Relief                      60 min     🟢
  ✓ IRS Publication 509                      weekly     🟢
  ✓ IRS Form 7004 Instructions               quarterly  🟢
  ✓ FEMA Emergency Declarations              daily      🟡 early warning

State sources (6 of 50 jurisdictions)
  ✓ California FTB · News + Emergency        60 min     🟢
  ✓ California FTB · Due Dates page          weekly     🟢
  ✓ New York DTF · Tax News                  60 min     🟢
  ...

Not yet covered: 44 states
  If you have clients in these states, you can request priority
  coverage. We don't pretend to watch what we don't watch.
  [Request a state ▾]

How we verify
  Each rule is cross-verified against 2+ official sources,
  reviewed by a human ops team, and re-audited quarterly.
  [Learn more about our verification process →]
```

**层 3 · 公开 `/rules` Landing Page（见 §6D.7）**。

**打 FIT 的点**：FIT 你**不知道它盯着什么**（桌面软件，年度维护包）。我们三连透明：**盯什么 + 多频繁 + 现在健康吗**。

### 6D.4 Rule Quality Badge（Plan §7.3 第二重防漏）

每条 verified rule 内嵌 6 项 checklist，在 UI 上以可展开徽章呈现：

```
[ ✓ Quality Tier 6/6 ]  ← 绿色，verified rules 的默认状态
  ↓ click / hover
  ☑ Filing vs payment distinguished
  ☑ Extension rule handled (7004: extends filing, not payment)
  ☑ Calendar / fiscal year applicability specified
  ☑ Weekend / holiday rollover handled
  ☑ Cross-verified with 2+ official sources
  ☑ Disaster exception channel established

  Verified by DueDateHQ ops · Apr 12, 2026
  Next review: Jul 12, 2026
```

**未满 6/6 时：**

- `[ ⚠ Quality Tier 5/6 — Applicability review needed ]` 黄色
- 点开告知 CPA"此规则需你根据客户情况判断是否适用"
- 对应 Plan §2.4 的 `requires_applicability_review` 标记

**数据层：** `ObligationRule.checklist_json`（6 字段 boolean + 注解）。

**打 FIT 的点**：FIT 给你一条 deadline，你不知道它有没有想过 "extension 延 filing 但不延 payment" 这种致命陷阱。我们把 ops 验证时的 6 个关键问题**显式答给 CPA 看**。

### 6D.5 Cross-source Verification（Plan §7.3 第三重防漏）

每条 verified rule 必须在 2+ 官方来源间交叉验证。UI 呈现：

**一致情况：**

```
Source: CA FTB Pub 3556 · [ ✓ Verified across 2 sources ] · verified Apr 12
         ↓ click
Primary:         CA FTB Publication 3556
                 ftb.ca.gov/forms/misc/3556.html
Cross-verified:  CA Revenue & Taxation Code §17941
                 leginfo.legislature.ca.gov/faces/codes_displaySection...

Both sources agree: "The $800 minimum franchise tax is due
by the 15th day of the 4th month after formation."

Last cross-check: Apr 12, 2026 by DueDateHQ ops
```

**冲突情况（透明警示）：**

```
Source: NY PTET (Form IT-204-IP) · [ ⚠ Sources disagree · under review ]
         ↓ click
  Source A says: Due March 15
  Source B says: Due April 15

  DueDateHQ action: Not yet published to rule library.
  Please verify with your NY DTF contact before relying on this
  deadline. We will update this page once sources align.
```

**数据层：** `RuleCrossVerification` 表（见 §8.1）。

**打 FIT 的点**：FIT 单源录入（有啥用啥）。我们双源交叉，**冲突不静默**，直接告诉 CPA 哪里有不确定性——这是**把不确定性也透明化**，CPA 会非常尊重。

### 6D.6 Verification Rhythm（Plan §6 对外翻译）

**内部配置：** `OpsCadence` 表定义"谁在什么频率做什么"。

**对外三层呈现：**

**层 A · `/security` 页新增一段**

```
Our Verification Rhythm

Every 30 minutes     IRS + CA FTB Newsroom scraping
Every 60 minutes     NY / TX / FL / WA tax news
Daily                FEMA declarations (early warning only)
Weekly (Fri 9am PT)  Base rule re-check against source
Quarterly            Full rule pack audit by ops team
Before tax season    Comprehensive manual review + double sign-off

Last quarterly audit:  Jan 15, 2026
Next quarterly audit:  Jun 15, 2026
```

**层 B · 每周一 8am Weekly Rhythm Report 邮件（所有 firm owner）**

```
Subject: [DueDateHQ] Weekly rule freshness · all systems green

Hi Sarah,

Here's what happened this week on the rules you depend on:

  ✓ 32 base rules re-checked · 0 changes needed
  ✓ 15 regulatory sources monitored · all healthy
  🌩 3 active relief overlays · all still in effect
  ⚠ 0 rules needing your applicability review

Coming up: quarterly full audit on Jun 15, 2026.

Trust, but verify. Open any rule to see its sources:
  [Open Rule Library →]
```

**层 C · Dashboard Freshness Badge（§6D.3 已述）**

**打 FIT 的点**：FIT 一年更新一次规则包，**中间 365 天你不知道它在不在活着**。我们每天 30 分钟扫一次、每周一份 report、每季度一次全量、每税季前一轮复核——**节奏公开书面承诺**。从 "trust me" 变成 "trust the rhythm"。

### 6D.7 Rule Library（`/rules` 公开 + 内部管理双面）

工程归属：公开 `/rules` 属于 `apps/marketing` / `duedatehq.com`；内部 rules 管理面属于登录后 `apps/app`。

**公开面 · `/rules` Landing Page（SEO + 获客）：**

```
Rule Library · Federal + 6 states · 32 verified rules

Federal (11 rules)
  ✓ 1040 · Individual filing        Pub 509 · Verified Apr 12
  ✓ 1065 · Partnership filing       Pub 509 · Verified Apr 12
  ✓ 1120-S · S-Corp filing          Pub 509 · Verified Apr 12
  ✓ Form 7004 · Extension           Instructions · Verified Apr 12
  ...

California (8 rules)
  ✓ Form 3522 · LLC Annual Tax      FTB Pub 3556 · Verified Apr 12
  ✓ PTET Election (Form 3804)       FTB · ⚠ Annual update due
  ...

🌩 Active Relief Overlays (3)
  IRS CA storm relief (LA County) · Apr 22–Oct 15 · 12 clients protected

44 states not yet fully covered · [Request priority coverage]

[Download as PDF]  [Download as JSON (API-ready)]  [Subscribe to changes]
```

**内部面 · Ops Dashboard（仅 DueDateHQ ops 团队，非 firm）：**

- Coverage Matrix：`jurisdiction × entity_type × tax_type` 网格，绿格已覆盖、灰格待办
- Source Health Dashboard：逐源 last_checked_at / consecutive_failures / next_check_at
- Rule Lifecycle：`candidate → verified → deprecated`，双人 sign-off 队列
- Cadence Audit：本周 / 本月 / 本季应执行的 review 任务清单
- Exception Rule 人工发布队列（Pulse approved → exception rule draft → 审核 → 发布）

### 6D.8 ObligationRule 字段补齐（Plan §4 / §10 对齐）

在现有 `ObligationRule` 基础上补充 5 字段（见 §8.1 完整定义）：

| 字段                            | 值域                                                        | CPA-facing 呈现                                             |
| ------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `status`                        | `candidate / verified / deprecated`                         | 🌀 Draft / ✓ (默认无标) / 🕳 Retired                        |
| `rule_tier`                     | `basic / annual_rolling / exception / applicability_review` | 颜色 + 图标系统（🌩 / ⚠ / 无）                              |
| `applicable_year`               | int                                                         | Source 字符串里带 `(2026 edition)`                          |
| `source_title`                  | string                                                      | "IRS Publication 509" 全名显示                              |
| `requires_applicability_review` | bool                                                        | `⚠ Verify eligibility before relying on this deadline` 文案 |
| `checklist_json`                | D1 JSON text                                                | 展开 6 项 Quality Badge（§6D.4）                            |
| `risk_level`                    | `low / med / high`                                          | 高风险要求双人 sign-off；UI 不直接显示                      |

### 6D.9 规则表述白 / 黑名单（Plan §8 字面对齐）

内部 style guide + AI prompt 硬约束：

**允许的措辞：**

- "Source indicates..."
- "This may affect..."
- "Verify eligibility before relying on this deadline."
- "Human verified on 2026-04-12."

**禁止的措辞（AI 生成 + UI 文案均不允许）：**

- "Your client qualifies for this relief."
- "No penalty will apply."
- "This deadline is guaranteed."
- "AI confirmed this rule."

已接入 §6.2.1 Glass-Box AI 的输出后处理正则校验。

### 6D.10 对 File In Time 的 8 维打击总表

| 维度                       | File In Time                                    | DueDateHQ v2.0 + Rules-as-Asset                                                                        |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 规则交付形式               | 年度维护包（一次性）                            | **持续流水** + 每条 freshness 信号                                                                     |
| 规则来源可见性             | 不透明（黑箱）                                  | `/rules` Library + `/watch` 公开                                                                       |
| 规则变更留痕               | 无                                              | 每 rule 有 version + ExceptionRule overlay history                                                     |
| Exception 处理             | 没这个概念                                      | **独立实体** · 可溯可撤 · 撤销时自动重算                                                               |
| 验证质量证明               | "请相信我们"                                    | **Quality Badge 6 项** + **Cross-verified chip**                                                       |
| 错误责任                   | 用户自负                                        | E&O $2M + Verification Rhythm 书面承诺                                                                 |
| 活跃度信号                 | 桌面应用 · 没法知道                             | Freshness Badge 24/7 + Weekly Rhythm Report 邮件                                                       |
| **Native 体验 / 平台覆盖** | **Windows exe only · 本地 + 网络盘 · 无移动端** | **Web + PWA（全平台 Add-to-Dock + Home-Screen）+ Web Push + macOS Menu Bar Widget（Phase 2）**（§7.8） |

### 6D.11 验收标准（T-RA-\*）

| Test ID | 描述                                      | 预期                                                             |
| ------- | ----------------------------------------- | ---------------------------------------------------------------- |
| T-RA-01 | 新建一条 rule 并填 6 项 checklist         | Quality Badge 显示 6/6 绿色                                      |
| T-RA-02 | 两条 source 冲突录入                      | Rule 状态 `needs_review`，不进入 published pool                  |
| T-RA-03 | Pulse approved → 发布为 ExceptionRule     | Obligation Detail 的 Deadline History 显示 overlay               |
| T-RA-04 | ExceptionRule 撤销 (`status='retracted'`) | 所有关联 obligation 的 `current_due_date` 重算 + 邮件推送        |
| T-RA-05 | Base rule v3.2 → v3.3 升级                | 关联 overlay 标 `needs_reevaluation`，ops 复核前不自动启用       |
| T-RA-06 | Source Registry 某源连续失败 3 次         | Dashboard Freshness Badge 变 🟡 + Sentry 告警                    |
| T-RA-07 | `/rules` 页未登录访问                     | 200 OK，不含客户数据                                             |
| T-RA-08 | `/watch` 页公开访问                       | 200 OK，显示 15 源 + 最近 check 时间                             |
| T-RA-09 | Weekly Rhythm Report 发送                 | 周一 8am 所有 Owner 收到                                         |
| T-RA-10 | 规则包 JSON 导出                          | Schema 完整，可被外部系统消费                                    |
| T-RA-11 | "禁止措辞"出现在 AI 输出                  | 正则拦截 + refusal fallback                                      |
| T-RA-12 | 2 个 overlay 叠加同一 obligation          | Deadline History 显示两条 + current_due_date 为最新 overlay 的值 |

### 6D.12 工程估算

| 子项                                                   | 工时     |
| ------------------------------------------------------ | -------- |
| 数据库迁移（3 新表 + ObligationRule 5 字段）           | 0.5 人天 |
| Overlay 计算引擎（base + overlays → current_due_date） | 1 人天   |
| Source Registry 管理 + Freshness Badge                 | 0.6 人天 |
| Rule Quality Badge + Cross-verified chip               | 0.5 人天 |
| Deadline History tab                                   | 0.4 人天 |
| `/rules` 公开页 + PDF/JSON 导出                        | 0.8 人天 |
| `/watch` 公开页 + 健康监控 worker                      | 0.5 人天 |
| Weekly Rhythm Report 邮件                              | 0.3 人天 |
| Pulse → ExceptionRule 适配层（改 §6.3.3 Batch Apply）  | 0.4 人天 |
| 验收测试用例                                           | 0.3 人天 |

**合计 ≈ 5.3 人天。** 推荐作为 P1 第一批优先级落地，或集训后 Phase 1 前两周集中处理。

### 6D.13 为什么是 P1 而非 P0

- Plan 的严格要求（Source Registry + Checklist + Cross-source）是**中长期 ops 管理** 基础设施，不是 MVP Demo 必需
- P0 只做 Rule Engine v1（Federal + CA/NY/TX/FL/WA 规则手工录入）已能通 Story S1–S3 的 AC
- 但 **P1 必须做 Rules-as-Asset**——这是 v2.0 相对 File In Time 最核心的护城河
- 短期 Demo 可在 `/rules` 和 `/watch` 以**静态页面 + mock 数据**展示承诺；真实后端监控 + overlay 引擎可在 Phase 1 4 周内落地

### 6D.14 数据模型索引（§8.1 / §8.2 已声明）

见 §8.1 `RuleSource / ExceptionRule / RuleCrossVerification / OpsCadence` 表 + ObligationRule 5 新字段。

---
