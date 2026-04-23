# 06 · Security & Compliance

> 对齐 PRD §13 + §3.6.3（RBAC 矩阵）+ §6C（Audit Package）。
> 核心纪律：**三层防御（Session / Scoped Repo / Lint）· 最小必要数据 · 审计永不删。**
> Auth 基座：**better-auth + Organization plugin + Access Control plugin**。

---

## 1. 威胁模型（STRIDE 速览）


| 威胁                  | 场景                            | 缓解                                                                |
| ------------------- | ----------------------------- | ----------------------------------------------------------------- |
| **S**poofing        | 伪冒 CPA 登录                     | Magic link + device/IP fingerprint；Owner TOTP 在真实试点前启用，Manager TOTP 随 Team Phase 1 强制 |
| **T**ampering       | 篡改 `current_due_date` / Pulse | Phase 1 Overlay 独立留痕不改 base；所有变更写 `audit_event`（永不删）              |
| **R**epudiation     | "不是我改的"                       | `audit_event` 记 actor + ip_hash + ua_hash                         |
| **I**nfo disclosure | 跨 firm 数据泄露                   | Middleware + `scoped(db, firmId)` + oxlint 三层                     |
| **D**oS             | Ask 恶意构造 query                | Rate Limit binding + DSL 白名单 + 3s 超时                              |
| **E**levation       | Preparer 跑 Owner 操作           | better-auth Access Control plugin 校验（Phase 1）                     |


---

## 2. Auth 设计（better-auth）

### 2.1 核心插件


| 插件                                    | 用途                                               |
| ------------------------------------- | ------------------------------------------------ |
| `magicLink`                           | 邮箱 magic link 登录（无密码）                            |
| `organization`                        | 多租户（= Firm）+ Member + Invitation + Active-org 切换 |
| 自定义 Access Control（`organization.ac`） | 四角色权限矩阵                                          |
| `twoFactor`（真实试点前 / Phase 1）      | TOTP MFA；Owner 在真实试点前强制，Manager 随 Team Phase 1 强制                    |


### 2.2 Session & Cookie

- Cookie：`httpOnly` · `secure` · `sameSite=lax`
- Session 存 D1；默认有效期 7 天
- `session.activeOrganizationId` = 当前 Firm；切换 Firm 走 `auth.api.setActiveOrganization`
- 双设备会话允许；Settings → Devices 列所有 session + "Sign out all"
- 新设备 / 新 IP → Phase 1 要求 step-up（TOTP 二次验证）

### 2.3 Invitation 流

- Owner 在 Settings → Team 发邀请 → better-auth 生成 token + 入 `invitation` 表
- 邀请邮件由 `sendInvitationEmail` hook 经 Resend 发出
- 接受：点链接 → `/api/auth/organization/accept-invitation/:token` → 自动加入并设为 active
- 拒绝 / 撤销：`cancelInvitation` / `rejectInvitation`
- 过期：默认 14 天

### 2.4 MFA（真实试点前 / Phase 1）

- `twoFactor` plugin；TOTP + 10 条 recovery codes
- 7 天 Demo 可跳过；真实 CPA 试点前 Owner 登录时若未开启 → 强制 setup wall
- `mfa_secret` AES-GCM 加密存储；key 来自 Worker secret

---

## 3. RBAC（Access Control · Phase 1 强制）

### 3.1 四角色 + 权限 statement（约束）

```ts
// packages/auth/permissions.ts（业务约束，不是示例）
const statement = {
  client:     ['create', 'read', 'update', 'delete'],
  obligation: ['read', 'update:status', 'update:assignee'],
  pulse:      ['read', 'approve', 'batch_apply', 'revert'],
  migration:  ['run', 'revert'],
  rule:       ['read', 'report_issue'],
  member:     ['invite', 'suspend', 'remove', 'change_role'],
  billing:    ['read', 'update'],
  audit:      ['read', 'export'],
  dollars:    ['read'],
} as const
```

### 3.2 角色权限矩阵


| 资源 · 动作                      | owner | manager            | preparer        | coordinator       |
| ---------------------------- | ----- | ------------------ | --------------- | ----------------- |
| `client.*`                   | ✓     | create/read/update | read/update     | read              |
| `obligation.update:status`   | ✓     | ✓                  | ✓（仅自己 assignee） | —                 |
| `obligation.update:assignee` | ✓     | ✓                  | —               | —                 |
| `pulse.approve`              | ✓     | ✓                  | —               | —                 |
| `pulse.batch_apply`          | ✓     | ✓                  | —               | —                 |
| `pulse.revert`               | ✓     | —                  | —               | —                 |
| `migration.run`              | ✓     | ✓                  | —               | —                 |
| `migration.revert`           | ✓     | —                  | —               | —                 |
| `member.invite`              | ✓     | ✓（≤ preparer）      | —               | —                 |
| `member.change_role`         | ✓     | —                  | —               | —                 |
| `billing.*`                  | ✓     | —                  | —               | —                 |
| `audit.export`               | ✓     | ✓                  | —               | —                 |
| `dollars.read`               | ✓     | ✓                  | ✓               | 默认 ✗；firm 开关打开才 ✓ |
| `export.evidence_package`    | ✓     | —                  | —               | —                 |


