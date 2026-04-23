# 04 · AI Architecture · Glass-Box · RAG · Pulse Pipeline

> 对齐 PRD §6.2 / §6.3 / §6.6 / §9 / §6D。
> 核心纪律（代码层必须体现）：
> 1. **No citation, no render** — 无 `[n]` → 降级 refusal
> 2. **Retrieval before generation** — prompt 只能引用传入 chunk
> 3. **PII never leaves** — 占位符进 LLM，输出后回填
> 4. **Never conclude** — 白名单措辞，黑名单正则拦截
> 5. **ZDR endpoint only** — Zero Data Retention 强制

---

## 1. AI 层总图

```
┌──────────────────────────────────────────────────────────────┐
│                       AI Orchestrator                        │
│  modules/ai/index.ts · 对内唯一 LLM 入口                       │
└───────┬──────────────┬──────────────┬─────────────┬──────────┘
        │              │              │             │
        ▼              ▼              ▼             ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────┐
│  Retriever   │ │  Prompter │ │ Guard / Post │ │ Tracer   │
│  pgvector    │ │  prompt/  │ │ cite / PII / │ │ Langfuse │
│  top-k 6     │ │  registry │ │ regex / ZDR  │ │ llm_logs │
└──────┬───────┘ └─────┬─────┘ └──────┬───────┘ └────┬─────┘
       │               │              │              │
       └───────────────▼──────────────┘              │
                       │                             │
                       ▼                             ▼
               ┌────────────────┐              ┌──────────┐
               │ LiteLLM Gateway│◄─────────────┤ Billing  │
               │  GPT-4o / mini │                │ budgets │
               │  Claude fallback                └──────────┘
               └────────────────┘
```

---

## 2. 模型选型与路由

```typescript
// modules/ai/router.ts
export const modelRouter = {
  tip:           { primary: "openai/gpt-4o-mini",  fallback: "anthropic/claude-3-5-haiku" },
  mapper:        { primary: "openai/gpt-4o-mini",  fallback: "anthropic/claude-3-5-haiku" },
  normalizer:    { primary: "openai/gpt-4o-mini",  fallback: "anthropic/claude-3-5-haiku" },
  brief:         { primary: "openai/gpt-4o",       fallback: "anthropic/claude-sonnet-4-5" },
  pulseExtract:  { primary: "openai/gpt-4o",       fallback: "anthropic/claude-sonnet-4-5" },
  riskSummary:   { primary: "openai/gpt-4o",       fallback: "anthropic/claude-sonnet-4-5" },
  ask:           { primary: "openai/gpt-4o",       fallback: "anthropic/claude-sonnet-4-5" },
  embedding:     { primary: "openai/text-embedding-3-small", fallback: null },
};
```

所有调用经 LiteLLM 网关：

- 路由 ZDR endpoint（OpenAI ZDR org / Azure OpenAI）
- 自动重试 + fallback
- cost / latency 记录到 `llm_logs`
- API key 不出服务端

---

## 3. Glass-Box Guard（输出后置校验）

每次 LLM 返回必过 5 道闸：

```typescript
// modules/ai/guard.ts
export async function glassBoxGuard(
  rawOutput: string,
  context: { retrievedChunks: Chunk[]; piiMap: Record<string, string>; model: string }
): Promise<GuardResult> {
  // 1. Regex citation check
  const citations = [...rawOutput.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1]));
  if (citations.length === 0) return { ok: false, reason: "no_citation" };

  // 2. Hallucination check: every [n] must exist
  const maxValid = context.retrievedChunks.length;
  if (citations.some(n => n < 1 || n > maxValid)) return { ok: false, reason: "citation_oob" };

  // 3. Blacklist phrase check
  const banned = [
    /your client qualifies/i,
    /no penalty will apply/i,
    /this is tax advice/i,
    /ai confirmed/i,
    /this deadline is guaranteed/i,
  ];
  if (banned.some(r => r.test(rawOutput))) return { ok: false, reason: "banned_phrase" };

  // 4. PII placeholder back-fill
  const filled = fillPiiPlaceholders(rawOutput, context.piiMap);

  // 5. Whitelist tone nudge (soft)
  const tone = scoreTone(filled);  // heuristic; does not block

  return { ok: true, text: filled, citations, toneScore: tone };
}
```

