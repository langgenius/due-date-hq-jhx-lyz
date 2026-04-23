# 03 · Data Model · 数据层设计

> PRD §8 列出了 25+ 张表。本文件把它落地成可执行的 **Drizzle schema + 索引 + RLS 策略 + migration 流程**。
> 核心纪律：**所有业务表必须带 `firm_id`；所有查询必须强制租户隔离；所有写操作必须留 audit。**

---

## 1. Schema 组织

```
db/
├── schema/
│   ├── _shared.ts            # 枚举 / 共用类型 / helpers
│   ├── firm.ts               # Firm · User · Membership · Invitation
│   ├── client.ts             # Client
│   ├── rule.ts               # ObligationRule · RuleSource · CrossVerification · OpsCadence
│   ├── exception.ts          # ExceptionRule · ObligationExceptionApplication
│   ├── obligation.ts         # ObligationInstance
│   ├── evidence.ts           # EvidenceLink
│   ├── pulse.ts              # Pulse · PulseApplication
│   ├── ai.ts                 # AiOutput · LlmLog · rule_chunks (vector)
│   ├── migration.ts          # Batch · Mapping · Normalization · Error
│   ├── audit.ts              # AuditEvent · AuditEvidencePackage
│   ├── notification.ts       # Reminder · PushSubscription · EmailOutbox
│   ├── team.ts               # SavedView
│   ├── readiness.ts          # ClientReadinessRequest · Response
│   └── index.ts              # re-export
├── relations.ts              # Drizzle relations
├── client.ts                 # Neon client factory (serverless + pool)
├── scoped-query.ts           # firmContext + scopedDb()
├── migrations/               # drizzle-kit output
└── seed/                     # test / demo data
```

---

## 2. 核心实体（Drizzle 样板）

### 2.1 Firm / User / Membership

```typescript
// db/schema/firm.ts
import { pgTable, uuid, text, timestamp, pgEnum, integer, boolean, unique, index } from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["solo", "firm", "pro"]);
export const roleEnum = pgEnum("role", ["owner", "manager", "preparer", "coordinator"]);
export const memberStatusEnum = pgEnum("member_status", ["active", "invited", "suspended", "left"]);

export const firms = pgTable("firm", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  timezone: text("timezone").notNull().default("America/Los_Angeles"),
  plan: planEnum("plan").notNull().default("solo"),
  seatLimit: integer("seat_limit").notNull().default(1),
  ownerUserId: uuid("owner_user_id").notNull(),
  defaultAssigneeStrategy: text("default_assignee_strategy").notNull().default("owner"),
  coordinatorCanSeeDollars: boolean("coordinator_can_see_dollars").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  defaultFirmId: uuid("default_firm_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const userFirmMembership = pgTable("user_firm_membership", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  firmId: uuid("firm_id").notNull().references(() => firms.id),
  role: roleEnum("role").notNull(),
  status: memberStatusEnum("status").notNull().default("active"),
  invitedByUserId: uuid("invited_by_user_id"),
  invitedAt: timestamp("invited_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  leftAt: timestamp("left_at", { withTimezone: true }),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  notificationPrefs: jsonb("notification_prefs_json").$type<NotificationPrefs>(),
}, (t) => ({
  uqUserFirm: unique().on(t.userId, t.firmId),
  ixFirmStatus: index().on(t.firmId, t.status),
}));
```

> **设计决策（对齐 PRD §3.6.2）：** P0 的 Solo 租户也走 Membership 表（`user.default_firm_id = firm.id`），不搞 shortcut；这样 P1 引入 Team 时零迁移。

### 2.2 Client · ObligationInstance