### 3.3 权限检查（P0 Owner-only，Phase 1 完整矩阵）

- 7 天 Demo / P0 早期：单 Owner 账号，`member.role='owner'`；仍必须检查 session、active firm、tenant scope，且所有写操作写 audit
- 真实试点前：Owner MFA 开启；危险写操作（migration revert / pulse apply / export）至少校验 owner role
- Phase 1 在每个 oRPC procedure middleware 中加 `authed.use(requirePermission('client.delete'))`，启用四角色矩阵
- 失败 → 写 `audit_event(action='auth.denied', reason=...)` + 返回 `ORPCError('FORBIDDEN')`

---

## 4. 租户隔离（D1 无 RLS · 三道工程防线）

### 4.1 Middleware 层

- Hono middleware 从 better-auth session 读 `activeOrganizationId`
- 不存在 → 401；存在但 `member.status !== 'active'` → 403
- 注入 `c.set('firmId', ...)` + `c.set('scoped', scoped(db, firmId))`

### 4.2 Repo 工厂层（约束）

- `scoped(db, firmId)` 是 `packages/db` 唯一对外导出
- 所有 repo 内部硬编码 `WHERE firm_id = :firmId`
- `firmId` 只能从 middleware 注入，不能从 procedure `input` 接

### 4.3 oxlint 层

`oxlintrc.json`（**约束**）：

```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["@duedatehq/db/schema", "@duedatehq/db/schema/*"],
          "message": "Use context.scoped instead of directly importing schema in procedures."
        }
      ]
    }]
  },
  "overrides": [
    {
      "files": ["packages/db/**"],
      "rules": { "no-restricted-imports": "off" }
    }
  ]
}
```

---

## 5. PII 数据保护

### 5.1 最小必要数据（MVP）


| 字段         | 收？   | 备注                                     |
| ---------- | ---- | -------------------------------------- |
| 客户姓名       | ✓    | 必要；显示用                                 |
| EIN        | ✓    | 必要；做去重                                 |
| 客户邮箱       | ✓    | 用于 Reminder / Readiness                |
| 客户地址       | ✗    | 不收；税务计算不依赖                             |
| SSN / ITIN | ✗    | **严禁**，任何理由都不收                         |
| 客户财务数据     | ✗    | 仅 `estimated_tax_liability` 可选输入（分级存储） |
| IP / UA    | hash | `sha256(ip)` + `sha256(ua)`；不存明文       |


### 5.2 进 LLM 之前的 PII 占位

- `client.name` / `client.ein` / `client.email` 在 prompt 中替换为 `{{client_N}}` / `{{ein_N}}` / `{{email_N}}`
- 保留 `piiMap` 在服务端内存
- LLM 返回后 Guard 回填
- `llm_log.input_hash` 存 sha256，不存原文
- 这是 IRC §7216 + FTC Safeguards Rule 的工程落地

### 5.3 加密

- At rest：D1 底层 encryption at rest 由 Cloudflare 提供
- In transit：HTTPS / TLS 1.3
- 应用层敏感字段（`mfa_secret`，Phase 1）：AES-GCM-256，key 来自 Worker secret
- R2 对象默认加密；Audit ZIP（Phase 1）额外 AES-256 加客户提供的密码（可选）

---

## 6. Audit Event 规范

### 6.1 Action 枚举（只增不删）

```
auth.login.success / auth.login.failed / auth.denied / auth.mfa.setup
client.create / client.update / client.delete / client.restore
obligation.status.change / obligation.assignee.change
pulse.ingest / pulse.extract / pulse.approve / pulse.reject / pulse.apply / pulse.revert
migration.import / migration.revert
exception.apply / exception.revert           ← Phase 1
rule.updated / rule.verified                 ← Phase 1（Rules-as-Asset）
member.invite / member.accept / member.suspend / member.remove / member.change_role
billing.subscribe / billing.cancel           ← Phase 1
export.evidence_package / export.firm_audit
ai.refusal / ai.guard_failed
```

### 6.2 字段

- `firm_id` · `actor_id`（可为 NULL，系统任务）
- `entity_type` · `entity_id`
- `action`
- `before_json` · `after_json`（完整快照；字段差异由前端展示层计算）
- `reason`
- `ip_hash` · `ua_hash`
- `created_at`

### 6.3 纪律

- `audit_event` **硬约束不删**；任何 migration / 运维脚本禁止 `DELETE FROM audit_event`
- 写入永远走 `packages/db/audit-writer.ts` 的 `writeAudit(input, tx?)`，不允许其他入口
- Pulse Apply / Migration Import 等批量操作必须在同一事务写 audit

---

## 7. Client Readiness Portal 安全（Phase 1）

