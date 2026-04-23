# 07 · DevOps · Testing · Observability

> 目标：**每一次 commit 5 分钟内部署到 PR 预览 · 每一次 deploy 可在 30 秒内回滚 · 每一次 AC 都有自动化测试守门**。

---

## 1. 环境拓扑

| 环境 | URL | DB | LLM | 用途 |
|---|---|---|---|---|
| **Dev** (本地) | `http://localhost:3000` | Neon branch `dev-<name>` | LiteLLM local + Mock | 日常开发 |
| **Preview** (PR) | `pr-<n>.duedatehq-preview.vercel.app` | Neon branch `pr-<n>` | LiteLLM + ZDR | PR 审查 |
| **Staging** | `staging.duedatehq.com` | Neon `staging` | LiteLLM + ZDR | Demo / QA |
| **Production** | `app.duedatehq.com` | Neon `main` | LiteLLM + ZDR | 正式 |
| **Demo** | `demo.duedatehq.com` | Neon `demo`（seed 固定数据） | Mock LLM | Demo Day |

---

## 2. CI/CD 流水线

### 2.1 GitHub Actions workflows

```
.github/workflows/
├── ci.yml              # 每个 PR：lint + typecheck + unit + e2e
├── preview.yml         # PR opened：创建 Neon branch + Vercel preview
├── cleanup.yml         # PR merged/closed：销毁 Neon branch
├── production.yml      # main 推送：迁移 + 部署 + 冒烟
├── cron-health.yml     # 每 5min ping /api/health
└── dependabot.yml
```

### 2.2 `ci.yml` 关键步骤

```yaml
name: CI
on: [pull_request]

jobs:
  lint-type-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:unit

  db-migration:
    runs-on: ubuntu-latest
    needs: lint-type-unit
    steps:
      - uses: actions/checkout@v4
      - uses: neondatabase/create-branch-action@v5
        id: create-branch
        with:
          api_key: ${{ secrets.NEON_API_KEY }}
          parent: main
          branch_name: pr-${{ github.event.pull_request.number }}
      - run: pnpm drizzle-kit migrate
        env:
          DATABASE_URL: ${{ steps.create-branch.outputs.db_url }}

  e2e:
    runs-on: ubuntu-latest
    needs: db-migration
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
        env:
          DATABASE_URL: ${{ needs.db-migration.outputs.db_url }}
          LITELLM_MOCK: "true"

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gitleaks/gitleaks-action@v2
      - uses: github/codeql-action/init@v3
      - uses: github/codeql-action/analyze@v3
```

### 2.3 生产部署

```yaml
# production.yml
on:
  push:
    branches: [main]

jobs:
  migrate:
    steps:
      - run: pnpm drizzle-kit migrate
        env: { DATABASE_URL: ${{ secrets.DATABASE_URL_MAIN }} }

  deploy:
    needs: migrate
    steps:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  smoke:
    needs: deploy
    steps:
      - run: curl -f https://app.duedatehq.com/api/health
      - run: pnpm playwright test tests/smoke

  rollback-on-fail:
    needs: smoke
    if: failure()
    steps:
      - run: vercel rollback --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 3. Branch / Release 策略

- **Trunk-based**：单一 `main` 分支
- Feature branches：`feat/xxx` / `fix/xxx` / `chore/xxx`
- PR 最多 500 行 diff（超过必须拆），单 approver 即可 merge（集训节奏）
- Release tag：`v0.1.0 → v1.0.0`（Semantic Versioning）
- Hotfix：`hotfix/xxx` → 直接 PR 到 main + tag

---

## 4. 观测栈

### 4.1 Sentry

- 前端 + 后端错误
- Session Replay（付费，Phase 1）
- 告警：P95 latency > SLA / 错误率 > 1% → Slack

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NEXT_PUBLIC_ENV,
  beforeSend(event) {
    // 脱敏
    redactPiiFromEvent(event);
    return event;
  },
});
```

### 4.2 Langfuse（AI 专属）

- 每次 LLM 调用 trace
- Prompt 版本 A/B 对比
- Cost per firm / day dashboard

### 4.3 Vercel Analytics + PostHog

- Web Vitals（LCP / FID / CLS）→ 对齐 §00 性能目标
- Product events（`pay_intent_click` / `migration_completed` / `pulse_applied`）
- 功能开关（Feature flags）

### 4.4 结构化日志