```typescript
// db/schema/client.ts
export const entityTypeEnum = pgEnum("entity_type", [
  "individual", "llc", "s_corp", "c_corp", "partnership", "trust", "sole_prop", "nonprofit"
]);
export const importanceEnum = pgEnum("importance", ["high", "med", "low"]);

export const clients = pgTable("client", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id),
  name: text("name").notNull(),
  ein: text("ein"), // "##-#######" after normalization
  entityType: entityTypeEnum("entity_type").notNull(),
  state: text("state").notNull(), // "CA" / "NY" ...
  county: text("county"),
  taxTypes: text("tax_types").array(),
  importance: importanceEnum("importance").notNull().default("med"),
  numPartners: integer("num_partners"),
  numShareholders: integer("num_shareholders"),
  estimatedTaxLiability: integer("estimated_tax_liability"), // cents
  assigneeId: uuid("assignee_id"),
  email: text("email"),
  notes: text("notes"),
  migrationBatchId: uuid("migration_batch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// db/schema/obligation.ts
export const statusEnum = pgEnum("obligation_status", [
  "not_started", "in_progress", "waiting_on_client", "needs_review",
  "filed", "paid", "extended", "not_applicable"
]);
export const readinessEnum = pgEnum("readiness", ["ready", "waiting_on_client", "needs_review"]);
export const extensionEnum = pgEnum("extension_decision", ["not_considered", "applied", "rejected"]);

export const obligationInstances = pgTable("obligation_instance", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  ruleId: uuid("rule_id").notNull(),
  ruleVersion: integer("rule_version").notNull(),
  taxYear: integer("tax_year").notNull(),
  period: text("period"), // Q1 / Q2 / annual / etc.

  originalDueDate: date("original_due_date").notNull(), // frozen at generation
  baseDueDate: date("base_due_date").notNull(),         // rule's current compute
  currentDueDate: date("current_due_date").notNull(),   // base + overlays (cached)
  filingDueDate: date("filing_due_date"),
  paymentDueDate: date("payment_due_date"),

  status: statusEnum("status").notNull().default("not_started"),
  readiness: readinessEnum("readiness").notNull().default("ready"),
  extensionDecision: extensionEnum("extension_decision").notNull().default("not_considered"),

  estimatedTaxDue: integer("estimated_tax_due"),
  estimatedExposureUsd: integer("estimated_exposure_usd"), // cents

  assigneeId: uuid("assignee_id"),
  notes: text("notes"),
  migrationBatchId: uuid("migration_batch_id"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastChangedBy: uuid("last_changed_by"),
}, (t) => ({
  ixFirmDue: index().on(t.firmId, t.currentDueDate),
  ixFirmStatusDue: index().on(t.firmId, t.status, t.currentDueDate),
  ixFirmAssigneeDue: index().on(t.firmId, t.assigneeId, t.currentDueDate),
}));
```

> **Overlay 设计（对齐 PRD §6D.2）：** `current_due_date` 是**派生字段 + 缓存**。写入时由 Overlay Engine 计算（见 §04），读取时直接用。查询快，不需要每次 JOIN overlay 表。

### 2.3 Rule-as-Asset 三件套

