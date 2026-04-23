# 02 · System Architecture · 系统架构

> 目标：把 PRD 的模块在工程上"干净地切开"，保证每个模块都有清晰的输入、输出、依赖与测试边界。

---

## 1. 系统分层（自顶向下）

```
┌─────────────────────────────────────────────────────────────────┐
│                   Presentation Layer (Edge + CSR)               │
│  Next.js App Router · RSC · Server Actions · PWA · Workbox SW   │
└────────────────┬────────────────────────────────────────────────┘
                 │ (Zod-validated DTOs)
┌────────────────▼────────────────────────────────────────────────┐
│              Application Layer (Use Cases / Services)           │
│  modules/dashboard · workboard · clients · obligations · rules  │
│  modules/pulse · migration · ai · audit · team · readiness      │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                 Domain Layer (Entities + Invariants)            │
│  pure TS types · business rules · penalty math · overlay engine │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│              Infrastructure Layer (Adapters)                    │
│  db/drizzle · ai/litellm · mail/resend · storage/r2 · cache     │
│  queue/inngest · auth/authjs · push/web-push · obs/sentry       │
└─────────────────────────────────────────────────────────────────┘
```

**规则：** 上层只能依赖下层的 **接口**，不能依赖下层的 **实现**（dependency inversion）。Infrastructure 层可替换（譬如 R2 换 S3）。

---

## 2. 核心模块划分与职责

| 模块 | 路径 | 对应 PRD | 输入 | 输出 |
|---|---|---|---|---|
| **auth** | `modules/auth` | §13.2 | email / TOTP | Session / Membership |
| **team** | `modules/team` | §3.6 | Owner 邀请 / role 调整 | Membership + Audit |
| **clients** | `modules/clients` | §5.6 + §8.1 | CRUD | Client 实体 |
| **rules** | `modules/rules` | §6.1 + §6D | rule draft | ObligationRule + Source Registry |
| **obligations** | `modules/obligations` | §5.2 + §8.1 | rule + client | ObligationInstance |
| **overlay** | `modules/overlay` | §6D.2 | ExceptionRule | 派生 `current_due_date` |
| **penalty** | `modules/penalty` | §7.5 | obligation + assumptions | ExposureReport |
| **priority** | `modules/priority` | §6.4 | open obligations | 打分 + 因子分解 |
| **dashboard** | `modules/dashboard` | §5.1 | firm + scope | Triage Tabs data |
| **workboard** | `modules/workboard` | §5.2 | filter + sort + page | TanStack Table rows |
| **pulse** | `modules/pulse` | §6.3 | RSS / HTML | Pulse + ExceptionRule |
| **migration** | `modules/migration` | §6A | paste / CSV | Client[] + Obligation[] |
| **readiness** | `modules/readiness` | §6B | CPA checklist | Magic link + Response |
| **audit** | `modules/audit` | §13.2.1 | write events | AuditEvent stream |
| **evidence** | `modules/evidence` | §5.5 + §6.2 | any source | EvidenceLink |
| **ai** | `modules/ai` | §6.2 + §9 | retrieval + prompt | AiOutput with citations |
| **ask** | `modules/ask` | §6.6 | NL query | DSL → SQL → table |
| **reminders** | `modules/reminders` | §7.1 | obligation due | Email / In-app |
| **notifications** | `modules/notifications` | §7.1.3 | event | In-app bell + Push |
| **evidence-package** | `modules/evidence-package` | §6C | scope + range | ZIP + SHA-256 |
| **push** | `modules/push` | §7.8.1 | user + event | VAPID-signed payload |

### 2.1 模块间依赖图（实线 = 直接依赖，虚线 = 事件）