校验失败 → 重试 1 次 → 仍失败返回：

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
│  embedding = openai.embed(query)   │
│  filters = { firm_id, jurisdiction │
│   , entity, tax_type }             │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ 2. pgvector top-k=6                │
│  SELECT chunk_text, rule_id, meta  │
│  FROM rule_chunks                  │
│  WHERE jurisdiction = :j           │
│    AND (tax_type IS NULL OR ...)   │
│  ORDER BY embedding <=> :query_emb │
│  LIMIT 6                           │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ 3. PII redact                      │
│  piiMap = collectClientPII(ctx)    │
│  replace with {{client_N}}         │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ 4. Prompt assembly                 │
│  system + retrieved [n] + user ctx │
│  + today + role                    │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ 5. LLM call (LiteLLM · ZDR)        │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ 6. glassBoxGuard()                 │
│  → retry 1× or refusal template    │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ 7. Persist                         │
│  AiOutput + EvidenceLink[] +       │
│  LlmLog + Langfuse trace           │
└────────────────────────────────────┘
```

### 4.1 Retriever 实现要点

```typescript
// modules/ai/retriever.ts
export async function retrieveChunks(params: {
  query: string;
  jurisdiction?: string;
  entityType?: string;
  taxType?: string;
  k?: number;
}): Promise<Chunk[]> {
  const embedding = await embedText(params.query);

  return db.select({
    id: ruleChunks.id,
    text: ruleChunks.chunkText,
    ruleId: ruleChunks.ruleId,
    meta: ruleChunks,
  })
  .from(ruleChunks)
  .where(
    and(
      params.jurisdiction ? eq(ruleChunks.jurisdiction, params.jurisdiction) : undefined,
      params.taxType ? eq(ruleChunks.taxType, params.taxType) : undefined,
    )
  )
  .orderBy(sql`embedding <=> ${toVec(embedding)}`)
  .limit(params.k ?? 6);
}
```

### 4.2 Prompt Registry

所有 prompt 以 Markdown 存仓库：

```
prompts/
├── weekly_brief.v3.md
├── deadline_tip.v2.md
├── pulse_extraction.v2.md
├── client_risk_summary.v2.md
├── migration_mapper.v1.md
├── migration_normalizer.v1.md
├── ask_intent_classifier.v1.md
├── ask_dsl_generator.v1.md
├── ask_summarizer.v1.md
├── readiness_explanation.v1.md
└── onboarding_agent.v1.md
```

每个 prompt 文件包含 frontmatter：

```markdown
---
version: v3
model_tier: tier_2
max_tokens: 800
temperature: 0.2
changelog:
  - v1: initial
  - v2: tightened refusal on advice-type questions
  - v3: added explicit dollar-aware instruction
---

You are DueDateHQ, a glass-box tax deadline copilot for US CPAs.

Rules (non-negotiable):
- ...

Given context:
{{retrieved_chunks}}

Client snapshot:
{{client_snapshot_with_placeholders}}

Today: {{today_iso}}