```typescript
// db/schema/rule.ts
export const ruleStatusEnum = pgEnum("rule_status", ["candidate", "verified", "deprecated"]);
export const ruleTierEnum = pgEnum("rule_tier", [
  "basic", "annual_rolling", "exception", "applicability_review"
]);
export const coverageStatusEnum = pgEnum("coverage_status", ["full", "skeleton", "manual"]);

export const obligationRules = pgTable("obligation_rule", {
  id: uuid("id").primaryKey().defaultRandom(),
  jurisdiction: text("jurisdiction").notNull(), // "federal" / "CA" / ...
  entityApplicability: text("entity_applicability").array().notNull(),
  taxType: text("tax_type").notNull(),
  formName: text("form_name").notNull(),

  dueDateLogic: jsonb("due_date_logic").$type<DueDateDSL>().notNull(),
  extensionPolicy: jsonb("extension_policy").$type<ExtensionPolicy>(),
  isPayment: boolean("is_payment").notNull().default(false),
  isFiling: boolean("is_filing").notNull().default(true),
  penaltyFormula: jsonb("penalty_formula").$type<PenaltyFormula>(),

  defaultTip: text("default_tip"),
  sourceUrl: text("source_url").notNull(),
  sourceTitle: text("source_title").notNull(),
  statutoryRef: text("statutory_ref"),
  verbatimQuote: text("verbatim_quote").notNull(),

  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),

  version: integer("version").notNull().default(1),
  coverageStatus: coverageStatusEnum("coverage_status").notNull().default("full"),
  active: boolean("active").notNull().default(true),

  status: ruleStatusEnum("status").notNull().default("candidate"),
  ruleTier: ruleTierEnum("rule_tier").notNull().default("basic"),
  applicableYear: integer("applicable_year"),
  requiresApplicabilityReview: boolean("requires_applicability_review").notNull().default(false),
  riskLevel: text("risk_level").notNull().default("low"),

  // 6-item Quality Badge
  checklistJson: jsonb("checklist_json").$type<{
    filing_payment_distinguished: boolean;
    extension_handled: boolean;
    calendar_fiscal_specified: boolean;
    holiday_rollover_handled: boolean;
    cross_verified: boolean;
    exception_channel: boolean;
  }>(),
}, (t) => ({
  ixStatusTier: index().on(t.status, t.ruleTier, t.jurisdiction),
  ixNextReview: index().on(t.nextReviewAt),
}));

export const ruleSources = pgTable("rule_source", {
  id: uuid("id").primaryKey().defaultRandom(),
  jurisdiction: text("jurisdiction").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  sourceType: text("source_type").notNull(), // newsroom|publication|...
  cadence: text("cadence").notNull(),        // 30m / 60m / daily ...
  ownerUserId: uuid("owner_user_id"),
  priority: text("priority").notNull().default("medium"),
  isEarlyWarning: boolean("is_early_warning").notNull().default(false),

  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  lastChangeDetectedAt: timestamp("last_change_detected_at", { withTimezone: true }),
  healthStatus: text("health_status").notNull().default("healthy"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  nextCheckAt: timestamp("next_check_at", { withTimezone: true }),
});

export const ruleCrossVerification = pgTable("rule_cross_verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: uuid("rule_id").notNull().references(() => obligationRules.id),
  primarySourceUrl: text("primary_source_url").notNull(),
  primarySourceTitle: text("primary_source_title").notNull(),
  primaryQuote: text("primary_quote").notNull(),
  crossSourceUrl: text("cross_source_url").notNull(),
  crossSourceTitle: text("cross_source_title").notNull(),
  crossQuote: text("cross_quote").notNull(),
  agreementStatus: text("agreement_status").notNull(), // agree | disagree | partial
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  checkedByUserId: uuid("checked_by_user_id"),
  notes: text("notes"),
});
```

### 2.4 ExceptionRule（overlay 核心）

```typescript
// db/schema/exception.ts
export const exceptionStatusEnum = pgEnum("exception_status", [
  "candidate", "verified", "applied", "retracted", "superseded"
]);

export const exceptionRules = pgTable("exception_rule", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourcePulseId: uuid("source_pulse_id"),
  jurisdiction: text("jurisdiction").notNull(),
  counties: text("counties").array(),
  affectedForms: text("affected_forms").array(),
  affectedEntityTypes: text("affected_entity_types").array(),

  overrideType: text("override_type").notNull(), // extend_due_date | waive_penalty | ...
  overrideValueJson: jsonb("override_value_json").$type<OverrideValue>().notNull(),

  effectiveFrom: date("effective_from").notNull(),
  effectiveUntil: date("effective_until"),

  status: exceptionStatusEnum("status").notNull().default("candidate"),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  retractedAt: timestamp("retracted_at", { withTimezone: true }),
  retractedReason: text("retracted_reason"),
  supersededByExceptionId: uuid("superseded_by_exception_id"),

  sourceUrl: text("source_url").notNull(),
  verbatimQuote: text("verbatim_quote").notNull(),
  needsReevaluation: boolean("needs_reevaluation").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixStatusEffective: index().on(t.status, t.effectiveFrom, t.effectiveUntil),
  // GIN for array match
}));

export const obligationExceptionApplication = pgTable("obligation_exception_application", {
  obligationInstanceId: uuid("obligation_instance_id").notNull(),
  exceptionRuleId: uuid("exception_rule_id").notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  appliedByUserId: uuid("applied_by_user_id"),
  revertedAt: timestamp("reverted_at", { withTimezone: true }),
  revertedByUserId: uuid("reverted_by_user_id"),
}, (t) => ({
  pk: primaryKey({ columns: [t.obligationInstanceId, t.exceptionRuleId] }),
  ixOblig: index().on(t.obligationInstanceId),
  ixException: index().on(t.exceptionRuleId),
}));
```

### 2.5 EvidenceLink · AuditEvent · AiOutput

