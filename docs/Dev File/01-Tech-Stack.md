# 01 · Tech Stack · 技术栈选型

> 原则：**单实例全栈部署到 Cloudflare · 前后端物理隔离但共享类型契约 · 零 vendor lock-in 的可替换单元 · 类型安全到底。**
> 每一项选择都必须能回答："为什么不是 X？"

---

## 1. 一张表看全栈


| 领域                | 选型                                                                                    | 为什么                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **语言**            | TypeScript 5.x                                                                        | 前后端单语言 + 强类型                                                                                  |
| **Monorepo**      | pnpm workspaces + Turborepo                                                           | pnpm 10 原生 workspace 配置；turbo 管构建缓存和并行                                                        |
| **脚手架**           | `pnpm dlx create-turbo@latest`（`basic` 模板起步）                                          | 复用共享 `typescript-config` 包；删掉默认 Next.js 应用后接我们的结构                                             |
| **Lint**          | **oxlint**（Oxc / Vite Plus 生态）                                                        | Rust 实现，比 ESLint 快 50–100×；零配置可用；对齐 Rolldown / Vite 工具链                                       |
| **Format**        | **oxfmt**（Oxc）                                                                        | Rust 实现；与 oxlint 同 AST；取代 Prettier                                                            |
| **前端框架**          | Vite 7 + React 19                                                                     | 纯 SPA，不走 SSR；Workers Assets 只托管静态产物                                                           |
| **前端路由**          | React Router 7（library/data mode，非 framework mode）                                    | framework mode 会拖进 Node 依赖，与 Worker 冲突                                                        |
| **UI 底座**         | shadcn/ui（`"style": "base-vega"`）+ Base UI                                            | Base UI 是 Radix 团队下一代；体积更小，键盘/RTL 更严                                                          |
| **样式**            | Tailwind 4（`@theme` directive）                                                        | 密度 + 暗色 token 切换；对齐 DESIGN.md                                                                 |
| **图标**            | lucide-react                                                                          | shadcn 默认；体积友好                                                                                |
| **表格**            | TanStack Table 8                                                                      | Workboard 虚拟化 + 客户自定义列                                                                        |
| **服务端数据**         | TanStack Query 5 + oRPC tanstack-query adapter                                        | 乐观 UI + invalidation + 契约派生类型                                                                 |
| **全局状态**          | Zustand 5                                                                             | 极少 UI state；不引 Redux                                                                          |
| **URL state**     | nuqs                                                                                  | 筛选 / 分页 / 抽屉开关持久到 URL                                                                         |
| **表单**            | react-hook-form + Zod                                                                 | 与 oRPC 契约共享 schema                                                                            |
| **动画**            | framer-motion + canvas-confetti + react-odometerjs                                    | Penalty Radar 游戏化 + Live Genesis                                                              |
| **PDF**           | @react-pdf/renderer（Phase 1）                                                          | Client PDF Report / Audit Package；Worker 可跑                                                   |
| **RPC 桥**         | **oRPC**（`@orpc/contract` + `@orpc/server` + `@orpc/client` + `@orpc/tanstack-query`） | Contract-first，端到端强类型；前后端解耦，AI 辅助编程下不易漂                                                       |
| **RPC prefix**    | `/rpc`（`RPCHandler` 默认）；`/api` 留给 REST / webhook / 未来 `OpenAPIHandler`                | 对齐 oRPC 官方惯例；两种 handler 可共用同一份契约                                                              |
| **后端框架**          | Hono 4（`hono/cloudflare-workers` adapter）                                             | 中间件 + 路由；`/api/*` 全挂它；轻量、Worker 原生                                                            |
| **Auth**          | **better-auth** + Organization plugin + Access Control plugin                         | 原生 Hono/Edge；Organization / Membership / Invitation / Active-org 开箱即用，PRD §3.6 Team 模型 1:1 对应 |
| **ORM**           | Drizzle ORM（`drizzle-orm/d1`）                                                         | D1 一等支持；零 Node 依赖；类型推导强；支持裸 SQL + 参数化                                                         |
| **数据库**           | **Cloudflare D1**（SQLite） + 全球读副本                                                   | Worker 原生 SQLite，进程内 < 1ms 查询；miniflare dev / prod 同引擎；Time-Travel 30 天；对我们的多租户点查询 workload 是**架构正确选择**（§2.5），非权宜之计 |
| **向量**            | **Cloudflare Vectorize**                                                              | 与 Worker 同域；RAG top-k 检索                                                                      |
| **对象存储**          | **Cloudflare R2**                                                                     | 零出口流量费；S3 兼容 API（`@aws-sdk/client-s3` 可用）                                                     |
| **缓存 / 限流**       | **Workers KV** + **Rate Limiting binding**                                            | KV 做热数据；Rate Limit 是 Cloudflare 原生 primitive                                                  |
| **后台任务**          | **Cron Triggers** + **Queues** + **Workflows**                                        | Pulse ingest / Email outbox / 长任务编排；零外部依赖                                                     |
| **AI 网关**         | **Cloudflare AI Gateway**                                                             | OpenAI / Anthropic 上游代理；自带 cache / trace / rate limit                                         |
| **LLM**           | OpenAI GPT-4o / 4o-mini（主） + Anthropic Claude Sonnet / Haiku（fallback）                | 经 AI Gateway 统一调度                                                                             |
| **Embedding**     | OpenAI text-embedding-3-small                                                         | 成本 / 精度平衡；结果写入 Vectorize                                                                      |
| **LLM tracing**   | Langfuse（fetch SDK）                                                                   | 云端托管；prompt 版本 / cost / latency                                                               |
| **邮件**            | Resend（React Email 模板）                                                                | fetch API；Worker 可跑                                                                           |
| **Push**          | web-push + VAPID（Workers 内直发）                                                         | 无第三方；Service Worker 里消费                                                                       |
| **监控**            | Sentry（Cloudflare Workers SDK）+ Workers Logs（Logpush）                                 | 错误 + 性能 + 日志                                                                                  |
| **产品分析**          | PostHog Cloud（JS SDK）                                                                 | Web Vitals + 事件；Pay-intent 埋点                                                                 |
| **测试**            | Vitest + `@cloudflare/vitest-pool-workers` + Playwright + msw                         | 单测跑在 Workers runtime；E2E 跨浏览器                                                                 |
| **菜单栏壳（Phase 2）** | Tauri 2 + Rust                                                                        | 跨平台；~1 MB 体积                                                                                  |


