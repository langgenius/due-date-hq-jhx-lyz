# 09 · 7-Day Sprint Playbook · 2 人 AI 辅助开发冲刺手册

> 适用场景：**2 位开发者 · 7 个自然日 · 两人都 AI 辅助开发 · 目标 Demo-Ready 闭环**
> 前置阅读：本 Dev File 00 ~ 08（尤其 §00 三条铁律 + §08 项目结构）
> 核心判断：PRD v2.0 是"build-complete 目标形态"，Dev File Phase 0 是 4 周口径；**7 天只能做 Demo 闭环 + 可信度信号**
>
> **本手册采用"垂直切片"分工模式**：不分前后端，每人在自己负责的 feature 上从 DB schema → Service → Server Action → UI → Test 端到端全栈。AI 辅助开发放大了单人全栈能力，垂直切片最大化两人并行度、最小化互相阻塞。

---

## 1. 第一件事：范围冻结（Scope Freeze）

### 1.1 7 天必须做（Demo 闭环）

对齐 PRD §15.3 Demo Script 的 6 分钟叙事链：

| 叙事段 | 最小可演功能 | PRD 映射 |
|---|---|---|
| 0:00–0:30 真实用户口证 | 录屏 + 公开 URL 可访问 | §15.3.1 |
| 0:30–1:30 Migration + Live Genesis | Paste CSV → AI Mapper → Default Matrix → Import 事务 → 顶栏 $ 滚动 | §6A + §7.5.6 |
| 1:30–3:00 Monday Triage | Dashboard 三段 Tab + Penalty Radar + Smart Priority + Evidence Mode | §5.1 + §6.4 + §7.5 |
| 3:00–4:00 Pulse Banner + Batch Apply | 预置 2 条 Pulse + 匹配客户 + 一键改 due_date + Audit 记录 | §6.3 |
| 4:00–5:00 Glass-Box | AI Weekly Brief 带 [n] citation + 点击打开 Evidence | §6.2 |
| 5:00–6:00 Pay-intent + PWA | `$49/mo` 点击 + Add-to-Dock 现场演示 | §7.8.1 + §15.3.6 |

### 1.2 7 天**不做**（Phase 1 再说）

| PRD 章节 | 7 天不做 | 为什么 |
|---|---|---|
| §3.6 Team / RBAC | ✂ | 4+ 人日工程量，Demo 用单 Owner 账号即可 |
| §6B Client Readiness Portal | ✂（stretch） | 独立路由 + magic link 系统 2 人日；非闭环刚需 |
| §6C Audit-Ready Package | ✂ | ZIP 签名 + worker 2 人日；Phase 1 做 |
| §6D Rules-as-Asset 完整 overlay | ✂ 简化 | Pulse 直接 UPDATE `current_due_date` + evidence_link 记录；不做独立 ExceptionRule 实体 |
| §6A.11 Onboarding AI Agent | ✂ | 传统 4 步向导即可通 S2 |
| §6.6 Ask DueDateHQ | ✂（stretch） | Cmd-K 留占位 UI 即可 |
| §7.8.2 macOS Menu Bar | ✂ | Phase 2 |
| §P0-21 Email Reminders 阶梯 | ✂ | 仅做 Pulse Apply 触发一封摘要邮件 |
| §Auth MFA | ✂ | 仅 magic link |
| §50 州骨架 | ✂ 简化 | 仅 **Federal + CA + NY** 3 辖区 seed |
| §ICS 日历订阅 | ✂ | Phase 1 |
| §Stripe | ✂ | 只做 `[I'd pay $49/mo]` 按钮 + 事件 |

### 1.3 冻结原则

- **任何新功能，一律下个 Phase。** 对齐 PRD §18.5
- 范围冻结时间：**D1 早晨 09:00**，此后只修 bug 不加 feature
- 唯一例外：Demo 现场反馈导致"这个不做 Demo 就讲不通"的必需项（需两人 10 秒达成一致）

---

## 2. 分工哲学：垂直切片 + 接口先行

### 2.1 为什么不分前后端

两人都 AI 辅助开发的情况下：
- **AI 放大了单人全栈能力**：写 Drizzle schema / 写 Server Action / 写 React 组件，对 AI 而言难度差不多
- **分前后端会制造虚假依赖**：前端等后端 API 出来才能动 → 串行；后端等前端提需求才能动 → 串行
- **垂直切片让两人彻底解耦**：各自拥有一个完整 feature，从数据库到像素

### 2.2 切片定义

每个"切片"= 一个独立可演示的 feature 单元，包含：

```
db/schema/<slice>.ts          (如需新增字段)
db/seed/<slice>.ts            (如需种子)
modules/<slice>/              (Service + Repo + Action + Schema)
components/features/<slice>/  (UI)
app/(app)/[firmSlug]/<slice>/ (路由)
prompts/<slice>/*.md          (如涉及 AI)
tests/**/<slice>.test.ts
```

### 2.3 两人的切片归属（总览）