```typescript
// db/schema/evidence.ts
export const evidenceLinks = pgTable("evidence_link", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull(),
  obligationInstanceId: uuid("obligation_instance_id"),
  aiOutputId: uuid("ai_output_id"),
  sourceType: text("source_type").notNull(), // rule|pulse|human_note|ai_*|default_inference|...
  sourceId: text("source_id"),
  sourceUrl: text("source_url"),
  verbatimQuote: text("verbatim_quote"),
  rawValue: text("raw_value"),
  normalizedValue: text("normalized_value"),
  confidence: real("confidence"),
  model: text("model"),
  matrixVersion: text("matrix_version"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  appliedBy: uuid("applied_by"),
}, (t) => ({
  ixOblig: index().on(t.obligationInstanceId),
  ixSource: index().on(t.sourceType, t.sourceId),
}));

// db/schema/audit.ts
export const auditEvents = pgTable("audit_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull(),
  actorId: uuid("actor_id"),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  action: text("action").notNull(),
  beforeJson: jsonb("before_json"),
  afterJson: jsonb("after_json"),
  reason: text("reason"),
  ipHash: text("ip_hash"),
  userAgentHash: text("user_agent_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixFirmCreated: index().on(t.firmId, t.createdAt),
  ixFirmActorCreated: index().on(t.firmId, t.actorId, t.createdAt),
  ixFirmActionCreated: index().on(t.firmId, t.action, t.createdAt),
}));
```

### 2.6 Pulse + PulseApplication

```typescript
export const pulseStatusEnum = pgEnum("pulse_status", [
  "pending_review", "approved", "applied", "rejected"
]);

export const pulses = pgTable("pulse", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  sourceUrl: text("source_url").notNull(),
  rawContent: text("raw_content"),           // HTML snapshot
  rawContentS3Key: text("raw_content_s3_key"),
  publishedAt: timestamp("published_at", { withTimezone: true }),

  aiSummary: text("ai_summary"),
  verbatimQuote: text("verbatim_quote"),

  parsedJurisdiction: text("parsed_jurisdiction"),
  parsedCounties: text("parsed_counties").array(),
  parsedForms: text("parsed_forms").array(),
  parsedEntityTypes: text("parsed_entity_types").array(),
  parsedOriginalDueDate: date("parsed_original_due_date"),
  parsedNewDueDate: date("parsed_new_due_date"),
  parsedEffectiveFrom: date("parsed_effective_from"),

  confidence: real("confidence"),
  status: pulseStatusEnum("status").notNull().default("pending_review"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  requiresHumanReview: boolean("requires_human_review").notNull().default(true),
}, (t) => ({
  ixStatusPublished: index().on(t.status, t.publishedAt),
}));
```

### 2.7 RAG 向量表

```typescript
// db/schema/ai.ts
import { vector } from "drizzle-orm/pg-core";

export const ruleChunks = pgTable("rule_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: uuid("rule_id").notNull().references(() => obligationRules.id),
  chunkText: text("chunk_text").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  entityType: text("entity_type"),
  taxType: text("tax_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixEmbedding: index("ix_rule_chunks_embedding").using("ivfflat", t.embedding.op("vector_cosine_ops"))
    .with({ lists: 100 }),
  ixJurisdiction: index().on(t.jurisdiction, t.taxType),
}));

export const aiOutputs = pgTable("ai_output", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull(),
  userId: uuid("user_id"),
  kind: text("kind").notNull(), // brief | tip | summary | ask_answer
  promptVersion: text("prompt_version").notNull(),
  model: text("model").notNull(),
  inputContextHash: text("input_context_hash"),
  outputText: text("output_text").notNull(),
  citations: jsonb("citations").$type<Citation[]>(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  costUsd: real("cost_usd"),
});

export const llmLogs = pgTable("llm_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id"),
  userId: uuid("user_id"),
  promptVersion: text("prompt_version"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  latencyMs: integer("latency_ms"),
  costUsd: real("cost_usd"),
  success: boolean("success"),
  errorMsg: text("error_msg"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 2.8 其他表（参考 §08 项目结构对应文件）

- `migration_batch / migration_mapping / migration_normalization / migration_error`
- `ics_token / push_subscription / email_outbox`
- `reminder / saved_view`
- `client_readiness_request / client_readiness_response`
- `audit_evidence_package`
- `event`（analytics）

全部按 PRD §8.1 建表即可，字段命名保持 snake_case。

---

## 3. 关键索引（P95 性能保障）

对齐 PRD §8.2 并补齐：

```sql
-- ===== Dashboard / Workboard =====
CREATE INDEX idx_obligation_firm_due ON obligation_instance (firm_id, current_due_date);
CREATE INDEX idx_obligation_firm_status_due ON obligation_instance (firm_id, status, current_due_date);
CREATE INDEX idx_obligation_firm_tax_due ON obligation_instance (firm_id, tax_type, current_due_date);
CREATE INDEX idx_obligation_firm_assignee_due ON obligation_instance (firm_id, assignee_id, current_due_date)
  WHERE status NOT IN ('filed','paid','not_applicable');

