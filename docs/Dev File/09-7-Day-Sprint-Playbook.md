# 09 · 7-Day Sprint Playbook · 2 人 AI 辅助开发冲刺手册

> 适用场景：**2 位开发者 · 7 个自然日 · 两人都 AI 辅助开发 · 目标 Demo-Ready 闭环**
> 前置阅读：本 Dev File 00 ~ 08（尤其 §00 三条铁律 + §08 项目结构）
> 核心判断：PRD v2.0 是"build-complete 目标形态"；Phase 0 MVP 按 PRD §14.1 是 ~4 周；**本手册是 Phase 0 内嵌的 7 天 Demo Sprint，只做 Demo-Ready 最小闭环 + 可信度信号**。Sprint 与 Phase 0 完整 MVP 的差异见 §1.2 和 §00.4。
>
> **本手册采用"垂直切片"分工模式**：不分前后端，每人在自己负责的 feature 上从 Drizzle schema → scoped repo → oRPC procedure → UI → Test 端到端全栈。AI 辅助开发放大了单人全栈能力，垂直切片最大化两人并行度。

---

## 1. 第一件事：范围冻结（Scope Freeze）

### 1.1 7 天必须做（Demo 闭环）

这是 PRD §15.3 的 **7 天替代 Demo 链**，只演 Phase 0 的最小可信闭环；不演 Onboarding Agent、Readiness Portal、Audit Package 等 P1/Phase 2 叙事。Pitch 时必须明说这些是 Phase 1 roadmap，不得暗示已实现。

| 叙事段 | 最小可演功能 | PRD 映射 |
|---|---|---|
| 0:00–0:30 真实用户口证 | 录屏 + 公开 Worker URL 可访问 | §15.3.1 |
| 0:30–1:30 Migration + Live Genesis | Paste CSV → AI Mapper → Default Matrix → `d1.batch` 导入 → 顶栏 $ 滚动 | §6A + §7.5.6 |
| 1:30–3:00 Monday Triage | Dashboard 三段 Tab + Penalty Radar + Smart Priority + Evidence Mode | §5.1 + §6.4 + §7.5 |
| 3:00–4:00 Pulse Banner + Batch Apply | 预置 2 条 Pulse + 匹配客户 + 一键改 `current_due_date` + audit | §6.3 |
| 4:00–5:00 Glass-Box | AI Weekly Brief 带 `[n]` citation + 点击打开 Evidence | §6.2 |
| 5:00–6:00 Pay-intent + PWA | `$49/mo` 点击 + Add-to-Dock 现场演示 | §7.8.1 + §15.3.6 |

### 1.2 7 天**不做**（Phase 1 再说）

| PRD 章节 | 7 天不做 | 为什么 |
|---|---|---|
| §3.6 Team / RBAC | ✂（数据层保留） | better-auth Organization 已就位；7 天只做 Owner-only，完整权限校验 Phase 1 再开 |
| §6B Client Readiness Portal | ✂ | 独立路由 + magic link 系统 2 人日 |
| §6C Audit-Ready Package | ✂ | ZIP 签名 Phase 1 做 |
| §6D Rules-as-Asset 完整 overlay | ✂ 简化 | Pulse 直接 UPDATE `current_due_date` + evidence_link；不建 `exception_rule` 表 |
| §6A.11 Onboarding AI Agent | ✂ | 传统 4 步向导即可 |
| §6.6 Ask DueDateHQ | ✂ | Cmd-K 留占位 UI |
| §7.8.2 macOS Menu Bar | ✂ | Phase 2 |
| §P0-21 Email Reminders 阶梯 | ✂ | 仅做 Pulse Apply 触发一封摘要邮件 |
| §Auth MFA | ✂ | 仅 magic link；真实试点前补 Owner TOTP |
| §50 州骨架 | ✂ 简化 | **Federal + CA + NY** 3 辖区 seed |
| §ICS 日历订阅 | ✂ | Phase 1 |
| §Stripe | ✂ | 只做 `[I'd pay $49/mo]` 按钮 + PostHog 事件 |

### 1.3 冻结原则

- 范围冻结时间：**D1 早晨 09:00**，此后只修 bug 不加 feature
- 唯一例外：Demo 现场反馈导致"这个不做 Demo 就讲不通"的必需项（两人 10 秒达成一致）

---

## 2. 分工哲学：垂直切片 + 契约先行

### 2.1 为什么不分前后端

- AI 辅助开发放大单人全栈能力：写 Drizzle schema / 写 oRPC procedure / 写 React 组件，AI 难度差不多
- 分前后端制造虚假依赖（前端等后端 API 出来才能动 → 串行）
- 垂直切片让两人彻底解耦：各自拥有一个完整 feature 从数据库到像素

### 2.2 切片定义

每个"切片" = 一个独立可演示的 feature 单元，涉及：

```
packages/db/src/schema/<slice>.ts         (如需新增字段)
packages/db/src/repo/<slice>.ts           (scoped repo 函数)
packages/db/seed/<slice>.ts               (如需种子)
packages/contracts/src/<slice>.ts         (oRPC 契约)
apps/server/src/procedures/<slice>/*.ts   (契约实现)
apps/web/src/features/<slice>/*           (UI)
apps/web/src/routes/*.tsx                 (路由)
packages/ai/src/prompts/<slice>/*.md      (如涉及 AI)
tests/**/<slice>.test.ts
```

