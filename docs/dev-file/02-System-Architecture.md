# 02 · System Architecture · 系统架构

> 目标：把 PRD 的模块在工程上"干净地切开"，保证每个模块都有清晰的输入、输出、依赖与测试边界。
> 核心决策：**一个 Worker = 部署单元；前后端物理隔离、通过 oRPC 契约同步类型；所有基础设施是 Cloudflare 原生 binding。**

---

## 1. 系统分层（自顶向下）

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                            │
│   Vite+ SPA · React Router 7 · TanStack Query · oRPC client          │
└──────────────────────────┬───────────────────────────────────────────┘
                           │  HTTPS
┌──────────────────────────▼───────────────────────────────────────────┐
│                  Cloudflare Worker (apps/server)                     │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Presentation Layer                                           │   │
│  │  • Static Assets serving (SPA dist · not_found = SPA fallback)│   │
│  │  • /rpc/*        → Hono + RPCHandler（oRPC Protocol，前端）   │   │
│  │  • /api/auth/*   → better-auth                                │   │
│  │  • /api/webhook/*→ Resend / Stripe 入站                       │   │
│  │  • /api/health   → liveness                                   │   │
│  │  • /api/v1/*     → OpenAPIHandler（Phase 2 公网 REST）         │   │
│  └─────────────────────────┬─────────────────────────────────────┘   │
│                            │                                         │
│  ┌─────────────────────────▼─────────────────────────────────────┐   │
│  │  Transport Layer                                              │   │
│  │  oRPC handler · procedures/*.ts · middleware（auth / tenant）  │   │
│  └─────────────────────────┬─────────────────────────────────────┘   │
│                            │                                         │
│  ┌─────────────────────────▼─────────────────────────────────────┐   │
│  │  Application Layer (Use Cases)                                │   │
│  │  modules/* service 层（migration · pulse · dashboard · ...）   │   │
│  └─────────────────────────┬─────────────────────────────────────┘   │
│                            │                                         │
│  ┌─────────────────────────▼─────────────────────────────────────┐   │
│  │  Domain Layer (Pure TS in packages/core)                      │   │
│  │  penalty math · priority scoring · overlay · date logic       │   │
│  │  ☆ 零运行时依赖（无 c.env / 无 DB / 无 fetch）                 │   │
│  └─────────────────────────┬─────────────────────────────────────┘   │
│                            │                                         │
│  ┌─────────────────────────▼─────────────────────────────────────┐   │
│  │  Infrastructure Layer (Adapters)                              │   │
│  │  packages/db（Drizzle + D1）· packages/auth（better-auth）     │   │
│  │  packages/ai（AI Gateway + Vectorize + prompts）              │   │
│  │  email · push · storage · queues                              │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Bindings: DB(D1) · CACHE(KV) · RATE_LIMIT · R2_* · VECTORS ·        │
│            EMAIL_QUEUE · ASSETS                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**分层纪律：**

- 上层只依赖下层**接口**，不依赖实现；Infrastructure 可替换（R2 换 S3、D1 换 Postgres 都只动 `packages/db`）
- **Domain Layer（`packages/core`）绝不引入运行时依赖**：不碰 `c.env`、不碰 DB、不发 fetch；纯函数让 Vitest 单测零成本
- Procedures 永不直接 import `@duedatehq/db` 或 DB schema，只通过 `context.vars.scoped` 访问（见 §03 / §06）

---

## 2. 模块划分与职责

| 模块                            | 路径                                                                  | PRD 对应                                         | 输入                                 | 输出                                                                                          |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| **auth**                        | `packages/auth`                                                       | §13.2 · §3.6                                     | Google OAuth / invitation            | Session · Organization · Member                                                               |
| **clients**                     | `apps/server/src/procedures/clients` + repo                           | §5.6 · §8.1                                      | CRUD                                 | Client 实体                                                                                   |
| **rules**                       | `packages/db` + seed                                                  | §6.1 · §6D                                       | rule draft                           | ObligationRule + Source Registry                                                              |
| **obligations**                 | `apps/server/src/procedures/obligations`                              | §5.2 · §8.1                                      | rule + client                        | ObligationInstance                                                                            |
| **overlay**（Phase 1）          | `packages/core/overlay`                                               | §6D.2                                            | ExceptionRule                        | 派生 `current_due_date`                                                                       |
| **penalty**                     | `packages/core/penalty`                                               | §7.5                                             | obligation + assumptions             | ExposureReport                                                                                |
| **priority**                    | `packages/core/priority`                                              | §6.4                                             | open obligations                     | 打分 + 因子分解                                                                               |
| **dashboard**                   | `apps/server/src/procedures/dashboard`                                | §5.1                                             | firm + scope                         | Triage Tabs + Brief 上下文                                                                    |
| **workboard**                   | `apps/server/src/procedures/workboard`                                | §5.2                                             | filter + sort + page                 | Table rows                                                                                    |
| **pulse**                       | `apps/server/src/procedures/pulse` + `jobs/pulse` + `packages/ingest` | §6.3 · [11](./11-Pulse-Ingest-Source-Catalog.md) | RSS / HTML / JSON API（源清单见 11） | Pulse + （Phase 1）ExceptionRule                                                              |
| **migration**                   | `apps/server/src/procedures/migration`                                | §6A                                              | paste / CSV                          | Client[] + Obligation[]                                                                       |
| **readiness**（Phase 1）        | `apps/server/src/procedures/readiness`                                | §6B                                              | CPA checklist                        | Signed portal link + Response                                                                 |
| **audit**                       | `apps/server/src/procedures/audit` + `packages/db/audit-writer`       | §13.2                                            | write events                         | AuditEvent stream                                                                             |
| **evidence**                    | `packages/db/evidence-writer`                                         | §5.5 · §6.2                                      | any source                           | EvidenceLink                                                                                  |
| **ai**                          | `packages/ai`                                                         | §6.2 · §9                                        | retrieval + prompt + guard           | `AiResult` + trace payload；`apps/server` 注入 writer 持久化 AiOutput / EvidenceLink / LlmLog |
| **ask**（Phase 1）              | `apps/server/src/procedures/ask`                                      | §6.6                                             | NL query                             | DSL → SQL → table                                                                             |
| **reminders**                   | `jobs/reminders`                                                      | §7.1                                             | due obligations                      | Email / In-app（Web Push 在 Phase 0 已移除）                                                  |
| **notifications**               | `apps/server/src/procedures/notifications`                            | §7.1.3                                           | event                                | In-app bell + Email                                                                           |
| **evidence-package**（Phase 1） | `jobs/evidence-package`                                               | §6C                                              | scope + range                        | ZIP + SHA-256                                                                                 |

### 2.1 模块依赖图

```
             better-auth (Organization plugin)
                   │
                   ▼
        ┌──────────────────┐
        │   middleware     │──── session + firmId into context
        └────────┬─────────┘
                 │
   ┌─────────────┼───────────────┬────────────┐
   ▼             ▼               ▼            ▼
 clients    obligations       rules       migration
   │             │               │            │
   └─────────────┼──────── generates ─────────┘
                 │
                 ▼
           dashboard ◄─── priority ◄─── penalty ◄─── overlay
                 │
                 ▼
          pulse (Queue)  ──► batch_apply ──► email_outbox
                                                │
                                                ▼
                                         email consumer
```

实线依赖直接调用；虚线（pulse → email_outbox）通过 **Transactional Outbox** 事件传递。

---

## 3. 路由前缀约定（约束）

对齐 oRPC 官方惯例，Worker 路由按职责分层，**不可混用**：

| 前缀                   | 挂载的 handler                                    | 职责                                                                       | 身份 / 调用方                       |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| `/rpc/*`               | `RPCHandler`（`@orpc/server/fetch`）              | 内部 TS 前端调用；支持 Date / BigInt / Map / Set / AsyncIterator 富类型    | `apps/app` 独占；cookie session     |
| `/api/auth/*`          | better-auth（Google OAuth + Organization plugin） | 登录 / 注销 / Google OAuth callback / 邀请接受 / session 管理              | 浏览器 + Google OAuth 回调          |
| `/api/webhook/*`       | 手写 Hono route                                   | Resend / Stripe（Phase 1）等外部回调                                       | 无用户身份；IP allowlist + 签名校验 |
| `/api/ics/:token`      | 手写 Hono route（Phase 1）                        | ICS 日历订阅 feed                                                          | token 鉴权                          |
| `/api/health`          | 手写 Hono route                                   | Cloudflare healthcheck / liveness                                          | 公开                                |
| `/api/v1/*`（Phase 2） | `OpenAPIHandler`（`@orpc/openapi/fetch`）         | 公网开放 REST；复用同一份 `packages/contracts` 契约；自动生成 OpenAPI spec | OAuth client credentials            |
| 其他所有路径           | ASSETS binding                                    | SPA 静态产物 + `not_found_handling = "single-page-application"` 兜底       | 浏览器                              |

**`wrangler.toml` 对应**：

```toml
[assets]
directory = "../app/dist"
binding = "ASSETS"
not_found_handling = "single-page-application"
run_worker_first = ["/rpc/*", "/api/*"]
```

**为什么 `/rpc` 独立于 `/api`**：

- oRPC 官方文档所有 `RPCHandler` 示例都用 `/rpc`；保持一致降低团队认知成本
- RPC Protocol ≠ REST：二进制-ish 协议不应该被放进 `/api/*` 的 REST 命名空间里，避免误解
- 为 Phase 2 的 `OpenAPIHandler(contract, { prefix: '/api/v1' })` 留出干净的命名空间，两者同时存在且零命名冲突

---

## 4. 请求流（关键三类）

### 4.1 首次访问 / SPA 冷启动

```
Browser ── GET /dashboard ──► Worker
                                 │
                                 │ 不匹配 run_worker_first(["/rpc/*", "/api/*"])
                                 │ → 交给 ASSETS binding
                                 ▼
                          ASSETS.fetch() → index.html（SPA fallback）
                                 │
                                 ▼
                          浏览器加载 SPA bundle → mount React
                                 │
                                 ▼
                          oRPC client 发起 rpc.dashboard.load.query()
                                 │
                                 ▼
Worker ── POST /rpc/dashboard/load ──► Hono → RPCHandler
                                                │
                                                ▼
                                           authed middleware
                                           （读 better-auth session
                                           → 注入 firmId + scoped repo）
                                                │
                                                ▼
                                           procedures/dashboard.load
                                           → scoped.obligations.triageTabs()
                                           → core.priority.score()
                                                │
                                                ▼
                                           响应 JSON 回前端
```

SPA 首屏 TTI 冷启动 ≤ 1.5s（bundle 加载）；回访热启动 ≤ 300ms（chunk hash 长缓存命中 + TanStack Query 内存缓存）。PWA / SW 在 Phase 0 已移除（见 `05 §8` 与 `00 §7`）。

### 4.2 Pulse 24h 闭环

> 本图展示**数据流抽象**；具体源清单 / 反爬策略 / SLA 风险 / Source Adapter 工程契约见 [11 Pulse Ingest Source Catalog](./11-Pulse-Ingest-Source-Catalog.md)。本图的 `Fetch` 节点对应 11 §6 的 `SourceAdapter.fetch()`，`raw 存 R2` 对应 `RawSnapshot.r2Key`。

```
Cron Trigger（*/30 * * * *，每源独立 interval 见 11 §3）
        │
        ▼