> 所有前端 `apps/web` 依赖不进 `apps/server`；所有后端 Worker 依赖不进 `apps/web`。两者通过 `packages/contracts` 共享类型。

---

## 2. 关键选型的深度理由

### 2.1 为什么 Cloudflare 单 Worker 而非 Vercel + Next.js


| 维度                    | 现方案（CF 单 Worker）                                                                                | 旧方案（Vercel + Next.js）                                              |
| --------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 部署供应商                 | Cloudflare（Workers + D1 + KV + R2 + Queues + Vectorize + AI Gateway）+ Resend + Sentry = **3 家** | Vercel + Neon + Upstash + Inngest + R2 + Resend + Sentry = **7 家** |
| dev / prod runtime 一致 | miniflare = Workers 完全一致                                                                        | Vercel Edge vs Node local 经常踩坑                                     |
| 全球 PoP                | 300+                                                                                            | 北美为主                                                               |
| 成本（MVP）               | ~$5–10/mo                                                                                       | ~$70/mo                                                            |
| SPA 回访体验（PWA 命中）      | 秒开                                                                                              | 同级                                                                 |
| SEO 公开页               | 弱（需单独 Astro 静态子站）                                                                               | 强                                                                  |


结论：**对回头率驱动 + PWA 常驻 Dock 的目标用户**，CF 方案体验与成本双优；SEO 短板留待 Phase 1 单独处理。

### 2.2 为什么 oRPC 而非 tRPC / REST

- **Contract-first**：`packages/contracts` 是前后端唯一共享源；后端 `os.contract(...).router(...)` 实现契约，前端 `createORPCClient<Contract>()` 消费契约；**契约改了前后端编译期一起红**
- **双 handler 策略**：同一份契约既可被 `RPCHandler`（走 `/rpc`，富类型 + 高性能，服务内部前端）消费，也可被 `OpenAPIHandler`（走 `/api/v1`，标准 REST + 自动生成 OpenAPI spec，服务未来第三方）消费，零业务代码重写
- TanStack Query 官方 adapter，query key / invalidation 类型派生
- 对非 TS 客户端更友好（通过 OpenAPIHandler），优于 tRPC