```typescript
// lib/logger.ts
import pino from "pino";
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["*.email", "*.ein", "*.ssn"],
  formatters: { level: (label) => ({ level: label }) },
});
```

Vercel 自动聚合到 Logs Drain → 可配置到 Better Stack / Axiom。

### 4.5 Health check

```typescript
// app/api/health/route.ts
export const runtime = "edge";
export async function GET() {
  const checks = await Promise.allSettled([
    db.execute(sql`SELECT 1`),
    redis.ping(),
    fetch(`${process.env.LITELLM_PROXY_URL}/health`),
  ]);
  const ok = checks.every(c => c.status === "fulfilled");
  return Response.json({ ok, checks }, { status: ok ? 200 : 503 });
}
```

---

## 5. 测试金字塔

```
                  ┌───────────────┐
                  │  Demo Scripts │   3–5 scripted flows
                  └───────────────┘   Playwright 录屏
                 ┌─────────────────┐
                 │  E2E (Playwright│   每个 AC Test ID 一条
                 │   + mocked LLM) │
                 └─────────────────┘
                ┌───────────────────┐
                │  Integration      │  Server Action + DB 实测
                │  (Vitest + Neon)  │
                └───────────────────┘
               ┌─────────────────────┐
               │  Unit (Vitest)       │  纯函数 · overlay · penalty
               │  components (Storybk)│  priority score · guard
               └─────────────────────┘
```

### 5.1 单元测试

覆盖：
- Penalty 公式（§7.5）
- Smart Priority 打分（§6.4）
- Overlay Engine `applyOverride`
- Migration Normalizer 字典 / 正则
- Glass-Box Guard（citation / blacklist / placeholder）
- Pulse Match 四维组合

```typescript
// tests/unit/priority.test.ts
describe("priorityScore", () => {
  it("high exposure dominates", () => {
    const high = priorityScore({ estimated_exposure_usd: 10_000, current_due_date: in(30) }, client);
    const low  = priorityScore({ estimated_exposure_usd: 200,    current_due_date: in(2)  }, client);
    expect(high.score).toBeGreaterThan(low.score);
  });
});
```

### 5.2 集成测试

```typescript
// tests/integration/pulse-apply.test.ts
it("pulse batch apply is atomic", async () => {
  const { firmId, pulseId, obligationIds } = await seedPulseScenario();
  await applyPulseBatch({ firmId, pulseId, actorUserId: OWNER, selectedObligationIds: obligationIds });
  const affected = await db.select().from(obligationInstances).where(inArray(obligationInstances.id, obligationIds));
  expect(affected.every(o => o.currentDueDate === expectedDate)).toBe(true);
  const audit = await db.select().from(auditEvents).where(eq(auditEvents.action, "pulse.applied"));
  expect(audit).toHaveLength(1);
});
```

### 5.3 E2E（Playwright · 按 Test ID 编排）

对齐 PRD §12.3 全部 Test ID：

```typescript
// tests/e2e/s1-ac1-dashboard.spec.ts
test("T-S1-01 · login lands on This Week tab", async ({ page }) => {
  await login(page, "demo-owner");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("tab", { name: /this week/i })).toHaveAttribute("aria-selected", "true");
});

// tests/e2e/s3-ac3-pulse.spec.ts
test("T-S3-03 · approved pulse triggers banner + email", async ({ page }) => {
  await seedApprovedPulse();
  await login(page, "demo-owner");
  await expect(page.getByRole("status", { name: /storm relief/i })).toBeVisible();
  const emailCount = await getOutboxEmailCountFor("sarah@firm.com", "pulse_digest");
  expect(emailCount).toBeGreaterThan(0);
});
```

**Test ID 命名约定：** 与 PRD §12.3 一一对应（T-S1-01 ~ T-TM-12 ~ T-RP-10 ~ T-AE-10 ~ T-PWA-09 ~ T-MB-07 ~ T-RA-12）。

### 5.4 Visual regression

- Chromatic（Storybook 集成）
- 关键页面：Dashboard / Workboard / TriageCard / Pulse Drawer / Migration Wizard Step 2

### 5.5 Load test（Phase 1）

k6 脚本，模拟 50 firm × 1000 obligations 并发：

```javascript
import http from "k6/http";
export const options = { vus: 50, duration: "3m" };
export default function () {
  http.get("https://staging.duedatehq.com/dashboard", { headers: { Cookie: SESSION } });
}
```

