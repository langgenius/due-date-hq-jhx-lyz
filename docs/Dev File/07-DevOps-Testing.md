# 07 · DevOps · Testing · Observability

> 目标：**一条 `wrangler deploy` 全量发布 · preview 自动化 · 测试金字塔清晰 · 可观测三件套（logs / errors / traces）全覆盖。**

---

## 1. 环境拓扑


| 环境             | Worker                          | D1                         | KV / R2 / Vectorize | 触发                |
| -------------- | ------------------------------- | -------------------------- | ------------------- | ----------------- |
| **local**      | `wrangler dev`（miniflare）       | `--local` SQLite 文件        | miniflare 内置        | `pnpm dev`        |
| **preview**    | Workers Preview URL（每 PR 一个）    | `duedatehq-preview-pr-<n>` | 独立                  | PR 打开 / 更新        |
| **staging**    | `duedatehq-staging.workers.dev` | `duedatehq-staging`        | 独立                  | `main` 分支合并       |
| **production** | `app.duedatehq.com`             | `duedatehq`                | 独立                  | release tag（`v`*） |


---

## 2. CI/CD 流水线（GitHub Actions）

### 2.1 PR 管线（`.github/workflows/pr.yml`）


| 步骤                                 | 工具                             | 失败影响  |
| ---------------------------------- | ------------------------------ | ----- |
| `pnpm install --frozen-lockfile`   | pnpm                           | block |
| `pnpm lint`（oxlint）                | oxlint                         | block |
| `pnpm format:check`（oxfmt）          | oxfmt                          | block |
| `pnpm secrets:scan`                 | gitleaks                       | block |
| `pnpm check-types`（turbo 并行）       | `tsgo --noEmit`                | block |
| `pnpm test`（Vitest + pool-workers） | vitest                         | block |
| `pnpm build`（turbo）                | vite / wrangler                | block |
| **Worker Preview 部署**              | `cloudflare/wrangler-action`   | warn  |
| **D1 Preview 迁移**                  | `wrangler d1 migrations apply` | block |
| E2E 烟测（关键路径 5 条）                   | Playwright                     | warn  |


`check-types:stable`（`tsc --noEmit`）不在 PR 默认路径；仅在升级 TypeScript / native preview、排查 tsgo 差异、或 release candidate 冻结前手动运行。

### 2.2 Production 管线（`.github/workflows/production.yml`）

- 触发：push to `main`（staging）+ tag `v*.*.*`（production）
- 步骤：
  1. 依赖装 + lint + test + build（同 PR 管线）
  2. D1 迁移 `wrangler d1 migrations apply duedatehq[-staging] --remote`（只允许 expand/forward-compatible migration）
  3. better-auth 迁移（如有变化）
  4. `wrangler deploy`
  5. Sentry release 创建 + sourcemap 上传
  6. Playwright smoke 打 staging 冒烟 20 条
  7. Worker 失败 → `wrangler rollback`；若已应用 DB migration，只能回滚到仍兼容新 schema 的上一版 Worker，禁止依赖删列式 rollback

**DB migration 纪律：**

- 所有 production migration 必须 forward-compatible：新增 nullable/default 字段、先双写、后读新字段、最后单独 release 清理旧字段。
- 禁止在同一 release 中 `DROP COLUMN` / 重命名热字段 / 收紧 NOT NULL，除非已有 backfill + 双版本兼容窗口。
- 每个 destructive migration 必须附 `docs/ops/runbooks/d1-migration-rollback-<slug>.md`，写清 Time Travel 恢复点、数据导出、验证 SQL 和业务降级方式。
- Preview / staging DB 可自动重建；production 只做可审计迁移。

### 2.3 Secret 注入

- GitHub Secrets：`CLOUDFLARE_API_TOKEN` · `CLOUDFLARE_ACCOUNT_ID` · `SENTRY_AUTH_TOKEN` · `TURBO_TOKEN`（远程缓存）
- Worker 运行时 secret：由 `wrangler secret put` 一次性写入，不走 GH Actions

---

## 3. 分支 / Release 策略

- 单一 `main` 分支
- Feature branch：`feat/<slice>/<short>`（7 天 Demo Sprint 期简化：不强制 code review，merge squash；Phase 0 完整 MVP 起强制 1 人 review）
- 版本标签：语义化 `v0.1.0`；tag 触发 production deploy
- Hotfix：`hotfix/<issue>` → PR → squash → tag `v0.1.1`

---

## 4. 观测栈

### 4.1 三件套