| Dev | 负责切片 | Demo 叙事归属 |
|---|---|---|
| **Alice** | 🅐 Migration Copilot · 🅑 Pulse 全链路 · 🅒 PWA + Push | 0:30–1:30 + 3:00–4:00 + 5:30–6:00 |
| **Bob** | 🅓 Dashboard + Penalty Radar · 🅔 Workboard + Client CRUD · 🅕 Evidence Mode + Cmd-K + Demo Polish | 1:30–3:00 + 4:00–5:00 |

两人切片的边界在 §2.5"契约清单"。Day 1–2 是**共同地基**（两人必须协作把 schema / UI 原语 / Auth 搭好，不然切片无法并行）。

### 2.4 契约先行（Day 1 晚就要定好）

两人垂直切片能并行的前提：**所有跨切片接口 Day 1 晚 18:00 就要冻结**。

下面列出的 8 个接口是不可谈判的冻结对象：

```typescript
// lib/schemas/client.ts （Bob 切片 🅔 暴露）
export const ClientSchema = z.object({ ... });
export type ClientInput = z.infer<typeof ClientSchema>;

// lib/schemas/obligation.ts （Bob 切片 🅔 暴露）
export const ObligationRowSchema = z.object({ ... });

// lib/schemas/pulse.ts （Alice 切片 🅑 暴露）
export const PulseExtractionSchema = z.object({ ... });

// lib/schemas/migration.ts （Alice 切片 🅐 暴露）
export const MigrationBatchSchema = z.object({ ... });

// modules/audit/writer.ts （两人共用，Bob 维护）
export async function writeAudit(input: AuditInput, tx?): Promise<void>;

// modules/evidence/writer.ts （两人共用，Bob 维护）
export async function writeEvidence(input: EvidenceInput, tx?): Promise<string>;

// modules/ai/index.ts （两人共用，Alice 维护 orchestrator 接口）
export async function runPromptJson<T>(opts: PromptOpts): Promise<T>;
export async function runPromptStream(opts: PromptOpts): ReadableStream;

// auth/session.ts （两人共用，Alice 维护）
export async function requireSession(): Promise<AuthedSession>;
export function withFirmContext<T>(firmId, fn): Promise<T>;
```

**契约纪律：**
- Day 1 晚定好签名 → Day 2 先各自写 mock 实现（可跑通但内部不完整）
- Day 3 起两人并行，改了上面任何函数签名必须 Slack 通告 + 对方 review
- 如发现契约缺字段 → 先加 optional 字段，不回头改

### 2.5 切片边界清单（谁负责 / 谁消费）

| 模块 | 维护人 | 被谁消费 |
|---|---|---|
| `db/schema/*`（所有表） | Day 1 两人共建，之后谁加谁负责 | 所有人 |
| `modules/auth/` | Alice（Day 2） | 所有 Server Action |
| `modules/clients/` | Bob（Day 3） | Alice Migration · 自己的 Workboard/Dashboard |
| `modules/rules/` | Alice（Day 1 seed + Day 3 生成 service） | Bob Dashboard 展示 |
| `modules/obligations/` | Bob（Day 3） | Alice Migration 触发生成 · 自己 Dashboard/Workboard |
| `modules/penalty/` | Bob（Day 4） | 自己 Dashboard |
| `modules/priority/` | Bob（Day 4） | 自己 Dashboard |
| `modules/migration/` | Alice（Day 3） | 自己 Wizard UI |
| `modules/ai/` | Alice（Day 2-3） | Alice Pulse · Bob Brief |
| `modules/pulse/` | Alice（Day 4-5） | 自己 Banner + Drawer |
| `modules/audit/` | Bob（Day 2，所有人写入） | Alice Pulse · 自己 Audit Log |
| `modules/evidence/` | Bob（Day 2，所有人写入） | 全局 Evidence Mode |
| `modules/push/` | Alice（Day 6） | 自己 Pulse fanout |
| `modules/notifications/email-outbox/` | Alice（Day 5） | 自己 Pulse |
| `components/ui/` | Day 1 两人共建（shadcn init） | 所有 |
| `components/primitives/` | Bob（Day 1） | 所有 |
| `components/features/migration-wizard/` | Alice | — |
| `components/features/pulse-*/` | Alice | — |
| `components/features/dashboard/*` | Bob | — |
| `components/features/workboard/*` | Bob | — |
| `components/patterns/evidence-drawer/` | Bob | Alice Pulse 调用打开 |
| `components/patterns/cmdk/` | Bob | — |

---

## 3. Day 0（前一天晚上 · 1 小时）· 共同准备

**目的：** 7 天不再卡在账号开通 / API key。

### 3.1 必须完成的前置清单（对齐 §01.5）

