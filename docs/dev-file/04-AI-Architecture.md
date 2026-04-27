# 04 · AI Architecture · Glass-Box · RAG · Pulse Pipeline

> 对齐 PRD §6.2 / §6.3 / §6.6 / §9 / §6D。
> 代码层必须体现的五条纪律：
>
> 1. **No citation, no render** — 无 `[n]` → 降级 refusal
> 2. **Retrieval before generation** — prompt 只能引用已传入的 chunk
> 3. **PII never leaves** — 占位符进 LLM，输出后回填
> 4. **Never conclude** — 白名单措辞，黑名单正则拦截
> 5. **Zero Data Retention** — 仅通过 AI Gateway 路由到 ZDR endpoint

---

## 1. AI 层总图

```
┌──────────────────────────────────────────────────────────────┐
│                   AI Orchestrator (packages/ai)              │
│   唯一 LLM 出入口；业务模块不直接碰 OpenAI / Anthropic SDK    │
└───────┬──────────────┬──────────────┬─────────────┬──────────┘
        │              │              │             │
        ▼              ▼              ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐
│  Retriever   │ │ Prompter │ │  Guard       │ │  Tracer  │
│  Vectorize   │ │ registry │ │ citation     │ │ Langfuse │
│  top-k 6     │ │ versioned│ │ PII / banned │ │ llm_log  │
└──────┬───────┘ └─────┬────┘ └──────┬───────┘ └────┬─────┘
       │               │             │              │
       └───────────────▼─────────────┘              │
                       │                            │
                       ▼                            ▼
        ┌─────────────────────────────┐    ┌──────────────┐
        │  Cloudflare AI Gateway      │◄───┤ Budget (KV)  │
        │  OpenAI (ZDR) / Anthropic   │    │ per-firm/day │
        │  缓存 / 重试 / 限流 / trace  │    └──────────────┘
        └─────────────────────────────┘
```

`packages/ai` 是 AI 相关的唯一业务包。`apps/server` 的 procedure 只调 `packages/ai` 暴露的高阶函数（如 `generateBrief(input, ports)`），不碰 LLM SDK。`packages/ai` 不直接 import `@duedatehq/db`；持久化 `AiOutput` / `EvidenceLink` / `LlmLog` 由 `apps/server` 注入 writer ports 完成。

---

## 2. 模型路由（约束）

```ts
// packages/ai/router.ts
export const modelRoute = {
  tip: { primary: 'openai/gpt-4o-mini', fallback: 'anthropic/claude-3-5-haiku' },
  'mapper@v1': { primary: 'openai/gpt-4o-mini', fallback: 'anthropic/claude-3-5-haiku' },
  'normalizer-entity@v1': { primary: 'openai/gpt-4o-mini', fallback: 'anthropic/claude-3-5-haiku' },
  'normalizer-tax-types@v1': {
    primary: 'openai/gpt-4o-mini',
    fallback: 'anthropic/claude-3-5-haiku',
  },
  brief: { primary: 'openai/gpt-4o', fallback: 'anthropic/claude-sonnet-4-5' },
  pulseExtract: { primary: 'openai/gpt-4o', fallback: 'anthropic/claude-sonnet-4-5' },
  riskSummary: { primary: 'openai/gpt-4o', fallback: 'anthropic/claude-sonnet-4-5' },
  ask: { primary: 'openai/gpt-4o', fallback: 'anthropic/claude-sonnet-4-5' },
  embedding: { primary: 'openai/text-embedding-3-small', fallback: null },
}
```

Prompt registry:

- `mapper@v1` → `packages/ai/src/prompts/mapper@v1.md`，ZDR route，JSON object，temperature 0；无 API key 时返回 structured refusal，不抛裸异常。
- `normalizer-entity@v1` → `packages/ai/src/prompts/normalizer-entity@v1.md`，同模型档位，用于 entity_type 字典未命中项。
- `normalizer-tax-types@v1` → `packages/ai/src/prompts/normalizer-tax-types@v1.md`，同模型档位，用于 tax_types 字典未命中项。

**所有 LLM 调用强制经 Cloudflare AI Gateway**：