scheduled(controller, env) → jobs/pulse/ingest
        │
        ▼
SourceAdapter.fetch()  ──► raw 存 R2 ──► 入 Queue { type: 'extract', pulseId }
（RSS / HTML / JSON API，选择与降级见 11 §4）
                                        │
                                        ▼
                                 Queue consumer
                                        │
                                        ▼
                                 LLM Extract（经 AI Gateway）
                                        │
                                        ▼
                                 Glass-Box Guard 校验
                                        │
                                        ▼
                                 写 pulse（status=pending_review）
                                        │
                                  人工 review（Dashboard UI）
                                        │
                                        ▼
                                 pulse.approve → Match Engine
                                        │
                                        ▼
                                 Dashboard Banner + Email Outbox
                                        │                 │
                                        ▼                 ▼
                                 用户点 Apply       Queue 消费 → Resend 发邮件
                                        │
                                        ▼
                                 d1.batch([
                                   UPDATE obligation.current_due_date,
                                   INSERT evidence_link,
                                   INSERT audit_event,
                                   INSERT email_outbox
                                 ])  ← 同一事务
```

### 4.3 Migration 原子导入

```
前端 Wizard → rpc.migration.dryRun（纯预览，不写库）
          ↓
          rpc.migration.apply
          ↓
          服务端创建 migration_batch（status=applying）
          ↓
          for each row:
            Zod.safeParse → 失败 → 写 migration_error，continue
            ↓
            normalize（core 纯函数 + LLM 兜底）
            ↓
          d1.batch([
            INSERT clients × N,
            INSERT obligations × N·M（规则引擎生成）,
            INSERT evidence_link × N·M,
            INSERT audit_event,
            UPDATE migration_batch SET status=applied, revert_expires_at=now()+24h
          ])
          ↓
          返回 summary
          ↓
          前端 Live Genesis 动画 + 顶栏 $ 滚动（纯前端驱动）