| 项 | 负责人 | 说明 |
|---|---|---|
| GitHub org + 空 repo `duedatehq` | Alice | private |
| Vercel project 挂 repo | Bob | preview + prod |
| Neon 账号 + 3 个 branch：`main` / `staging` / `demo` | Alice | `preview` 由 CI 自动创建 |
| OpenAI 账号 + ZDR org + API key | Alice | **必须 ZDR**（§06.5.3） |
| Resend 账号 + 域名验证 | Bob | DNS 验证 24h，当晚先动 |
| Upstash Redis REST | Alice | |
| Cloudflare R2 bucket × 3 | Bob | pdf / migration / audit |
| Langfuse 账号 | Alice | |
| Sentry 账号 | Bob | |
| Inngest 账号 + key | Alice | |
| VAPID key（`web-push generate-vapid-keys`） | Alice | |
| 域名（可选）或 Vercel 免费域名 | 谁快谁来 | 可选 |

### 3.2 环境变量同步

两人用 1Password / Bitwarden shared vault 同步 `.env.local`，**不要用 Slack / 微信发明文密钥**。

---

## 4. Day-by-Day 作战计划

> 每日结构：
> - 当日 Definition of Done
> - 两人任务清单（2h 粒度）
> - 晚 18:00 集成联调（演示给对方看）

### 4.1 Day 1（周六）· 共同地基

**Definition of Done：**
- 两人都能本地 `pnpm dev` 跑起来
- PR preview 可访问
- DB 有 10+ 张核心表
- Federal + CA + NY 的 ~20 条 rules seeded
- **Day 1 晚 18:00：§2.4 的 8 个接口契约签名冻结**

**Alice · 平台基础 + DB**

| 时段 | 任务 |
|---|---|
| 09:00–10:00 | 范围冻结 review · Day 0 资源核对 · 契约大致方向口头对齐 |
| 10:00–12:00 | `pnpm create next-app` · 安装依赖（§01.4）· Drizzle 配置 · Neon 连接 · `.env.example` 完整化 · 仓库首次 push + Vercel preview 跑通 |
| 13:00–15:00 | Schema Part 1：`firm` / `user` / `user_firm_membership` / `client` · Migration 跑 Neon main branch 成功 |
| 15:00–17:00 | Schema Part 2：`obligation_rule` / `obligation_instance` / `evidence_link` / `audit_event` / `ai_output` / `llm_log` · 核心索引（§03.3） |
| 17:00–18:00 | Seed 脚本：`db/seed/rules.{federal,california,newyork}.ts`（共 ~20 条 rule · 每条带 `source_url + verbatim_quote + verified_by + verified_at`） |
| 18:00–19:00 | **与 Bob 对齐 §2.4 契约**：两人一起把 8 个接口签名写进 `lib/schemas/*` 和对应 `modules/*/index.ts`（函数签名 + mock throw `Error("not implemented")`） |

**Bob · UI 基础 + 原语**

| 时段 | 任务 |
|---|---|
| 09:00–10:00 | 与 Alice 一起 review + 资源 |
| 10:00–12:00 | Tailwind token（Indigo / Emerald / Amber / Ruby）· 字体（Inter + JetBrains Mono）· Theme provider + darkmode · shadcn init + 安装 button / input / card / dropdown / dialog / toast / table / tabs / drawer / popover |
| 13:00–15:00 | App Router 骨架：`(marketing)` / `(auth)` / `(app)/[firmSlug]` layout · 侧栏 + 顶栏占位 · Storybook 配置 |
| 15:00–17:00 | 原语组件：`TriageCard` / `DaysBadge` / `PenaltyPill` / `SourceBadge` / `AIHighlight` / `EvidenceChip` / `StatusDropdown`（纯视觉 · mock props）+ Storybook stories |
| 17:00–18:00 | 登录页 UI / Dashboard 空态 / Workboard 空态 骨架 |
| 18:00–19:00 | 与 Alice 对齐契约 |

**Day 1 晚 18:00 集成点：**
两人一起把契约文件（`lib/schemas/*`、`modules/*/index.ts` 签名）写好 → Commit 带 tag `day1-contracts-frozen` → 此后两人可以各自 AI 辅助开发不必互等。

---

### 4.2 Day 2（周日）· 契约实装 + 应用地基

**Definition of Done：**
- Alice 的 Auth 跑通（真实邮箱收 magic link 登录）
- Alice 的 `withFirmContext` / RLS 生效
- Bob 的 Workboard 空态 + Client 新建表单能打开（即使后端还不通也要 UI 可走）
- `modules/audit/writer.ts` 和 `modules/evidence/writer.ts` 有可用实现（简单版）
- `modules/ai/index.ts` 的 `runPromptJson` 有 LiteLLM 基础实现

**Alice · 切片共享设施**

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | Auth.js Magic Link 真实对接 Resend · `auth()` helper · `requireSession` · 登录后跳 `/<firm_slug>/dashboard` |
| 11:00–13:00 | `firmContext` AsyncLocalStorage + `withFirmContext` wrapper · RLS policy SQL 上线（client / obligation / evidence_link / audit_event） |
| 14:00–16:00 | `modules/ai/litellm.ts` LiteLLM client · `runPromptJson`（Zod 校验输出）· `runPromptStream`（SSE）· Langfuse trace · `llm_logs` 落库 |
| 16:00–18:00 | `modules/ai/retriever.ts`（pgvector top-k） · `modules/ai/guard.ts`（glassBoxGuard 5 道闸） · `modules/ai/pii.ts`（PII redact 占位符） |
| 18:00–19:00 | Daily Sync + demo |

