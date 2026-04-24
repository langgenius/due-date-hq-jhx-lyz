# 03 · Data Model · 数据层设计

> 目标：一次设计**覆盖 Phase 0 + Phase 1**，避免 Team / Overlay / Readiness 上线时回头重构。
> 核心决策：**D1 + Drizzle + `scoped(db, firmId)` 工厂**；租户字段统一使用 `firmId`（= better-auth `organizationId`）。

---

## 1. Schema 组织

```
packages/db/
├── src/
│   ├── schema/
│   │   ├── auth.ts              ← better-auth 托管（user / session / account / verification
│   │   │                            / organization / member / invitation）
│   │   ├── clients.ts
│   │   ├── obligations.ts       ← rule + instance + exception（Phase 1）
│   │   ├── migration.ts
│   │   ├── pulse.ts
│   │   ├── ai.ts                ← ai_output + llm_log
│   │   ├── audit.ts             ← audit_event + evidence_link
│   │   ├── notifications.ts     ← in_app + email_outbox + reminder（push_subscription 已随 Phase 0 PWA 降级移除）
│   │   ├── readiness.ts         ← Phase 1
│   │   └── index.ts             ← barrel
│   ├── client.ts                ← drizzle(D1) factory
│   ├── scoped.ts                ← ★ 业务模块的唯一入口
│   ├── audit-writer.ts
│   ├── evidence-writer.ts
│   └── types.ts
├── migrations/                   ← drizzle-kit 生成，wrangler d1 apply
└── drizzle.config.ts
```

**约束：**

- `apps/server/src/procedures/**` **不允许**直接 import `@duedatehq/db/schema` 的业务表 symbol；只能通过 `context.scoped.xxx()`
- `scoped.ts` 的每个 repo 入口都必须硬编码 `WHERE firm_id = :firmId`，`firmId` 只能从 middleware 注入，不能从 procedure `input` 接收
- `schema/auth.ts`（better-auth 身份层 7 张表）**手工维护**：已在 `member` 表加 `(organization_id, user_id)` unique index、加 `member.status` 业务字段，且 `firm_profile` 通过 PK FK 挂到 `organization.id`。不跑 `@better-auth/cli generate`（package.json 已无 `auth:schema` 脚本，避免误重跑覆盖这些约束）；后续 schema 变更一律走 `pnpm db:generate` + 人工 review
- 业务表统一用 `firm_id` 保持 DueDateHQ 术语（逻辑等同 `organization_id`）

---

## 2. 核心实体（按领域分组）

> 只列字段与约束；Drizzle 具体写法在 `packages/db/src/schema/*.ts`。不贴实现代码除非是**约束**。

### 2.1 better-auth 托管表

| 表             | 说明                                                                     | DueDateHQ 视角                                           |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `user`         | 全局唯一的人（邮箱唯一）                                                 | CPA 本人                                                 |
| `session`      | 登录态                                                                   | 含 `activeOrganizationId`                                |
| `account`      | OAuth account                                                            | Google OAuth 为主                                        |
| `verification` | 邮箱 / 邀请 token                                                        | —                                                        |
| `organization` | **Firm（租户）身份容器**；业务字段在 `firm_profile`（§2.1.b）            | 仅 `id / name / slug / logo / metadata`（metadata 留空） |
| `member`       | **UserFirmMembership**；`role ∈ {owner, manager, preparer, coordinator}` | —                                                        |
| `invitation`   | **TeamInvitation**                                                       | token + 14d 过期                                         |

`firmId`（业务表）严格 = `organization.id` = `firm_profile.id`（三层共用同一个 id；见 §2.1.b 与 ADR 0010）。

> **2026-04-24 修订**：`organization.metadata` 不再承载业务语义（plan / seatLimit / timezone / ownerUserId / status），这些字段已迁到独立的 `firm_profile` 表（见下一小节）。`organization.metadata` 当前不写、未来仅用于身份层附加属性。

**Global vs tenant-scoped 边界（约束）：**