### 2.3 两人的切片归属

| Dev | 负责切片 | Demo 叙事归属 |
|---|---|---|
| **Alice** | 🅐 Migration Copilot · 🅑 Pulse 全链路 · 🅒 PWA + Push | 0:30–1:30 + 3:00–4:00 + 5:00–6:00 |
| **Bob** | 🅓 Dashboard + Penalty Radar · 🅔 Workboard + Client CRUD · 🅕 Evidence Mode + Cmd-K + Demo Polish | 1:30–3:00 + 4:00–5:00 |

Day 1–2 是**共同地基**（schema / UI 原语 / auth / contracts 模板），之后才能并行。

### 2.4 契约先行（Day 1 晚 18:00 冻结）

两人垂直切片能并行的前提：**跨切片接口 Day 1 晚 18:00 签名全部冻结**。

不可谈判的 8 个冻结对象：

```typescript
// packages/contracts/src/shared/client.ts （Bob 🅔 维护）
export const ClientSchema = z.object({ ... });

// packages/contracts/src/shared/obligation.ts （Bob 🅔 维护）
export const ObligationRowSchema = z.object({ ... });

// packages/contracts/src/pulse.ts （Alice 🅑 维护）
export const PulseExtractionSchema = z.object({ ... });

// packages/contracts/src/migration.ts （Alice 🅐 维护）
export const MigrationBatchSchema = z.object({ ... });

// packages/db/src/audit-writer.ts （两人共用，Bob 维护）
export async function writeAudit(input: AuditInput, tx?: Tx): Promise<void>;

// packages/db/src/evidence-writer.ts （两人共用，Bob 维护）
export async function writeEvidence(input: EvidenceInput, tx?: Tx): Promise<string>;

// packages/ai/src/index.ts （两人共用，Alice 维护）
// packages/ai returns guarded results; apps/server writes DB records via injected writers.
export async function runPromptJson<T>(opts: PromptOpts, ports: AiPorts): Promise<T>;
export async function runPromptStream(opts: PromptOpts, ports: AiPorts): ReadableStream;

// packages/auth/src/index.ts + apps/server/src/middleware/tenant.ts （Alice 维护）
// Hono middleware 注入 c.set('firmId', ...) + c.set('scoped', scoped(db, firmId))
```

**契约纪律：**

- Day 1 晚定好签名 → Day 2 先各自写 mock 实现（跑通但内部不完整）
- Day 3 起两人并行；改上面任何函数签名必须 Slack 通告 + 对方 review
- 发现缺字段 → 加 optional 字段，不回头改结构
- 改契约的 PR 必须打 `[contract]` 标签

### 2.5 切片边界清单

| 模块 | 维护人 | 被谁消费 |
|---|---|---|
| `packages/db/src/schema/*` | Day 1 两人共建，之后谁加谁负责 | 所有人（经 scoped） |
| `packages/auth` | Alice（Day 2） | 所有 procedure |
| `packages/db/src/repo/clients` | Bob（Day 3） | Alice Migration · Bob Workboard/Dashboard |
| `packages/db/src/repo/obligations` | Bob（Day 3） | Alice Migration 触发生成 · Bob Dashboard/Workboard |
| `packages/db/seed/rules.ts` | Alice（Day 1 seed + Day 3 生成 service） | Bob Dashboard 展示 |
| `packages/core/penalty` | Bob（Day 4） | Bob Dashboard |
| `packages/core/priority` | Bob（Day 4） | Bob Dashboard |
| `apps/server/src/procedures/migration` | Alice（Day 3） | Alice Wizard UI |
| `packages/ai` | Alice（Day 2–3） | Alice Pulse · Bob Brief |
| `apps/server/src/procedures/pulse` + `jobs/pulse` | Alice（Day 4–5） | Alice Banner + Drawer |
| `packages/db/src/audit-writer` / `evidence-writer` | Bob（Day 2，所有人写入） | Alice Pulse · Bob Audit Log |
| `apps/server/src/middleware/push` · SW | Alice（Day 6） | Alice Pulse fanout |
| `jobs/email-outbox` | Alice（Day 5） | Alice Pulse |
| `apps/web/src/components/ui/*` | Day 1 两人共建（shadcn init `base-vega`） | 所有 |
| `apps/web/src/components/primitives/*` | Bob（Day 1） | 所有 |
| `apps/web/src/features/migration/*` | Alice | — |
| `apps/web/src/features/pulse/*` | Alice | — |
| `apps/web/src/features/dashboard/*` | Bob | — |
| `apps/web/src/features/workboard/*` | Bob | — |
| `apps/web/src/components/patterns/evidence-drawer/` | Bob | Alice Pulse 调用打开 |
| `apps/web/src/components/patterns/cmdk/` | Bob | — |

---

## 3. Day 0（前一天晚上 · 1 小时）· 共同准备

**目的：** 7 天不再卡在账号开通 / API key。

### 3.1 必须完成的前置清单