| 维度    | 工具                                                     | 接入点                                                                      |
| ----- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| 错误    | **Sentry**（`@sentry/cloudflare`）                       | Worker `fetch` / `scheduled` / `queue` 入口 wrap；前端 SPA 入口 init            |
| 日志    | **Workers Logs + Logpush**                             | 结构化 JSON `console.log({ level, msg, firmId, ... })`；Logpush 到 R2 保留 90 天 |
| Trace | **Langfuse**（LLM 专用）+ Sentry Performance（HTTP / DB 抽样） | `packages/ai/trace.ts` 统一上报                                              |
| 指标    | **Cloudflare Analytics Engine**                        | 关键业务事件（dashboard_view / pulse_apply / migration_import / rpc_latency）    |
| 产品分析  | **PostHog**                                            | `web-vitals` + 关键埋点（`pay_intent_click` / `evidence_open` / ...）          |


### 4.2 关键 SLO / 告警


| 指标                    | 阈值             | 告警                 |
| --------------------- | -------------- | ------------------ |
| Dashboard P95 latency | > 1.5s         | Sentry Slack       |
| Worker error rate     | > 1% / 5min    | Sentry Slack       |
| D1 query P95          | > 200ms        | Logpush 查询 + Slack |
| LLM fail rate         | > 5% / hour    | Langfuse → Slack   |
| Email outbox stuck    | 未 flush > 5min | Queue consumer 告警  |
| Pulse ingest idle     | Cron 未运行 > 2h  | Cron health check  |


---

## 5. 测试金字塔

### 5.1 结构

```
          ┌───────────────┐
          │  E2E (Playwright) · 10 条核心路径
          └───────┬───────┘
     ┌────────────┴────────────┐
     │  Integration · Vitest
     │  • oRPC procedure + scoped repo + D1（vitest-pool-workers）
     │  • Pulse / Migration 完整管线
     └────────────┬────────────┘
   ┌──────────────┴──────────────┐
   │  Unit · Vitest
   │  • packages/core（penalty / priority / date-logic）
   │  • packages/ai/guard（5 道闸）
   │  • 合约 Zod schema
   └─────────────────────────────┘
```

### 5.2 单测（`packages/core` 尤其重要）

- 所有 `packages/core` 函数必须有单测，覆盖率 ≥ 90%
- Glass-Box Guard 5 道闸每道 ≥ 3 条断言
- `packages/contracts` Zod schema 边界用例

### 5.3 集成测（`@cloudflare/vitest-pool-workers`）

- 运行在真实 Workers runtime
- 使用 miniflare 提供 D1 / KV / R2 / Vectorize mock
- 每个 procedure 至少 1 条 happy path + 1 条权限拒绝 + 1 条 validation 失败

### 5.4 E2E（Playwright）

对齐 PRD §12.3 Test ID，Phase 0 10 条核心路径：

| # | PRD Test ID / AC | 路径 |
|---|---|---|
| 1 | — | 新用户注册 magic link → 登录 → 看到空 Dashboard |
| 2 | **T-S1-01 / S1-AC1** | 登录后默认 Dashboard，选中 `This Week` tab |
| 3 | **T-S1-02 / S1-AC2** | 本周 obligations 左上 `[🔴 Nd]` 倒计时徽章 |
| 4 | **T-S1-03 / S1-AC3** | 200 clients × 1000 obligations，三维筛选（CA + LLC + 1040）响应 < 1s |
| 5 | **T-S1-04 / S1-AC4** | 行内 status 下拉改；500ms 内 + Undo toast |
| 6 | **T-S2-02 / S2-AC2** + **T-S2-04 / S2-AC4** | 粘贴 30 行 CSV（含 `Tax ID` 列，无 `tax_types` 列）→ EIN 格式化 + Default Matrix 兜底 → Live Genesis |
| 7 | **T-S2-03 / S2-AC3** | CSV 5 行缺 `state` → 非阻塞，其余 25 行正常导入 |
| 8 | **T-S3-03 + T-S3-04 / S3-AC3 + S3-AC4** | Approved Pulse → Banner 打开 → Apply → 批量 UPDATE + Audit + 24h Undo + 邮件双渠道 |
| 9 | **T-S3-05 / S3-AC5** | 任意 `[n]` citation → Evidence Drawer 展开 source + verbatim + `official_source_url` |
| 10 | **T-PWA-*** | PWA Add-to-Home（移动端）→ 独立窗口启动；Pulse Apply 触发 Push 到达 |

Phase 0 完整 MVP 追加覆盖（可用 integration test，不要求全部 E2E）：

| # | PRD Test ID / AC | 路径 |
|---|---|---|
| 11 | **T-S1-05 / S1-AC5** | 85 客户 seed，记录完成 triage session 的引导路径与耗时埋点 |
| 12 | **T-S2-01 / S2-AC1** | TaxDome preset CSV 命中 profile，字段映射 ≥ 95% |
| 13 | **T-S2-05 / S2-AC5** | 30 客户 signup → import 完整链路，性能计时 P95 ≤ 30 min |
| 14 | **T-S3-01 / S3-AC1** | mock 官方公告 T0 → ingest/extract/review feed 在 SLA 窗口内完成 |
| 15 | **T-S3-02 / S3-AC2** | CA + LA + Individual + 1040 Pulse 精确匹配 12 个符合客户；county unknown 进入 needs_review |

