# 01 · Tech Stack · 技术栈选型

> 原则：**主流、少即是多、serverless 优先、类型安全到底**。
> 每一个选择都必须能回答："为什么不是 X？"

---

## 1. 一张表看全栈

| 领域 | 选型 | 版本 | 替代方案 | 选它的原因 |
|---|---|---|---|---|
| **语言** | TypeScript | 5.6+ | — | 前后端单语言 + 强类型 |
| **Web 框架** | Next.js (App Router) | 15.x | Remix / SvelteKit | RSC + Server Actions + Vercel 一体化 + PWA 支持 |
| **Runtime** | Node.js 20 LTS + Edge Runtime | — | Bun | Vercel 首选；Edge 跑 middleware |
| **UI 库** | React | 19.x | — | 与 Next.js 绑定 |
| **样式** | Tailwind CSS | 4.x | CSS Modules | 密度 + 暗黑模式一等公民 + 团队熟悉 |
| **组件库** | shadcn/ui + Radix UI | latest | MUI / Ant | 可拷贝可改造；AI UI 统一底座 |
| **表格** | TanStack Table | 8.x | AG-Grid | Workboard 虚拟化 + 客户自定义列 |
| **异步状态** | TanStack Query | 5.x | SWR | 乐观 UI + mutation invalidation |
| **全局状态** | Zustand | 5.x | Redux / Jotai | 轻量 · 10 行搞定 · RSC 兼容 |
| **表单** | react-hook-form + Zod | latest | Formik | schema-first + 与 Server Actions 共享 validator |
| **动画** | Framer Motion + canvas-confetti | latest | — | Penalty Radar 游戏化（§PRD 7.5.6） |
| **数字滚动** | react-odometerjs | latest | 手写 | Scoreboard 数字动效 |
| **PDF** | @react-pdf/renderer | latest | Puppeteer | Client PDF Report / Audit Package |
| **ORM** | Drizzle ORM | 0.36+ | Prisma / Kysely | Edge 兼容 + 零生成 + SQL 贴近 + 类型精准 |
| **数据库** | Postgres (Neon Serverless) | 16 | Supabase / RDS | 自动扩缩 · branch preview · 秒开分支跑 migration |
| **向量** | pgvector | 0.8+ | Pinecone / Weaviate | 与主库同事务，零额外 infra |
| **缓存 / 速率限制** | Upstash Redis | — | ElastiCache | REST API 兼容 Edge |
| **对象存储** | Cloudflare R2 | — | AWS S3 | 零出口流量费 · PDF / migration raw / audit ZIP |
| **后台任务** | Inngest | 3.x | QStash / Trigger.dev | 事件驱动 · 重试 · Step Functions · TS 原生 |
| **邮件** | Resend | — | Postmark / SES | React Email 模板 + 高送达率 |
| **Auth** | Auth.js (NextAuth) | 5.x | Clerk / Lucia | 开源 + 自持账号 + 支持 magic link & TOTP |
| **AI Gateway** | LiteLLM (self-host) | latest | OpenRouter | 统一 API · ZDR endpoint 路由 · 成本审计 |
| **LLM** | OpenAI GPT-4o / 4o-mini | — | Claude Sonnet 4.5 / Haiku | Tier 1/2 组合；Anthropic 作 fallback |
| **Embedding** | OpenAI text-embedding-3-small | — | Voyage / Cohere | 成本 / 准确度平衡 |
| **RAG 框架** | 自研（Drizzle + pgvector）| — | LangChain | LangChain 过重；RAG 管线 < 300 行 TS |
| **AI 观测** | Langfuse | cloud | Helicone | Prompt 版本 · trace · cost |
| **Push** | web-push + Workbox | latest | OneSignal | VAPID 自持 · 无第三方依赖 |
| **测试** | Vitest + Playwright + msw | latest | Jest | Vite 原生快 · Playwright 跨浏览器 |
| **Lint / Format** | ESLint + Prettier + Biome (可选) | — | — | 主流；Biome 作加速备选 |
| **类型校验** | Zod | 3.x | Valibot | 与 hook-form / Server Actions 共享 |
| **监控** | Sentry | cloud | Datadog | 前后端错误 + Performance + Session Replay |
| **分析** | Vercel Analytics + PostHog | — | GA4 | Web Vitals + product events |
| **CDN / WAF** | Vercel Edge / Cloudflare | — | — | DDoS + rate limit |
| **CI/CD** | GitHub Actions + Vercel | — | — | Preview deploy + 分支 DB |
| **Monorepo** | pnpm workspaces + Turborepo | — | Nx | 够用；构建缓存 |
| **菜单栏壳 (Phase 2)** | Tauri + Rust | 2.x | SwiftUI | 跨平台 future-proof · 1MB 体积 |
| **文档** | Storybook (UI) + Markdown (架构) | 8.x | — | UI 审查 + 架构可读 |