| 类别         | 表                                                                                                                         | `firm_id` 规则                                                                                        | 访问方式                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 租户业务数据 | `client` / `obligation_instance` / `migration_*` / `audit_event` / `ai_output` / `llm_log` / `email_outbox` / `saved_view` | `firm_id NOT NULL`                                                                                    | 只能经 `scoped(db, firmId)`                                        |
| 全局规则资产 | `obligation_rule` / `rule_source` / `rule_chunk`                                                                           | 不带 firm 或 `firm_id NULL`                                                                           | 只读公开/ops 路径；业务查询必须通过 rule id join 到租户 obligation |
| 混合 overlay | `exception_rule`                                                                                                           | `firm_id NULL` 表示 ops verified 全局 exception；`firm_id NOT NULL` 表示 firm custom/manual exception | 全局只读；firm custom 经 `scoped`                                  |
| 应用记录     | `pulse_application` / `obligation_exception_application` / `evidence_link`                                                 | `firm_id NOT NULL`（即使可由 parent join 推导，也冗余存储）                                           | 只能经 `scoped`                                                    |

任何可由用户直接打开详情页的记录，都必须能用自身 `firm_id` 或父实体 join 证明归属；不允许只靠前端传来的 id 查询。

### 2.1.b firm_profile（业务租户表）

> 来源：ADR [`0010-firm-profile-vs-organization.md`](../adr/0010-firm-profile-vs-organization.md)。
> Schema：`packages/db/src/schema/firm.ts`；migration `0001_tidy_shiva.sql`。

| 字段            | 类型                                               | 备注                                                                                                      |
| --------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `id`            | `text PK · FK → organization.id ON DELETE CASCADE` | PK 复用 organization.id；删 org → 级联删 firm_profile                                                     |
| `name`          | `text NOT NULL`                                    | 镜像 organization.name；P1 可分离 legal/display                                                           |
| `plan`          | `text NOT NULL DEFAULT 'solo'`                     | PRD §3.6.1；enum `solo / firm / pro` 在 drizzle schema + TS 层校验（见下）                                |
| `seat_limit`    | `integer NOT NULL DEFAULT 1`                       | UI affordance；写时由 plan 决定（P1）                                                                     |
| `timezone`      | `text NOT NULL DEFAULT 'America/New_York'`         | P0 ICP 假设（PRD §2.1）；P1 onboarding 让用户选                                                           |
| `owner_user_id` | `text NOT NULL · FK → user.id ON DELETE RESTRICT`  | 删 user 前必须先转 owner 或软删 firm                                                                      |
| `status`        | `text NOT NULL DEFAULT 'active'`                   | enum `active / suspended / deleted`（drizzle+TS 层）；tenantMiddleware 拒 non-active → `TENANT_SUSPENDED` |
| `created_at`    | `integer (ms) NOT NULL`                            |                                                                                                           |
| `updated_at`    | `integer (ms) NOT NULL`                            | drizzle `$onUpdate` 触发                                                                                  |
| `deleted_at`    | `integer (ms) NULL`                                | PRD §3.6.8 软删 30d grace                                                                                 |

**与 `organization` 的关系**：

- `firmId == organization.id == firm_profile.id` —— 三个 id 永远同值（PK 复用）
- `organization` 仍由 better-auth 托管（身份层）；`firm_profile` 由我们写入（业务层）
- 业务表 `firm_id` FK 指向 `firm_profile.id`（语义清晰）；底层值与 `organization.id` 一致，老查询不需要改

**写入时机**：

1. **正常路径**：`apps/server/src/auth.ts` 注入的 `organizationHooks.afterCreateOrganization`（在 `apps/server/src/organization-hooks.ts` 工厂里），`organization.create` 完成后同请求 INSERT 一行 firm_profile
2. **自愈路径**：`apps/server/src/middleware/tenant.ts` 在缺失时 lazy create —— 读 `organization` 行 + 找 `member.role='owner'` 最早一条 → INSERT。代价：缺失场景的请求多 1 次 select + 1 次 insert，下次起回正常路径

**加列原则**：

- D1 加列零成本，按需 ALTER
- billing 字段（`billingCustomerId / billingSubscriptionId`）等 P0-23 Pay-intent 立项时再加，不预占
- `coordinatorCanSeeDollars`（PRD §3.6 RBAC）/ `defaultAssigneeUserId`（PRD §3.6.8）等 P1 字段同样不预占

**关于 enum / CHECK**：

drizzle 的 `text({ enum: [...] })` **只在 TypeScript + drizzle 运行时层做 enum**
（编译期拒绝越界字面量；运行时 drizzle 不替你生成 `CHECK (...)`）。
D1 层当前**无 CHECK 约束** —— 生成的 migration SQL 里只有 `DEFAULT 'solo'` /
`DEFAULT 'active'`，没有 `CHECK (plan IN (...))`。

