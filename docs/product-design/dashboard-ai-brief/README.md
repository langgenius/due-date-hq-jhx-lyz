# Weekly Brief 与 Dashboard Triage 解释层产品设计册

> 版本：v0.4（Dashboard 首屏去独立 brief 卡片 · 2026-05-04）
> 上游：`docs/report/DueDateHQ - MVP 边界声明.md`、`docs/PRD/DueDateHQ-PRD-v2.0-Part1A.md`、`docs/dev-file/02-System-Architecture.md`、`docs/dev-file/04-AI-Architecture.md`
> 适用范围：后台物化 Weekly Brief、Dashboard Triage queue 的分诊解释层；不包含 Ask DueDateHQ、客户邮件草稿、实时聊天或外部日历同步。

## 1. 本册定位

Weekly Brief 是 DueDateHQ weekly triage 的异步解释能力。它把已经由服务端确定性聚合出的
deadline risk、readiness、evidence gap 和 Pulse 影响，转成 CPA 周一早上能直接执行的 3-5
条分诊建议。

Dashboard 首屏不再展示独立 AI Weekly Brief 卡片。首屏分诊解释由 Triage queue 行内承担：
Focus rank、Smart Priority drivers、Next check 和 Evidence 入口直接附着在每条 obligation 上，
避免在同一页面重复摘抄队列信息。

内部一句话：

> AI 在后台把可信的 Dashboard read model 翻译成可读的分诊建议；Dashboard 首屏由确定性队列直接驱动下一步动作。

## 2. 核心裁定

| 裁定            | 结论                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| AI 运行时机     | 后台 Queue consumer 生成；`dashboard.load` 不调用模型。                                                                   |
| 首屏职责        | Dashboard 首屏展示确定性风险数据、Pulse 和带行内解释的 Triage queue；不再展示独立 AI Brief 状态。                         |
| 数据源          | Brief 输入只能来自 server-side Dashboard snapshot、Evidence、Pulse、Rules source metadata；不能让模型重新查询或自行判断。 |
| 输出定位        | Weekly email / manager summary 可使用摘要、优先级解释、下一步核验事项、来源引用；Dashboard 行内只展示确定性 drivers。     |
| 失败策略        | AI 失败不影响 Dashboard；Dashboard 继续显示确定性 Triage queue。                                                          |
| Secret          | 不新增 secret；复用现有 `AI_GATEWAY_*` secrets。                                                                          |
| Cloudflare 资源 | 使用 `DASHBOARD_QUEUE` binding 隔离 Pulse 与 Brief 故障域；这是 binding 配置，不是 secret。                               |

## 3. 用户体验

Dashboard 推荐顺序：

```text
Risk Pulse / Pulse Alerts
Risk metrics / Penalty Radar
Triage queue with Focus rank / Smart Priority drivers / Next check / Evidence
```

后台 Weekly Brief 仍有四种状态，供邮件、Slack/manager summary 或未来非首屏消费方使用；Dashboard 首屏
不渲染这些状态：

| 状态      | 用户看到什么                                  | 行为                                             |
| --------- | --------------------------------------------- | ------------------------------------------------ |
| `ready`   | 3-5 条本周分诊建议，带 source / evidence chip | 可在异步摘要中引用 evidence，并跳到 obligation。 |
| `stale`   | 上次生成的 brief + `Updated <time>`           | 仍可用于异步摘要；后台刷新中或已超过 TTL。       |
| `pending` | brief 正在后台准备                            | 不影响 Dashboard；风险表照常可用。               |
| `failed`  | 记录失败原因                                  | Dashboard 使用确定性队列；异步摘要可跳过 brief。 |

Brief 文案必须回答：

- 本周先碰哪 3-5 个客户 / obligation。
- 为什么它们排前面。
- 下一步要核验什么。
- 依据来自哪里。
- 是否有 Pulse 改变了优先级。

Brief 文案禁止：

- 声称客户一定适用某项延期或 relief。
- 给结论性税务建议。
- 使用 “AI confirmed”、“guaranteed”、“no penalty will apply” 等绝对措辞。
- 展示没有 citation 的模型句子。

## 4. 后台触发

### 4.1 定时触发

Cron 每 30 分钟运行一次现有 scheduled handler。Dashboard Brief job 不在每次 cron 里直接跑 AI；
cron 只扫描 due firm，按 firm timezone 判断是否需要在本地工作日前生成一次 morning brief。

默认策略：

- 每 firm 每个本地日期最多 1 次 scheduled brief。
- 推荐生成窗口：firm timezone 的 07:00-08:00。
- 周末默认不生成，除非该 firm 有 overdue / critical open obligations。

### 4.2 数据变化触发

以下写路径完成后 enqueue `dashboard.brief.refresh`：

- Migration apply / revert。
- Obligation status 或 readiness 变更。
- Pulse apply / revert / dismiss。
- Evidence gap 被补齐。
- Client facts 变更并影响 rules / pulse matching。