---

## 2. 关键选型的深度理由

### 2.1 Next.js App Router（而非 Remix / Nuxt）

- **RSC + Streaming**：Dashboard 顶栏 Penalty Radar 可以独立 stream，TTI ≤ 1.5s 的核心手段
- **Server Actions**：替代 tRPC / REST 样板，配合 Zod 一份 schema 全栈共享
- **Middleware + Edge**：RBAC 前置 + 地域路由
- **Route Groups**：把 `(marketing)` 公开 SEO 页、`(app)` 登录后、`(embed)` Readiness Portal 清晰隔离（见 §08）
- **Vercel 一体化部署**：`vercel deploy` = production；与 Neon branch preview 天然集成

### 2.2 Drizzle ORM（而非 Prisma）

| 维度 | Drizzle | Prisma |
|---|---|---|
| Edge Runtime | ✓ 原生 | ✗ 需 Accelerate |
| SQL 可读性 | ✓ 贴近 SQL | ✗ 自定义 DSL |
| 类型 | ✓ 全表推导 | ✓ 但生成慢 |
| 迁移工具 | drizzle-kit | prisma migrate |
| Bundle 体积 | 小（~50KB） | 大（~1MB） |
| 多 schema / 事务 | ✓ | ⚠ 受限 |
| 上手难度 | ✓ 低 | ✓ 低 |

决定因素：**Overlay Engine（§04）需要裸 SQL 写派生字段计算**，Drizzle 直接 raw SQL + 类型推导；Prisma 此处要写 `$queryRaw` 失去类型。

### 2.3 Neon Postgres（而非 Supabase / RDS）

- **分支数据库**：每个 PR 一个独立 DB 分支（`branch preview`），跑完 migration 自动销毁
- **Serverless 计费**：scale-to-zero；MVP 阶段月成本 < $20
- **pgvector 支持**：官方扩展，RAG 不需要独立向量库
- **Postgres 16**：支持 `STORED GENERATED COLUMN`、`MERGE`、`SQL/JSON`

Supabase 也可以，但**我们不需要它的 Auth / Realtime / Storage**，Auth.js + Inngest + R2 已覆盖；不想被多产品套牢。

### 2.4 Inngest（而非 QStash / BullMQ）

Pulse / Migration / Audit Package 三类后台任务都是**事件驱动 + 多步 + 可重试 + 有幂等要求**：

```typescript
// Pulse 完整管线示例（§04 详讲）
export const pulseIngest = inngest.createFunction(
  { id: "pulse-ingest", retries: 3 },
  { cron: "*/30 * * * *" },
  async ({ event, step }) => {
    const raw = await step.run("fetch", () => fetchIRSNewsroom());
    const parsed = await step.run("extract", () => llmExtract(raw));
    await step.sendEvent("pulse/ready-for-review", { data: parsed });
  }
);
```

- Step Functions：失败自动从断点续跑
- 本地 dev 模式有 UI，调试 DLQ 直观
- TS 原生，无需学 YAML

### 2.5 LiteLLM 网关

- **ZDR endpoint 路由**：自动切 OpenAI ZDR 或 Azure OpenAI（合规 §06）
- **Fallback 链**：GPT-4o 挂 → Claude Sonnet 4.5 → 缓存模板
- **成本审计**：每次调用自动落 `llm_logs`
- **A/B prompt**：路由不同 prompt_version 跑对比

### 2.6 Auth.js v5（而非 Clerk）

| 维度 | Auth.js | Clerk |
|---|---|---|
| 成本 | 0 | > $25/mo per 1k MAU |
| 自持账号数据 | ✓ | ✗ 数据在 Clerk |
| 多 Firm Membership | ✓ 自定义 session | ⚠ 需自建 |
| 磁力链 + TOTP | ✓ | ✓ |
| 可定制登录页 | ✓ | ✓ |