**Bob · 应用层骨架 + 共享写入器**

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | 登录 Flow UI（邮箱 → check email → magic link 回到 App）· 登录态 header |
| 11:00–13:00 | `modules/audit/writer.ts` 真实实现 · `modules/evidence/writer.ts` 真实实现 · 单元测试各 3 条 |
| 14:00–16:00 | `components/patterns/cmdk/` 基础壳（Search tab） · `components/patterns/evidence-drawer/` 全局 drawer 壳 + Zustand `evidenceTarget` · `E` 键打开 |
| 16:00–18:00 | 主 App layout 完善：侧栏 Nav + 顶栏 PenaltyRadarHero 占位 + `<DrawerStack />` 容器 · `/dashboard` / `/workboard` / `/clients` / `/alerts` / `/audit` 空态页 |
| 18:00–19:00 | Daily Sync + demo |

**Day 2 晚 18:00 集成：**
- Alice 用真实邮箱登录 → 跳到 Bob 的 Dashboard 空态页
- Alice 在 psql 里手动 `INSERT client` → Bob 的 `/clients` 列表看到（验证 RLS 正常）
- Alice 跑一次 `runPromptJson({ prompt: 'return { hello: "world" }' })` → 看到 Langfuse trace

---

### 4.3 Day 3（周一）· 切片并行启动

从 Day 3 开始两人进入"独立切片并行模式"，互相不再等接口。

#### 🅐 Alice · Slice Migration Copilot（全栈）

**Definition of Done：**
- Paste TaxDome-style / messy / 无 tax_types 三种 CSV 都能导入
- Live Genesis 动画正常 · 顶栏 $ 滚动
- 导入事务原子 · 单行失败不阻塞

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | Schema：`migration_batch / mapping / normalization / error` · Seed Default Tax Types Matrix（§6A.5）YAML |
| 11:00–13:00 | `modules/migration/mapper.ts` · prompt `prompts/migration_mapper.v1.md` · EIN 正则二次校验 · 写 `MigrationMapping[]` |
| 14:00–16:00 | `modules/migration/normalize.ts` · 字典优先（state / entity / importance）+ LLM 兜底 · 置信度 < 0.8 标 `needs_review` · 写 `evidence_link(source_type='ai_migration_normalize')` |
| 16:00–18:00 | `modules/migration/import.ts` 单事务 · 调用 `modules/rules/compute` 生成 obligations · 写 audit/evidence · Revert 接口（只写 `reverted_at`，UI 按钮可简化） |
| 18:00–19:00 | Daily Sync · 三种 CSV 冒烟 |

**UI（同一天晚上启动）：**

| 时段 | 任务 |
|---|---|
| 19:00–21:00 | `components/features/migration-wizard/` Stepper + Step 1 Intake（paste + file drop）· URL state 记当前步 |

（Wizard 剩余 Step 2/3/4 UI 在 Day 4 上午继续）

#### 🅔 Bob · Slice Client + Workboard（全栈）

**Definition of Done：**
- 能在 UI 手动创建 client
- Client 创建后规则引擎自动生成 obligations 出现在 Workboard
- Workboard 筛选 + 排序 + 行内 status 改 + 键盘快捷键
- Obligation Detail Drawer 打开有 Evidence / Audit / Status 三 Tab

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | `modules/clients/{service,repo,schema,actions}.ts` · CRUD 全链 |
| 11:00–13:00 | `modules/rules/compute.ts`：`rule.due_date_logic` + `client` → 计算 `originalDueDate` · `modules/obligations/generate.ts`：给一位 client 生成全年 instances（含 Default Matrix 兜底） |
| 14:00–16:00 | `/clients` 列表页 · Client 新建页 · 创建后触发 obligations 生成 · 回到 list 看到客户 |
| 16:00–18:00 | Workboard 真实数据：TanStack Table + 10 列 + State/Status/Form 筛选栏 · 服务端分页 · URL state |
| 18:00–19:00 | Daily Sync |
| 19:00–21:00 | `StatusDropdown` 行内改 · Optimistic UI · 5s Undo toast · 键盘 `F/X/I/W` + `J/K` 导航 · **Obligation Detail Drawer** 壳（暂占位，Evidence/Audit 两 Tab 留空） |

**Day 3 晚 18:00 集成：**
- Bob 手动创建一位 `LLC × CA` 客户 → Workboard 看到 2–3 条 obligations
- Alice 粘贴 30 行 CSV → 尽管 UI wizard 还没完但后端 import 跑通，DB 里能看到 30 客户 + 120 obligations
- 关键验证：**两人的切片今天完全没互相阻塞**

---

### 4.4 Day 4（周二）· Dashboard + Pulse 前半

#### 🅐 Alice · Slice Migration UI 收尾 + Slice Pulse 启动

**Definition of Done（Migration）：**
- Wizard 4 步完整可走
- Live Genesis 动画触发 · 顶栏 $ 滚动粒子