**为什么先这样**：

- SQLite 不支持 `ALTER TABLE ... ADD CONSTRAINT CHECK`；后加 CHECK 必须做
  "CREATE new + INSERT SELECT + DROP + RENAME" 的表重建迁移，对已承载数据的
  表成本过高。
- 写入路径 100% 经 TS 应用层（procedures + hooks），drizzle 已在编译期拦
  住越界；攻击面是"SQL 直接执行" / "未来新迁移脚本写错"等运维类风险。
- 验收这套约束的真实收益要等业务表实现后重新评估；届时把要求 CHECK 的表
  一起在一条重建迁移里补齐。

如果未来业务表真的需要 CHECK（例如状态机敏感的 `obligation.status`），用
drizzle 的 `check('<name>', sql\`...\`)` + 手写迁移。现阶段 schema 只保证
**drizzle-层 enum 安全**，不保证 **DB-层 CHECK**。

### 2.2 客户与义务

**clients**

| 字段                                       | 类型                                                                                                                                       | 备注                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `id`                                       | `text PK`                                                                                                                                  | UUID v4                                             |
| `firm_id`                                  | `text NOT NULL`                                                                                                                            | → `organization.id`                                 |
| `name`                                     | `text NOT NULL`                                                                                                                            |                                                     |
| `ein`                                      | `text`                                                                                                                                     | `##-#######`；正则校验；允许 NULL                   |
| `state`                                    | `text NOT NULL`                                                                                                                            | ISO 两位州码                                        |
| `county`                                   | `text`                                                                                                                                     | Pulse 匹配用                                        |
| `entity_type`                              | `text NOT NULL` · enum `llc / s_corp / partnership / c_corp / sole_prop / trust / other`（drizzle+TS 层校验，见 §2.1.b 关于 enum / CHECK） |                                                     |
| `tax_types`                                | `text (JSON array)`                                                                                                                        | NULL 时走 Default Matrix 兜底                       |
| `importance`                               | `text DEFAULT 'med'` · enum `high / med / low`（drizzle+TS 层）                                                                            |                                                     |
| `num_partners` / `num_shareholders`        | `integer`                                                                                                                                  | Penalty per-partner 用                              |
| `estimated_annual_revenue_band`            | `text NULL` · enum `lt_250k / 250k_1m / 1m_10m / gt_10m`（drizzle+TS 层）                                                                  | PRD P0-7；Client CRM 视角的粗档收入；Penalty 归档用 |
| `estimated_tax_liability_cents`            | `integer`                                                                                                                                  | PRD §8.1；Penalty Radar 精算输入（可选）            |
| `assignee_id`                              | `text → user.id`                                                                                                                           | Phase 1 Team 启用                                   |
| `email` / `notes`                          | `text`                                                                                                                                     |                                                     |
| `migration_batch_id`                       | `text`                                                                                                                                     | Revert 级联                                         |
| `created_at` / `updated_at` / `deleted_at` | `integer (ms)`                                                                                                                             | 软删                                                |

**obligation_rule**（Rules-as-Asset 核心实体）

| 字段                                                                   | 备注                           |
| ---------------------------------------------------------------------- | ------------------------------ |
| `id` / `version`                                                       | 同一规则多版本共存             |
| `jurisdiction`                                                         | `federal` / `CA` / `NY` / ...  |
| `entity_applicability`                                                 | JSON string[]                  |
| `tax_type` / `form_name` / `is_filing` / `is_payment`                  |                                |
| `due_date_logic`                                                       | JSON DSL（§03.7）              |
| `extension_policy` / `penalty_formula`                                 |                                |
| `source_url` / `source_title` / `verbatim_quote` / `statutory_ref`     | 证据铁律                       |
| `verified_by` / `verified_at` / `next_review_at`                       |                                |
| `status ∈ (candidate, verified, deprecated)`                           | AI candidate vs human verified |
| `rule_tier ∈ (basic, annual_rolling, exception, applicability_review)` |                                |
| `risk_level ∈ (low, med, high)`                                        | 高风险要求双人 sign-off        |
| `checklist_json`                                                       | 6 项 Quality Badge（§6D.4）    |
| `coverage_status ∈ (full, skeleton, manual)`                           | 50 州骨架                      |
| `active`                                                               |                                |

**obligation_instance**