| 项 | 负责人 | 说明 |
|---|---|---|
| GitHub org + 空 repo `duedatehq` | Alice | private |
| Cloudflare 账号 + API token（Workers + D1 + R2 + Vectorize + AI Gateway） | Bob | 权限：Edit Workers · D1 · R2 · Vectorize · AI Gateway |
| Cloudflare R2 bucket × 3 | Bob | `duedatehq-pdf` / `duedatehq-migration` / `duedatehq-audit` |
| Cloudflare D1 databases × 3 | Alice | `duedatehq` / `duedatehq-staging` / `duedatehq-preview` |
| Cloudflare KV namespace | Alice | `CACHE` |
| Cloudflare Vectorize index × 2 | Alice | `duedatehq-rules` / `duedatehq-pulse-chunks` |
| Cloudflare Queues × 2 | Alice | `duedatehq-email` / `duedatehq-pulse-extract` |
| Cloudflare AI Gateway slug | Alice | `duedatehq` |
| OpenAI 账号 + ZDR org + API key | Alice | **必须 ZDR**（§06） |
| Anthropic 账号 + API key | Alice | fallback |
| Langfuse 账号 | Alice | LLM trace |
| Resend 账号 + 域名验证 | Bob | DNS 验证 24h，当晚先动 |
| Sentry 账号（Cloudflare SDK） | Bob | |
| PostHog 账号 | Bob | 产品事件 |
| VAPID key | Alice | 用 Workers-compatible 工具生成；不要假设 Node `web-push` runtime 可直接部署 |
| 域名（可选）或 `*.workers.dev` | 谁快谁来 | 可选 |

### 3.2 环境变量同步

- 两人用 1Password / Bitwarden shared vault 同步 `.env.local`
- 生产 / staging secret 直接 `wrangler secret put`；**不要走 GH Actions**
- **不要用 Slack / 微信发明文密钥**

---

## 4. Day-by-Day 作战计划

> 每日结构：
> - 当日 Definition of Done
> - 两人任务清单（2h 粒度）
> - 晚 18:00 集成联调（演示给对方看）

### 4.1 Day 1（周六）· 共同地基

**Definition of Done：**

- 两人都能本地 `pnpm dev` 跑起来（Vite + miniflare Worker 一起起）
- Worker preview URL 可访问
- D1 有 10+ 张核心表 + better-auth 自动建表
- Federal + CA + NY ~20 条 rules seed 完成
- **Day 1 晚 18:00：§2.4 的 8 个接口契约签名冻结**

**Alice · 平台基础 + DB + Auth**

| 时段 | 任务 |
|---|---|
| 09:00–10:00 | 范围冻结 review · Day 0 资源核对 · 契约方向口头对齐 |
| 10:00–12:00 | `pnpm dlx create-turbo@latest` → 删默认 apps → 按 §08.1 搭骨架 · `pnpm-workspace.yaml` 含 catalog（§01.3） · 装核心依赖（oxlint / oxfmt / wrangler / drizzle-kit / better-auth / hono / oRPC）· 首次 push + Worker Preview 跑通 |
| 13:00–15:00 | 起 `apps/server`：Hono + RPCHandler 挂 `/rpc` + better-auth 挂 `/api/auth/*` · `wrangler.toml`（D1 / KV / R2 / Queues / Vectorize / AI Gateway bindings 全配）· miniflare 本地跑通 |
| 15:00–17:00 | `packages/db` schema Part 1：`clients` / `obligations`（rule + instance）/ `evidence_link` / `audit_event` / `ai_output` / `llm_log` + 核心索引（§03.3） · `drizzle-kit generate` + `wrangler d1 migrations apply --local` · better-auth 启动自动建表 |
| 17:00–18:00 | Seed：`packages/db/seed/rules.ts`（Federal + CA + NY ~20 条，每条带 `source_url + verbatim_quote + verified_by + verified_at`） |
| 18:00–19:00 | **与 Bob 对齐 §2.4 契约**：两人一起把 8 个接口签名写进 `packages/contracts/src/*` + `packages/db/src/{audit,evidence}-writer.ts` + `packages/ai/src/index.ts`（函数签名 + mock throw `Error("not implemented")`） |

**Bob · UI 基础 + 原语 + 合约 schema**

| 时段 | 任务 |
|---|---|
| 09:00–10:00 | 与 Alice review + 资源 |
| 10:00–12:00 | 起 `apps/web`（Vite + React 19 + React Router 7 + `vite-plugin-pwa`）· Tailwind 4 + shadcn init `base-vega` + 关键 primitives（button / input / dialog / dropdown / toast / table / tabs / sheet / popover / tooltip / command） · `globals.css` 对齐 DESIGN.md token（§05.5） |
| 13:00–15:00 | React Router 7 路由骨架：`_layout` / `_app._layout`（登录 shell + 侧栏 + 顶栏占位） · 登录页 / Dashboard / Workboard / Clients / Alerts / Audit 空态页 |
| 15:00–17:00 | 原语组件：`TriageCard` / `DaysBadge` / `PenaltyPill` / `SourceBadge` / `AIHighlight` / `EvidenceChip` / `StatusDropdown`（纯视觉 · mock props） |
| 17:00–18:00 | `apps/web/src/lib/rpc.ts` 写好（指向 `/rpc`） · 登录页 UI 接 better-auth client |
| 18:00–19:00 | 与 Alice 对齐契约 |