```
                 ┌─────────┐
                 │  auth   │◄────────── middleware
                 └────┬────┘
                      │
     ┌────────────────┼─────────────────┐
     ▼                ▼                 ▼
┌─────────┐     ┌──────────┐      ┌──────────┐
│  team   │     │ clients  │      │  rules   │
└────┬────┘     └─────┬────┘      └─────┬────┘
     │                │                 │
     │                ▼                 │
     │         ┌────────────┐           │
     │         │ obligations│◄──────────┘
     │         └─────┬──────┘
     │               │
     │       ┌───────┼────────┬──────────┐
     │       ▼       ▼        ▼          ▼
     │   ┌───────┐ ┌──────┐ ┌───────┐ ┌────────┐
     │   │overlay│ │penalt│ │priorit│ │migrat. │
     │   └───┬───┘ └──┬───┘ └───┬───┘ └───┬────┘
     │       │        │         │         │
     │       └────────┴─────────┴─────────┤
     │                                    │
     ▼                                    ▼
┌────────────┐                      ┌──────────┐
│ dashboard  │◄───── priority ─────►│workboard │
└─────┬──────┘                      └────┬─────┘
      │                                  │
      │  ┌─────────┐   ┌─────────┐       │
      ├─►│  pulse  │──►│ overlay │◄──────┤
      │  └────┬────┘   └─────────┘       │
      │       ╎ (event: pulse.applied)   │
      │       ▼                          │
      │  ┌──────────┐                    │
      ├─►│reminders │──────► mail        │
      │  └──────────┘                    │
      │                                  │
      └────────► audit ◄─────────────────┘
                  │
                  ▼
            evidence-package
```

---

## 3. 关键数据流

### 3.1 登录到 Dashboard（Story S1 首屏）

```
1. 用户访问 /dashboard
2. Middleware (Edge)
   - 校验 session cookie
   - 注入 currentFirmId（Membership 多 Firm 时读 URL slug）
   - 未登录 → redirect /login
3. RSC (Dashboard page.tsx)
   - 并行 await Promise.all:
     · getPenaltyRadarSummary(firmId, scope)        ← 索引聚合
     · getPulseBannerFeed(firmId)                   ← 未处理 pulse
     · getTriageTabCounts(firmId, scope)            ← 3 tab + count
     · getSmartPriorityRanked(firmId, scope, tab)   ← 默认 This Week
4. 流式渲染
   - <Suspense> 包住 WeeklyBrief（LLM 生成 · 独立 stream）
   - <Suspense> 包住 AskInput
5. Client 端 hydrate
   - Keyboard shortcut provider
   - Push subscription 状态
```

### 3.2 Pulse 全链路（Story S3）

```
[Cron every 30m]
   │
   ▼
┌─────────────────────────────┐
│ Inngest: pulseIngest        │
│  fetch RSS / HTML           │
│  diff vs last snapshot      │
│  upsert Pulse(status=pending│
│    _review)                 │
└─────────────┬───────────────┘
              │ if new
              ▼
┌─────────────────────────────┐
│ Inngest: pulseExtract       │
│  LiteLLM → schema-first     │
│  PII redact in prompt       │
│  write parsed fields +      │
│  verbatim_quote + confidence│
│  status=pending_review      │
└─────────────┬───────────────┘
              │ (manual: ops Approve)
              ▼
┌─────────────────────────────┐
│ Ops Dashboard → Approve     │
│  creates ExceptionRule draft│
│  status=verified            │
│  Pulse.status=approved      │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Frontend: Dashboard Banner  │
│  SWR polling 60s            │
│  OR server push via SSE     │
└─────────────┬───────────────┘
              │ user clicks Apply
              ▼
┌─────────────────────────────┐
│ Server Action: pulseApply   │
│  BEGIN TX                   │
│   SELECT matching oblig.    │
│     FOR UPDATE SKIP LOCKED  │
│   INSERT Obligation         │
│     ExceptionApplication[]  │
│   Overlay Engine recompute  │
│     current_due_date        │
│   INSERT EvidenceLink[]     │
│   INSERT AuditEvent         │
│   INSERT email_job (outbox) │
│   UPDATE Pulse.status=applie│
│  COMMIT                     │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Inngest: emailDigestWorker  │
│  poll email_outbox          │
│  batch by assignee          │
│  Resend send                │
│  mark sent_at               │
│  audit event                │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Inngest: webPushFanout      │
│  look up PushSubscription   │
│  VAPID sign + send          │
│  revoke on 410/404          │
└─────────────────────────────┘
```

### 3.3 Migration Copilot（Story S2）