| 字段                                                                                                          | 备注                                                         |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `id` / `firm_id` / `client_id` / `rule_id` / `rule_version`                                                   |                                                              |
| `tax_year` / `period`                                                                                         |                                                              |
| `original_due_date`                                                                                           | 规则生成时的原始日期，**永不变**                             |
| `base_due_date`                                                                                               | base rule 最新计算值                                         |
| `current_due_date`                                                                                            | Phase 0 直接 = base；Phase 1 = base + apply(active overlays) |
| `filing_due_date` / `payment_due_date`                                                                        |                                                              |
| `status ∈ (not_started, in_progress, waiting_on_client, needs_review, filed, paid, extended, not_applicable)` |                                                              |
| `readiness ∈ (ready, waiting, needs_review)`                                                                  |                                                              |
| `extension_decision`                                                                                          | JSON                                                         |
| `estimated_tax_due_cents` / `estimated_exposure_cents`                                                        | Penalty Radar 预聚合                                         |
| `assignee_id` / `notes`                                                                                       |                                                              |
| `migration_batch_id`                                                                                          |                                                              |
| `last_changed_by`                                                                                             |                                                              |
| `created_at` / `updated_at`                                                                                   |                                                              |

**exception_rule**（Phase 1 · Overlay Engine）

| 字段                                                                           | 备注                                                                                 |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `id` / `firm_id` / `source_pulse_id`                                           | `firm_id NULL` = 全局 ops verified；非 NULL = firm custom/manual；来源 Pulse 可 NULL |
| `jurisdiction` / `counties[]` / `affected_forms[]` / `affected_entity_types[]` | JSON                                                                                 |
| `override_type ∈ (extend_due_date, waive_penalty, ...)`                        |                                                                                      |
| `override_value_json`                                                          |                                                                                      |
| `effective_from` / `effective_until`                                           |                                                                                      |
| `status ∈ (candidate, verified, applied, retracted, superseded)`               |                                                                                      |
| `source_url` / `verbatim_quote`                                                |                                                                                      |

**obligation_exception_application**（多对多）

| 字段                                                 |     |
| ---------------------------------------------------- | --- |
| `obligation_instance_id` / `exception_rule_id`（PK） |     |
| `applied_at` / `applied_by_user_id`                  |     |
| `reverted_at` / `reverted_by_user_id`                |     |

### 2.3 Pulse 链路

**pulse**

| 字段                                                                                     | 备注      |
| ---------------------------------------------------------------------------------------- | --------- |
| `id` / `source` / `source_url` / `raw_r2_key`                                            | 原文存 R2 |
| `published_at`                                                                           |           |
| `ai_summary` / `verbatim_quote`                                                          |           |
| `parsed_jurisdiction` / `parsed_counties[]` / `parsed_forms[]` / `parsed_entity_types[]` | JSON      |
| `parsed_original_due_date` / `parsed_new_due_date` / `parsed_effective_from`             |           |
| `confidence`                                                                             | 0–1       |
| `status ∈ (pending_review, approved, applied, rejected)`                                 |           |
| `reviewed_by` / `reviewed_at` / `requires_human_review`                                  |           |

**pulse_application**

| 字段                                                                   | 备注     |
| ---------------------------------------------------------------------- | -------- |
| `id` / `pulse_id` / `obligation_instance_id` / `client_id` / `firm_id` |          |
| `applied_by` / `applied_at` / `reverted_at`                            |          |
| `before_due_date` / `after_due_date`                                   | 审计必备 |

### 2.4 Migration

**migration_batch**

| 字段                                                              | 备注 |
| ----------------------------------------------------------------- | ---- |
| `id` / `firm_id` / `user_id`                                      |      |
| `source ∈ (paste, csv, preset_name)` / `raw_input_r2_key`         |      |
| `mapping_json` / `preset_used`                                    |      |
| `row_count` / `success_count` / `skipped_count`                   |      |
| `ai_global_confidence`                                            |      |
| `status ∈ (draft, mapping, reviewing, applied, reverted, failed)` |      |
| `revert_expires_at` = `applied_at + 24h`                          |      |

**migration_mapping** · **migration_normalization** · **migration_error**

- `mapping.confidence` / `reasoning` / `user_overridden`
- `normalization.field / raw_value / normalized_value / confidence / model / reasoning`
- `error.row_index / raw_row_json / error_code / error_message`（供 UI 非阻塞展示）