Produce up to 5 sentences, each ending with [n] citation index.
```

Prompt 加载：

```typescript
// modules/ai/prompts.ts
export function loadPrompt(name: string, version: string) {
  const path = `prompts/${name}.${version}.md`;
  const text = fs.readFileSync(path, "utf-8");
  const { frontmatter, body } = parseMd(text);
  return { frontmatter, body };
}
```

**Prompt 版本必须在 `AiOutput.prompt_version` 落库** → 回放任意历史 AI 输出。

---

## 5. Glass-Box AI 能力矩阵（落地位置）

| 能力 | 模块 | 入口 | 调用模型 | 缓存 | Fallback |
|---|---|---|---|---|---|
| Weekly Brief | `modules/ai/brief.ts` | `getDashboardBrief(firmId)` | tier_2 | 1 / firm / day | 上次缓存 + 模板 |
| Client Risk Summary | `modules/ai/client-risk.ts` | Client Detail 抽屉 | tier_2 | 按 client_id 1h | SQL 聚合模板 |
| Deadline Tip | `modules/ai/deadline-tip.ts` | Obligation Detail | tier_1 | `(rule_id, client_id)` 7d | `rule.default_tip` |
| Smart Priority (score) | `modules/priority/score.ts` | 纯函数（不用 LLM） | — | — | — |
| Smart Priority (why-hover) | `modules/ai/priority-explain.ts` | hover ✦ | tier_1 | 按 obligation_id 24h | 因子表格 |
| Pulse Source Translator | `modules/pulse/extract.ts` | worker | tier_2 | 按 raw_content_hash 永久 | pending_review 人工 |
| Ask DueDateHQ | `modules/ask/*` | Cmd-K / Ask | tier_1 + tier_2 | 问句 hash 1h | 5 模板 |
| AI Draft Client Email | `modules/ai/draft-email.ts` | Readiness / Alert | tier_2 | 无 | 固定模板 |
| Migration Field Mapper | `modules/migration/mapper.ts` | Step 2 | tier_1 | preset 命中跳过 | Preset + 手动 |
| Migration Normalizer | `modules/migration/normalize.ts` | Step 3 | tier_1 | 按 (field, raw_value) 永久 | 字典 + fuzzy |
| Readiness Explanation | `modules/readiness/explain.ts` | 客户侧 [?] | tier_1 | 按 checklist_item 永久 | "ask your CPA" |
| Onboarding Agent | `modules/ai/onboarding.ts` | 空态首页 | tier_2 | 无 | 4 步向导 |

---

## 6. Pulse Pipeline（Story S3 完整实现）

### 6.1 Ingest Worker（6 源独立）

```typescript
// modules/pulse/ingest.ts
export const pulseIngestIRS = inngest.createFunction(
  { id: "pulse-ingest-irs", retries: 3, concurrency: 1 },
  { cron: "*/30 * * * *" },
  async ({ step }) => {
    const raw = await step.run("fetch", async () => {
      const res = await fetch("https://www.irs.gov/newsroom/rss", { signal: AbortSignal.timeout(15_000) });
      return await res.text();
    });

    await step.run("update-source-health", () => markSourceHealthy("irs_newsroom"));

    const items = parseIrsRss(raw);
    for (const item of items) {
      await step.run(`upsert-${item.id}`, async () => {
        await db.insert(pulses).values({
          source: "irs_newsroom",
          sourceUrl: item.url,
          rawContentS3Key: await saveSnapshotToR2(item),
          publishedAt: item.publishedAt,
          status: "pending_review",
        }).onConflictDoNothing();
      });

      await step.sendEvent("pulse/extract-needed", {
        name: "pulse.extract.needed",
        data: { pulseId: item.id },
      });
    }
  }
);
```

6 源各自一个 Inngest function，失败互不影响。

### 6.2 LLM Extract Worker

```typescript
// modules/pulse/extract.ts
export const pulseExtract = inngest.createFunction(
  { id: "pulse-extract", retries: 2 },
  { event: "pulse.extract.needed" },
  async ({ event, step }) => {
    const pulse = await step.run("load", () => getPulseById(event.data.pulseId));
    const rawHtml = await step.run("fetch-snapshot", () => loadSnapshotFromR2(pulse.rawContentS3Key));
    const cleanText = stripHtml(rawHtml);

    const extraction = await step.run("llm-extract", async () => {
      return await runPromptJson({
        promptName: "pulse_extraction",
        version: "v2",
        context: { raw_content: cleanText, published_at: pulse.publishedAt },
        schema: PulseExtractionSchema,  // Zod
      });
    });

    await step.run("persist", async () => {
      await db.update(pulses).set({
        aiSummary: extraction.summary,
        verbatimQuote: extraction.verbatim_quote,
        parsedJurisdiction: extraction.jurisdiction,
        parsedCounties: extraction.counties,
        parsedForms: extraction.affected_forms,
        parsedEntityTypes: extraction.affected_entity_types,
        parsedOriginalDueDate: extraction.original_due_date,
        parsedNewDueDate: extraction.new_due_date,
        parsedEffectiveFrom: extraction.effective_from,
        confidence: extraction.confidence,
      }).where(eq(pulses.id, event.data.pulseId));
    });

    // 高置信 → 进 ops review queue；低置信保持 pending_review 不推送
    if (extraction.confidence >= 0.7) {
      await step.sendEvent("pulse/ready-for-review", { data: { pulseId: event.data.pulseId } });
    }
  }
);
```

### 6.3 Match Engine

```typescript
// modules/pulse/match.ts
export async function findAffectedObligations(pulseId: string, firmId: string) {
  const p = await getPulseById(pulseId);
  return withFirmContext(firmId, (tx) =>
    tx.select({
      clientId: clients.id,
      clientName: clients.name,
      obligationId: obligationInstances.id,
      currentDueDate: obligationInstances.currentDueDate,
    })
    .from(clients)
    .innerJoin(obligationInstances, eq(obligationInstances.clientId, clients.id))
    .where(and(
      eq(clients.state, p.parsedJurisdiction),
      p.parsedCounties?.length
        ? or(isNull(clients.county), inArray(clients.county, p.parsedCounties))
        : undefined,
      p.parsedEntityTypes?.length
        ? inArray(clients.entityType, p.parsedEntityTypes)
        : undefined,
      p.parsedForms?.length
        ? inArray(obligationInstances.taxType, p.parsedForms)
        : undefined,
      sql`status NOT IN ('filed','paid','not_applicable')`,
      eq(obligationInstances.currentDueDate, p.parsedOriginalDueDate)
    ))
  );
}
```

### 6.4 Batch Apply（原子事务 + Outbox）

```typescript
// modules/pulse/apply.ts
export async function applyPulseBatch(input: {
  pulseId: string;
  firmId: string;
  actorUserId: string;
  selectedObligationIds: string[];
}) {
  return withFirmContext(input.firmId, (tx) =>
    tx.transaction(async (txx) => {
      const pulse = await lockPulseForApply(txx, input.pulseId);
      if (pulse.status === "applied") throw new Error("already_applied");

      const exception = await ensureExceptionRule(txx, pulse);

      for (const obligationId of input.selectedObligationIds) {
        await txx.insert(obligationExceptionApplication).values({
          obligationInstanceId: obligationId,
          exceptionRuleId: exception.id,
          appliedByUserId: input.actorUserId,
        });
        await recomputeCurrentDueDate(txx, obligationId);
        await txx.insert(evidenceLinks).values({
          firmId: input.firmId,
          obligationInstanceId: obligationId,
          sourceType: "pulse_apply",
          sourceId: exception.id,
          sourceUrl: exception.sourceUrl,
          verbatimQuote: exception.verbatimQuote,
          appliedBy: input.actorUserId,
        });
      }

      await txx.insert(auditEvents).values({
        firmId: input.firmId,
        actorId: input.actorUserId,
        entityType: "pulse",
        entityId: input.pulseId,
        action: "pulse.applied",
        afterJson: { exceptionRuleId: exception.id, obligationIds: input.selectedObligationIds },
      });

      await txx.insert(emailOutbox).values({
        firmId: input.firmId,
        kind: "pulse_digest",
        payload: { pulseId: input.pulseId, exceptionRuleId: exception.id, obligationIds: input.selectedObligationIds, actorId: input.actorUserId },
      });

      await txx.update(pulses)
        .set({ status: "applied", reviewedAt: new Date(), reviewedBy: input.actorUserId })
        .where(eq(pulses.id, input.pulseId));
    })
  );
}
```

Worker 消费 Outbox：

```typescript
// modules/notifications/email-outbox.ts
export const emailOutboxWorker = inngest.createFunction(
  { id: "email-outbox", retries: 5 },
  { cron: "* * * * *" },
  async ({ step }) => {
    const rows = await step.run("claim", () => claimOutboxBatch(50));
    for (const row of rows) {
      await step.run(`send-${row.id}`, () => sendResend(row));
    }
  }
);
```

### 6.5 Overlay Engine（计算 current_due_date）

```typescript
// modules/overlay/compute.ts
export async function recomputeCurrentDueDate(tx: Transaction, obligationId: string) {
  const o = await tx.select().from(obligationInstances).where(eq(obligationInstances.id, obligationId)).limit(1);
  const overlays = await tx
    .select()
    .from(obligationExceptionApplication)
    .innerJoin(exceptionRules, eq(exceptionRules.id, obligationExceptionApplication.exceptionRuleId))
    .where(and(
      eq(obligationExceptionApplication.obligationInstanceId, obligationId),
      isNull(obligationExceptionApplication.revertedAt),
      inArray(exceptionRules.status, ["applied", "verified"]),
    ));

  let current = o[0].baseDueDate;
  for (const ov of overlays) {
    current = applyOverride(current, ov.exceptionRules);
  }

  await tx.update(obligationInstances)
    .set({ currentDueDate: current, updatedAt: new Date() })
    .where(eq(obligationInstances.id, obligationId));
}
```

> 触发时机：Apply / Revert Exception · Base Rule 升版 · ExceptionRule status 变化 · nightly cron（兜底一致性）。

---

## 7. Ask DueDateHQ 的三层防护

```typescript
// modules/ask/pipeline.ts
export async function runAsk(query: string, ctx: { firmId: string; userId: string; role: Role }) {
  // Layer 1: Intent
  const intent = await classifyIntent(query);
  if (intent !== "retrieval") return refusalResponse(intent);

  // Layer 2: DSL
  const dsl = await generateDsl(query, schemaHint);
  const validated = AskDslSchema.parse(dsl);      // Zod

  // Executor
  const sql = compileDslToSql(validated, { firmId: ctx.firmId, role: ctx.role });
  const rows = await executeReadOnly(sql);        // separate read-only pool

  // Layer 3: Summarize
  const summary = await summarizeWithCitations(query, rows, retrievedChunks);
  const guarded = await glassBoxGuard(summary.text, { ... });

  await logAsk({ query, dsl, sql, rowCount: rows.length, aiOutputId: guarded.id });

  return { rows, summary: guarded.text, citations: guarded.citations };
}
```

**关键防护：**
- DSL → SQL 只认白名单 token（SELECT / FROM / WHERE / JOIN whitelist / LIMIT）
- `firm_id` 自动注入，不经 LLM
- 单独 read-only DB pool，物理权限禁止 DML
- 响应时间 > 3s → cancel + 返回 "query too complex, please narrow down"

---

## 8. 成本与限流

```typescript
// modules/ai/budget.ts
export async function enforceBudget(firmId: string) {
  const today = startOfDay(new Date());
  const calls = await redis.incr(`ai:${firmId}:${today.toISOString()}`);
  await redis.expire(`ai:${firmId}:${today.toISOString()}`, 86_400);
  if (calls > 200) throw new BudgetExceededError("AI daily limit reached");
}
```

- **每 firm / day 200 calls**（PRD §6.2.5）
- Brief 每 firm 每天 1 次缓存
- Tip 按 `(rule_id, client_id)` 缓存 7 天
- 成本监控：Langfuse Dashboard + 每日 summary 邮件发 ops

---

## 9. 流式输出（UX）

```typescript
// app/api/ai/brief/route.ts
export async function GET(req: Request) {
  const stream = runPromptStream({
    promptName: "weekly_brief",
    version: "v3",
    context: { ... },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

前端：

```typescript
const { data, isLoading } = useSWRSubscription("/api/ai/brief", ...);
```

- Weekly Brief / Risk Summary 流式（用户感知快）
- Mapper / Normalizer 非流式（等完整 JSON）
- Pulse Extract 非流式（后台 worker）

---

## 10. Langfuse 集成

```typescript
// modules/ai/trace.ts
export async function tracedCall(name: string, fn: () => Promise<any>, meta: TraceMeta) {
  const trace = langfuse.trace({ name, metadata: meta });
  const gen = trace.generation({ name: `${name}.llm`, model: meta.model });
  try {
    const result = await fn();
    gen.end({ output: result });
    return result;
  } catch (err) {
    gen.end({ level: "ERROR", statusMessage: String(err) });
    throw err;
  } finally {
    trace.update();
  }
}
```

每次 AI 调用：
- Langfuse trace：input / output / model / latency / cost
- Local table `llm_logs`：audit 备份（即便 Langfuse 挂也不丢）

---

## 11. AI 模块测试策略

| 层 | 测试方法 |
|---|---|
| Retriever | fixture 数据 + 已知 embedding 验证 top-k |
| Guard | 单元测试（black/white list + citation 位置） |
| Pulse Extract | snapshot 测试（5 条历史 IRS/CA 公告 → 预期 JSON） |
| DSL generator | 20 条 NL query fixtures → 预期 DSL |
| SQL compiler | 恶意输入（`DROP TABLE` / `'; --`）必须 reject |
| End-to-End | Playwright 假 LLM（mock LiteLLM）跑完整 UI |

Mock LLM：

```typescript
// test/mocks/litellm.ts
export function mockLlm(rules: Map<string, string>) {
  return {
    completion: async ({ messages }: any) => {
      const key = hashMessages(messages);
      return { choices: [{ message: { content: rules.get(key) ?? "FALLBACK" } }] };
    },
  };
}
```

---

## 12. 未来演进

| 场景 | 做法 |
|---|---|
| 多语言 Brief（华人 CPA 版本） | prompt registry 加 `locale` 维度 |
| Agent orchestration（Onboarding v2） | 走 OpenAI Assistants API 或 LangGraph 轻量 |
| Vector 量过 10M | Neon pgvector HNSW 索引 / 切到 Qdrant |
| Finetune 小模型跑 Mapper | 数据来自 `migration_mapping` 人工覆盖样本 |

---

继续阅读：[05-Frontend-Architecture.md](./05-Frontend-Architecture.md)
