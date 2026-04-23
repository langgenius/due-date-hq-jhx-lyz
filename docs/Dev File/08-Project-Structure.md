# 08 · Project Structure · 代码组织与命名约定

> 目标：**新人拉代码 10 分钟能跑起来 · 按文件名能猜到内容 · 模块边界清晰**。

---

## 1. 顶层目录

```
duedatehq/
├── app/                         # Next.js App Router（§05）
├── modules/                     # 业务模块（Use cases / Services · §02）
├── components/                  # UI 组件（§05.4）
├── db/                          # Schema / migrations / seed（§03）
├── auth/                        # NextAuth + RBAC（§06）
├── lib/                         # 通用工具（Zod schemas / formatters / rate-limit / logger）
├── prompts/                     # 版本化 Prompt（§04.4）
├── inngest/                     # 后台任务入口（注册所有 function）
├── emails/                      # React Email 模板
├── workers/                     # Inngest function 实现（或直接放 modules/*）
├── public/                      # 静态资源（manifest / icons / sw.js）
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── smoke/
│   └── fixtures/
├── scripts/                     # 一次性 / CLI 工具（ac-traceability / cost-report）
├── tools/cli/                   # 运维 CLI（firm-inspect / push-dry-run / seed-demo）
├── docs/                        # 本文档组
├── .github/workflows/
├── .vscode/
├── .cursor/rules/               # IDE 辅助（可选）
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-workspace.yaml          # 若扩 monorepo
├── turbo.json                   # 同上
├── .env.example
└── README.md
```

---

## 2. `modules/` 结构（核心）

每个模块**必须**具备这五种文件类型（如适用）：

```
modules/<domain>/
├── index.ts                     # 对外 barrel export
├── service.ts                   # use case 入口（被 Server Action / worker 调用）
├── repo.ts                      # 数据访问（Drizzle queries，外部不直接用）
├── schema.ts                    # Zod input / output schema（与 lib/schemas 共享）
├── actions.ts                   # "use server" · 如果被 Page 直接调用
├── types.ts                     # 纯类型
├── <sub-feature>.ts             # 细分逻辑（penalty / priority / overlay 等）
└── __tests__/
    ├── service.test.ts
    └── repo.test.ts
```

### 2.1 完整模块列表

```
modules/
├── auth/                         # session · MFA · invitation
├── team/                         # invite / suspend / transfer / roles
├── clients/
├── rules/                        # rule CRUD (ops) · read API · chunks
├── overlay/                      # ExceptionRule apply / revert / recompute
├── obligations/                  # instance CRUD · status machine
├── penalty/                      # exposure calc + what-if simulator
├── priority/                     # pure scoring + explain wrapper
├── dashboard/                    # triage tabs · weekly brief context
├── workboard/                    # query service · saved views
├── pulse/
│   ├── ingest.ts                 # Inngest cron fn
│   ├── extract.ts                # LLM extraction fn
│   ├── match.ts                  # SQL match engine
│   ├── apply.ts                  # Batch apply transaction
│   ├── revert.ts
│   └── source-health.ts
├── migration/
│   ├── mapper.ts                 # AI field mapper
│   ├── normalize.ts              # AI normalizer + dictionary
│   ├── import.ts                 # Atomic import
│   ├── revert.ts
│   ├── default-matrix.ts         # §6A.5 lookup
│   └── pii-scrub.ts
├── readiness/                    # Client Readiness Portal
├── audit/                        # writer · queries · export CSV
├── evidence/                     # EvidenceLink helpers
├── evidence-package/             # §6C zip worker
├── ai/
│   ├── index.ts                  # orchestrator entry
│   ├── retriever.ts
│   ├── prompter.ts
│   ├── guard.ts
│   ├── pii.ts
│   ├── budget.ts
│   ├── trace.ts
│   ├── brief.ts
│   ├── deadline-tip.ts
│   ├── client-risk.ts
│   ├── draft-email.ts
│   └── onboarding.ts
├── ask/
│   ├── pipeline.ts
│   ├── dsl-generator.ts
│   ├── dsl-to-sql.ts
│   └── executor.ts
├── reminders/
├── notifications/                # in-app bell + outbox
├── push/                         # web-push send
├── ics/                          # feed generator
├── email/                        # Resend wrapper + templates binding
└── analytics/                    # PostHog event dispatch
```

---

## 3. `app/` 与 `modules/` 的关系

```
app/(app)/[firmSlug]/clients/[id]/page.tsx
  └─ calls modules/clients/service.getClientDetail(id)     ← RSC query
       └─ modules/clients/repo.findById(id)                ← Drizzle

app/(app)/[firmSlug]/clients/[id]/actions.ts
  └─ "use server"
  └─ calls modules/clients/service.updateClient(input)
       └─ withRbac + withFirmContext + writeAudit
```

**禁止：** `app/*.tsx` 直接 import `db` 或 Drizzle schema；必须走 `modules/*/service`。

---

## 4. `components/` 分层