```
Step 1 · Intake (client-side only)
  - PII scrub (SSN regex) in browser
  - Upload to /api/migration/intake → R2 raw object

Step 2 · AI Mapping (Server Action)
  - LLM only sees: headers + 5-row sample + preset hint
  - Output: MigrationMapping[] rows
  - Status: draft

Step 3 · Normalize (Server Action, batched)
  - LLM for entity_type (enum) · dict for state · regex for EIN
  - Write MigrationNormalization rows
  - Conflict detect: existing client by name+state
  - Status: reviewing

Step 4 · Import (single transaction)
  BEGIN
    INSERT MigrationBatch
    FOR each row:
      INSERT Client  (catch unique + collect errors)
      INSERT EvidenceLink (for each AI decision)
      -- rule engine generates obligations via
      --   rule.due_date_logic.compute(client, year)
      --   + Default Tax Types Matrix (§6A.5)
      INSERT ObligationInstance[]
    UPDATE MigrationBatch status=applied
    INSERT AuditEvent
  COMMIT

Post-import
  - Revert window 24h (batch) / 7d (single client)
  - Report email via Resend
  - Live Genesis animation (frontend only, <Suspense> fallback)
```

### 3.4 Ask DueDateHQ（NL → DSL → SQL）

```
1. User types NL query in Cmd-K
2. Server Action: askRun
   ├─ Layer 1: intent classifier (LiteLLM cheap)
   │  if not retrieval → refusal template
   ├─ Layer 2: DSL generator (schema-aware, JSON output)
   │  e.g. { entity: 'obligation',
   │         filters: [{tax_type: 'state_ptet'}, {state: 'CA'}],
   │         group_by: 'client' }
   ├─ Executor: DSL → parameterized SQL
   │  - whitelisted tables: clients, obligation_instances, rules
   │  - WHERE firm_id injected server-side
   │  - parser rejects DDL/DML/cross-JOIN
   ├─ Execute via Drizzle (read-only pool)
   ├─ Layer 3: summarize (LiteLLM) with [source] chips
   └─ Return: { sql, rows, summary, citations }
3. Frontend renders table + "Open in Workboard" deep link
4. All steps logged to llm_logs + audit
```

---

## 4. 外部依赖清单

| 依赖 | 用途 | SLA 容忍度 | 降级 |
|---|---|---|---|
| OpenAI / Anthropic | LLM 推理 | 99% | LiteLLM 自动切；再挂 → 模板 |
| Neon Postgres | 主数据 | 99.9% | Replica + maintenance 页 |
| Vercel | 托管 | 99.99% | Cloudflare failover（Phase 2） |
| Upstash Redis | 缓存 / 限流 | 99% | 退化为 DB 计数 |
| R2 Storage | PDF / Migration / ZIP | 99% | 同步生成 + stream |
| Resend | 邮件 | 99% | Inngest 延迟重试 + In-app 兜底 |
| Inngest | 后台任务 | 99% | Vercel Cron + 手写 Outbox |
| Sentry / Langfuse | 观测 | 无阻塞 | 本地 stdout |
| IRS / 6 州税局 | Pulse 源 | 不受控 | 单源失败不阻塞 + "Last checked X min ago" |

---

## 5. 服务部署拓扑

```
┌────────────────┐         ┌────────────────┐
│   Cloudflare   │         │   Apple APNS   │
│   (DNS + WAF)  │         │   FCM / WebPush│
└────────┬───────┘         └────────┬───────┘
         │                          ▲
         ▼                          │
┌──────────────────────────────────┴────────┐
│          Vercel (Next.js + Edge)          │
│  ┌─────────┬──────────┬──────────────┐    │
│  │ Edge MW │ RSC/SSR  │ /api + Server│    │
│  │ (auth)  │ (stream) │   Actions    │    │
│  └────┬────┴─────┬────┴───────┬──────┘    │
└───────┼──────────┼────────────┼───────────┘
        │          │            │
        │          │            │  (webhook)
        ▼          ▼            ▼
   ┌─────────┐ ┌────────┐ ┌──────────────┐
   │  Neon   │ │Upstash │ │   Inngest    │
   │ (PG +   │ │ Redis  │ │  (Workers)   │
   │ pgvector│ └────────┘ └──────┬───────┘
   └─────────┘                   │
                                 ▼
                       ┌────────────────────┐
                       │  Cloudflare R2     │
                       │  (PDF · CSV · ZIP) │
                       └────────────────────┘

   LLM Gateway (self-host Docker on Fly.io / Railway)
       │
       ├─► OpenAI ZDR endpoint
       └─► Anthropic (fallback)
```