**Definition of Done（Pulse 前半）：**
- Seed 2 条 approved Pulse
- Pulse Banner 在 Dashboard 顶部出现
- Pulse Detail Drawer 展示 verbatim quote + affected clients 列表

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | Wizard Step 2 Mapping table（置信度高亮 + re-run AI） |
| 11:00–13:00 | Wizard Step 3 Normalize + Default Matrix 勾选块 + 冲突处理 |
| 14:00–15:00 | Wizard Step 4 Preview + **Live Genesis 动画**（`react-odometerjs` + CSS 粒子） |
| 15:00–17:00 | Schema: `pulse / pulse_application` · Seed 2 条 demo Pulse（`IRS CA storm relief` + `NY PTET reminder`，raw_html snapshot 存 R2）· `modules/pulse/match.ts` 四维 SQL |
| 17:00–18:00 | `components/features/pulse-banner/` Dashboard layer 2 · "Last checked X min ago" 信号 · `components/features/pulse-detail-drawer/` 前半（AI summary + verbatim + affected table） |
| 18:00–19:00 | Daily Sync |

#### 🅓 Bob · Slice Dashboard 全栈

**Definition of Done：**
- Dashboard 首屏 TTI < 2s（Vercel prod）
- Penalty Radar 顶栏是服务端预聚合 · Odometer 滚动
- Triage Tabs（This Week / This Month / Long-term）count + $ 正确
- Weekly Brief 流式 + 带 `[n]` citation
- Obligation Detail Drawer 的 Evidence Mode 可点

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | `modules/penalty/compute.ts`（§7.5.2 纯函数 · Federal + CA · 单元测试）· Obligation 生成时写 `estimated_exposure_usd` |
| 11:00–13:00 | `modules/priority/score.ts`（§6.4.2 纯函数 + 因子分解 · 单元测试）· Smart Priority 排序 API |
| 14:00–15:00 | `db/seed/rule_chunks.ts` embed + pgvector 写入 · 通过 Alice 的 `retriever.ts` 跑通 top-k |
| 15:00–17:00 | `modules/ai/brief.ts` · `prompts/weekly_brief.v1.md` · `glassBoxGuard` 校验 · 流式 API · `AiOutput` 落库 · Redis 每 firm 每天 1 次缓存 |
| 17:00–18:00 | `components/features/dashboard/penalty-radar-hero.tsx`（76px JetBrains Mono + Odometer + 趋势箭头 + Sparkline）· `triage-tabs.tsx` · `weekly-brief.tsx`（Suspense 流式） |
| 18:00–19:00 | Daily Sync |
| 19:00–21:00 | Obligation Detail Drawer 完成 · Evidence Mode 全局抽屉完成（任意 `[n]` 可点 → 打开看 source + verbatim + verified_by） |

**Day 4 晚 18:00 集成：**
- Bob 打开生产 Dashboard：看到 `$19,200 at risk this week` 顶栏 + 三 tab + Weekly Brief 一句句流式带 `[1][2][3]`
- 点 `[1]` → 打开 Evidence 抽屉看到 source + verbatim quote
- Alice 的 Pulse Banner 在 Bob 的 Dashboard 顶部已经出现（两人切片首次可视集成）
- 点 Banner Review → 抽屉展示 12 位 LA 客户（Batch Apply 按钮在 Day 5 才有效）

---

### 4.5 Day 5（周三）· Pulse 闭环 + Evidence 加深

#### 🅐 Alice · Slice Pulse 后半 + 邮件 + Audit Log 页

**Definition of Done：**
- Batch Apply 事务原子 · UPDATE obligation.current_due_date + evidence_link + audit + email_outbox
- Resend 邮件真实发出 · 含受影响客户列表 + source URL
- Audit Log `/audit` 页可查看

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–12:00 | `modules/pulse/apply.ts` 事务：advisory lock + UPDATE obligations + 写 evidence_link + 写 audit_event + 写 email_outbox · 24h Revert 接口 |
| 13:00–15:00 | React Email 模板 `emails/pulse-digest.tsx` · Resend 对接 · `modules/notifications/email-outbox-worker.ts` Inngest 每 1 分钟 flush |
| 15:00–17:00 | Pulse Detail Drawer 后半：Batch Apply 按钮 + confirm modal + Optimistic UI（顶栏 $ 下落 + 绿色 pulse halo） |
| 17:00–18:00 | `/audit` 页：时间线列表 + 过滤 actor / action · 行点击展开 before/after diff |
| 18:00–19:00 | Daily Sync |

#### 🅕 Bob · Slice Polish: Penalty 深化 + Priority 解释 + TriageCard 因子 + Alerts 历史