### 2.5 证据与审计

**evidence_link**（PRD §5.5 provenance 核心）

| 字段                                                        | 备注                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| `id`                                                        |                                                                     |
| `firm_id`                                                   | tenant evidence 必填；全局 rule source 不直接作为 EvidenceLink 暴露 |
| `obligation_instance_id` 或 `ai_output_id`                  | 二选一                                                              |
| `source_type`                                               | 枚举（§06）                                                         |
| `source_id` / `source_url` / `verbatim_quote`               |                                                                     |
| `raw_value` / `normalized_value`                            | Migration 用                                                        |
| `confidence` / `model` / `matrix_version`                   | AI 决策用                                                           |
| `verified_at` / `verified_by` / `applied_at` / `applied_by` |                                                                     |

**audit_event**

| 字段                                    | 备注          |
| --------------------------------------- | ------------- |
| `id` / `firm_id` / `actor_id`           |               |
| `entity_type` / `entity_id`             |               |
| `action`                                | 枚举（§06.6） |
| `before_json` / `after_json` / `reason` |               |
| `ip_hash` / `user_agent_hash`           | 匿名化        |
| `created_at`                            |               |

**硬约束：`audit_event` 永不物理删除，也不允许软删标志位。**

### 2.6 AI 观测

**ai_output**

| 字段                                                                                                                         |     |
| ---------------------------------------------------------------------------------------------------------------------------- | --- |
| `id` / `firm_id` / `user_id` / `kind ∈ (brief, tip, summary, ask_answer, pulse_extract, migration_map, migration_normalize)` |     |
| `prompt_version` / `model` / `input_context_ref`                                                                             |     |
| `output_text` / `citations_json`                                                                                             |     |
| `generated_at` / `tokens_in` / `tokens_out` / `cost_usd`                                                                     |     |

**llm_log**

| 字段                                                         |                                  |
| ------------------------------------------------------------ | -------------------------------- |
| `id` / `firm_id` / `user_id` / `prompt_version`              |                                  |
| `input_tokens` / `output_tokens` / `latency_ms` / `cost_usd` |                                  |
| `success` / `error_msg` / `created_at`                       |                                  |
| `input_hash`                                                 | sha256；**不存原文**（PII 合规） |

### 2.7 通知

**in_app_notification** · **email_outbox** · **reminder**

- `email_outbox.external_id` 唯一约束（幂等）
- `email_outbox.status ∈ (pending, sending, sent, failed)`
- `reminder.offset_days ∈ {30, 7, 1}`；`sent_at` / `clicked_at`

> `push_subscription` 表已随 Phase 0 PWA/Web Push 降级整体移除（见 `00-Overview.md §7`、`05 §8`）。恢复时需同步 schema migration + `packages/db/schema/notifications.ts` + 两条 push 相关索引。

### 2.8 其他

- **saved_view**（P1-16）· **ics_token**（P1-11）· **analytics_event** · **audit_evidence_package**（Phase 1）
- 详细字段参照 PRD §8.1，此处不重复

---

## 3. 关键索引（P95 性能保障）

```sql
-- Dashboard / Workboard 核心
CREATE INDEX idx_oi_firm_due          ON obligation_instance(firm_id, current_due_date);
CREATE INDEX idx_oi_firm_status_due   ON obligation_instance(firm_id, status, current_due_date);
CREATE INDEX idx_oi_firm_tax_due      ON obligation_instance(firm_id, tax_type, current_due_date);
CREATE INDEX idx_oi_firm_assignee_due ON obligation_instance(firm_id, assignee_id, current_due_date);

-- Pulse 匹配
CREATE INDEX idx_client_firm_state        ON client(firm_id, state);
CREATE INDEX idx_client_firm_state_county ON client(firm_id, state, county);
CREATE INDEX idx_client_firm_entity       ON client(firm_id, entity_type);

-- Migration Revert
CREATE INDEX idx_client_batch ON client(migration_batch_id);
CREATE INDEX idx_oi_batch     ON obligation_instance(migration_batch_id);

-- Evidence
CREATE INDEX idx_evidence_firm_time ON evidence_link(firm_id, applied_at DESC);
CREATE INDEX idx_evidence_oi     ON evidence_link(obligation_instance_id);
CREATE INDEX idx_evidence_source ON evidence_link(source_type, source_id);

-- Pulse feed
CREATE INDEX idx_pulse_status_pub ON pulse(status, published_at DESC);

-- Audit（火热写）
CREATE INDEX idx_audit_firm_time        ON audit_event(firm_id, created_at DESC);
CREATE INDEX idx_audit_firm_actor_time  ON audit_event(firm_id, actor_id, created_at DESC);
CREATE INDEX idx_audit_firm_action_time ON audit_event(firm_id, action, created_at DESC);

-- Penalty 周聚合（Scoreboard）
CREATE INDEX idx_oi_firm_week_exposure ON obligation_instance(
  firm_id, current_due_date, estimated_exposure_cents
) WHERE status NOT IN ('filed', 'paid', 'not_applicable');

-- Exception overlay（Phase 1）
CREATE INDEX idx_exc_status_effective ON exception_rule(status, effective_from, effective_until)
  WHERE status IN ('applied', 'verified');
CREATE INDEX idx_exc_firm_status ON exception_rule(firm_id, status, effective_from)
  WHERE firm_id IS NOT NULL;

-- Notifications
CREATE INDEX idx_outbox_status        ON email_outbox(status, created_at);
-- push_subscription 索引已随 PWA/Web Push 降级移除（见 §2.7 末尾）
```