---

## 6. AC Traceability Report

自动生成 HTML，列出每个 Test ID 的 pass/fail：

```bash
pnpm test:e2e --reporter=./scripts/ac-traceability.ts
```

输出 `docs/reports/ac-traceability-<commit>.html`，作为集训交付物（PRD §17）。

---

## 7. Feature Flags

```typescript
// lib/flags.ts
import { PostHog } from "posthog-node";
const ph = new PostHog(process.env.POSTHOG_KEY);

export async function flag(name: string, firmId: string, defaultValue = false) {
  return await ph.isFeatureEnabled(name, firmId) ?? defaultValue;
}
```

- P1 特性（Team RBAC / Onboarding Agent / Readiness Portal）灰度
- A/B prompt 版本
- 紧急 kill switch（"暂停所有 AI 调用"）

---

## 8. Inngest Dev Loop

```bash
# 终端 1
pnpm dev                # Next.js
# 终端 2
pnpm inngest-cli dev    # http://localhost:8288 UI
```

Inngest UI：
- 查看事件流
- 手动触发某 Pulse 抓取
- DLQ 查看失败任务
- 重放

---

## 9. 数据迁移演练（Phase 1）

每次 migration 必须：
1. 在 PR Neon branch 跑通
2. Preview 部署测通
3. `staging` 部署测通 2 小时
4. Production 部署 + 冒烟
5. 失败 → Vercel rollback + Neon branch revert（分钟级）

---

## 10. 性能监控 SLO

| SLO | 目标 | 告警阈值 | 动作 |
|---|---|---|---|
| Dashboard TTI P95 | ≤ 1.5s | > 2.5s 持续 5min | Slack #eng-alerts |
| Workboard filter P95 | ≤ 1s | > 2s | 同上 |
| Pulse ingest freshness | ≤ 1h | > 3h | PagerDuty |
| Server error rate | ≤ 0.5% | > 2% | PagerDuty |
| LLM success rate | ≥ 99% | < 95% | Slack + on-call |
| DB CPU | ≤ 70% | > 90% 持续 10min | Neon autoscale + alert |

---

## 11. 成本监控

| 项 | 预算（MVP 阶段） | 报警 |
|---|---|---|
| Vercel | $20/mo | > $80 |
| Neon | $20/mo | > $60 |
| Upstash | $10/mo | > $30 |
| R2 | $5/mo | > $15 |
| OpenAI | $50/mo | > $150 |
| Resend | $20/mo | > $60 |
| Sentry / Langfuse | $0 免费额度 | 接近上限 |

每日 cost summary 邮件发 ops（从 Langfuse + Vercel billing API 拉取）。

---

## 12. 备份与恢复演练

- Neon 自动每日备份，保留 7 天
- 每季度演练恢复：创建 Neon branch from `7 days ago` → 跑冒烟测试
- R2：PDF / Migration raw / Audit ZIP 独立 lifecycle 策略（audit ZIP 永不过期）
- `prompts/` 与 `docs/` 通过 git 天然备份

---

## 13. 机密轮换（§06.12）

Runbook：

```
每 90 天：
1. 生成新 secret
2. 更新 Vercel env（双版本并存 1 周）
3. 代码支持 "accept old+new"
4. 切到新 secret
5. 7 天后移除旧
```

---

## 14. 运维 Runbook

| 场景 | 步骤 |
|---|---|
| **紧急回滚** | `vercel rollback` 或 Vercel UI 一键；数据层兼容时无需回 migrate |
| **Pulse 错误推送** | Settings Ops → Pulse → Retract → worker 自动 Revert 所有 ExceptionApplication |
| **某 firm 数据异常** | `pnpm cli firm-inspect <slug>` 导出 snapshot；走支持流程 |
| **AI 费用超限** | Kill switch feature flag → 所有 AI 调用返回模板；通知 ops |
| **Neon 主库挂** | 立即切 Replica；Vercel 挂 maintenance 静态页 |

CLI：`tools/cli/*.ts`，基于 `tsx` + `commander`。

---

## 15. 文档与交付

每次生产部署自动：
- 生成 CHANGELOG（基于 Conventional Commits）
- 更新 `/status` 页状态（外部 status.duedatehq.com）
- 发 `#release-log` Slack 通知

---

继续阅读：[08-Project-Structure.md](./08-Project-Structure.md)