**Day 1 晚 18:00 集成点：**

两人一起把契约（`packages/contracts/src/*` + writer + middleware 签名）提交，Tag `day1-contracts-frozen`。此后两人可 AI 辅助开发不必互等。

---

### 4.2 Day 2（周日）· 契约实装 + 应用地基

**Definition of Done：**

- Alice：magic link 真实邮箱收信可登录；tenant middleware 把 `firmId` 注入 context；scoped repo 工厂可用
- Alice：`packages/ai/src/index.ts` 有 AI Gateway 基础 client 可跑
- Bob：`audit-writer` / `evidence-writer` 落库能走通
- Bob：Workboard 空态 + Client 新建表单 UI 能打开（后端未通也能走）

**Alice · 切片共享设施**

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | better-auth + Organization plugin 真实配置（magic link sendEmail → Resend）· 登录后 `setActiveOrganization` · `/api/auth/*` 所有路由打通 |
| 11:00–13:00 | `apps/server/src/middleware/tenant.ts`：读 session → 注入 `firmId` + `scoped` → 单测一条快乐路径 + 一条 401 |
| 14:00–16:00 | `packages/ai/src/gateway.ts` AI Gateway fetch client · `runPromptJson`（Zod 输出校验）· `runPromptStream`（SSE）· `packages/ai/src/trace.ts` Langfuse payload · server 注入 writer 后 `llm_log` 落库 |
| 16:00–18:00 | `packages/ai/src/retriever.ts`（Vectorize top-k） · `packages/ai/src/guard.ts`（5 道闸） · `packages/ai/src/pii.ts`（PII redact） |
| 18:00–19:00 | Daily Sync + demo |

**Bob · 应用层骨架 + 共享写入器**

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | 登录 Flow UI（邮箱 → check email → magic link 回到 app） · 登录态 header |
| 11:00–13:00 | `packages/db/src/audit-writer.ts` 真实实现 · `packages/db/src/evidence-writer.ts` 真实实现 · 单测各 3 条 |
| 14:00–16:00 | `components/patterns/cmdk/`（Search tab 基础） · `components/patterns/evidence-drawer/` 全局 drawer 壳 + Zustand `evidenceTarget` · `E` 键打开 |
| 16:00–18:00 | 主 App layout：侧栏 Nav + 顶栏 `<PenaltyRadarHero/>` 占位 + `<DrawerStack/>` 容器 · `/dashboard` / `/workboard` / `/clients` / `/alerts` / `/audit` 空态完整 |
| 18:00–19:00 | Daily Sync + demo |

**Day 2 晚集成：**

- Alice 真实邮箱登录 → 跳 Bob 的 Dashboard 空态
- Alice `wrangler d1 execute --local` 手工 `INSERT client` → Bob `/clients` 列表看到（验证 scoped 正常）
- Alice `runPromptJson({ ... })` 调一次 → Langfuse 看到 trace

---

### 4.3 Day 3（周一）· 切片并行启动

#### 🅐 Alice · Slice Migration Copilot

**DoD：**

- Paste TaxDome / messy / 无 tax_types 三种 CSV 都能导入
- Live Genesis 动画正常 + 顶栏 $ 滚动
- 导入走 `d1.batch` 原子；单行失败不阻塞

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | Schema：`migration_batch / mapping / normalization / error` · Seed Default Tax Types Matrix（§6A.5）TS 常量 |
| 11:00–13:00 | `packages/ai/src/prompts/migration_mapper.v1.md` · procedure `migration.mapColumns` · EIN 正则二次校验 · 写 `migration_mapping` |
| 14:00–16:00 | procedure `migration.normalize` · 字典优先（state / entity / importance）+ LLM 兜底 · 置信度 < 0.8 标 `needs_review` · 写 `evidence_link(source_type='ai_migration_normalize')` |
| 16:00–18:00 | procedure `migration.apply` 单 `d1.batch` 事务 · 调 `packages/core/default-matrix` 和 `packages/core/date-logic` 生成 obligations · 写 audit/evidence · revert 接口（仅写 `reverted_at`） |
| 18:00–19:00 | Daily Sync · 三种 CSV 冒烟 |
| 19:00–21:00 | `features/migration/wizard/` Stepper + Step 1 Intake（paste + file drop） · URL state 记当前步 |

#### 🅔 Bob · Slice Client + Workboard

**DoD：**

- 能在 UI 手动创建 client
- Client 创建后规则引擎自动生成 obligations 出现在 Workboard
- Workboard 筛选 + 排序 + 行内 status 改 + 键盘快捷键
- Obligation Detail Drawer 壳打开

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | `packages/db/src/repo/clients.ts` · `apps/server/src/procedures/clients/{list,create,update,delete}.ts` · `packages/contracts/src/clients.ts` 契约定义 · CRUD 全链 |
| 11:00–13:00 | `packages/core/date-logic`：`DueDateLogic` DSL 求值器 · `packages/core/default-matrix`：entity × state → tax_types · procedure `obligations.generateForClient`（给一位 client 生成全年 instances） |
| 14:00–16:00 | `/clients` 列表页 · Client 新建页 · 创建触发 obligations 生成 · 回 list 看到 |
| 16:00–18:00 | Workboard 真实数据：TanStack Table + 10 列 + State/Status/Form 筛选 · 服务端分页 · URL state（nuqs） |
| 18:00–19:00 | Daily Sync |
| 19:00–21:00 | `StatusDropdown` 行内改 · Optimistic UI · 5s Undo toast · 键盘 `F/X/I/W` + `J/K` · **Obligation Detail Drawer** 壳（Evidence/Audit tab 占位） |