D1 无 GIN / ivfflat；向量检索走 Vectorize；需要数组 / JSON 过滤时优先拆 helper table 或反范式（如 `has_federal` boolean、`client_tax_type`、`exception_affected_form`），临时 JSON 查询用 `json_each()` 但不得作为高频路径默认方案。

---

## 4. 租户隔离（D1 无 RLS · 三道工程防线）

1. **Middleware 层**：Hono middleware 从 better-auth session 读 `activeOrganizationId`，不存在直接 401
2. **Repo 工厂层**：`scoped(db, firmId)` 是 `packages/db` 唯一对外导出；所有查询在工厂内部硬编码 `WHERE firm_id = :firmId`
3. **oxlint 层**：`apps/server/src/procedures/**` 禁止直接 import `@duedatehq/db/schema` 的业务表 symbol（通过 `no-restricted-imports` 配置）；PR CI 自动 block

`scoped.ts` 强制形态（**约束**）：

```ts
// packages/db/src/scoped.ts
export const scoped = (db: DrizzleDB, firmId: string) => ({
  clients: clientsRepo(db, firmId),
  obligations: obligationsRepo(db, firmId),
  pulse: pulseRepo(db, firmId),
  migration: migrationRepo(db, firmId),
  evidence: evidenceRepo(db, firmId),
  audit: auditRepo(db, firmId),
  // 每个业务 repo 都在此注入 firmId
})
```

任何 repo 内部**不得**接受其他租户来源；`firmId` 只能从这里传入。

---

## 5. 软删除策略

| 实体                               | 策略                                                    |
| ---------------------------------- | ------------------------------------------------------- |
| `client`                           | `deleted_at` 软删；30 天后 Cron 硬删（级联 obligation） |
| `obligation_instance`              | 不软删；状态 `not_applicable` 代替                      |
| `audit_event`                      | **永不删**（硬约束）                                    |
| `migration_batch`                  | `reverted_at` 标记；原始数据 R2 保留 90 天              |
| `pulse`                            | 不删；`status=rejected` 即过滤                          |
| `user` / `organization` / `member` | 由 better-auth 管理；GDPR 请求走其 `deleteUser` API     |

---

## 6. Migration 流程（约束）

```
# 1. 改 packages/db/src/schema/*.ts
# 2. 生成迁移
pnpm --filter @duedatehq/db db:generate

# 3. 本地 D1 应用
pnpm --filter @duedatehq/server exec wrangler d1 migrations apply duedatehq --local

# 4. 本地 better-auth 迁移（首次 + 改 auth 配置时）
pnpm --filter @duedatehq/server auth:migrate --local

# 5. PR 合并后 CI 对 staging D1 应用
wrangler d1 migrations apply duedatehq-staging --remote

# 6. 生产 deploy pipeline 先 apply prod D1
wrangler d1 migrations apply duedatehq --remote
```

**纪律：**

- 迁移**向前兼容**：新字段默认 NULL 或给默认值；删字段走两阶段（先停写 → 下次发布删列）
- Seed 脚本分环境：`db:seed:demo`（幂等）/ `db:seed:rules`（Federal + CA + NY 核心规则）/ `db:seed:pulse`（2 条示例）