附加的快速 smoke（不走完整 Test ID 流程）：

- 手动创建 1 个 LLC × CA 客户 → Workboard 出现 obligations
- Cmd-K 搜索客户 → Enter 跳转
- 点 `I'd pay $49/mo` → audit event 写入
- 退出登录 → 重定向

E2E 跑在 staging，每次 release 前必跑。所有 Test ID 覆盖率报告由 `scripts/ac-traceability.ts` 生成（见 §6）。

### 5.5 契约测

- `packages/contracts` 导出的每个 procedure 必须有 Zod schema 单测（边界值、错误输入）
- 契约改动必须 PR 打 `[contract]` 标签，前端 / 后端同步 approve

---

## 6. AC Traceability 报告

- 每条 PRD AC（§3 矩阵 S1 / S2 / S3）对应 1 条 E2E 或 Integration 测试；7 天 Demo 允许只覆盖核心 10 条，但 Phase 0 完整 MVP 必须补齐上表 11–15
- 脚本 `scripts/ac-traceability.ts` 扫 `tests/**` 里的 `// AC: T-S1-01` 注释，输出覆盖报告
- CI 跑一次，缺 AC 覆盖发 warning

---

## 7. Feature Flags

- **PostHog Feature Flags**（前端）+ 环境变量（Worker）
- 约定：`ff_<phase>_<name>`，如 `ff_p1_ask_duedatehq`
- Kill switch：Worker 内用 `env.FF_AI_ENABLED === 'true'` 一键关闭 AI 调用（LLM 成本失控时）
- 移除时机：flag 开启 4 周稳定后移除代码

---

## 8. Cron / Queues Dev Loop

```
# 终端 1：Worker + miniflare
pnpm --filter @duedatehq/server dev

# 终端 2：手工触发 cron（miniflare）
curl 'http://localhost:8787/__scheduled?cron=*%2F30+*+*+*+*'

# 终端 3：手工投递 queue 消息
wrangler queues producer send duedatehq-email '{"type":"test"}' --local
```

---

## 9. 数据迁移演练（Phase 1）

- D1 → Postgres（如需要）：每季度跑一次演练，staging 数据集完整 dump → 新建 pg → import → 跑 E2E 回归
- 记录时长 / 故障点 / 数据差异
- 演练报告存 `docs/ops/db-migration-drill-<date>.md`

---

## 10. 性能监控 SLO

详见 §00 §8 "关键性能目标"。Sentry Performance 抽样 10%，重点 transaction：

- `rpc.dashboard.load`
- `rpc.workboard.query`
- `rpc.migration.apply`
- `rpc.pulse.batchApply`

---

## 11. 成本监控

- Cloudflare Dashboard：每日检查 Workers / D1 / R2 / AI Gateway 用量
- 月预算硬顶：MVP $50 / month；超预算发 email 告警
- LLM 成本：Langfuse Dashboard 按 firm 分组，超 $0.05/firm/day 告警

---

## 12. 备份与恢复演练

- **D1**：Cloudflare time-travel（可恢复到过去 30 天任意点）；每月演练一次
- **R2**：桶启用 object versioning；90 天 retention
- **better-auth tables**：同 D1，由 time-travel 覆盖
- **恢复演练**：每季度模拟"D1 误删 clients 表"，走恢复流程，计时；目标 RTO < 30 min

---

## 13. 密钥轮换


| 密钥                   | 频率    | 流程                              |
| -------------------- | ----- | ------------------------------- |
| `AUTH_SECRET`        | 90 天  | 临时双 secret 并存 → 验证 → 下线旧 secret |
| `VAPID_PRIVATE_KEY`  | 180 天 | 换后旧订阅失效，用户需重新 subscribe         |
| Resend API key       | 180 天 | 直接切换                            |
| Cloudflare API token | 90 天  | GH Actions 更新                   |
| LLM API key          | 按合规要求 | 经 AI Gateway，切换时前端无感            |


---

## 14. 运维 Runbook

仓库 `docs/ops/runbooks/` 至少包含：

- `deploy-production.md`
- `rollback-production.md`
- `rotate-secret.md`
- `d1-recover.md`
- `pulse-ingest-stuck.md`
- `email-outbox-flood.md`
- `llm-cost-spike.md`

每个 runbook 格式：触发条件 · 诊断命令 · 修复步骤 · 验证方法 · Post-mortem 模板。

---

## 15. 文档与交付

- 架构文档变更与代码一起 PR（Doc-as-Code）
- 每次 production release 自动生成 changelog（Conventional Commits → `changesets` 或手写）
- 发布公告同步到 `/status`（Phase 1）

---

继续阅读：[08-Project-Structure.md](./08-Project-Structure.md)