### 2.3 为什么 Drizzle 而非 Prisma

- **D1 / Edge Runtime 原生兼容**（Prisma 需要 Accelerate）
- 裸 SQL + 类型推导都强；Overlay Engine（派生 `current_due_date`）需要直写 SQL
- Bundle 体积小（对 Worker 体积敏感场景有正向影响）
- `drizzle-kit` 管迁移，和 `wrangler d1 migrations` 无缝衔接

### 2.4 为什么 better-auth 而非 Auth.js

- 原生支持 Hono + Cloudflare Workers
- **Organization plugin** 开箱提供 Firm / Member / Invitation / Active-org / Role 全套，PRD §3.6 Team 模型零自建
- **Access Control plugin** 做四角色（owner / manager / preparer / coordinator）per-permission 矩阵
- Drizzle adapter 一等支持
- 数据自持（不像 Clerk 把账号数据锁在第三方）

### 2.5 为什么 D1（SQLite）是架构核心选择

D1 是 Cloudflare Worker 的**原生 SQLite**：查询走 V8 isolate 进程内（< 1ms），同一个运行时 dev / prod 完全一致。对 DueDateHQ 的 workload（多租户 · 小数据量 · 点查询 · 边缘延迟敏感），它是**正确选择**而非 MVP 妥协：

| 特性 | D1 |
|---|---|
| 数据规模契合 | 1000 家 firm × 10 年 × 3 万行/firm ≈ 3 亿单元 ≈ 数 GB，远低于 10 GB 硬顶 |
| 查询模式契合 | 全部是 `WHERE firm_id = ?` 点查询 + 范围扫，无复杂 OLAP |
| 读写复制 | 全球 read replica 已 GA，边缘读延迟 < 50ms |
| 灾备 | Time-Travel 30 天任意点恢复 |
| Drizzle 一等支持 | `drizzle-orm/d1` |
| 本地 / 线上一致 | miniflare 内置同一 SQLite 引擎，dev 代码无需改 |
| 成本 | MVP 阶段免费额度覆盖 |
| 事务 | `d1.batch()` ≈ 原子事务（单 batch ~1000 语句） |

**工程纪律（约束而非限制）：**

- 所有列表强制分页（单查询返回 ≤ 10 万行硬顶）
- Migration / Pulse batch 分批 commit（单 batch ~1000 语句硬顶）
- 长计算拆 Queue / Workflow（单 request CPU 上限）
- 无原生向量 → Vectorize
- 无原生 JSON 索引 → 反范式冗余

**Postgres 退路（极端情况，非默认路径）：** 如果后续真落到"跨租户 OLAP + 单库 > 10 GB + 深嵌套分析型 join"，走 Hyperdrive + Neon + Drizzle `neon-http` 方言切换。`packages/db` 是唯一 schema/query 入口，业务层零感知。可见未来不命中，**不做预设迁移规划**。

### 2.6 为什么 Base UI 作 shadcn 原语

- Base UI 是 Radix 团队（与 MUI 合并后）的下一代产品
- shadcn 4.x 官方一等支持：`components.json` 设 `"style": "base-vega"` 即可
- 打包体积比 Radix 小约 30%（对单 Worker SPA 有微正向）
- 键盘 / RTL / ARIA 严格度更高（对齐 Keyboard-first 设计铁律）

---

## 3. 版本策略：pnpm catalog 集中锁定

**单一事实来源：`pnpm-workspace.yaml` 的 `catalog`**。workspace 内所有 `package.json` 通过 `"catalog:"` 协议引用版本，不直接写版本号。

- **初次安装**：`pnpm add hono@latest --workspace-root --save-catalog` → catalog 写入精确版本（`saveExact: true` 保证）
- **workspace 包引用**：`"hono": "catalog:"`（主 catalog）或 `"hono": "catalog:react19"`（命名 catalog，为前端 React 生态单独分组）
- **升级**：直接改 `pnpm-workspace.yaml` 的 catalog 条目；`pnpm install` 自动传播到所有引用包
- **Renovate 持续升级**：对 `pnpm-workspace.yaml` 的 catalog 字段自动起 PR，改一处等于升级整个 monorepo
- **生态重点包 major 升级走独立 PR**：Vite / Drizzle / Hono / oRPC / better-auth / React / Tailwind