我们需要 **User 多 Firm Membership**（PRD §3.6）的强定制，Clerk 的 Organizations 模型不完全贴合。

### 2.7 Zustand + TanStack Query + URL state（而非 Redux）

三者各司其职：

- **URL state**：Triage tab / 筛选 / 分页（可分享可刷新）
- **TanStack Query**：所有服务端数据（缓存、乐观 UI、invalidation）
- **Zustand**：极少的纯 UI state（Cmd-K 开关、drawer 堆栈、Evidence Mode 目标）

> PRD §5.2.3 的 "所有筛选 URL state 持久化" → 直接用 `nuqs` 或 `useSearchParams` 管 URL，不进 Zustand。

---

## 3. 版本锁定策略

- `package.json` 用**精确版本**（不用 `^` / `~`），通过 Renovate 定期升级
- Major 升级走独立 PR + changelog review
- Drizzle / Next.js / LLM 模型版本列入 `lockfile.md` 手动跟踪

---

## 4. 依赖安装命令（首次脚手架）

```bash
# 1. 初始化 Next.js monorepo
pnpm create next-app@latest duedatehq --ts --app --tailwind --eslint --src-dir=false

# 2. 核心依赖
pnpm add drizzle-orm @neondatabase/serverless pg
pnpm add -D drizzle-kit

pnpm add next-auth@beta @auth/drizzle-adapter

pnpm add @tanstack/react-query @tanstack/react-table
pnpm add zustand nuqs react-hook-form zod @hookform/resolvers

pnpm add framer-motion canvas-confetti react-odometerjs
pnpm add @react-pdf/renderer

pnpm add inngest
pnpm add resend @react-email/components
pnpm add @upstash/redis @upstash/ratelimit
pnpm add @aws-sdk/client-s3          # R2 用 S3 兼容 API

pnpm add litellm                     # optional proxy, self-host via Docker
pnpm add openai @anthropic-ai/sdk    # direct fallback

pnpm add web-push
pnpm add date-fns                    # 时区 / 节假日
pnpm add pino pino-http              # 结构化日志

# 3. 观测
pnpm add @sentry/nextjs langfuse

# 4. UI
pnpm dlx shadcn@latest init
pnpm add lucide-react

# 5. Dev
pnpm add -D vitest @vitest/ui msw
pnpm add -D @playwright/test
pnpm add -D @storybook/nextjs
pnpm add -D tsx dotenv-cli
```

---

## 5. 环境变量清单（`.env.example`）

```bash
# App
NEXT_PUBLIC_APP_URL=https://app.duedatehq.com
NEXT_PUBLIC_ENV=production

# Database
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...      # for migrations

# Auth
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://app.duedatehq.com
EMAIL_FROM=noreply@duedatehq.com

# LLM
OPENAI_API_KEY=sk-...
OPENAI_ZDR_BASE_URL=https://api.openai.com/v1   # ZDR org
ANTHROPIC_API_KEY=sk-ant-...
LITELLM_PROXY_URL=https://litellm.internal
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_PDF=duedatehq-pdf
R2_BUCKET_MIGRATION=duedatehq-migration
R2_BUCKET_AUDIT=duedatehq-audit

# Cache
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Mail
RESEND_API_KEY=re_...

# Workers
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Push
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:ops@duedatehq.com

# Observability
SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...

# Feature flags (optional)
POSTHOG_KEY=phc_...
```

`.env.local` 用于开发，`.env.production` 通过 Vercel 管理，秘钥永不进仓库。

---

## 6. 风险与降级矩阵

| 依赖 | 挂了怎么办 |
|---|---|
| OpenAI | LiteLLM 自动切 Anthropic；再挂 → UI 降级为模板文案（§04） |
| Neon | Vercel 地区 → standby replica；彻底挂 → 静态 maintenance 页 |
| Resend | 降级为 `audit_event` + Inngest 延迟重试；用户 In-app 通知兜底 |
| Upstash | 限流退化为 DB 计数；缓存退化为直查（加 200ms 但可用） |
| Inngest | 紧急情况可改为 Vercel Cron + 手写事务 Outbox |
| R2 | PDF 降级为同步生成 + stream 返回（慢但可用） |

---

继续阅读：[02-System-Architecture.md](./02-System-Architecture.md)