这些触发必须 debounce。5 分钟内同一 firm + scope 的多次变化合并成一次 refresh，避免用户批量操作时
重复花 AI 成本。

### 4.3 手动刷新

Dashboard 首屏不提供 `Refresh brief` 控件。需要手动刷新时，应放在未来的异步摘要管理入口或内部
ops 工具中；刷新仍只投递 Queue 消息，不在 request path 里调用 AI。

## 5. 数据模型设计

新增 `dashboard_brief` 作为 Dashboard 可快速读取的物化表；`ai_output(kind='brief')` 继续保存
模型执行 trace。

建议字段：

| 字段                        | 说明                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `id`                        | PK。                                                                                      |
| `firm_id`                   | 租户边界。                                                                                |
| `user_id`                   | scope 为 `me` 时可填；firm-wide brief 为 null。                                           |
| `scope`                     | `firm` / `me`。MVP 可先只做 `firm`。                                                      |
| `as_of_date`                | firm timezone 下的 date-only。                                                            |
| `status`                    | `pending` / `ready` / `failed` / `stale`。                                                |
| `input_hash`                | Dashboard snapshot 的 SHA-256；幂等与省钱核心。                                           |
| `ai_output_id`              | 指向 `ai_output.id`；pending / failed 可为空。                                            |
| `summary_text`              | 通过 guard 后的 brief 文本。                                                              |
| `top_obligation_ids_json`   | brief 中引用的 obligation ids。                                                           |
| `citations_json`            | citation refs，对应 evidence / rule / pulse source。                                      |
| `reason`                    | `scheduled` / `migration_apply` / `pulse_apply` / `status_change` / `manual_refresh` 等。 |
| `error_code`                | structured refusal 或 job error code。                                                    |
| `generated_at`              | ready / failed 写入时间。                                                                 |
| `expires_at`                | stale 判断边界，默认 24h。                                                                |
| `created_at` / `updated_at` | 运维与调试。                                                                              |

推荐索引：

```sql
CREATE INDEX idx_dashboard_brief_firm_scope_time
  ON dashboard_brief(firm_id, scope, as_of_date, updated_at DESC);

CREATE UNIQUE INDEX uq_dashboard_brief_ready_hash
  ON dashboard_brief(firm_id, scope, as_of_date, input_hash)
  WHERE status IN ('ready', 'pending');
```

## 6. Queue 消息契约

Queue binding 使用 `DASHBOARD_QUEUE`。如果未来为了早期环境节省 Cloudflare queue 资源，也可以临时复用
其他 queue，但必须把 message type 明确区分，并在后续拆出独立 queue。

```ts
type DashboardBriefRefreshMessage = {
  type: 'dashboard.brief.refresh'
  firmId: string
  scope: 'firm' | 'me'
  userId?: string
  asOfDate?: string
  reason:
    | 'scheduled'
    | 'migration_apply'
    | 'migration_revert'
    | 'pulse_apply'
    | 'pulse_revert'
    | 'pulse_dismiss'
    | 'status_change'
    | 'evidence_change'
    | 'client_facts_change'
    | 'manual_refresh'
  idempotencyKey: string
  requestedAt: string
}
```

消费者必须逐条 ack/retry，不能让一个 firm 的 AI 失败导致整批重放。遇到 provider 429 或临时网络错误时
使用 Queue retry delay；遇到 guard rejection / schema invalid 写 `failed`，不无限重试。

## 7. Consumer 流程

```text
dashboard.brief.refresh
  -> load firm + tenant context
  -> derive asOfDate from firm timezone
  -> load deterministic dashboard snapshot
  -> compute input_hash
  -> if latest ready/pending hash exists: ack and skip
  -> insert pending dashboard_brief
  -> build redacted prompt input
  -> packages/ai.runPrompt('brief@v1', input, schema)
  -> glass-box guard + citation validation
  -> record ai_output(kind='brief') + llm_log
  -> update dashboard_brief ready / failed
  -> ack
```

Prompt input 不直接发送 EIN、邮箱、notes 原文等不必要 PII。客户名可按 `{{client_1}}` 占位，
guard 后再由 server 回填；citation refs 指向 evidence / rule / pulse source，不指向模型自造内容。

## 8. API 边界

`dashboard.load` 继续是唯一首屏 query，输出增加 `brief`：

```ts
type DashboardBriefPublic = {
  status: 'ready' | 'stale' | 'pending' | 'failed'
  generatedAt: string | null
  expiresAt: string | null
  text: string | null
  citations: Array<{
    ref: number
    obligationId: string
    evidence: {
      id: string | null
      sourceType: string
      sourceId: string | null
      sourceUrl: string | null
    } | null
  }> | null
  aiOutputId: string | null
  errorCode: string | null
}
```

`dashboard.load` 只读 `dashboard_brief`，禁止调用 `packages/ai`。如果没有任何 brief row，则返回
`brief: null`。Dashboard 首屏不再消费 `brief` 字段，Triage queue 使用确定性 row data 展示
Focus rank、drivers、Next check 和 evidence 入口。