**Day 3 晚集成：**

- Bob 创建 LLC × CA 客户 → Workboard 出现 2–3 条 obligations
- Alice 粘贴 30 行 CSV → 后端 import 跑通，D1 里能看到 30 客户 + 120 obligations
- 关键验证：**两人切片今天完全没互相阻塞**

---

### 4.4 Day 4（周二）· Dashboard + Pulse 前半

#### 🅐 Alice · Migration UI 收尾 + Pulse 启动

**Migration DoD：**

- Wizard 4 步完整可走
- Live Genesis 动画 + 顶栏 $ 滚动

**Pulse 前半 DoD：**

- Seed 2 条 approved Pulse（IRS CA storm + NY PTET）
- Pulse Banner 在 Dashboard 顶部出现
- Pulse Detail Drawer 展示 verbatim + affected clients

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | Wizard Step 2 Mapping table（置信度高亮 + re-run AI） |
| 11:00–13:00 | Wizard Step 3 Normalize + Default Matrix 勾选块 + 冲突处理 |
| 14:00–15:00 | Wizard Step 4 Preview + **Live Genesis 动画**（`react-odometerjs` + CSS 粒子） |
| 15:00–17:00 | Schema: `pulse / pulse_application` · Seed 2 条 demo Pulse（raw 存 R2） · procedure `pulse.match`：四维 SQL |
| 17:00–18:00 | `features/pulse/banner/` Dashboard Layer 2 · "Last checked X min ago" 信号 · `features/pulse/detail-drawer/` 前半（AI summary + verbatim + affected table） |
| 18:00–19:00 | Daily Sync |

#### 🅓 Bob · Dashboard 全栈

**DoD：**

- Dashboard 首屏 TTI（Worker preview）≤ 1.5s
- Penalty Radar 顶栏是服务端预聚合 · Odometer 滚动
- Triage Tabs（This Week / This Month / Long-term）count + $ 正确
- Weekly Brief 流式带 `[n]` citation
- Obligation Detail Drawer 的 Evidence Mode 可点

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | `packages/core/penalty/` 纯函数（Federal + CA） · 单测 · Obligation 生成时写 `estimated_exposure_cents` |
| 11:00–13:00 | `packages/core/priority/` 纯函数 + 因子分解 · 单测 · `apps/server/src/procedures/dashboard.triage` 使用 |
| 14:00–15:00 | `packages/db/seed/rule_chunks.ts` embed + Vectorize 入库 · 通过 `packages/ai/retriever` 跑通 top-k |
| 15:00–17:00 | `packages/ai/src/brief.ts` · `prompts/weekly_brief.v1.md` · `glassBoxGuard` 校验 · 流式 API（Hono `streamSSE`） · server writer 写 `ai_output` · KV 缓存每 firm/day 1 次 |
| 17:00–18:00 | `features/dashboard/penalty-radar-hero.tsx`（76px JetBrains Mono + Odometer + 趋势箭头 + Sparkline） · `triage-tabs.tsx` · `weekly-brief.tsx`（Suspense 流式） |
| 18:00–19:00 | Daily Sync |
| 19:00–21:00 | Obligation Detail Drawer 完成 · Evidence Mode 全局抽屉完成（任意 `[n]` 可点 → source + verbatim + verified_by） |

**Day 4 晚集成：**

- Bob 打开 preview Dashboard：顶栏 `$19,200 at risk this week` + 三 tab + Weekly Brief 流式带 `[1][2][3]`
- 点 `[1]` → Evidence 抽屉看到 source + verbatim
- Alice 的 Pulse Banner 在 Bob Dashboard 顶部已显示
- 点 Banner Review → 抽屉展示 12 位 LA 客户（Batch Apply 按钮 Day 5 才有效）

---

### 4.5 Day 5（周三）· Pulse 闭环 + Evidence 加深

#### 🅐 Alice · Pulse 后半 + 邮件 + Audit Log

**DoD：**

- Batch Apply 走 `d1.batch` 原子事务：UPDATE `current_due_date` + `evidence_link` + `audit_event` + `email_outbox`
- Queue consumer 调 Resend 把真实邮件发出（含受影响客户列表 + source URL）
- Audit Log `/audit` 页可查看

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–12:00 | procedure `pulse.batchApply` 事务：KV advisory lock + `d1.batch([UPDATE, INSERT evidence_link, INSERT audit_event, INSERT email_outbox, INSERT pulse_application])` · 24h Revert 接口 |
| 13:00–15:00 | React Email 模板 `packages/ai/src/emails/pulse-digest.tsx` · `jobs/email-outbox.ts` Queue consumer（每 1 min flush 到 Resend） |
| 15:00–17:00 | Pulse Detail Drawer 后半：Batch Apply 按钮 + confirm modal + Optimistic UI（顶栏 $ 下落 + 绿色 pulse halo） |
| 17:00–18:00 | `/audit` 页：时间线列表 + actor/action 过滤 · 行点击展开 before/after diff |
| 18:00–19:00 | Daily Sync |