- Magic link token ≥ 32 bytes 随机
- URL 形态：`/portal/:orgSlug/:requestId?t=<token>`
- 过期默认 14 天；可撤销（`revoked_at`）
- 客户响应不登录，仅凭 token；每次写 `audit_event(action='readiness.client_response')`
- 速率限制：同一 token 每分钟 ≤ 10 次
- CSP 严格：不允许客户响应页加载任何外部脚本

---

## 8. Audit-Ready Evidence Package（Phase 1）

- 一键导出 ZIP：包含 PDF 报告 + CSV audit trail + SHA-256 签名文件
- 生成过程：Queue 触发 → Worker 拉数据 → 打包 → 上传 R2 → 返回 signed URL（7 天过期）
- 签名：
  - 文件清单 JSON + 每个文件 sha256 → 整体清单 sha256
  - 预留 Phase 2 接 RFC 3161 TSA（可信时间戳）
- 权限：仅 `owner` 可导出

---

## 9. WISP（Written Information Security Plan）

IRS Publication 4557 要求。7 天 Demo 可以提交 1 页 draft；真实 CPA 试点 / 4 周 MVP 必须交 5 页 WISP v1.0，放仓库 `docs/compliance/WISP-v1.pdf`，内容要点：

- 数据分类（PII / 财务 / 审计）
- 访问控制（better-auth RBAC）
- 加密策略（TLS + at-rest）
- 备份与恢复（D1 time-travel + R2 版本化）
- 事故响应流程（§13）
- 员工培训记录（Phase 1 团队扩张时启用）
- 年度审查制度

---

## 10. 合规"红线"硬编码检查

在 `packages/ai/guard.ts` 的黑名单里固化：


| 红线                            | 触发     | 处理                           |
| ----------------------------- | ------ | ---------------------------- |
| "your client qualifies"       | AI 下结论 | refusal + audit `ai.refusal` |
| "no penalty will apply"       | 承诺无罚款  | refusal                      |
| "this is tax advice"          | 自称税务建议 | refusal                      |
| "ai confirmed"                | 伪权威    | refusal                      |
| "this deadline is guaranteed" | 绝对承诺   | refusal                      |
| SSN 正则 `/\d{3}-\d{2}-\d{4}/`  | 用户误输入  | 前端拦截 + 后端二次校验拒绝              |
| 信用卡号正则（Luhn）                  | 误输入    | 同上                           |


---

## 11. Rate Limit（Cloudflare 原生 binding）


| 场景                    | 限制                             |
| --------------------- | ------------------------------ |
| 登录 magic link 请求      | 同 IP 5/min · 同邮箱 3/min         |
| Magic link 回调         | 同 token 1 次（消费即失效）             |
| oRPC procedure（普通）    | 每 user 120/min                 |
| oRPC procedure（AI 调用） | 每 user 20/min · 每 firm 200/day |
| Pulse Approve         | 每 user 30/min                  |
| Readiness Portal 响应   | 同 token 10/min                 |
| Webhook 入站            | 按签名源 60/min                    |


超限返回 `429` + `Retry-After`。

---

## 12. Secret 管理

- **本地**：`.env.local`（gitignore），1Password Shared Vault 同步给团队
- **Staging / Production**：`wrangler secret put <KEY>`
- **轮换**：季度轮换 `AUTH_SECRET` / `VAPID_PRIVATE_KEY`；轮换流程先新增 secondary → 验证 → 删除 primary
- **扫描**：pre-commit hook 跑 `gitleaks` 扫明文 key；CI 阶段再扫一次

---

## 13. 事件响应（IR Playbook · 摘要）


| 级别  | 定义                              | 响应 SLA                       |
| --- | ------------------------------- | ---------------------------- |
| P0  | 数据泄露 / 账号被盗 / 全站宕机              | 15 分钟响应 · 4 小时缓解 · 24 小时 RCA |
| P1  | 单租户数据错乱 / Auth 异常 / AI 发出合规红线内容 | 1 小时响应 · 24 小时缓解             |
| P2  | 个别 feature 故障                   | 次工作日响应                       |


响应步骤：Detect（Sentry 告警 / 用户上报）→ Contain（Wrangler rollback 或 feature flag off）→ Eradicate → Recover → Lessons（写 `docs/incidents/YYYYMMDD-<slug>.md`）。

---

## 14. 合规目标路线图


| Phase   | 目标                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------- |
| 7 天 Demo | PII 最小化 · TLS · Audit 不删 · Glass-Box Guard · Secret 管理 · WISP 1-page draft |
| Phase 0 | Owner-only tenant isolation · Owner MFA before real pilot · WISP v1.0 · dangerous write role check · `llm_logs` |
| Phase 1 | 完整四角色 RBAC · Manager MFA · Audit-Ready Evidence Package · CSP strict · Readiness Portal 安全 |
| Phase 2 | RFC 3161 TSA 可信时间戳 · SOC 2 Type I 审计 · Pen-test                                                   |


---

继续阅读：[07-DevOps-Testing.md](./07-DevOps-Testing.md)
