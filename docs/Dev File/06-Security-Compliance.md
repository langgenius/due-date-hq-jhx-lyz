# 06 · Security & Compliance

> 对齐 PRD §13 + §3.6.3（RBAC 矩阵）+ §6C（Audit Package）。
> 核心纪律：**三层防御（Middleware / Server Action / RLS）· 最小必要数据 · 审计永不删。**

---

## 1. 威胁模型（STRIDE 速览）

| 威胁 | 场景 | 缓解 |
|---|---|---|
| **S**poofing | 伪冒 CPA 登录 | Magic link + 设备指纹 + TOTP MFA（Owner 必开） |
| **T**ampering | 篡改 due_date / Pulse | 每条 overlay 独立留痕，不改 base；Audit 永不删 |
| **R**epudiation | "不是我改的" | Audit 记录 actor + IP hash + UA hash |
| **I**nfo disclosure | 跨 firm 数据泄露 | Middleware + ORM wrapper + RLS 三层 |
| **D**oS | Ask 恶意构造 query | Rate limit + SQL parser + 超时 cancel |
| **E**levation | Preparer 跑 Owner 操作 | Server Action RBAC 装饰器 + RLS policy |

---

## 2. Auth 设计

### 2.1 Magic Link + TOTP

```typescript
// auth/config.ts
export const authConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60, // 10 min
    }),
  ],
  session: { strategy: "database", maxAge: 7 * 24 * 60 * 60 }, // 7d
  callbacks: {
    async signIn({ user, account }) {
      return await ensureMembership(user.id);
    },
    async session({ session, user }) {
      session.firmId = await resolveFirmFromRequest(user.id);
      session.role = await resolveRole(user.id, session.firmId);
      return session;
    },
  },
  events: {
    signIn: async ({ user }) => writeAudit({ action: "auth.login.success", actorId: user.id }),
  },
} satisfies NextAuthConfig;
```

### 2.2 TOTP MFA（Owner 必开）

- 库：`otplib`
- Setup 流程：扫 QR（otpauth://）→ 输入 6 位验证 → 生成 10 条 recovery codes
- 数据库：`mfa_secret`（加密存储）+ `mfa_enabled` + `recovery_codes_hash[]`
- Team 版：Manager 强制开启（登录时如 role ≥ manager 且未开 → 强制 setup）

### 2.3 Session & Cookie

- Cookie: `httpOnly` + `secure` + `sameSite=lax`
- 双 session（desktop / mobile）允许，但"设备 / IP 变"要求 step-up auth
- Settings → Devices 列所有 session + "Sign out all"

---

## 3. RBAC 双层实现

### 3.1 Server Action 装饰器

```typescript
// auth/rbac.ts
import { requireSession } from "./session";

export function withRbac<T>(
  allowedRoles: Role[],
  handler: (session: AuthedSession) => Promise<T>
): Promise<T> {
  return async () => {
    const session = await requireSession();
    if (!allowedRoles.includes(session.role)) {
      await writeAudit({
        firmId: session.firmId,
        actorId: session.userId,
        action: "auth.denied",
        reason: `required=${allowedRoles.join(",")} actual=${session.role}`,
      });
      throw new ForbiddenError();
    }
    return handler(session);
  };
}
```

用法：

```typescript
// app/(app)/[firmSlug]/settings/team/actions.ts
"use server";
export const inviteMember = async (formData: FormData) =>
  withRbac(["owner"], async (session) => {
    const input = InviteSchema.parse(Object.fromEntries(formData));
    return teamService.invite(session.firmId, session.userId, input);
  });
```

### 3.2 Row-level ownership

Preparer 只能改自己 assignee 的任务：

```typescript
// modules/obligations/service.ts
export async function changeStatus(input: { id: string; next: Status }, session: AuthedSession) {
  return withFirmContext(session.firmId, (tx) =>
    tx.update(obligationInstances)
      .set({ status: input.next, lastChangedBy: session.userId, updatedAt: new Date() })
      .where(and(
        eq(obligationInstances.id, input.id),
        // preparer limits
        session.role === "preparer"
          ? eq(obligationInstances.assigneeId, session.userId)
          : undefined,
      ))
      .returning()
  );
}
```

### 3.3 RBAC 矩阵（对齐 PRD §3.6.3）

权限矩阵直接作为 **单一数据源** 写入 `auth/rbac-matrix.ts`，Server Action 代码读这个文件，永不散落多处：