**Definition of Done：**
- Obligation Detail 的 Penalty breakdown（FTF / FTP / Interest / Per-partner）完整
- Smart Priority hover ✦ 展开因子分解
- TriageCard 展示"Why top rank?"
- `/alerts` 页（Pulse 历史）左右布局

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | Penalty breakdown 前端组件 · Evidence Mode 展开公式 + 出处 + assumptions |
| 11:00–13:00 | Priority 因子徽章 hover 展开 · `modules/ai/priority-explain.ts`（LLM 仅在 top-5 差 < 5% 时兜底） |
| 14:00–16:00 | **联调 Pulse Impact**：Alice 的 Batch Apply 完成后，Bob 的 Dashboard 顶栏 $ 真实下落 · TriageCard 的 due_date 变化 · Evidence Chain 追加 Pulse event |
| 16:00–18:00 | `/alerts` 页：左 Pulse feed + 右 Pulse Detail（复用 Alice 的 Drawer 组件） |
| 18:00–19:00 | Daily Sync |
| 19:00–21:00 | TriageCard 视觉完善（severity 色条 + status dropdown 右上 + source badge 底部） |

**Day 5 晚 18:00 集成（重要）：**
- 登录 Dashboard → Pulse Banner 红色脉冲 "IRS CA storm relief → 12 clients affected"
- 点 Review → 12 位 LA 客户 → **Apply** → 顶栏 $ **减少 $6,500** + 绿色 pulse 动画 + Toast
- 打开 Resend dashboard → 看到 real email 发出
- 打开 `/audit` → 看到 12 条 `pulse.applied` 事件
- 打开任一客户 Evidence Chain → 追加了 "Pulse applied" 一行

---

### 4.6 Day 6（周四）· PWA + Demo Seed + Polish + Pay-intent

#### 🅒 Alice · Slice PWA + Push

**Definition of Done：**
- PWA Add-to-Dock（macOS Safari/Chrome）独立窗口
- Add-to-Home（iPhone）全屏启动
- Web Push 真实到达手机（Pulse Apply 触发）
- App Badge 显示 overdue count

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | `app/manifest.ts` · `public/sw.js`（Workbox 生成 + push handler + notificationclick）· `<link rel="manifest">` |
| 11:00–13:00 | `modules/push/subscribe.ts` · `modules/push/send.ts`（VAPID 签名 · 410/404 revoke）· `/api/push/subscribe` |
| 14:00–16:00 | Pulse Apply 后触发 `modules/push/fanout.ts` · Settings Notifications 页（订阅状态 + Enable 按钮） |
| 16:00–17:00 | App Badge Integration（`navigator.setAppBadge(overdueCount)`） |
| 17:00–18:00 | Install prompt 时机（第 3 次访问 + Migration 完成后 inline 提示） |
| 18:00–19:00 | Daily Sync · 两人都 Add-to-Dock 一次 |

#### 🅕 Bob · Slice Cmd-K + Demo Seed + Pay-intent + 视觉收口

**Definition of Done：**
- `pnpm db:seed:demo` 幂等脚本：Sarah firm + 30 clients + 150 obligations + 2 Pulse + cached Weekly Brief
- Cmd-K 命令面板（Search + Navigate，Ask 占位 "coming soon"）
- `[I'd pay $49/mo]` 按钮 + PostHog 事件 + audit
- Zero Week confetti · Dark mode 微调 · 响应式 4 断点

| 时段 | 任务 |
|---|---|
| 09:00–09:10 | Daily Sync |
| 09:10–11:00 | **Demo seed 脚本** · Sarah / 30 clients（12 LA）/ 150 obligations / 2 pulses / AI Brief 预生成 · 幂等 |
| 11:00–13:00 | Cmd-K 搜索 + 跳转 · `?` 快捷键面板 · 全局键盘导航 |
| 14:00–15:00 | Pay-intent 按钮（Dashboard + Settings 都有）· 点击写 `event` 表 + PostHog · 感谢 toast |
| 15:00–17:00 | 视觉收口：confetti（`canvas-confetti`）· Smart Priority ✦ hover 动画 · Loading skeleton · Dark mode 对比度修 · responsive 4 断点（iPhone 13 / iPad / MacBook 13" / 27"） |
| 17:00–18:00 | 公开页 `/` 首页 + `/pulse` Feed（SEO 摆样子，不需要功能完整） |
| 18:00–19:00 | Daily Sync |

**Day 6 晚 18:00 集成：**
- 两人各从手机 Add-to-Home → 截图
- Bob 在 demo firm 手动 "approve" Alice 的第三条 mock pulse → Alice 手机 2 秒内收到 push 弹窗 → 点击跳转到 Banner 已展开
- 按 Cmd-K → 输入 `acme` → 下拉 client 列表 → 回车跳 Detail

---

### 4.7 Day 7（周五）· 冻结 + 部署 + 排练

**上午 09:00–12:00 · 联合冻结**

| 时段 | 两人一起 |
|---|---|
| 09:00–09:30 | Commit frozen · main 只接受 P0 blocker hotfix |
| 09:30–11:00 | 完整跑一遍 Demo 脚本（PRD §15.3）· 每一段掐表 · 记录卡点清单 |
| 11:00–12:00 | 两人分头修 top 5 卡点 |

**下午 12:00–17:00**

