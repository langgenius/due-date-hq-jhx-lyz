# 08 · Project Structure · 代码组织与命名约定

> 目标：**新人拉代码 10 分钟能跑起来 · 按路径能猜到内容 · 模块边界被类型系统和 lint 规则强制。**

---

## 1. 顶层目录（约束）

```
duedatehq/
├── apps/
│   ├── web/                       # Vite SPA（Phase 0 唯一前端）
│   └── server/                    # Cloudflare Worker（唯一可部署单元）
├── packages/
│   ├── contracts/                 # oRPC 契约（前后端唯一共享源）
│   ├── db/                        # Drizzle schema + scoped repo 工厂 + writers
│   ├── core/                      # 纯领域逻辑（penalty / priority / overlay / date-logic）
│   ├── ai/                        # RAG + prompts + guard + LLM gateway
│   ├── auth/                      # better-auth 配置（Organization + AC）
│   ├── ui/                        # 可选：跨 app 共享 UI primitives（Phase 0 可暂放 apps/web）
│   └── typescript-config/         # 共享 tsconfig（base / vite / worker / library）
├── docs/
│   ├── PRD/                       # 产品文档（不变）
│   ├── Design/                    # 设计系统
│   ├── Dev File/                  # 本目录 00~09
│   ├── compliance/                # WISP 等合规文档
│   ├── ops/                       # Runbook / 演练报告
│   └── adr/                       # Architecture Decision Records
├── scripts/                        # 运维 CLI（ac-traceability / cost-report / firm-inspect）
├── .github/
│   └── workflows/
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json（顶层仅用于 scripts/）
├── oxlintrc.json
├── oxfmt.toml
├── package.json
└── README.md
```

---

## 2. 脚手架初始化（create-turbo + 定制）

Turborepo 官方脚手架复用其优势（共享 `typescript-config` 包 + JIT 内部包约定），再接我们的结构：

```bash
# 1. 用 create-turbo 起骨架（basic 模板）
pnpm dlx create-turbo@latest duedatehq --package-manager pnpm --skip-install
cd duedatehq

# 2. 删掉默认的 Next.js apps 和 eslint 配置包
rm -rf apps/web apps/docs packages/ui packages/eslint-config

# 3. 保留 packages/typescript-config + turbo.json，但按本文档修改
#    （packages/typescript-config 改名为 @duedatehq/typescript-config；扩展 vite / worker / library 三个派生）

# 4. 手工新增我们的 apps/server · apps/web · packages/{contracts,db,core,ai,auth}
# 5. 按 §01.4 写 pnpm-workspace.yaml（含 catalog）
# 6. pnpm install
```

---

## 3. Turborepo 约定（来自官方 TS Best Practices，**必须遵守**）

### 3.1 Just-in-Time (JIT) 内部包

`packages/contracts / db / core / ai / auth` **不构建**：

- 直接导出 `.ts` 源码（`package.json` 的 `exports` 指向 `src/`*）
- 消费端（`apps/server` 的 wrangler esbuild · `apps/web` 的 Vite rollup）自行转译
- 好处：dev 零构建延迟；go-to-definition 直达源码；无构建产物缓存冲突

### 3.2 每包独立 `tsconfig.json`

- 根目录**不放** `tsconfig.json`（只有 `tsconfig.base.json` 供 `scripts/` 用）
- 每个 app / package 都 `extends: "@duedatehq/typescript-config/<variant>.json"`
- Variants：
  - `base.json`：strict + ES2022 + isolated modules
  - `library.json`：JIT 包用（exports types from src）
  - `vite.json`：`apps/web` 用（DOM lib + React JSX）
  - `worker.json`：`apps/server` 用（`@cloudflare/workers-types` + no DOM）

### 3.3 Node.js Subpath Imports（取代 TS paths）

- 内部引用用 subpath imports，**不用** TS `paths` 配置
- `package.json`：

```json
{
  "imports": {
    "#*": "./src/*"
  }
}
```

- 使用：`import { foo } from '#utils'`
- 跨包走正常 `@duedatehq/<pkg>` 包名

### 3.4 禁止 TypeScript Project References

- 不使用 `tsconfig.json` 的 `references` 字段
- 类型检查靠 turbo 并行跑 `tsc --noEmit`，缓存命中率更高

### 3.5 TypeScript 版本统一

- 全 workspace 通过 catalog 用同一版本的 `typescript` 和 `@types/node`
- 避免 tsserver 在多版本间跳跃

---

## 4. 各包职责（约束）

### 4.1 `apps/server`