**约束：**

- **禁止**在 `apps/*/package.json` 或 `packages/*/package.json` 里写具体版本号（除 workspace 互相引用 `"@duedatehq/db": "workspace:*"` 外）
- 所有外部依赖必须 `"catalog:"` 或 `"catalog:<name>"` 引用
- oxlint 规则 `no-restricted-syntax` 可校验（或写 pre-commit hook 扫描）

---

## 4. 根配置文件（约束项）

### 4.1 `pnpm-workspace.yaml`

pnpm 10 已把所有配置迁到这里，**不要再写 `.npmrc`**。catalog 也定义于此。

```yaml
packages:
  - "apps/*"
  - "packages/*"

# pnpm 10 settings
saveExact: true
autoInstallPeers: true
dedupePeerDependents: true
strictPeerDependencies: false
linkWorkspacePackages: true
preferWorkspacePackages: true

onlyBuiltDependencies:
  - esbuild
  - "@swc/core"
  - sharp
  - workerd

# ============================================================
# Catalog（版本集中锁定 · 改这里等于升级全仓）
# ============================================================
catalog:
  # runtime core
  typescript:          5.x.x
  "@types/node":       22.x.x

  # frontend
  react:               19.x.x
  react-dom:           19.x.x
  "@types/react":      19.x.x
  "@types/react-dom":  19.x.x
  "react-router":      7.x.x
  vite:                7.x.x
  "@vitejs/plugin-react": 5.x.x
  "vite-plugin-pwa":   1.x.x
  "workbox-window":    7.x.x
  tailwindcss:         4.x.x
  "@tailwindcss/vite": 4.x.x
  "lucide-react":      0.x.x
  "class-variance-authority": 0.x.x
  "tailwind-merge":    2.x.x
  "tw-animate-css":    1.x.x

  # Base UI（shadcn base-vega 依赖）
  "@base-ui-components/react": 1.x.x

  # state / form
  "@tanstack/react-query":    5.x.x
  "@tanstack/react-table":    8.x.x
  "@tanstack/react-virtual":  3.x.x
  zustand:                    5.x.x
  nuqs:                       2.x.x
  "react-hook-form":          7.x.x
  "@hookform/resolvers":      3.x.x
  zod:                        3.x.x

  # animation
  "motion":                   12.x.x     # framer-motion v12+ 改名 motion
  "canvas-confetti":          1.x.x
  "react-odometerjs":         3.x.x

  # backend
  hono:                       4.x.x
  "@hono/zod-validator":      0.x.x

  # oRPC
  "@orpc/contract":           1.x.x
  "@orpc/server":             1.x.x
  "@orpc/client":             1.x.x
  "@orpc/tanstack-query":     1.x.x
  "@orpc/openapi":            1.x.x

  # auth
  "better-auth":              1.x.x

  # db
  "drizzle-orm":              0.x.x
  "drizzle-kit":              0.x.x

  # ai
  openai:                     4.x.x
  "@anthropic-ai/sdk":        0.x.x
  langfuse:                   3.x.x

  # infra
  resend:                     4.x.x
  "@react-email/components":  0.x.x
  "web-push":                 3.x.x
  "@sentry/cloudflare":       8.x.x
  "posthog-js":               1.x.x

  # cloudflare
  wrangler:                   3.x.x
  "@cloudflare/workers-types": 4.x.x

  # dev tooling
  turbo:                      2.x.x
  oxlint:                     0.x.x
  oxfmt:                      0.x.x
  vitest:                     2.x.x
  "@cloudflare/vitest-pool-workers": 0.x.x
  "@playwright/test":         1.x.x
  msw:                        2.x.x

# 命名 catalog（给某些需要独立演进的包用，例如 canary React）
# 目前暂不使用，留作扩展
# catalogs:
#   canary:
#     react: 19.2.0-canary
```

> 实际写入仓库时，上表所有 `x.x.x` 会被 `pnpm add --save-catalog` 固化成精确版本号（`saveExact: true` 保证）。这里用 `x.x.x` 只表示"初始化时抓最新版 major.x"。

### 4.2 workspace 包 `package.json` 示例（约束形态）