#### 🅕 Bob · Penalty 深化 + Priority 解释 + TriageCard 因子 + Alerts 历史

**DoD：**

- Obligation Detail 的 Penalty breakdown（FTF / FTP / Interest / Per-partner）完整
- Smart Priority hover ✦ 展开因子分解
- TriageCard 展示"Why top rank?"
- `/alerts` 页（Pulse 历史）

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | Penalty breakdown 前端组件 · Evidence Mode 展开公式 + 出处 + assumptions |
| 11:00–13:00 | Priority 因子徽章 hover 展开 · `packages/ai/src/priority-explain.ts`（LLM 仅在 top-5 差 < 5% 时兜底） |
| 14:00–16:00 | **联调 Pulse Impact**：Alice 的 Batch Apply 后，Bob Dashboard 顶栏 $ 真实下落 · TriageCard 的 due_date 变化 · Evidence Chain 追加 Pulse event |
| 16:00–18:00 | `/alerts` 页：左 Pulse feed + 右 Pulse Detail（复用 Alice Drawer） |
| 18:00–19:00 | Daily Sync |
| 19:00–21:00 | TriageCard 视觉完善（severity 色条 + status dropdown + source badge） |

**Day 5 晚集成（重要）：**

- 登录 Dashboard → Pulse Banner 红色脉冲 "IRS CA storm relief → 12 clients affected"
- 点 Review → 12 位 LA 客户 → **Apply** → 顶栏 $ **减少 $6,500** + 绿色 pulse 动画 + Toast
- Resend Dashboard 里看到 real email
- `/audit` 看到 12 条 `pulse.apply` 事件
- 打开任一客户 Evidence Chain → 追加 "Pulse applied" 一行

---

### 4.6 Day 6（周四）· PWA + Demo Seed + Polish + Pay-intent

#### 🅒 Alice · PWA + Push

**DoD：**

- PWA Add-to-Dock（macOS Safari/Chrome）独立窗口
- Add-to-Home（iPhone）全屏启动
- Web Push 真实到达手机（Pulse Apply 触发）
- App Badge 显示 overdue count

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | `vite-plugin-pwa` 配置（manifest / Workbox runtime caching / `navigateFallbackDenylist: [/^\/rpc/, /^\/api/]`） · `apps/web/src/sw.ts` push handler + notificationclick |
| 11:00–13:00 | `apps/server/src/procedures/push/subscribe.ts` · `jobs/push-fanout.ts`（VAPID 签名 · 410/404 自动 revoke） |
| 14:00–16:00 | Pulse Apply 成功后触发 push fanout · Settings Notifications 页（订阅状态 + Enable 按钮） |
| 16:00–17:00 | App Badge Integration（`navigator.setAppBadge(overdueCount)`） |
| 17:00–18:00 | Install prompt 时机（第 3 次访问 + Migration 完成后 inline 提示） |
| 18:00–19:00 | Daily Sync · 两人都 Add-to-Dock 一次 |

#### 🅕 Bob · Cmd-K + Demo Seed + Pay-intent + 视觉收口

**DoD：**

- `pnpm db:seed:demo` 幂等脚本：Sarah firm + 30 clients（12 LA）+ 150 obligations + 2 Pulse + cached Weekly Brief
- Cmd-K 命令面板（Search + Navigate，Ask 占位 `Coming soon`）
- `[I'd pay $49/mo]` 按钮 + PostHog 事件 + audit
- Zero Week confetti · Dark mode 微调 · 响应式 4 断点

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | **Demo seed 脚本**（`packages/db/seed/demo.ts`）· 幂等 · Sarah / 30 clients（12 LA）/ 150 obligations / 2 pulses / AI Brief 预生成 |
| 11:00–13:00 | Cmd-K 搜索 + 跳转 · `?` 快捷键面板 · 全局键盘导航 |
| 14:00–15:00 | Pay-intent 按钮（Dashboard + Settings）· 点击写 `analytics_event` + PostHog · 感谢 toast |
| 15:00–17:00 | 视觉收口：confetti（`canvas-confetti`）· Smart Priority ✦ hover 动画 · Loading skeleton · Dark mode 对比度修 · responsive 4 断点（iPhone 13 / iPad / MacBook 13" / 27"） |
| 17:00–18:00 | 公开页 `/` 首页 + `/pulse` Feed（SEO 占位，无功能） |
| 18:00–19:00 | Daily Sync |

**Day 6 晚集成：**

- 两人各从手机 Add-to-Home → 截图
- Bob 在 demo firm 手动 approve Alice 的第三条 mock pulse → Alice 手机 2 秒内收到 push → 点击跳 Banner 已展开
- Cmd-K → `acme` → 回车跳 Client Detail

---

### 4.7 Day 7（周五）· 冻结 + 部署 + 排练

**上午 09:00–12:00 · 联合冻结**