```
apps/server/
├── src/
│   ├── index.ts                    # Worker entry：fetch / scheduled / queue
│   ├── app.ts                      # Hono app 组装
│   ├── env.ts                      # Env 类型（Bindings 收敛）
│   ├── middleware/
│   │   ├── session.ts              # better-auth session 读取
│   │   ├── tenant.ts               # 注入 firmId + scoped
│   │   ├── rate-limit.ts
│   │   └── logger.ts
│   ├── procedures/                 # oRPC 实现（每个切片一个目录）
│   │   ├── index.ts                # 拼装总 router
│   │   ├── clients/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── update.ts
│   │   │   └── delete.ts
│   │   ├── obligations/
│   │   ├── dashboard/
│   │   ├── workboard/
│   │   ├── pulse/
│   │   ├── migration/
│   │   └── notifications/
│   ├── jobs/
│   │   ├── cron.ts                 # scheduled handler 总入口
│   │   ├── queue.ts                # queue consumer 总入口
│   │   ├── pulse/                  # ingest / extract / apply
│   │   ├── reminders/
│   │   └── email-outbox/
│   ├── webhooks/                   # /api/webhook/*
│   │   └── resend.ts
│   └── routes/                     # /api/auth/* 由 better-auth handler 挂载
│       ├── auth.ts
│       ├── ics.ts                  # Phase 1
│       └── health.ts
├── wrangler.toml                   # binding + assets + cron + queue
├── package.json
└── tsconfig.json
```

**约束：**

- `procedures/`** 不得 import `@duedatehq/db/schema/*`（用 `context.scoped`）
- `jobs/**` 可以直接用 `scoped(db, firmId)`（系统任务，firmId 从消息体或 cron 规则推导）
- 每个 procedure 文件只导出一个 procedure 定义

### 4.2 `apps/web`

详见 §05。核心：

- `src/routes/*`：RR7 data mode 路由
- `src/features/*`：跨页面业务组合
- `src/components/{ui,primitives,patterns}`：三层 UI
- `src/lib/rpc.ts`：唯一 oRPC client 实例
- `src/lib/auth.ts`：better-auth client

### 4.3 `packages/contracts`

```
packages/contracts/
├── src/
│   ├── index.ts                    # 导出 appContract
│   ├── shared/                     # 共享 Zod schema（ClientSchema / ObligationSchema）
│   │   ├── client.ts
│   │   ├── obligation.ts
│   │   └── enums.ts
│   ├── clients.ts                  # clients 域契约
│   ├── obligations.ts
│   ├── dashboard.ts
│   ├── workboard.ts
│   ├── pulse.ts
│   ├── migration.ts
│   └── errors.ts                   # 自定义 ORPCError code 表
└── package.json
```

**约束：**

- 只依赖 `zod` 和 `@orpc/contract`
- **不得**引入 `@orpc/server` / `hono` / `drizzle-orm` 等后端依赖（否则前端 bundle 污染）
- 所有 schema 必须既可作 input 又可作 output 校验（避免字段漂移）

### 4.4 `packages/db`

```
packages/db/
├── src/
│   ├── schema/
│   │   ├── auth.ts                 # better-auth 托管（自动生成）
│   │   ├── clients.ts
│   │   ├── obligations.ts
│   │   ├── migration.ts
│   │   ├── pulse.ts
│   │   ├── ai.ts
│   │   ├── audit.ts
│   │   ├── notifications.ts
│   │   └── index.ts
│   ├── repo/
│   │   ├── clients.ts
│   │   ├── obligations.ts
│   │   ├── pulse.ts
│   │   ├── migration.ts
│   │   ├── evidence.ts
│   │   └── audit.ts
│   ├── scoped.ts                   # ★ 唯一对外入口
│   ├── client.ts                   # drizzle(D1) factory
│   ├── audit-writer.ts
│   ├── evidence-writer.ts
│   └── types.ts
├── migrations/                      # drizzle-kit 生成
├── seed/
│   ├── rules.ts                    # Federal + CA + NY
│   ├── demo.ts                     # Sarah firm + 30 clients + 2 pulses
│   └── pulse-samples.ts
├── drizzle.config.ts
└── package.json
```

**约束：**

- `exports` 仅暴露 `scoped` / `client` / `audit-writer` / `evidence-writer` / `types` / schema 导入要显式 `@duedatehq/db/schema`（只给 migration / seed / writer 内部用）
- oxlint 限制：`apps/server/src/procedures/`** 禁止 import `@duedatehq/db/schema`

### 4.5 `packages/core`

```
packages/core/
├── src/
│   ├── penalty/                    # Federal + CA penalty 计算
│   ├── priority/                   # Smart Priority 打分 + 因子分解
│   ├── date-logic/                 # DueDateLogic DSL 求值
│   ├── overlay/                    # ExceptionRule 叠加（Phase 1）
│   ├── default-matrix/             # entity × state → tax_types 矩阵
│   └── index.ts
└── package.json
```