```json
{
  "name": "@duedatehq/server",
  "private": true,
  "type": "module",
  "dependencies": {
    "hono": "catalog:",
    "@orpc/server": "catalog:",
    "@orpc/contract": "catalog:",
    "better-auth": "catalog:",
    "drizzle-orm": "catalog:",
    "resend": "catalog:",
    "@duedatehq/contracts": "workspace:*",
    "@duedatehq/db": "workspace:*",
    "@duedatehq/core": "workspace:*",
    "@duedatehq/ai": "workspace:*",
    "@duedatehq/auth": "workspace:*"
  },
  "devDependencies": {
    "wrangler": "catalog:",
    "@cloudflare/workers-types": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
    "@cloudflare/vitest-pool-workers": "catalog:"
  }
}
```

### 4.3 根 `package.json`（骨架）

```json
{
  "name": "duedatehq",
  "private": true,
  "packageManager": "pnpm@10.x",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "check-types": "turbo run check-types",
    "lint": "oxlint",
    "format": "oxfmt",
    "test": "turbo run test",
    "deploy": "turbo run deploy --filter=@duedatehq/server"
  },
  "devDependencies": {
    "turbo": "catalog:",
    "typescript": "catalog:",
    "oxlint": "catalog:",
    "oxfmt": "catalog:"
  }
}
```

### 4.4 `turbo.json`（关键任务图）

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "topo": { "dependsOn": ["^topo"] },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".wrangler/**"]
    },
    "check-types": { "dependsOn": ["topo"] },
    "lint": { "dependsOn": ["topo"] },
    "test": { "dependsOn": ["topo"] },
    "dev": { "cache": false, "persistent": true },
    "deploy": {
      "dependsOn": ["build", "check-types", "test"],
      "cache": false
    }
  }
}
```

### 4.5 `.env.example`（完整清单）

```bash
# ───────── App ─────────
NODE_ENV=development
APP_URL=http://localhost:8787
ENV=development

# ───────── Cloudflare Bindings（由 wrangler.toml 注入到 Worker）─────────
# 本地 dev 由 miniflare 提供；此处仅供参考
# DB           (D1)
# CACHE        (KV)
# RATE_LIMIT   (Rate Limit binding)
# R2_PDF       (R2 bucket)
# R2_MIGRATION (R2 bucket)
# R2_AUDIT     (R2 bucket)
# VECTORS      (Vectorize index)
# EMAIL_QUEUE  (Queues producer)
# ASSETS       (Static Assets binding)

# ───────── Auth ─────────
AUTH_SECRET=        # openssl rand -base64 32
AUTH_URL=http://localhost:8787

# ───────── LLM（经 AI Gateway）─────────
AI_GATEWAY_ACCOUNT_ID=
AI_GATEWAY_SLUG=duedatehq
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=

# ───────── Mail ─────────
RESEND_API_KEY=
EMAIL_FROM=noreply@duedatehq.com

# ───────── Push ─────────
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:ops@duedatehq.com

# ───────── Observability ─────────
SENTRY_DSN=
POSTHOG_KEY=

# ───────── Cloudflare CLI auth（仅 CI / 本地 deploy 用）─────────
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

机密**永不进仓库**；`.env.local` 给本地开发；线上通过 `wrangler secret put` 写入 Worker secrets。

---

## 5. 风险与降级矩阵


| 依赖               | 挂了怎么办                                                    |
| ---------------- | -------------------------------------------------------- |
| D1 主区            | 读走 CF read replica；写降级为 Queue 缓冲 + 延迟 flush              |
| Vectorize        | RAG 降级为 D1 FTS5 全文检索兜底（精度下降但可用）                          |
| AI Gateway / LLM | 内置 fallback 链：GPT-4o → Claude Sonnet → 缓存模板 → refusal 文案 |
| Resend           | 写 `email_outbox` + Queue 重试；用户 in-app 通知兜底               |
| KV               | 限流退化为 DB 计数（~200ms 成本）；缓存退化为直查                           |
| Queues           | 紧急降级为 `scheduled()` 里直接处理，牺牲并行度                          |
| R2               | PDF 降级为同步生成 + stream 返回                                  |
| Worker 单区故障      | Cloudflare 全球自动路由；无需人工介入                                 |


---

继续阅读：[02-System-Architecture.md](./02-System-Architecture.md)