| 时段 | 两人一起 |
|---|---|
| 09:00–09:30 | Commit frozen · main 只接受 P0 blocker hotfix |
| 09:30–11:00 | 完整跑 Demo 脚本（PRD §15.3） · 每段掐表 · 记录卡点 |
| 11:00–12:00 | 两人分头修 top 5 卡点 |

**下午 12:00–17:00**

| 时段 | Alice | Bob |
|---|---|---|
| 12:00–14:00 | `wrangler deploy` production · seed demo · 跑 D1 remote migration · 冒烟 | 同上 + 确认 PWA 在 HTTPS prod 正常 · 公开页内容校对 |
| 14:00–16:00 | Plan B 断网预案：4K 全流程录屏 · 预置脚本化 Pulse 触发 | Pitch Deck 6 页（§15.4） · 真实 CPA 视频或 stand-in |
| 16:00–17:00 | 合并共同排练 | 同 |

**晚 17:00–21:00 · 排练**

| 时段 | 内容 |
|---|---|
| 17:00–18:00 | 第一次全流程（录屏作 Plan B） |
| 18:00–19:00 | 吃饭 + 卡点清单 |
| 19:00–20:00 | 第二次（修完卡点） |
| 20:00–21:00 | 最后一次 · 冻结 · 关电脑 |

---

## 5. 任务拆分粒度

### 5.1 GitHub Issue 标签

```
type/feat · type/fix · type/chore · type/docs · [contract]
slice/migration · slice/pulse · slice/dashboard · slice/workboard · slice/pwa · slice/infra
owner/alice · owner/bob
priority/p0-demo · priority/p1-stretch
day/1 ~ day/7
```

每个 issue 必须同时打 `slice/*` 和 `owner/*` 标签。

### 5.2 Issue 模板

```markdown
## 目标
一句话：做完之后 Demo 能怎么演？

## Slice 归属
slice/migration · owner/alice

## AC（对齐 PRD Test ID）
- [ ] T-S2-02: ...

## 跨切片依赖
依赖 #N（哪个契约）/ 不依赖

## 估时
X 小时

## DoD
- [ ] 代码 + 测试 + PR merged
- [ ] Preview URL 可见
- [ ] 对方 10 秒确认过
```

### 5.3 PR 模板

```markdown
## 本 PR 做了什么
-

## Slice / 关联 Issue
slice/pulse · Closes #

## 是否改动契约（§2.4）？
- [ ] 否
- [ ] 是（已 Slack 告知 + 对方已确认） — PR 标题加 `[contract]`

## 测试怎么验？
1.

## 截图 / GIF（UI PR 必须）
```

---

## 6. Definition of Done（按 Slice）

| Slice | DoD |
|---|---|
| **Auth + 基础（Alice）** | 邮箱收 magic link（Resend 真实发信）· 7 天 session · better-auth Organization 创建 · scoped repo 过滤生效 |
| **Migration（Alice）** | 3 份 CSV（整齐 / 混乱 / 无 tax_types）都能导入 · 单行错误不阻塞 · Live Genesis 动画 · Undo 按钮存在 |
| **Pulse（Alice）** | 2 demo pulse 在 Banner · Drawer 显示 verbatim + 12 affected · Apply 后顶栏 $ 减少 · Resend 真邮件 · Audit 多 12 条 |
| **PWA（Alice）** | 地址栏 Install · Add-to-Dock 独立窗口 · 手机 Add-to-Home 全屏 · Pulse Apply 触发 Push |
| **Client + Workboard（Bob）** | 创建 client 自动生成 obligations · Workboard 1000 行虚拟化不卡 · 三维筛选生效 · 行内 status 5s Undo · J/K 导航 |
| **Dashboard（Bob）** | 三 tab count 正确 · Penalty 顶栏 = D1 聚合 · Weekly Brief 带 ≥ 2 个 `[n]` · Evidence 抽屉可点 |
| **Polish（Bob）** | demo seed 幂等 · Cmd-K 可用 · Pay-intent 写事件 · confetti · 响应式过 4 断点 |

---

## 7. Daily Sync Ritual

### 7.1 早 09:00（10 分钟）

```
1. 昨天完成了什么？（各 2 分钟）
2. 今天切片目标？（各 2 分钟）
3. 今天有没有改契约计划？（有 → 提前约时间）
4. 范围漂移预警
```

### 7.2 晚 18:00（10–15 分钟）

```
1. 演示今天切片 DoD（共 5 分钟）
2. 明天是否需要跨切片联调？
3. 是否需要调整范围？
4. 是否需要互相 rubber-duck 卡点？
```

超 15 分钟必须停，改 async。

### 7.3 契约变更协议

- 改 §2.4 任一签名 → Slack `@对方` + PR 链接 + 打 `[contract]` 标签
- 对方 5 分钟内 approve 或提异议
- **不要 push 未告知的契约变更**

---

## 8. 如果落后怎么办（Decision Tree）