```

`d1.batch()` 是事务化批处理，但每条 statement 仍受 D1 限制（例如 100 bound parameters / 100 KB SQL），整个 Worker invocation 也受查询数限制。30 客户 × 平均 5 obligations 通常可单批提交；更大导入按 100–200 prepared statements 分批，并用 `migration_batch` 记录批次状态与可回滚边界。

---

## 5. 外部依赖清单

| 依赖                        | 用途         | 故障降级见           |
| --------------------------- | ------------ | -------------------- |
| OpenAI（via AI Gateway）    | LLM 主       | §01.5                |
| Anthropic（via AI Gateway） | LLM fallback | §01.5                |
| Resend                      | 邮件         | email_outbox 重试    |
| Sentry                      | 错误上报     | 无降级（非关键路径） |
| PostHog                     | 产品事件     | 失败吞掉不影响功能   |
| Langfuse                    | LLM trace    | 失败吞掉不影响功能   |

所有 Cloudflare 原生服务（D1 / KV / R2 / Queues / Vectorize / AI Gateway）**不算外部依赖**，它们是 Worker 的 binding。

---

## 6. 并发与一致性策略

| 场景                                         | 策略                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------- |
| 同 firm 多设备并发改同一 obligation          | Drizzle optimistic `updated_at` 比对；前端 toast "conflict" 提示重试 |
| Pulse Batch Apply 期间同一 firm 禁止二次触发 | KV 做 advisory lock（30s TTL）+ 前端按钮 disable                     |
| Migration 运行中禁止二次 import              | `migration_batch.status=applying` 时拒绝新 batch                     |
| 邮件 outbox 幂等                             | `email_outbox.external_id` 唯一约束；consumer 处理前校验             |
| Queue 消息幂等                               | 消息体带 `idempotency_key`，消费者先查 D1 去重                       |

---

## 7. 多租户隔离（纵深防御，详见 §06）

三道防线共同构成纵深防御；其中 session 与 scoped repo 是运行时安全边界，lint 是防止绕过边界的开发期护栏：

1. **better-auth session 层**：`activeOrganizationId` 必须存在于 session，否则 middleware 拒绝请求
2. **repo 工厂层**：`scoped(db, firmId)` 是进入 `packages/db` 业务数据的唯一入口；所有 tenant-scoped query 在工厂内部硬编码 `WHERE firm_id = :firmId`
3. **Lint 静态层**：oxlint 自定义规则（`no-restricted-imports`）禁止 procedures 直接 import `@duedatehq/db` 或 DB schema 表；PR 检查自动 block，但不替代运行时权限检查

D1 无 RLS 能力，不依赖 DB 级防护。

---

## 8. 性能架构要点

- Dashboard / Workboard 查询结果由 Worker 内存 + KV **分层缓存**；TTL 60s，写时主动 invalidate
- Penalty Radar 顶栏 $ 聚合由一条 SQL 完成（复合索引 § 03.3），不在前端二次求和
- Workboard 走服务端分页（50 行/页）+ 前端 TanStack Table 虚拟化
- AI 调用全部异步 + 流式；Weekly Brief 用 Server-Sent Events（Hono `streamSSE`）
- 大对象（PDF / migration raw / audit zip）存 R2，API 只返 signed URL

---

## 9. 故障域与回滚

| 故障                                | 回滚手段                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Worker 新版本线上异常               | `wrangler rollback`（立即回上一版）                                        |
| D1 migration 写坏                   | 迁移走"可逆 migration"模式；写坏后 rollback migration + 从备份恢复         |
| Pulse 批量误改                      | 24h 内 `pulse.revert` 一键还原（写入 `reverted_at`，UI 不再展示）          |
| Migration 导入误操作                | 24h 内 `migration.revert` 按 `migration_batch_id` 级联删客户和 obligations |
| Exception overlay 误应用（Phase 1） | 独立 `ObligationExceptionApplication` 表，`reverted_at` 立即失效           |

---

## 10. 演进路径预留

| 演进方向                                              | 预留点                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 → Postgres（极端场景退路，非预设路径，见 §03.9.2） | `packages/db` 是唯一 schema/query 入口；切换只改该包；业务层零感知                                                                                                                                                                                                                                         |
| Vectorize → Pinecone                                  | `packages/ai/retriever.ts` 抽象 `VectorStore` 接口                                                                                                                                                                                                                                                         |
| AI Gateway → 自建                                     | `packages/ai/gateway.ts` 隔离所有外部 LLM 调用                                                                                                                                                                                                                                                             |
| 单 Worker → 多 Worker（承载量上来后）                 | Queue consumer 拆到独立 Worker；主 Worker 只处理交互请求                                                                                                                                                                                                                                                   |
| **SEO 公开页**（PRD P1-17 / P1-34 / §5.7A / §5.7B）   | **独立 Astro 静态子站**（`apps/marketing`，挂 `duedatehq.com` / `docs.duedatehq.com`）承接 `/rules` `/watch` `/state/*` `/pulse`；通过 oRPC SDK 直连主 Worker 的 `/api/v1` OpenAPIHandler 读 verified 规则快照。PRD 语义不变，工程上与主 Worker（`app.duedatehq.com`）物理分离以避开 SPA 不利于 SEO 的限制 |
| Phase 2 第三方 API 开放                               | 主 Worker 增加 `/api/v1/*` 路由挂 `OpenAPIHandler(contract, { prefix: '/api/v1' })`，复用 `packages/contracts`                                                                                                                                                                                             |

---

继续阅读：[03-Data-Model.md](./03-Data-Model.md)