```
components/
├── ui/                           # shadcn 原子（button / dropdown / table / toast / ...）
│   └── ...                       # 只做 UI，不含业务逻辑
├── primitives/                   # 品牌原语（§05.4.1）
│   ├── triage-card.tsx
│   ├── penalty-pill.tsx
│   ├── evidence-chip.tsx
│   ├── source-badge.tsx
│   ├── ai-highlight.tsx
│   └── days-badge.tsx
├── patterns/                     # 跨 feature 复合
│   ├── cmdk/
│   ├── evidence-drawer/
│   ├── pulse-banner/
│   └── status-dropdown/
└── features/                     # 与业务强绑定
    ├── dashboard/
    │   ├── penalty-radar-hero.tsx
    │   ├── triage-tabs.tsx
    │   ├── weekly-brief.tsx
    │   └── ask-input.tsx
    ├── workboard/
    ├── migration-wizard/
    ├── pulse-detail-drawer/
    ├── obligation-detail-drawer/
    ├── readiness-form/             # client-facing
    └── onboarding-agent/
```

**依赖方向：** `ui` ← `primitives` ← `patterns` ← `features`；底层不得 import 上层。

---

## 5. 命名约定

### 5.1 文件

- React 组件：`kebab-case.tsx`，export 首字母大写组件名
- 纯 TS 模块：`kebab-case.ts`
- 测试：与被测文件同名 `.test.ts`
- Server Action 文件：`actions.ts`
- Inngest function：`<domain>/ingest.ts` · `<domain>/worker.ts`

### 5.2 变量 / 函数

- 变量：`camelCase`
- 组件：`PascalCase`
- 常量：`SCREAMING_SNAKE_CASE`
- Zod schema：`<Noun>Schema` · 对应 type `<Noun>Input` / `<Noun>Output`
- Drizzle table：`camelCase` 导出，`snake_case` 物理名
- 事件名：`domain.noun.verb.past`（`pulse.applied` / `obligation.status_changed`）

### 5.3 Server Action / API Route

- 动词开头：`createClient` / `applyPulse` / `revertMigration`
- 返回值：`Promise<ActionResult<T>>`，统一 `{ ok: true, data } | { ok: false, error }`

### 5.4 错误类型

```typescript
// lib/errors.ts
export class ForbiddenError extends Error {}
export class NotFoundError extends Error {}
export class ValidationError extends Error {}
export class BudgetExceededError extends Error {}
export class ConflictError extends Error {}   // last-write-wins / advisory lock
```

全局 error boundary 把这些映射到合适的 HTTP / UI 状态。

---

## 6. 依赖方向（必须遵守）

```
 app  ←──  components/features
          ↑
      components/patterns
          ↑
      components/primitives
          ↑
      components/ui

 app  ←──  modules/<domain>/service
                    ↓
               modules/<domain>/repo
                    ↓
                  db/*
```

跨模块通信必须通过：

- 事件（Inngest `sendEvent`）· 弱耦合场景
- 公共 `lib/schemas/*`
- 禁止 `modules/A/service.ts` 直接 import `modules/B/repo.ts`；走 `modules/B/service`

---

## 7. `lib/` 内容

```
lib/
├── schemas/                      # 全局共享 Zod schemas（client / obligation / rule）
├── types/                        # 全局 TS types（Role / Plan / Jurisdiction）
├── format/                       # formatCurrency / formatDays / formatEin
├── dates/                        # tz helpers / holiday rollover / next-business-day
├── ids/                          # nanoid wrappers / token generator / sha256
├── rate-limit.ts
├── logger.ts
├── env.ts                        # Zod-validated process.env（启动即校验）
└── flags.ts                      # feature flags
```

`lib/env.ts` 样板：

```typescript
import { z } from "zod";
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  // ...
});
export const env = envSchema.parse(process.env);
```

启动即 fail-fast，避免生产跑一半发现 env 缺失。

---