| 时段 | Alice | Bob |
|---|---|---|
| 12:00–14:00 | 生产部署 · seed:demo · Inngest prod · 冒烟 | 同上 + 确认 PWA 在 HTTPS prod 正常 · 公开页内容校对 |
| 14:00–16:00 | Plan B 断网预案：4K 全流程录屏 · 预置脚本化 Pulse 触发 | Pitch Deck 6 页（§15.4） · 真实 Sarah 视频或 stand-in 剪辑 |
| 16:00–17:00 | 合并共同排练 | 同 |

**晚 17:00–21:00 · 排练**

| 时段 | 内容 |
|---|---|
| 17:00–18:00 | 第一次全流程（录屏作 Plan B） |
| 18:00–19:00 | 吃饭 + 卡点清单 |
| 19:00–20:00 | 第二次（修完卡点） |
| 20:00–21:00 | 最后一次 · 冻结 · 关电脑 |

---

## 5. 任务拆分粒度（建议）

### 5.1 GitHub Issue 标签体系

```
type/feat · type/fix · type/chore · type/docs
slice/migration · slice/pulse · slice/dashboard · slice/workboard · slice/pwa · slice/infra
owner/alice · owner/bob
priority/p0-demo · priority/p1-stretch
day/1 ~ day/7
```

**原则：** 每个 issue 必须同时打 `slice/*` 和 `owner/*` 标签，方便一眼看"谁在做什么切片"。

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
- [ ] 否（对方无需 review）
- [ ] 是（已 Slack 告知 + 对方已确认）

## 测试怎么验？
1. 

## 截图 / GIF（UI PR 必须）
```

---

## 6. Definition of Done（按 Slice）

| Slice | DoD |
|---|---|
| **Auth + 基础（Alice）** | 邮箱收 magic link · 7 天 session · RLS 生效（SELECT 被 firm_id 过滤） |
| **Migration（Alice）** | 3 份 CSV（整齐 / 混乱 / 无 tax_types）都能导入 · 单行错误不阻塞 · Live Genesis 动画 · Undo 按钮 UI 存在 |
| **Pulse（Alice）** | 2 demo pulse 在 Banner · Drawer 显示 verbatim + 12 affected · Apply 后顶栏 $ 减少 · Resend 真邮件 · Audit 多 12 条 |
| **PWA（Alice）** | 地址栏 Install · Add-to-Dock 独立窗口 · 手机 Add-to-Home 全屏 · Pulse Apply 触发 Push |
| **Client + Workboard（Bob）** | 创建 client 自动生成 obligations · Workboard 1000 行虚拟化不卡 · 三维筛选生效 · 行内 status 5s Undo · J/K 导航 |
| **Dashboard（Bob）** | 三 tab count 正确 · Penalty 顶栏 = DB 聚合 · Weekly Brief 带 ≥ 2 个 [n] · Evidence 抽屉可点 |
| **Polish（Bob）** | demo seed 幂等 · Cmd-K 搜索可用 · Pay-intent 写事件 · confetti 在 Zero Week · 响应式过 4 断点 |

---

## 7. Daily Sync Ritual（两人协作）

### 7.1 早 09:00（10 分钟，站立）

```
1. 昨天完成了什么？（各 2 分钟）
2. 今天切片的目标？（各 2 分钟）
3. 今天有没有改契约的计划？（有 → 提前约时间一起定）
4. 范围漂移预警：做不完要砍还是换？
```

### 7.2 晚 18:00（10–15 分钟，坐下）

```
1. 各自演示今天切片的 DoD（共 5 分钟）
2. 明天是否需要跨切片联调？（定时间）
3. 是否需要临时调整范围？
4. 是否需要互相 rubber-duck 一个卡点？
```

**Sync 不超时规则：** 超 15 分钟必须停下来改 async（Slack / PR 评论）。

### 7.3 契约变更协议

- 改 §2.4 任一接口签名 → Slack `@对方` + 贴 diff 链接
- 对方 5 分钟内必须 thumb up 或回复异议
- **不要 push 未告知的契约变更，这会让对方整天白干**

---

## 8. 如果落后怎么办（Decision Tree）

```
Day 3 晚 · Alice 的 Migration 没跑通？
  ├─ 差 < 2h：熬夜（Migration 是 Demo 核心）
  └─ 差 ≥ 2h：保留 Migration，AI Brief 降级为预生成模板
  
Day 3 晚 · Bob 的 Client/Workboard 没跑通？
  ├─ Client CRUD 没通：当晚补（Dashboard 依赖它）
  └─ Workboard 筛选不完：保留基础表格，筛选降级为 URL state 手写（不做 < 1s SLA）

Day 4 晚 · Dashboard TTI > 3s？
  ├─ 索引缺：补索引
  └─ Weekly Brief 慢：Suspense fallback 模板 · LLM 异步填充

Day 5 晚 · Pulse 事务有 bug？
  ├─ 小 bug：修到通
  └─ 大坑：改为"更新 current_due_date + 单独写 audit"，不走统一事务（Demo 看不出）