- URL 形态：`https://gateway.ai.cloudflare.com/v1/{account}/{gateway}/openai/...`
- 好处：自动缓存（幂等 query）、自动重试、自动 rate limit、自动 trace、所有调用的 cost / latency 在 Cloudflare Dashboard 可见
- ZDR 在 OpenAI 组织级启用（AI Gateway 不存 prompt / completion 原文）

---

## 3. Glass-Box Guard（输出后置校验）

每次 LLM 返回必过 5 道闸（实现在 `packages/ai/guard.ts`）：

```ts
// 约束形态
export interface GuardResult {
  ok: boolean
  text?: string
  citations?: number[]
  reason?: 'no_citation' | 'citation_oob' | 'banned_phrase' | 'pii_mismatch' | 'empty_retrieval'
}

export async function glassBoxGuard(
  raw: string,
  ctx: { retrievedChunks: Chunk[]; piiMap: Record<string, string>; kind: AiKind },
): Promise<GuardResult>
```

五道闸的职责：

1. **Citation 正则校验**：`/\[(\d+)\]/g` 至少匹配 1 次，否则 `no_citation`
2. **Citation 越界校验**：每个 `[n]` 对应的 index 必须存在于 `retrievedChunks`，否则 `citation_oob`
3. **黑名单短语**：`/your client qualifies/i` · `/no penalty will apply/i` · `/this is tax advice/i` · `/ai confirmed/i` · `/this deadline is guaranteed/i` 命中任一即 `banned_phrase`
4. **PII 回填**：将 `{{client_N}}` / `{{ein_N}}` 占位符替换回真实值；若出现未声明占位符即 `pii_mismatch`
5. **White-list tone scoring**：软提示，不阻塞（收集指标）

**失败处理**：重试 1 次 → 仍失败返回固定 refusal：

```
"I don't have a verified source for this. [Ask a human]"
```

---

## 4. RAG Pipeline

```
User event (dashboard load / Ask / Apply)
       │
       ▼
┌────────────────────────────────────┐
│ 1. Query builder                   │
│   embedding = openai.embed(query)  │
│   filter = { firmId, jurisdiction, │
│              entity_type, tax_type}│
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│ 2. Retriever                       │
│   Vectorize.query(embedding,       │
│     { topK: 6, filter })           │
│   → global rule_chunks             │
│   → firm pulse_chunks              │
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│ 3. PII redact                      │
│   client.name → {{client_1}}       │
│   client.ein  → {{ein_1}}          │
│   保存 piiMap                       │
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│ 4. Prompt assembly                 │
│   system: glass-box persona        │
│   retrieved chunks with [1]..[n]   │
│   user ctx (redacted)              │
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│ 5. LLM call via AI Gateway         │
│   stream or one-shot               │
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│ 6. glassBoxGuard                   │
│   (citation + banned + PII refill) │
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│ 7. Return guarded AiResult         │
│   caller writes llm_log / ai_output│
│   / evidence via injected writers  │
└────────────────────────────────────┘
```

**向量库选型**：Vectorize

- `rule_chunks` 索引：每条 verified rule 切成 200 token 片段，向量化入库；`firm_id = null`（全局）
- `pulse_chunks` 索引：每条 approved pulse 的 `verbatim_quote + summary` 入库；全局 Pulse chunk 可 `firm_id = null`，firm-specific 应用解释必须带 `firm_id`
- 检索策略：不要用单个 `firmId` filter 排除全局规则。先查 global rule collection（`firm_id IS NULL`），再查 firm collection（`firm_id = currentFirmId`），合并 top-k 后按 jurisdiction / entity_type / tax_type rerank。
- 未来 `client_memory_chunks`（Phase 2）：记录 CPA 对某客户的自由备注，供 AI 检索（PII 敏感，默认关闭）

---

## 5. 能力矩阵（Phase 0 / 1 落地）