-- ===== Penalty Radar 聚合（物化视图） =====
CREATE MATERIALIZED VIEW mv_firm_weekly_exposure AS
SELECT
  firm_id,
  date_trunc('week', current_due_date) AS week_start,
  assignee_id,
  SUM(estimated_exposure_usd) AS total_exposure_cents,
  COUNT(*) AS obligation_count
FROM obligation_instance
WHERE status NOT IN ('filed','paid','not_applicable')
GROUP BY firm_id, date_trunc('week', current_due_date), assignee_id;

CREATE UNIQUE INDEX idx_mv_firm_week_assignee
  ON mv_firm_weekly_exposure (firm_id, week_start, assignee_id);

-- 每 15min 刷新（Inngest cron）
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_firm_weekly_exposure;

-- ===== Pulse 匹配（GIN array 匹配） =====
CREATE INDEX idx_client_firm_state ON client (firm_id, state);
CREATE INDEX idx_client_firm_state_county ON client (firm_id, state, county);
CREATE INDEX idx_client_firm_entity ON client (firm_id, entity_type);
CREATE INDEX idx_exception_status_effective ON exception_rule (status, effective_from, effective_until);
CREATE INDEX idx_exception_jurisdiction ON exception_rule (jurisdiction);
CREATE INDEX idx_exception_counties_gin ON exception_rule USING GIN (counties);
CREATE INDEX idx_exception_forms_gin ON exception_rule USING GIN (affected_forms);

-- ===== Evidence / Audit =====
CREATE INDEX idx_evidence_obligation ON evidence_link (obligation_instance_id);
CREATE INDEX idx_audit_firm_created ON audit_event (firm_id, created_at DESC);

-- ===== Migration Revert =====
CREATE INDEX idx_client_batch ON client (migration_batch_id);
CREATE INDEX idx_obligation_batch ON obligation_instance (migration_batch_id);
CREATE UNIQUE INDEX idx_one_draft_batch_per_firm
  ON migration_batch (firm_id) WHERE status IN ('draft','mapping','reviewing');

-- ===== RAG Vector =====
CREATE INDEX idx_rule_chunks_embedding ON rule_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ===== Team / Membership =====
CREATE UNIQUE INDEX idx_membership_user_firm ON user_firm_membership (user_id, firm_id);
CREATE INDEX idx_membership_firm_status ON user_firm_membership (firm_id, status);
CREATE UNIQUE INDEX idx_invitation_token
  ON team_invitation (invite_token)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- ===== Readiness Portal =====
CREATE UNIQUE INDEX idx_readiness_token
  ON client_readiness_request (magic_link_token)
  WHERE revoked_at IS NULL AND status NOT IN ('expired');

-- ===== Push =====
CREATE INDEX idx_push_user_active ON push_subscription (user_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX idx_push_endpoint ON push_subscription (endpoint) WHERE revoked_at IS NULL;
```

---

## 4. Row-Level Security（RLS · 底线防御）

Neon Postgres 原生支持 RLS。我们对**所有业务表**启用 RLS，作为"忘记 WHERE firm_id"的终极保险：

```sql
-- 设置 session 变量（Drizzle client 每次获取连接时注入）
CREATE OR REPLACE FUNCTION app_current_firm() RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_firm_id', true)::UUID;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 每张业务表
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON client
  USING (firm_id = app_current_firm());

ALTER TABLE obligation_instance ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON obligation_instance
  USING (firm_id = app_current_firm());

-- 以此类推：evidence_link / audit_event / pulse_application / migration_batch /
--           saved_view / reminder / push_subscription / email_outbox / client_readiness_*

-- 规则 / Pulse 是全租户共享，不启 RLS
```

Drizzle client wrapper：

```typescript
// db/client.ts
export async function withFirmContext<T>(
  firmId: string,
  fn: (tx: DrizzleClient) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_firm_id', ${firmId}, true)`);
    return fn(tx);
  });
}
```

---

## 5. 软删除策略

| 表 | 策略 | 理由 |
|---|---|---|
| `firm` | 软删 + 30 天 grace | 合规（GDPR 诉讼证据 + 恢复） |
| `client` | 软删（`deleted_at`） | 7 年审计保留 |
| `obligation_instance` | **不软删**，用 `status='not_applicable'` | 避免查询复杂度 |
| `user` | 软删（GDPR 匿名化） | |
| `user_firm_membership` | `status='left'` 不删 | 审计历史 |
| `pulse / pulse_application` | 不删 | 法定级记录 |
| `audit_event` | **永不删**，仅 7 年后归档 | 合规 |
| `rule` | 永不删，`status='deprecated'` | 历史 obligation 指向版本 |

所有"查当前数据"的 query 必须加 `WHERE deleted_at IS NULL`（在 ORM wrapper 层强制）。

---

## 6. Migration 流程（drizzle-kit）

```bash
# 1. 修改 schema/*.ts
# 2. 生成迁移
pnpm drizzle-kit generate --name="add_exception_rule"