**硬约束：**

- **纯函数**；不 import `fetch` / `c.env` / `drizzle-orm` / `crypto.subtle`
- 所有导出函数必须 100% 单测覆盖
- 任何业务常量（罚金利率 / 州码白名单 / 实体枚举）放这里，禁止复制到其他包

### 4.6 `packages/ai`

```
packages/ai/
├── src/
│   ├── index.ts                    # orchestrator 高阶 API（generateBrief / generateTip / ...）
│   ├── gateway.ts                  # AI Gateway client（OpenAI / Anthropic）
│   ├── router.ts                   # modelRoute 定义
│   ├── retriever.ts                # Vectorize 查询
│   ├── prompter.ts                 # prompt 加载 + 版本号
│   ├── guard.ts                    # Glass-Box Guard 5 道闸
│   ├── pii.ts                      # PII redact + fill
│   ├── budget.ts                   # per-firm/day 配额（KV）
│   ├── trace.ts                    # Langfuse 上报
│   └── prompts/                    # *.md 版本化
│       ├── weekly_brief.v1.md
│       ├── deadline_tip.v1.md
│       ├── pulse_extract.v1.md
│       ├── migration_mapper.v1.md
│       └── migration_normalizer.v1.md
└── package.json
```

### 4.7 `packages/auth`

```
packages/auth/
├── src/
│   ├── index.ts                    # createAuth(db, env) 工厂
│   ├── permissions.ts              # Access Control statement + 四角色
│   ├── plugins.ts                  # magicLink / organization / twoFactor 配置
│   ├── email.ts                    # sendMagicLinkEmail / sendInvitationEmail
│   └── types.ts                    # Session / Member 扩展类型
└── package.json
```

### 4.8 `packages/typescript-config`

```
packages/typescript-config/
├── base.json
├── library.json                    # JIT 内部包
├── vite.json                       # apps/web
├── worker.json                     # apps/server
└── package.json                    # name: @duedatehq/typescript-config
```

---

## 5. 命名约定


| 实体                 | 规则                                  | 示例                                   |
| ------------------ | ----------------------------------- | ------------------------------------ |
| 包名                 | `@duedatehq/<kebab>`                | `@duedatehq/contracts`               |
| 目录                 | `kebab-case`                        | `migration-wizard/`                  |
| 文件                 | `kebab-case.ts`；组件 `PascalCase.tsx` | `pulse-banner.ts` · `TriageCard.tsx` |
| 类型                 | `PascalCase`                        | `ClientInput` · `AppContract`        |
| 常量                 | `SCREAMING_SNAKE`                   | `MAX_CLIENTS_PER_IMPORT`             |
| 函数                 | `camelCase`                         | `computePenalty()`                   |
| Zod schema         | `PascalCaseSchema`                  | `ClientSchema`                       |
| oRPC 契约            | `<domain>Contract`                  | `clientsContract`                    |
| oRPC procedure     | 动词 `camelCase`                      | `clients.list` / `pulse.batchApply`  |
| DB 表               | `snake_case` 单数                     | `client` · `obligation_instance`     |
| DB 列               | `snake_case`                        | `firm_id` · `current_due_date`       |
| URL                | `/kebab-case`                       | `/api/webhook/resend`                |
| 环境变量               | `SCREAMING_SNAKE`                   | `AUTH_SECRET`                        |
| Cloudflare binding | `SCREAMING_SNAKE`                   | `DB` · `R2_PDF` · `EMAIL_QUEUE`      |


---

## 6. 依赖方向（必须遵守）

```
apps/*
  └─► packages/{contracts, auth, ui}
        └─► packages/{core}

apps/server
  └─► packages/{db, ai, contracts, auth, core}

apps/web
  └─► packages/{contracts, auth(client-only exports), ui}
        └─► packages/{core}

packages/ai
  └─► packages/{core}（only）

packages/db
  └─► packages/{core}（only）

packages/core
  └─► (无)
```

**禁止反向依赖**；CI 通过脚本检查。

---

## 7. `exports` / `imports` 约定（约束）

每个 `packages/*/package.json` 的 `exports`（JIT 包）：

```json
{
  "name": "@duedatehq/contracts",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./shared/*": "./src/shared/*.ts",
    "./clients": "./src/clients.ts",
    "./obligations": "./src/obligations.ts"
  },
  "imports": {
    "#*": "./src/*"
  }
}
```

- 不用 barrel `index.ts` 导出一切（避免 tree-shake 失效）
- 分 entry 点使消费端按需 import

---