| 能力                    | 优先级 | 输入                                        | 输出                                        | 降级                                                                      |
| ----------------------- | ------ | ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| Weekly Brief            | P0     | 本 firm Smart Priority top-N + 客户 summary | 3–5 句带 citation                           | 缓存上次版本 + 模板 `You have N items this week.`                         |
| Client Risk Summary     | P0     | 单客户 30 天 obligations + rule chunks      | 一段话 + bullets                            | 纯 SQL 聚合 `3 upcoming, 1 critical`                                      |
| Deadline Tip            | P0     | 单 obligation + rule chunk                  | 3 段 What/Why/Prepare                       | 从 `rule.default_tip` 兜底                                                |
| Smart Priority          | P0     | 全部 open obligations + client 字段         | 打分 + 因子分解                             | **纯函数零 LLM**（`packages/core/priority`）；LLM 仅用于 `Why-hover` 解释 |
| Pulse Source Translator | P0     | 官方公告原文                                | 结构化 JSON + 人话 summary + source excerpt | 置信度 < 0.7 标记 `pending_review`                                        |
| Ask DueDateHQ           | P1     | 自然语言 query                              | 表格 + 一句话 + citations                   | 预设模板 5 条兜底（§6.6.5）                                               |
| AI Draft Client Email   | P1     | Pulse + 受影响客户                          | 英文邮件草稿                                | 固定模板                                                                  |
| Migration Field Mapper  | P0     | 表头 + 前 5 行样本                          | mapping JSON                                | Preset profile + 手动下拉                                                 |
| Migration Normalizer    | P0     | 字段枚举值                                  | 归一值 + confidence                         | 字典 + fuzzy + 手动编辑                                                   |

**关键决策：Smart Priority 是纯函数**，不走 LLM。打分算法 + 因子权重写死在 `packages/core/priority/score.ts`；LLM 只在用户 hover `Why?` 时生成一句自然语言解释，且带 citation。

---

## 6. Pulse Pipeline（Story S3 完整实现）

### 6.1 Ingest（Cron Trigger）

- 每 30 分钟运行 `jobs/pulse/ingest.ts`
- 抓取源（Phase 0 仅 2 个示例；Phase 1 扩到 15 个）：
  - IRS Newsroom RSS
  - CA FTB Emergency Tax Relief
  - NY DTF Tax News
- 策略：抓取 → 与 `raw_r2_key` hash 比对 → 新内容入库 `pulse(status=pending_review)` → 投递 Queue 消息 `{ type: 'extract', pulseId }`

### 6.2 Extract（Queue Consumer）

- 消费者从 `pulse_extract_queue` 取消息
- 调 `packages/ai/pulse-extract.ts`，走 Glass-Box Guard
- 更新 `pulse.parsed_*` 字段 + `confidence`
- `confidence < 0.7` 保持 `pending_review`，不进 banner
- `confidence ≥ 0.7` 转 `requires_human_review=false` 但仍等人工点 Approve

### 6.3 Match（服务端）

人工 Approve 触发 `modules/pulse/match.ts`。D1 / SQLite 不支持 Postgres `ANY($1)`；实现必须生成参数化 `IN (?, ?...)`，或使用 helper table。下例是 D1 可执行形态：

```sql
SELECT c.id, c.name, oi.id AS obligation_id, oi.original_due_date
FROM client c
JOIN obligation_instance oi ON oi.client_id = c.id AND oi.firm_id = c.firm_id
WHERE c.firm_id = ?
  AND c.state = ?
  AND (? = 0 OR c.county IN (?, ?, ?))             -- generated placeholders
  AND oi.tax_type IN (?, ?, ?)                     -- generated placeholders
  AND c.entity_type IN (?, ?, ?)                   -- generated placeholders
  AND oi.original_due_date >= ?
  AND oi.status NOT IN ('filed', 'paid', 'not_applicable')
```

返回受影响客户 + obligations 列表，前端展示 Pulse Detail Drawer。若 Pulse 是县级 relief 且客户 `county IS NULL`，不要进入默认 Apply 集合；放入 `needs_review` 分组，要求 CPA 手动确认。

### 6.4 Batch Apply（D1 事务）

前端 `Apply` → 后端一个原子事务完成：

```
d1.batch([
  UPDATE obligation_instance SET current_due_date = $newDue, updated_at = now() WHERE id IN (...),
  INSERT INTO evidence_link (source_type='pulse_apply', source_id, source_url, verbatim_quote, applied_by, applied_at) VALUES ...,
  INSERT INTO audit_event (action='pulse.apply', before_json, after_json, ...),
  INSERT INTO email_outbox (external_id, to, subject, body_json, ...),    ← Transactional Outbox
  INSERT INTO pulse_application (pulse_id, obligation_instance_id, ...) VALUES ...,
])
```