# 3. 本地预览
pnpm drizzle-kit studio  # 打开 Drizzle Studio 查验

# 4. CI: 在 Neon preview branch 跑 migration
NEON_BRANCH=pr-123 pnpm drizzle-kit migrate

# 5. E2E 测试通过后 merge
# 6. 生产：deploy pipeline 中 pre-deploy 跑 migrate
```

**规则：**
- 破坏性 migration（drop column / rename）必须分两步：
  1. PR#1：双写 + 新字段上线
  2. 观测 7 天 · PR#2：drop 旧字段
- 所有 migration 必须 idempotent（`IF NOT EXISTS` / `IF EXISTS`）
- 禁止手写 SQL 直连生产 DB；走 drizzle migration 的 CI 流水

---

## 7. Seed 数据

```
db/seed/
├── rules.federal.ts      # 11 rules
├── rules.california.ts   # 8 rules
├── rules.newyork.ts
├── rules.texas.ts
├── rules.florida.ts
├── rules.washington.ts
├── rules.massachusetts.ts
├── default_tax_matrix.ts # §6A.5 matrix
├── source_registry.ts    # 15 sources
├── demo_firm.ts          # Demo firm + 30 clients + 2 Pulses
└── index.ts
```

```bash
pnpm seed:dev        # 本地
pnpm seed:preview    # Vercel preview branch
pnpm seed:demo       # Demo Day 数据
```

---

## 8. 查询样板（复杂度控制）

**Dashboard Triage Tab 计数**（Server Action）：

```typescript
export async function getTriageTabCounts(
  firmId: string,
  scope: "firm" | "me",
  userId: string
) {
  return withFirmContext(firmId, async (tx) => {
    const base = tx
      .select({
        tab: sql<"week" | "month" | "longterm">`
          CASE
            WHEN current_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'week'
            WHEN current_due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'month'
            ELSE 'longterm'
          END
        `,
        count: count(),
        exposure: sum(obligationInstances.estimatedExposureUsd),
      })
      .from(obligationInstances)
      .where(
        and(
          sql`status NOT IN ('filed','paid','not_applicable')`,
          sql`current_due_date <= CURRENT_DATE + INTERVAL '180 days'`,
          scope === "me" ? eq(obligationInstances.assigneeId, userId) : undefined
        )
      )
      .groupBy(sql`tab`);

    return base;
  });
}
```

> **圈复杂度约束：** 单个 query function ≤ 30 行；超过 → 拆成多个并在 service 层组合。

---

## 9. 数据迁移到 50 州的预案

- `obligation_rule.coverage_status` 三档：`full | skeleton | manual`
- P0：Federal + 6 州 = `full`
- P1：新增州时，先进 `skeleton`（仅 Federal 默认），积累使用量再升级
- `client` 表的 `state` 不做枚举（text），避免加州就要 migration

---

## 10. Dev 工具

```bash
pnpm db:studio         # Drizzle Studio
pnpm db:reset          # drop + recreate + migrate + seed:dev
pnpm db:branch <name>  # Neon branch 创建 shortcut
pnpm db:explain "<sql>" # 运行 EXPLAIN ANALYZE
```

---

继续阅读：[04-AI-Architecture.md](./04-AI-Architecture.md)