```typescript
export const RBAC_MATRIX: Record<Action, Role[]> = {
  "team.invite":        ["owner"],
  "team.suspend":       ["owner"],
  "team.transfer":      ["owner"],
  "client.create":      ["owner", "manager", "preparer"],
  "client.delete":      ["owner", "manager"],
  "obligation.reassign":["owner", "manager"],
  "pulse.batch_apply":  ["owner", "manager"],
  "pulse.revert":       ["owner"],
  "migration.import":   ["owner", "manager"],
  "migration.revert":   ["owner"],
  "export.firm_audit":  ["owner", "manager"],
  "export.evidence_package": ["owner"],
  "priority.weights_edit":   ["owner"],  // Pro only
  // ... 完整列表
};
```

---

## 4. 租户隔离（三层防御）

### 4.1 Middleware 层

```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const session = await getToken({ req });
  if (!session && isProtected(req)) return redirectToLogin();

  // Firm slug 校验
  const firmSlug = extractFirmSlug(req.url);
  if (firmSlug && !userHasFirmMembership(session.sub, firmSlug)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next({
    headers: { "x-firm-slug": firmSlug ?? "" },
  });
}
```

### 4.2 ORM 层（firmContext）

见 §02 / §03：所有业务查询用 `withFirmContext(firmId, fn)` 包裹。

```typescript
// db/wrapper.ts · 开发期 lint 规则
// eslint-plugin-custom: 禁止直接 import { db } 在 modules/* 里使用 select/insert/update/delete。
// 只允许通过 withFirmContext(firmId, tx => tx.xxx) 调用。
```

### 4.3 RLS 层（§03.4）

数据库级最后防线，即使 ORM 误用也挡住。

---

## 5. PII 数据保护

### 5.1 最小必要数据（MVP）

| 字段 | 收 | 备注 |
|---|---|---|
| 客户名 | ✓ | 仅业务名称 |
| EIN | ✓ | "##-#######" 加密存储（`pgcrypto`）|
| 客户邮箱 | ✓ | 发 Readiness 用 |
| 州 / 县 / 实体 | ✓ | 匹配 Pulse 用 |
| num_partners / shareholders | ✓ | Penalty 计算 |
| estimated_tax_liability | 可选 | 用户手填 |
| SSN | ✗ | 粘贴时前端正则拦截 |
| 完整税额 / W-2 | ✗ | 不收 |
| 银行账号 | ✗ | 不收 |

### 5.2 加密

- **At rest**：Neon 自带 AES-256；EIN 字段额外用 `pgcrypto` 列级加密
- **In transit**：全站 TLS 1.2+（Vercel 强制）
- **Backups**：Neon 每日备份，保留 7 天
- **Keys**：env var 管理；生产走 Vercel env secrets；不进仓库

### 5.3 LLM PII 保护

```typescript
// modules/ai/pii.ts
export function redactPii(text: string, clients: Client[]): { masked: string; map: Map<string, string> } {
  const map = new Map<string, string>();
  let masked = text;
  clients.forEach((c, i) => {
    const placeholder = `{{client_${i + 1}}}`;
    map.set(placeholder, c.name);
    masked = masked.replaceAll(c.name, placeholder);
    if (c.ein) {
      const einPh = `{{ein_${i + 1}}}`;
      map.set(einPh, c.ein);
      masked = masked.replaceAll(c.ein, einPh);
    }
  });
  return { masked, map };
}
```

- Prompt 里只出现 `{{client_N}}` 占位符
- LLM 返回后由 `glassBoxGuard` 用 `map` 回填
- LLM 调用走 **ZDR endpoint**（OpenAI ZDR org / Azure OpenAI）
- `llm_logs` 记录 input hash，不记录 raw input

### 5.4 粘贴 SSN 拦截

```typescript
// modules/migration/pii-scrub.ts
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

export function detectSsn(rows: string[][]): Set<number> {
  const cols = new Set<number>();
  for (const row of rows) {
    row.forEach((cell, idx) => {
      if (SSN_REGEX.test(cell)) cols.add(idx);
    });
  }
  return cols;
}
```

命中 → 该列在 UI 强制 `IGNORE` + 红色警示 + 禁止用户手动改回。

---

## 6. Audit Event 规范

### 6.1 统一写入接口