**Email Outbox Consumer**（独立 Queue）每分钟 flush 一次，调 Resend 发邮件。

### 6.5 Revert（24h 内）

`pulse.revert` 按 `pulse_application.id` 反向一次事务：恢复 `current_due_date`，写 `reverted_at`，追加 `audit_event(action='pulse.revert')`。

### 6.6 与 ExceptionRule Overlay 的关系

- **Phase 0 · Demo Sprint**（§09 简化口径）：直接 UPDATE `current_due_date` + evidence_link，不建 `exception_rule` 表
- **Phase 0 完整 MVP（4 周）+ Phase 1**：启用 Overlay Engine。每个 Pulse Apply 创建一条 `exception_rule` + N 条 `obligation_exception_application`，`current_due_date` 改为运行时 = base_due_date + apply(active overlays)
- **Sprint → 完整 MVP 的数据迁移**：从 `pulse_application` 反推生成 `exception_rule`，一次性 script

---

## 7. Ask DueDateHQ 的三层防护（Phase 1）

自然语言问答走 **NL → DSL → SQL** 三层，绝不允许 LLM 直接生成 SQL：

1. **NL → DSL**：LLM 产出受限 JSON DSL（`{ intent, filters, aggregations }`），Zod 校验
2. **DSL → SQL**：服务端确定性映射到白名单 SQL 模板，参数化，租户 `firm_id` 强制注入
3. **SQL 执行**：查询超时 3s；返回行数 > 1000 截断 + 提示

禁止：`DROP` / `UPDATE` / `DELETE` / `INSERT` / 多 statement / 子查询未授权表。

---

## 8. 成本与限流

**每 firm / day** 的 LLM 配额（存 KV）：

| 任务                          | 每日 cap                                          |
| ----------------------------- | ------------------------------------------------- |
| Weekly Brief                  | 1（缓存 24h）                                     |
| Client Risk Summary           | N 个客户 × 1                                      |
| Deadline Tip                  | 50（缓存 per-rule 7d）                            |
| Pulse Extract                 | 无 cap（管理员触发）                              |
| Ask                           | 30（付费可升）                                    |
| Migration Mapper / Normalizer | 20 req / firm / day（FU-2 hook；每 batch 1–2 次） |

超限返回 `rate_limited` + 明确 message。成本阈值：默认 $0.02 / firm / day，超过发告警。

---

## 9. 流式输出

- Weekly Brief / Ask 用 **Server-Sent Events**（Hono `streamSSE`）
- 前端 TanStack Query + `useStream` 模式；UI 逐字显示
- Citation 在流结束并通过 `glassBoxGuard` 后一次性渲染（避免半句话误导）
- 流式正文在 guard 完成前必须标记为 provisional，且不得触发 Evidence chip / Copy as Citation；guard 失败则整体替换为 refusal，不保留未验证文本

---

## 10. Langfuse 集成

- 所有 LLM 调用在 `packages/ai/trace.ts` 自动上报
- 字段：`prompt_version` / `model` / `firm_id (hash)` / `latency` / `tokens` / `cost` / `guard_result`
- Prompt 版本管理在 `packages/ai/src/prompts/*.md`，每次改动 `prompt_version++`
- A/B 实验：路由里按 `firm_id` hash 分桶 → 不同 prompt_version

---

## 11. 测试策略

- **Guard 单测**：5 道闸每道 3 条断言（Vitest）
- **Prompt snapshot 测试**：固定输入 → LLM 响应用 Langfuse 回放；输出文本不比对，只比 citation 数量和黑名单
- **Pulse extract 集成测**：mock fetch RSS → 跑完整管线 → 断言 DB 状态
- **RAG 端到端**：seed 10 条 rule_chunks → 构造 query → 断言 top-k 召回率

---

## 12. 未来演进

- **多语言支持**：prompts 按 locale 切换；glass-box guard 黑名单本地化
- **自建 RAG 工具链**：若 Vectorize 不够用，退路是 D1 + FTS5 brute-force cosine，再退到外部 Pinecone
- **Agentic 能力**：ReAct / tool-use 仅限 Ask，且工具全走 DSL 白名单

---

继续阅读：[05-Frontend-Architecture.md](./05-Frontend-Architecture.md)
