# DueDateHQ 技术文档 · 00 项目总览

> 文档类型：Technical Design Document Index
> 版本：v1.0
> 对齐 PRD：`docs/PRD/DueDateHQ-PRD-v2.0-Unified.md`
> 目标：把 PRD 的"产品承诺"转译为"可实现、可运维、可演进"的技术方案
> 语言约定：正文中文，代码 / 命名 / 注释全部英文

---

## 1. 文档一览

| # | 文档 | 解决的问题 | 读者 |
|---|---|---|---|
| 00 | **Overview**（本文件） | 文档地图 + 阅读顺序 + 核心技术判断 | 所有人 |
| 01 | [Tech Stack](./01-Tech-Stack.md) | 技术栈选型 + 版本锁定 + 选型依据 | Eng |
| 02 | [System Architecture](./02-System-Architecture.md) | 模块边界 · 核心数据流 · 外部依赖 | Eng / PM |
| 03 | [Data Model](./03-Data-Model.md) | Drizzle Schema · 索引 · 租户隔离 · 迁移 | Eng |
| 04 | [AI Architecture](./04-AI-Architecture.md) | Glass-Box · RAG · Pulse · Prompt 管理 | Eng / AI |
| 05 | [Frontend Architecture](./05-Frontend-Architecture.md) | App Router · UI System · 状态管理 · PWA | Frontend |
| 06 | [Security & Compliance](./06-Security-Compliance.md) | Auth · RBAC · PII · 审计 · WISP | Eng / Compliance |
| 07 | [DevOps & Testing](./07-DevOps-Testing.md) | 部署 · CI/CD · 可观测性 · 测试策略 | Eng / SRE |
| 08 | [Project Structure](./08-Project-Structure.md) | 代码目录 · 模块划分 · 命名约定 | Eng |
| 09 | [7-Day Sprint Playbook](./09-7-Day-Sprint-Playbook.md) | 2 人 7 天 Demo-Ready 冲刺手册 | Team |
| 📐 | [Design System](../Design/DueDateHQ-DESIGN.md) | 视觉 token · 组件规格 · Agent Prompt Guide（**Ramp × Linear · Light Workbench**） | Designer / Frontend / AI agents |

---

## 2. 核心技术判断（一图读懂）