```typescript
// modules/audit/writer.ts
export async function writeAudit(input: {
  firmId: string;
  actorId: string | null;
  entityType: string;
  entityId?: string;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
  reason?: string;
  ip?: string;
  userAgent?: string;
}, tx?: Transaction) {
  const client = tx ?? db;
  await client.insert(auditEvents).values({
    firmId: input.firmId,
    actorId: input.actorId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    beforeJson: input.before ? sanitize(input.before) : null,
    afterJson: input.after ? sanitize(input.after) : null,
    reason: input.reason,
    ipHash: input.ip ? hash(input.ip) : null,
    userAgentHash: input.userAgent ? hash(input.userAgent) : null,
  });
}
```

### 6.2 Action 枚举（对齐 PRD §13.2.1）

```typescript
export type AuditAction =
  // auth
  | "auth.login.success" | "auth.login.failed" | "auth.mfa.enabled" | "auth.session.revoked" | "auth.denied"
  // team
  | "team.member.invited" | "team.member.joined" | "team.member.role_changed" | "team.member.suspended" | "team.member.left"
  | "firm.owner.transferred"
  // client
  | "client.created" | "client.updated" | "client.deleted" | "client.reassigned"
  // obligation
  | "obligation.status_changed" | "obligation.readiness_changed" | "obligation.extension_decided"
  | "obligation.reassigned" | "obligation.penalty_overridden"
  // migration
  | "migration.imported" | "migration.reverted" | "migration.single_undo"
  // pulse
  | "pulse.applied" | "pulse.reverted" | "pulse.dismissed" | "pulse.snoozed"
  // rule
  | "rule.report_issue" | "rule.updated"
  // export
  | "export.csv" | "export.pdf" | "export.ics.feed_rotated" | "evidence_package.exported"
  // ask
  | "ask.query_run";
```

### 6.3 PII sanitize

`before_json` / `after_json` 在写入前对已知 PII 字段**hash 化**：

```typescript
function sanitize(obj: unknown): unknown {
  return mapObject(obj, (value, key) => {
    if (PII_FIELDS.has(key)) return hashPreserveLen(value as string);
    return value;
  });
}
const PII_FIELDS = new Set(["email", "ein", "ssn"]);
```

### 6.4 保留 + 匿名化

- 活跃数据：7 年（IRS 推荐）
- Firm 删除：`actor_id` 匿名化为 `deleted_user_<sha>`，事件保留
- GDPR 用户删除：`User` 软删 + `User.email = 'deleted+<id>@anon'` 不可反推

---

## 7. Client Readiness Portal 安全

（PRD §6B.4）

| 威胁 | 防护 |
|---|---|
| Token 泄露 | 32 字节签名 + 14 天过期 + 单客户绑定 |
| Token 枚举 | 长度 + rate limit（IP 10/min）+ Sentry 告警 |
| XSS from client_note | 服务端 sanitize + React 自动 escape |
| Bot submit | hCaptcha |
| 发错客户 | 客户侧页面显示 CPA + Firm + Client 三项，提供 "this isn't me" 上报 |
| PII 泄露 | 客户侧页面不显示 EIN / SSN / $ 金额 |

```typescript
// app/(embed)/readiness/[token]/page.tsx
export default async function ReadinessPortalPage({ params }: { params: { token: string } }) {
  const request = await readinessService.loadByToken(params.token);
  if (!request || request.status === "expired") return <ExpiredPage />;
  return <ReadinessForm request={request} />;  // 不传任何 firm / obligation internal id
}
```

---

## 8. Audit-Ready Evidence Package（§6C 工程落地）

### 8.1 打包 worker

```typescript
// modules/evidence-package/worker.ts
export const evidencePackageWorker = inngest.createFunction(
  { id: "evidence-package", retries: 2 },
  { event: "evidence-package.requested" },
  async ({ event, step }) => {
    const { firmId, scope, range, actorId } = event.data;
    await enforceOwnerRole(actorId, firmId);

    const s3Prefix = `audit/${firmId}/${Date.now()}-${crypto.randomUUID()}`;

    const manifest = await step.run("build-manifest", async () => {
      const m: Manifest = { files: [], sha256s: {} };
      m.files.push(await writeObligations(firmId, scope, range, s3Prefix));
      m.files.push(await writeAuditLog(firmId, range, s3Prefix));
      m.files.push(await writeAiDecisions(firmId, range, s3Prefix));
      m.files.push(await writePulseHistory(firmId, range, s3Prefix));
      m.files.push(await writeMigration(firmId, range, s3Prefix));
      m.files.push(await writeReadiness(firmId, range, s3Prefix));
      m.files.push(await writeRulesSnapshot(s3Prefix));
      m.files.push(await writeTeam(firmId, s3Prefix));
      for (const f of m.files) m.sha256s[f.key] = await sha256Of(f.key);
      return m;
    });

    const zipKey = await step.run("zip", () => streamZip(s3Prefix, manifest));
    const signature = await step.run("sign", () => signManifest(manifest));
    const row = await step.run("persist", () => writePackageRow({ firmId, actorId, scope, range, zipKey, sha256: signature }));
    await step.run("email", () => sendPackageEmail(actorId, row));
    await step.run("audit", () => writeAudit({ firmId, actorId, action: "evidence_package.exported", afterJson: { scope, range, sha256: signature } }));
  }
);
```