Day 6 晚 · PWA 装不上？
  ├─ Safari manifest 问题：先保 Chrome + iPhone
  └─ 全炸：Demo 删 "Add to Dock" 段 · Phase 1 再做

Day 6 晚 · Push 到不了？
  ├─ VAPID 配置错：修
  └─ 到不了：Demo 用"In-app notification + 假装 push"顶上

Day 7 早 · 生产部署炸？
  ├─ 走 cloudflared / ngrok tunnel
  └─ Plan B 4K 录屏 + 解说
```

**总原则：每一天都要让"当前版本可演示"，不追求"完美但不能演"。**

---

## 9. Git 与分支策略（7 天简化版）

- 单一 `main` 分支
- Feature branches：`feat/<slice>/<short>`（例：`feat/migration/wizard-step2`）
- **PR 无需等 CI**：本地 `pnpm lint && pnpm typecheck` 过即可 push
- Merge 策略：squash
- Commit 粒度：每个自然任务一个 commit（Conventional Commits）
- Hotfix：直接 push main（7 天集训特例）
- **改契约（§2.4）的 PR 必须两人都标 approve**（唯一例外）

---

## 10. 备份 / 回滚

| 场景 | 动作 |
|---|---|
| 演示前一晚 main 坏了 | Vercel rollback · `git revert` |
| demo 数据被误删 | `pnpm db:seed:demo --force`（幂等脚本必备） |
| 某切片当场演挂 | 切 Plan B 录屏 · 讲稿延续 |
| 现场 WiFi 挂 | Plan B 本地 tunnel / 录屏 / 热点 |

---

## 11. 每天必测"最小闭环 Sanity"

> 每晚 18:00 sync 前，各自跑一次本地 5 分钟 sanity：

```
1. pnpm db:reset && pnpm db:seed:demo
2. pnpm dev
3. 登录 → Dashboard → 打开 Evidence → 修改 1 条 status
4. 走一遍自己切片的端到端（如 Migration: 粘贴 → 导入 → Live Genesis）
5. 能走通到这里 → 当晚代码可 push
6. 走不通 → 不 push，加班修
```

---

## 12. 7 天交付物清单（对齐 PRD §17 精简版）

| 交付 | 形态 | D7 必须 |
|---|---|---|
| Production build | URL | ✅ |
| 源码仓库 | GitHub | ✅ README setup ≤ 10 min |
| Demo seed 脚本 | `pnpm db:seed:demo` | ✅ 幂等 |
| Demo 视频 | MP4 4K | ✅ 6 分钟 |
| Pitch deck | PDF | ✅ 6 页 |
| Plan B 录屏 | MP4 | ✅ |
| 真实 CPA 口证 | 30s 视频 | 能拿到最好；用 stand-in 也可 |
| WISP | 1 页 PDF | 可延后 Phase 1，Pitch 里提一句 |
| 架构文档 | `docs/Dev File/` 组 | ✅ 已完成 |

---

## 13. 7 天之外（Phase 1 第一批）

按 PRD §14.2 排序：

1. **Rules-as-Asset overlay 引擎**（把 Day 5 的"直接 UPDATE"重构成 ExceptionRule）
2. **Team RBAC 完整**（多席位 + Server Action 装饰器强制）
3. **Client Readiness Portal**（§6B，延续 Demo 跨设备互动叙事）
4. **Audit-Ready Evidence Package**（§6C）
5. **Stripe** + ICS + 更多 SEO 页

---

## 14. 最后的纪律

1. **不在 Day 4 以后给自己加新 feature**，只修 bug
2. **Demo 能跑 > 代码漂亮**；7 天后重构窗口多得是
3. **任一人卡超过 4 小时 → 必须求助**（结对解决或互换切片内小任务）
4. **每天结束必须 push**（即使未完成，互为 backup）
5. **晚上保证睡 6 小时**（Day 7 之前崩掉无法上场）
6. **契约不随便改 / 切片不随便抢 / AI 生成的代码要自己读一遍**

---

## 15. 为什么"切片分工"对两人 AI 辅助开发是最优解

| 维度 | 前后端分工 | 垂直切片分工（本手册） |
|---|---|---|
| 互相等待 | 高（前端等 API · 后端等需求） | 低（契约定好后各自端到端） |
| AI 辅助放大效果 | 一般（前端 AI / 后端 AI 分离） | 强（单人 full-stack 全程 AI 陪跑） |
| Demo 归属清晰 | 模糊（谁也说不清 Dashboard 谁的） | 清晰（Alice 负责 Migration + Pulse 两大叙事段） |
| 上下文切换成本 | 高（每天跨多个抽象层） | 低（一个切片一天专注） |
| 卡点隔离 | 一方卡全队卡 | 切片内卡不影响对方 |
| Commit 冲突 | 高（layout / shared 经常碰） | 低（切片目录天然隔离） |

**代价：** 两人都得 AI 辅助写 SQL / React / Drizzle，**单人技术栈必须够广**。两人技能栈互补时，切片分工效果最佳。

---

**祝冲刺愉快。Ship it. Show the work.**