```
┌──────────────────────────────────────────────────────────────────────┐
│                 DueDateHQ · Web-first SaaS (2026)                    │
│                                                                      │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐   │
│  │  Next.js 15     │   │  Server Actions  │   │  Inngest Workers │   │
│  │  App Router     │◄──┤  + Route Handler │◄──┤  (Pulse / Email  │   │
│  │  RSC + PWA      │   │  RBAC Guard      │   │   / AuditPkg)    │   │
│  └────────┬────────┘   └────────┬─────────┘   └────────┬─────────┘   │
│           │                     │                      │             │
│           │                     ▼                      │             │
│           │          ┌────────────────────┐            │             │
│           │          │  Drizzle ORM       │            │             │
│           │          │  (type-safe SQL)   │            │             │
│           │          └──────────┬─────────┘            │             │
│           │                     │                      │             │
│  ┌────────┴───────┐   ┌─────────┴────────┐  ┌──────────┴──────────┐  │
│  │  Web Push      │   │  Postgres + pgv  │  │  LiteLLM Gateway    │  │
│  │  Service Worker│   │  (Neon Serverless│  │  GPT-4o / mini      │  │
│  │  VAPID         │   │   + pgvector)    │  │  Claude fallback    │  │
│  └────────────────┘   └──────────────────┘  └─────────────────────┘  │
│                                                                      │
│  Cache: Upstash Redis   ·   Files: Cloudflare R2   ·   Mail: Resend  │
│  Obs:   Sentry + Langfuse + Vercel Analytics   ·   Auth: Auth.js v5  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. 三条"技术铁律"（必须在代码里体现）

呼应 PRD §0.3 的产品 SLA，工程层面对应：

1. **30 秒看清风险**
   - Dashboard 首屏 P95 TTI ≤ 1.5s（RSC streaming + 索引 §03-Data-Model#2）
   - Penalty Radar 顶栏 **纯服务端预聚合**，不在前端跑求和
   - 1000 obligations × 200 clients 下筛选 P95 < 1s（复合索引 + 服务端 pagination）

2. **30 分钟完成导入**
   - Migration 必须是**单事务 + 单行失败不阻塞**（§03 / §08 Migration 模块）
   - AI Field Mapper 与 Normalizer 走**schema-first prompt + 后置正则校验**，禁止幻觉字段
   - Live Genesis 的 4 秒动画靠**前端 CSS + 乐观 UI**，不依赖后端推送

3. **24 小时 Pulse 闭环**
   - 6 源独立 worker + DLQ + `last_checked_at` 诚实信号
   - Batch Apply 与 Email Digest **共用同一事务**（Transactional Outbox 模式）
   - 所有 Pulse 变更都落 `ExceptionRule` overlay，**不改 base rule**（§04 Pulse Pipeline）

---

## 4. 工程优先级（与 PRD 的 Phase 对齐）

| Phase | PRD 范围 | 技术里程碑 |
|---|---|---|
| **Phase 0 (MVP · 4 周)** | P0 全部 + P1 部分（Pulse / Ask / ICS / PWA 壳） | 核心闭环：Auth → Migration → Dashboard → Pulse → PWA |
| **Phase 1 (5–12 周)** | Rules-as-Asset · Team RBAC · Client Readiness Portal · Onboarding Agent | 规则资产层 · 多席位 · Stripe · 公开 SEO 页 |
| **Phase 2 (Q3 2026)** | macOS Menu Bar Widget · Audit Package · QBO/TaxDome 集成 | Tauri 壳 · RFC 3161 TSA · Compliance Calendar API 前置 |

> 本技术文档的 schema、索引、目录结构**一次性覆盖到 Phase 1**，避免 P1 来时被迫重构（特别是 Team / Membership / ExceptionRule 三张表）。

---

## 5. 阅读顺序建议

**后端 Eng：** 01 → 02 → 03 → 06 → 04 → 07 → 08
**前端 Eng：** 01 → 02 → 05 → 08 → 07
**PM / TL：** 00 → 02 → 04（Glass-Box 部分）→ 06
**SRE / DevOps：** 01 → 02 → 07 → 06

---

## 6. 修改约定

- 所有架构变更必须先改本文档组再改代码
- PRD 与 Dev File 出现歧义时：**产品语义以 PRD 为准，工程实现以 Dev File 为准**
- UI / 视觉相关歧义时：**`docs/Design/DueDateHQ-DESIGN.md` 为准**（token / 组件规格 / 色彩语义）
- 任何新引入的第三方依赖必须更新 `01-Tech-Stack.md` 的版本表
- Schema 改动必须同步 `03-Data-Model.md` 并附 migration SQL

---

## 7. 不做的技术选择（与 PRD §4.3 "明确不做"对齐）

| 拒绝的选择 | 理由 |
|---|---|
| ❌ 微服务 | 团队 < 5 人；Next.js Server Actions + 模块化 monorepo 已足够 |
| ❌ GraphQL | Server Actions + 受约束的 DSL（§04 Ask）已覆盖查询需求 |
| ❌ Electron 桌面 App | PWA + Tauri menu bar widget 覆盖 95% native 体验 |
| ❌ 自建 Kubernetes | Vercel + Neon + Upstash 的 serverless 组合 zero-ops |
| ❌ Prisma | Drizzle 类型更强、Edge 兼容、生成 SQL 更透明 |
| ❌ Redux / MobX | Zustand + TanStack Query + URL state 已覆盖；避免样板代码 |
| ❌ 独立 Auth 微服务 | Auth.js v5 直接集成到 Next.js，磁力链 + TOTP 够用 |
| ❌ ElasticSearch | Postgres GIN + pgvector 覆盖搜索 + 向量两类需求 |

---

## 8. 关键性能 / 成本目标

| 指标 | 目标 | 约束来源 |
|---|---|---|
| Dashboard TTI (P95) | ≤ 1.5s | PRD §5.1 · Story S1-AC1 |
| Workboard 筛选响应 (P95) | < 1s @ 1000 obligations | PRD §5.2.3 · S1-AC3 |
| Migration 完成 (P95 · 30 客户) | ≤ 30 min | PRD §12.2 · S2-AC5 |
| Pulse 抓取 → Dashboard Banner | ≤ 24h | PRD §6.3 · S3-AC1 |
| LLM 平均成本 | < $0.02 / firm / day | PRD §6.2.5 · Cost Control |
| AI Q&A 响应 (P95) | < 3s | PRD §6.6 |
| Cold start（Edge / Serverless）| < 300ms | Vercel Edge Runtime 要求 |
| DB 查询 (P95) | < 80ms | Neon + 索引 |

---

## 9. 术语简表（工程版）

- **tenant key** = `firm_id`（所有业务表必须带）
- **ORM middleware** = Drizzle 查询拦截层，强制注入 `WHERE firm_id = :current_firm`
- **Server Action Guard** = 服务端 action 入口的 RBAC 装饰器
- **Overlay Engine** = 运行时把 `ExceptionRule` 叠加到 `ObligationRule.base_due_date` 算出 `current_due_date`
- **Pulse Pipeline** = Ingest → LLM Extract → Human Review → Match → Batch Apply 五段
- **Glass-Box Guard** = LLM 输出后置校验（citation 正则 + 黑白名单 + PII 回填）
- **Transactional Outbox** = Pulse Apply 与 Email Job 在同一 DB 事务写入，worker 消费

---

继续阅读：[01-Tech-Stack.md](./01-Tech-Stack.md)