## 8. 根脚本（`package.json` · 约束）

```json
{
  "scripts": {
    "dev":          "turbo run dev --parallel",
    "build":        "turbo run build",
    "check-types":  "turbo run check-types",
    "lint":         "oxlint",
    "lint:fix":     "oxlint --fix",
    "format":       "oxfmt",
    "format:check": "oxfmt --check",
    "test":         "turbo run test",
    "test:e2e":     "playwright test",
    "db:generate":  "pnpm --filter @duedatehq/db db:generate",
    "db:migrate:local":  "pnpm --filter @duedatehq/server wrangler d1 migrations apply duedatehq --local",
    "db:migrate:remote": "pnpm --filter @duedatehq/server wrangler d1 migrations apply duedatehq --remote",
    "db:seed:demo":      "pnpm --filter @duedatehq/db seed:demo",
    "deploy":       "pnpm --filter @duedatehq/server deploy"
  }
}
```

---

## 9. ADR（Architecture Decision Record）

所有**非 trivial** 架构决策必须写 ADR 存 `docs/adr/NNNN-<slug>.md`：

```
## Context
<为什么需要这个决策>

## Decision
<我们决定什么>

## Consequences
<好的 / 坏的 / 不确定的后果>

## Status
proposed | accepted | deprecated | superseded by #NNN
```

当前已做决策应补充的 ADR（Phase 0 内补齐）：

1. `0001-cloudflare-single-worker-fullstack.md`
2. `0002-orpc-contract-first.md`
3. `0003-better-auth-organization.md`
4. `0004-d1-as-mvp-database.md`
5. `0005-shadcn-base-ui-vega.md`
6. `0006-vite-plus-oxlint-oxfmt.md`
7. `0007-pnpm-catalog-version-lock.md`
8. `0008-route-prefix-rpc-vs-api.md`

---

## 10. README 必含段落

- 项目一句话定位（抄 PRD §19）
- 10 分钟 quickstart（装依赖 → 本地 D1 迁移 → seed → `pnpm dev` → 打开 localhost）
- 三条铁律（`00-Overview` §3）
- 目录导航
- 部署命令
- 文档地图

---

## 11. 代码规范强制链

1. oxlint：lint + 自定义 no-restricted-imports
2. oxfmt：格式
3. tsc --noEmit：类型
4. Vitest：测试
5. pre-commit hook（`simple-git-hooks` + `lint-staged`）跑 oxfmt + oxlint --fix + gitleaks 扫密钥
6. CI 再跑一次完整三件套

---

## 12. Monorepo "10 分钟能跑起来"清单（README 核心段）

```bash
# 前置：Node 22 + pnpm 10 + wrangler（自动随依赖装）

pnpm install
pnpm db:migrate:local
pnpm db:seed:demo
pnpm dev

# 打开 http://localhost:8787
# 用任何邮箱走 magic link → 本地 dev 环境 magic link 会直接打印在控制台
```

---

## 13. PRD 映射速查


| PRD §               | 工程落地                                                                            |
| ------------------- | ------------------------------------------------------------------------------- |
| §1.3 设计原则           | `docs/Design/DueDateHQ-DESIGN.md` + `apps/web/styles/globals.css`               |
| §3 Story S1/S2/S3   | E2E 10 条核心路径（§07.5.4）                                                           |
| §3.6 Team           | `packages/auth` Organization plugin                                             |
| §5.1 Dashboard      | `apps/web/routes/_app.dashboard.tsx` + `features/dashboard/`                    |
| §5.2 Workboard      | `apps/web/routes/_app.workboard.tsx` + `features/workboard/`                    |
| §5.5 Evidence Mode  | `apps/web/components/patterns/evidence-drawer/` + `packages/db/evidence-writer` |
| §6.1 Rule Engine    | `packages/db/seed/rules.ts` + `packages/core/date-logic`                        |
| §6.2 Glass-Box      | `packages/ai/guard.ts`                                                          |
| §6.3 Pulse          | `apps/server/src/jobs/pulse/*` + `procedures/pulse/*`                           |
| §6.4 Smart Priority | `packages/core/priority/`                                                       |
| §6A Migration       | `apps/server/src/procedures/migration/*` + `features/migration/`                |
| §7.5 Penalty Radar  | `packages/core/penalty/` + `features/dashboard/penalty-radar-hero.tsx`          |
| §7.8.1 PWA          | `apps/web/vite.config.ts`（PWA plugin）+ `apps/web/src/sw.ts`                     |
| §13 Security        | `06-Security-Compliance.md` + `packages/auth`                                   |


---

继续阅读：[09-7-Day-Sprint-Playbook.md](./09-7-Day-Sprint-Playbook.md)