可选新增 mutation：

```ts
dashboard.requestBriefRefresh({ scope: 'firm' | 'me' })
```

该 mutation 只 enqueue，不等待 AI。返回 `queued` 和当前 latest brief；它保留给异步摘要或 ops
入口，不再驱动 Dashboard 首屏 UI 状态。

## 9. 成本与可靠性

- 每 firm/day 默认：1 次 scheduled brief + 3 次 event-triggered refresh + 最多 3 次 manual refresh。
- `input_hash` 不变则跳过。
- Queue message 使用 `idempotencyKey`，consumer 先查 D1 再写 pending。
- `CACHE` 保存短 TTL debounce key：`dashboard-brief:debounce:{firmId}:{scope}:{userOrFirm}`；
  reason 不参与 key，5 分钟内同一 firm + scope 合并成一次 refresh。
- 旧 ready brief 超过 TTL 后可显示为 stale；不要删除，便于 audit / compare。
- AI 不可用时写 failed row，Dashboard 保留确定性数据。
- 运维排障以 `dashboard_brief` 状态、Queue / DLQ 状态和 AI trace 表为准；运行时代码不写裸
  `console.log`。

## 10. 代码架构落点

| 层                | 路径                                    | 职责                                                                                                      |
| ----------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Contracts         | `packages/contracts/src/dashboard.ts`   | 增加 `DashboardBriefPublicSchema`，扩展 `DashboardLoadOutputSchema`，可选增加 `requestBriefRefresh`。     |
| DB schema         | `packages/db/src/schema/dashboard.ts`   | `dashboard_brief` 表；单独 schema 分区，避免 ai trace 表承担 read-model 语义。                            |
| DB repo           | `packages/db/src/repo/dashboard.ts`     | 读取 latest brief、写 pending/ready/failed、计算 stale。                                                  |
| Server procedures | `apps/server/src/procedures/dashboard`  | `load` 只读 latest brief；`requestBriefRefresh` 只投递 queue。                                            |
| Jobs              | `apps/server/src/jobs/dashboard-brief/` | enqueue helper、consumer、snapshot builder、idempotency/debounce。                                        |
| Queue dispatch    | `apps/server/src/jobs/queue.ts`         | 按 `batch.queue` 和 `message.type` 分发。                                                                 |
| Cron dispatch     | `apps/server/src/jobs/cron.ts`          | 扫描 due firms，投递 scheduled refresh；周末仅在存在 critical risk 时生成。                               |
| AI facade         | `packages/ai/src/prompter.ts`           | `brief@v1` 生成结构化 brief，不写 DB。                                                                    |
| Frontend          | `apps/app/src/routes/dashboard.tsx`     | 不渲染独立 brief 卡片；Triage queue 行内展示 Focus rank、Smart Priority drivers、Next check 和 evidence。 |

## 11. Cloudflare / CI 变更

首版设计不需要新增 secret。

新增非 secret Cloudflare binding：

```toml
[[queues.producers]]
binding = "DASHBOARD_QUEUE"
queue = "due-date-hq-dashboard-staging"

[[queues.consumers]]
queue = "due-date-hq-dashboard-staging"
max_batch_size = 5
max_batch_timeout = 5
max_retries = 3
dead_letter_queue = "due-date-hq-dashboard-dlq-staging"
```

如果不想新增 queue 资源，MVP 可以临时复用 `PULSE_QUEUE`，但设计上仍保留 `dashboard.brief.refresh`
独立消息契约，后续拆分不影响业务代码。

CI 需要同步的只有 Wrangler 配置和 queue 创建步骤；不需要新增 GitHub Actions secret。现有
`AI_GATEWAY_PROVIDER_API_KEY` 继续作为唯一模型 provider secret。

## 12. 非目标

- 不做 Dashboard 打开时实时 AI。
- 不做 Ask DueDateHQ。
- 不做 streaming brief。
- 不做用户可编辑 AI prompt。
- 不做双向日历同步。
- 不把 AI 输出作为排序源；Smart Priority 仍是确定性排序，AI 只解释。

## 13. 变更记录

| 版本 | 日期       | 作者  | 摘要                                                                                             |
| ---- | ---------- | ----- | ------------------------------------------------------------------------------------------------ |
| v0.1 | 2026-04-29 | Codex | 新增后台物化 Dashboard AI Brief 设计，固定 Queue-first、no-request-path-AI、no-new-secret 裁定。 |
| v0.2 | 2026-04-29 | Codex | 落地 `dashboard_brief`、`DASHBOARD_QUEUE`、consumer、manual refresh API 和 Dashboard UI 状态。   |
| v0.3 | 2026-04-29 | Codex | 补齐 citation drawer、manual refresh queued 反馈、firm/scope debounce 和周末 scheduled 策略。    |
| v0.4 | 2026-05-04 | Codex | Dashboard 首屏移除独立 brief 卡片，将分诊解释下沉到 Triage queue 行内。                          |