---

## 6. 并发与一致性策略

| 场景 | 策略 |
|---|---|
| 两人同改同一 obligation | Last-write-wins + toast 推送前一次 diff + `ETag` 乐观锁 |
| Pulse Batch Apply 并发 | 事务开头 `SELECT ... FOR UPDATE SKIP LOCKED` on Pulse row |
| Migration 同 firm 并行 | 每 firm 同时仅 1 个 draft batch（unique partial index） |
| Revert vs Apply 竞态 | `UNIQUE (batch_id) WHERE status='reverted'` + idempotent Revert |
| Readiness Response submit 重放 | `(request_id, item_index)` UNIQUE + upsert |

---

## 7. 多租户隔离（纵深防御）

**三层强制，缺一不可：**

1. **Middleware 层**：解析 URL slug / cookie → 注入 `currentFirmId` 到 AsyncLocalStorage
2. **ORM 层**：Drizzle query builder wrap，自动 append `WHERE firm_id = :current`
3. **数据库层**：Postgres Row-Level Security 作为底线（session-level `SET app.current_firm_id = ...`）

```typescript
// db/scoped-query.ts
import { AsyncLocalStorage } from "async_hooks";

export const firmContext = new AsyncLocalStorage<{ firmId: string; userId: string }>();

export function scopedDb() {
  const ctx = firmContext.getStore();
  if (!ctx) throw new Error("firm context missing");
  return db.$with({ firmId: ctx.firmId });
}
```

Row-Level Security（§06 详讲）把"忘记加 WHERE"的代码错误也挡掉。

---

## 8. 性能架构要点

| 要求 | 实现 |
|---|---|
| Dashboard TTI ≤ 1.5s | RSC streaming + 关键查询预先并行 + Edge runtime middleware |
| Workboard 筛选 < 1s | 复合索引（§03）+ 服务端 pagination + `virtualized` table |
| Penalty Radar 聚合 | 物化视图 `mv_firm_weekly_exposure` refresh 15min |
| Pulse Match 精准 | 四维 Composite index on `(state, county, entity, tax_type)` |
| AI 成本 ≤ $0.02/firm/day | Brief 每日 1 次缓存 · Tip 按 `rule+client` 缓存 7 天 · Retrieval top-k=6 |
| RAG 响应 < 500ms | pgvector IVFFlat `lists=100`；冷启动 warm-up 脚本 |

---

## 9. 故障域与回滚策略

| 故障 | 影响范围 | 回滚 |
|---|---|---|
| 错 deploy | 全租户 | Vercel 5s 回滚到上一 good build |
| 错 migration | 全租户 | Neon branch 恢复（分钟级） |
| Pulse LLM 幻觉 | 单条 Pulse | 保持 `pending_review` 不进 feed |
| Migration 错批次 | 单 firm | 24h Revert（事务回滚所有关联数据） |
| Rule 错更新 | 多租户 | `rule_version` 指针回滚 + 通知所有 Owner |

---

## 10. 演进路径预留

| 未来场景 | 本架构的前置设计 |
|---|---|
| **Phase 3 Compliance Calendar API** | Rules 独立于 UI（§6D.1），直接暴露 REST/GraphQL |
| **多 Firm 用户切换** | `UserFirmMembership` 已多对多（§03） |
| **50 州全覆盖** | Rule Engine 50 州骨架 + `coverage_status` 字段 |
| **macOS Menu Bar** | `/api/v1/me/radar-summary` 只读端点预留 |
| **SOC 2 审计** | AuditEvent + RLS + Secrets Manager 已对齐控制项 |

---

继续阅读：[03-Data-Model.md](./03-Data-Model.md)