---

## 7. `due_date_logic` DSL（约束）

```ts
// 枚举所有 MVP 支持的规则类型；不支持的类型不进 verified 池
type DueDateLogic =
  | { type: 'fixed_date'; month: number; day: number }
  | { type: 'nth_day_after_event'; n: number; event: 'formation' | 'tax_year_end' }
  | { type: 'calendar_anchor'; anchor: 'q1' | 'q2' | 'q3' | 'q4' | 'annual'; offset_days?: number }
  | {
      type: 'nth_month_day'
      month: number
      weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6
      nth: 1 | 2 | 3 | 4 | -1
    }

interface WeekendHolidayPolicy {
  rollover: 'next_business_day' | 'preceding_business_day' | 'none'
  holiday_calendar: 'us_federal' | 'us_federal_plus_state' | 'none'
}
```

日期计算由 `packages/core/date-logic.ts` 纯函数完成，零运行时依赖。未来加 fiscal year / 跨年滚转时，DSL 增加新 `type`，不破坏现有规则。

---

## 8. D1 约束速查

| 约束                 | 值                                | 工程缓解                                                      |
| -------------------- | --------------------------------- | ------------------------------------------------------------- |
| 单库大小             | 10 GB                             | 接近阈值前按 firm / region 分库；不要假设单库长期承载全部租户 |
| 单查询返回行数       | 10 万                             | 所有列表强制分页（50 / 100 / 200）                            |
| 单 invocation 查询数 | Workers Paid 约 1000（Free 更低） | Migration / Pulse 分批；每批优先 100–200 prepared statements  |
| 单 SQL 绑定参数      | 100                               | 大 `IN (...)` 拆批或写入临时/helper 表                        |
| 单请求 CPU           | 30s（付费 5min）                  | 长计算拆 Queue / Workflow                                     |
| 无原生 vector        | —                                 | Vectorize                                                     |
| 无原生 JSON 索引     | —                                 | 反范式冗余 boolean / 拆表                                     |
| 无 RLS               | —                                 | `scoped(db, firmId)` 工厂强制                                 |

---

## 9. 规则覆盖路线图 + Postgres 退路

### 9.1 规则覆盖（对齐 PRD §4.1 P0-8 / §6.1.2）

| 阶段                              | 覆盖辖区                              | 条目                                                                           |
| --------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| **Demo Sprint**（§09）            | Federal + CA + NY                     | ~20 条 verified                                                                |
| **Phase 0 MVP 完整**（PRD §14.1） | Federal + CA + NY + TX + FL + WA + MA | ~30 条全 verified；其他 44 州 `coverage_status='skeleton'` + Federal-only 回退 |
| **Phase 1 完整**（PRD §14.2）     | 50 州 full coverage                   | 逐州 sign-off 后 `active=true`；无 schema 变更                                 |

### 9.2 Postgres 退路（极端场景，非预设路径）

D1 不是权宜之计，是**架构正确选择**（见 §01.2.5）。仅在以下**不在当前路线图**的极端场景下考虑切 Hyperdrive + Neon：

| 触发条件                 | 处理                                                                        |
| ------------------------ | --------------------------------------------------------------------------- |
| 单库真实超 10 GB         | 先评估按 firm 分库（D1 支持多库）；仍不够再切                               |
| 跨租户 OLAP 分析需求固化 | 先评估 Cloudflare Analytics Engine + 定时 Workflow 重算物化视图；仍不够再切 |
| 合规要求物理租户隔离     | 按 firm 建独立 D1 实例（D1 支持多库）；仍不够再切                           |

**若真需要迁移**，路径（需要独立迁移计划，不按 1 天承诺）：

- Drizzle 方言切换：sqlite → pg（约 30% schema 语法变更：`integer (ms)` → `timestamptz`，JSON text → `jsonb`）
- 查询层零感知：`scoped.ts` 是唯一修改点
- 数据复制：`sqlite3 .dump` → 转 pg SQL → `pg_restore`

---

## 10. Dev 工具

- `drizzle-kit studio` 可视化 schema + 查询
- `wrangler d1 execute duedatehq --local --command "SELECT ..."` ad-hoc SQL
- `pnpm db:seed:demo` 幂等 seed（Sprint Playbook 的 Demo Data 模块依赖）

---

继续阅读：[04-AI-Architecture.md](./04-AI-Architecture.md)