```
Day 3 晚 · Alice Migration 没跑通？
  ├─ 差 < 2h：熬夜（Migration 是 Demo 核心）
  └─ 差 ≥ 2h：保留 Migration，AI Brief 降级为预生成模板

Day 3 晚 · Bob Client/Workboard 没跑通？
  ├─ Client CRUD 没通：当晚补
  └─ Workboard 筛选不完：保留基础表格，筛选降级为手写

Day 4 晚 · Dashboard TTI > 3s？
  ├─ 索引缺：补索引
  └─ Weekly Brief 慢：Suspense fallback 模板 · LLM 异步填充

Day 5 晚 · Pulse 事务有 bug？
  ├─ 小 bug：修到通
  └─ 大坑：禁用现场 Apply，改演预置 applied Pulse + audit/evidence；不要实现非原子写路径冒充生产方案

Day 6 晚 · PWA 装不上？
  ├─ manifest 问题：修
  └─ 全炸：Demo 删 "Add to Dock" 段

Day 6 晚 · Push 到不了？
  ├─ VAPID 配错：修
  └─ 到不了：Demo 用 in-app notification 顶替

Day 7 早 · 生产部署炸？
  └─ Plan B 4K 录屏 + 解说
```

**总原则：每天让当前版本可演示，不追求完美但不能演。**

---

## 9. Git / 分支策略（7 天简化）

- 单一 `main`
- Feature branch：`feat/<slice>/<short>`（`feat/migration/wizard-step2`）
- **PR 无需等 CI**：本地 `pnpm lint && pnpm check-types` 过即可 push；`check-types` 走 `tsgo`，不跑 `tsc`
- Merge：squash
- Commit：每自然任务一个 commit（Conventional Commits）
- Hotfix：直接 push main（7 天特例）
- **改契约的 PR 必须两人都 approve**

---

## 10. 备份 / 回滚

| 场景 | 动作 |
|---|---|
| 演示前一晚 main 坏了 | `wrangler rollback` · `git revert` |
| demo 数据被误删 | `pnpm db:seed:demo --force`（幂等必备） |
| 某切片当场演挂 | 切 Plan B 录屏 |
| 现场 WiFi 挂 | Plan B 本地 tunnel / 录屏 / 热点 |

---

## 11. 每天必测"最小闭环 Sanity"

每晚 18:00 sync 前各自跑一次本地 5 分钟：

```
1. pnpm db:migrate:local && pnpm db:seed:demo
2. pnpm dev
3. 登录 → Dashboard → 打开 Evidence → 改 1 条 status
4. 走一遍自己切片端到端
5. 能走通 → 当晚代码可 push
6. 走不通 → 不 push，加班修
```

---

## 12. 7 天交付物清单

| 交付 | 形态 | D7 必须 |
|---|---|---|
| Production Worker URL | `https://*.workers.dev` 或自定义域 | ✅ |
| 源码仓库 | GitHub | ✅ README setup ≤ 10 min |
| Demo seed 脚本 | `pnpm db:seed:demo` | ✅ 幂等 |
| Demo 视频 | MP4 4K | ✅ 6 分钟 |
| Pitch deck | PDF | ✅ 6 页 |
| Plan B 录屏 | MP4 | ✅ |
| 真实 CPA 口证 | 30s 视频 | 能拿最好；stand-in 可 |
| WISP | 1 页 PDF | ✅ Demo draft；5 页 v1.0 在真实试点 / 4 周 MVP 前补齐 |
| 架构文档 | `docs/Dev File/` 组 | ✅ 已完成 |

---

## 13. 7 天之外（Phase 1 第一批）

按 PRD §14.2 排序：

1. **Overlay Engine 重构**（Day 5 的 "Pulse 直接 UPDATE" → 独立 `exception_rule` + `obligation_exception_application`）
2. **Team RBAC 完整**（better-auth Access Control plugin 开启校验 + 多席位 UI）
3. **Client Readiness Portal**（§6B · 延续 Demo 跨设备互动叙事）
4. **Audit-Ready Evidence Package**（§6C）
5. **Stripe · ICS · 更多 SEO 公开页（独立 Astro 子站）**

---

## 14. 最后的纪律

1. **不在 Day 4 以后加新 feature**，只修 bug
2. **Demo 能跑 > 代码漂亮**；7 天后重构窗口多得是
3. **卡超过 4 小时 → 必须求助**
4. **每天结束必须 push**（互为 backup）
5. **晚上睡 6 小时**
6. **契约不随便改 · 切片不随便抢 · AI 生成的代码要自己读一遍**

---

## 15. 为什么"切片分工"对 2 人 AI 辅助开发最优

| 维度 | 前后端分工 | 垂直切片（本手册） |
|---|---|---|
| 互相等待 | 高（前端等 API / 后端等需求） | 低（契约定好后各自端到端） |
| AI 辅助放大效果 | 一般 | 强（单人 full-stack 全程 AI 陪跑） |
| Demo 归属清晰 | 模糊 | 清晰（Alice 负责 Migration + Pulse 两大叙事段） |
| 上下文切换成本 | 高 | 低（一切片一天专注） |
| 卡点隔离 | 一方卡全队卡 | 切片内卡不影响对方 |
| Commit 冲突 | 高（layout / shared 经常碰） | 低（切片目录天然隔离） |

**代价：两人都得能写 SQL / React / Drizzle / oRPC procedure，单人技术栈必须够广。**

---

**祝冲刺愉快。Ship it. Show the work.**