### 8.2 签名

- Phase 0：SHA-256 of `manifest.json` + Ed25519 服务端私钥签名
- Phase 1：公开校验脚本 `verify-duedatehq.py`
- Phase 2：RFC 3161 TSA（FreeTSA）接入

### 8.3 下载链接

- R2 pre-signed URL，7 天过期
- Single-use：下载后 flag `consumed=true`；二次访问 410
- 邮件附带 **OTP 密码**（6 位，15 分钟过期，防邮箱劫持）

---

## 9. WISP（Written Information Security Plan）

IRS Pub 5708 要求的 5 页 PDF，作为首发交付物。存 `docs/WISP-v1.0.pdf`。

包含：

1. 范围与数据分类
2. 物理 / 逻辑访问控制
3. 事件响应流程（含 Data Breach 72h 通知）
4. 员工培训 + 背景调查要求
5. 第三方供应商评估清单（Vercel / Neon / Resend / OpenAI ZDR / R2 ...）

Ops 每季度复审 → `OpsCadence.event_type='wisp_review'`。

---

## 10. 合规"红线"硬编码检查

CI 跑 eslint 规则：

| 规则 | 触发 |
|---|---|
| `no-raw-db-in-modules` | modules/*/service.ts 直接 import `db` 而非 `withFirmContext` |
| `no-ssn-in-schema` | schema 里出现 `ssn` / `social_security` 字段名 |
| `no-pii-in-llm-prompts` | prompts/*.md 含 `{{client_name}}` 未转占位符 |
| `audit-required-for-writes` | 所有 Server Action 必须 `writeAudit` |
| `role-matrix-source-of-truth` | Server Action 硬编码 role array → 警告，必须从 RBAC_MATRIX 读 |

---

## 11. Rate Limit

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const rl = {
  login:       new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.fixedWindow(5, "15 m") }),
  readiness:   new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.fixedWindow(10, "1 m") }),
  ask:         new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.fixedWindow(30, "1 m") }),
  api:         new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.fixedWindow(100, "1 m") }),
};
```

应用位置：
- 登录 magic link 请求（IP + email）
- Readiness Portal（IP）
- Ask DueDateHQ（user）
- Generic API（IP + user）
- Push subscribe（user）

---

## 12. Secret 管理

- 生产：Vercel env（按环境隔离：Production / Preview / Development）
- 轮换：VAPID 私钥 / OPENAI 密钥 / AUTH_SECRET / DB 密码每 90 天
- 仓库：`gitleaks` 检查 pre-commit hook
- CI：只读部署 token；永不在 actions 里 `echo $SECRET`

---

## 13. 事件响应（IR Playbook · 摘要）

| 事件 | 响应 |
|---|---|
| **数据泄露** | 1h 内安全通道告警 → 封锁泄露 surface → 72h 内通知受影响 firm + 相关监管机构 |
| **Pulse 错误推送** | 立即 Dismiss 该 Pulse → Retract ExceptionRule → 24h 内 Revert + 邮件 |
| **LLM 输出违规（客户举报）** | 下架涉及 AiOutput → 禁用对应 prompt_version → ops 复盘 |
| **第三方供应商 outage** | 走 §01 降级矩阵；状态页 status.duedatehq.com 实时更新 |

---

## 14. 合规目标路线图（对应 PRD §14）

| 里程碑 | 时间 |
|---|---|
| WISP v1.0 + E&O $2M | Phase 0 MVP |
| SOC 2 Type I 准备（控制项梳理） | Phase 1 末 |
| SOC 2 Type II 审计 | Phase 2 末 |
| RFC 3161 TSA 接入 | Phase 2 |
| ISO 27001 评估（视企业客户需求） | Phase 3 |

---

继续阅读：[07-DevOps-Testing.md](./07-DevOps-Testing.md)