## 8. TSConfig

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@app/*": ["./app/*"],
      "@components/*": ["./components/*"],
      "@modules/*": ["./modules/*"],
      "@db/*": ["./db/*"],
      "@lib/*": ["./lib/*"],
      "@auth/*": ["./auth/*"]
    }
  }
}
```

---

## 9. package.json 脚本

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "dev:inngest": "pnpm concurrently \"pnpm dev\" \"pnpm inngest-cli dev -u http://localhost:3000/api/inngest\"",
    "build": "next build",
    "start": "next start",

    "lint": "next lint && eslint .",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "format": "prettier --write .",

    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:smoke": "playwright test tests/smoke",

    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:reset": "tsx scripts/db-reset.ts",
    "db:seed:dev": "tsx db/seed/index.ts dev",
    "db:seed:demo": "tsx db/seed/index.ts demo",

    "prompts:sync": "tsx scripts/prompts-sync.ts",   // git sha → DB
    "ai:dry": "tsx tools/cli/ai-dry.ts",             // 本地打 prompt

    "reports:ac": "tsx scripts/ac-traceability.ts",
    "cost:report": "tsx scripts/cost-report.ts"
  }
}
```

---

## 10. Inngest 注册

```typescript
// inngest/index.ts
import { Inngest } from "inngest";
export const inngest = new Inngest({ id: "duedatehq" });

// inngest/functions.ts
export const functions = [
  pulseIngestIRS, pulseIngestCa, pulseIngestNy, pulseIngestTx, pulseIngestFl, pulseIngestWa, pulseIngestMa,
  pulseExtract,
  emailOutboxWorker,
  webPushFanout,
  weeklyRhythmReport,          // §6D.6
  reminderScheduler,
  mvRefreshPenaltyWeekly,      // 物化视图 refresh
  evidencePackageWorker,
  readinessAutoReminder,
  sourceHealthAudit,
];

// app/api/inngest/route.ts
import { serve } from "inngest/next";
export const { POST, GET, PUT } = serve({ client: inngest, functions });
```

---

## 11. 文档与交付路径

```
docs/
├── PRD/                          # 产品需求
├── Dev File/                     # 本文档组（架构）
├── WISP-v1.0.pdf                 # §06 合规交付
├── reports/                      # AC Traceability HTML
├── runbooks/                     # 事件响应 playbook
├── adr/                          # Architecture Decision Records
└── diagrams/                     # excalidraw / mermaid 源文件
```

**ADR 模板：**

```
docs/adr/NNNN-title.md
---
Status: Proposed | Accepted | Superseded
Date: YYYY-MM-DD
---
## Context
## Decision
## Consequences
```

---

## 12. README 应包含

```
1. Quick start (pnpm install · 3 命令跑起来)
2. 环境变量指南（指向 .env.example）
3. 常用开发命令（上面 scripts 解释）
4. 本文档组入口链接
5. Troubleshooting 前 3 个常见问题
```

---

## 13. 代码规范强制

- ESLint：`@typescript-eslint/recommended` + `next/core-web-vitals`
- 自定义规则（§06.10 合规红线）
- Prettier：默认
- Husky pre-commit：`lint-staged`（prettier + eslint fix + gitleaks）
- Commit 信息：Conventional Commits（`feat:` / `fix:` / `chore:` / `refactor:` / `test:` / `docs:`）

---

## 14. Monorepo 扩展（可选）

当前 MVP 单 repo 即可。若将来拆：

```
packages/
├── web/             # Next.js app (当前内容)
├── worker/          # 独立 Inngest / Node worker
├── shared/          # lib/schemas + lib/types
├── cli/             # tools/cli
├── menu-bar/        # Tauri 壳（Phase 2）
└── emails/          # React Email templates

turbo.json           # build / test / lint 流水线
pnpm-workspace.yaml
```

---

## 15. "能跑起来"的 10 分钟清单（README 核心段）

```
1. git clone && cd duedatehq
2. pnpm install
3. cp .env.example .env.local  # 填 Neon / OpenAI / Resend / Upstash
4. pnpm db:migrate
5. pnpm db:seed:dev
6. pnpm dev:inngest
7. 打开 http://localhost:3000，用 .env.local 里的 DEMO_USER 邮箱登录
```

---

## 16. 对齐 PRD 的模块映射速查

| PRD 章节 | 代码位置 |
|---|---|
| §3.6 Team / Membership | `modules/team/` + `modules/auth/` + `db/schema/firm.ts` |
| §5.1 Dashboard | `app/(app)/[firmSlug]/dashboard/` + `modules/dashboard/` |
| §5.2 Workboard | `app/(app)/[firmSlug]/workboard/` + `modules/workboard/` |
| §5.5 Evidence Mode | `components/patterns/evidence-drawer/` + `modules/evidence/` |
| §6.1 Rule Engine | `modules/rules/` + `db/seed/rules.*.ts` |
| §6.2 Glass-Box AI | `modules/ai/` + `prompts/` |
| §6.3 Pulse | `modules/pulse/` + Inngest fn |
| §6.4 Smart Priority | `modules/priority/` |
| §6.6 Ask | `modules/ask/` |
| §6A Migration | `modules/migration/` + `components/features/migration-wizard/` |
| §6B Readiness | `modules/readiness/` + `app/(embed)/readiness/` |
| §6C Evidence Package | `modules/evidence-package/` + Inngest worker |
| §6D Rules-as-Asset | `modules/rules/` + `modules/overlay/` + 公开 `app/(marketing)/rules/` |
| §7.1 Reminders | `modules/reminders/` |
| §7.5 Penalty Radar | `modules/penalty/` + `components/features/dashboard/penalty-radar-hero.tsx` |
| §7.8 PWA / Push | `modules/push/` + `public/sw.js` + `app/manifest.ts` |
| §13 合规 / Audit | `modules/audit/` + `auth/rbac.ts` + `lib/env.ts` |

---

文档组结束。

- 如需补充"ADR 模板"、"部署 Runbook"、"Demo Day 脚本"等可再独立加文件
- 任何技术决策变更请先更新本 Dev File 组，再改代码
