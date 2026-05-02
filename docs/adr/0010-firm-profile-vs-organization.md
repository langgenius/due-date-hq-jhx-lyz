# 0010 · firm_profile 独立业务租户表（与 Better Auth `organization` 解耦）

## 背景（Context）

Better Auth 的 `organization` 插件提供身份层能力：`organization / member /
invitation / activeOrganizationId / roles / permissions`。它**不**覆盖 SaaS
业务租户应有的 `plan / seatLimit / timezone / status / billingCustomerId /
subscriptionId / usage entitlement` 这些字段。

PRD §3.6.2 把 `Firm` 定义为：

```
Firm (tenant)
  id, name, timezone, plan (solo|firm|pro),
  seat_limit,                    -- Solo 1 / Pro 5 / Firm 10+ contract-defined
  owner_user_id,                 -- Firm 的主负责人（转让时修改）
  created_at, deleted_at (soft)
```

2026-05-02 产品口径补充：`Firm` 现在也是 pricing workspace 的一等 entitlement。
Solo / Pro 默认只包含 1 个 active firm；Firm plan 才包含 contract-defined multiple
active firms / offices。`seatLimit` 仍是每个 firm 内的成员席位限制，不等于 active
firm count。完整产品口径见
`docs/product-design/billing/01-firm-entitlement-pricing.md`。

也就是说 PRD 第一性把这些字段视为 **first-class**（结构化、可索引、可在需要时
通过 schema / migration 加 CHECK 约束、可加 FK），不是 metadata blob。当前 D1
落地只启用 Drizzle / TypeScript 层 enum 校验，暂未生成 DB-level CHECK；细节以
`docs/dev-file/03-Data-Model.md` 的 "关于 enum / CHECK" 小节为准。

落地时如果偷懒把它们塞 `organization.metadata`（一个 untyped TEXT JSON 列），
会有四个具体后果：

1. PRD §3.6.4 邀请席位灰化、§3.6.8 plan 降级 suspend、§3.6.4 默认 assignee =
   owner —— 这些 P1 逻辑都要按 `plan` / `seat_limit` 查询，TEXT JSON 不可索引
2. CHECK 约束不能写在 metadata 字段上（plan 取值越界只能在应用层兜底）
3. Stripe billing 接入时，`billingCustomerId` 要做唯一索引、要支持双
   向回查 customer → firm，metadata 模型完全做不到
4. 一旦上线 metadata-as-business-data，再拆出来要写 backfill 脚本 + 兼容期双写
   - 改 hook，三件套

## 决策（Decision）

新建独立的业务租户表 `firm_profile`，PK 复用 `organization.id`：

```
identity layer (Better Auth)        business tenant (we own)        business data
─────────────────────────             ──────────────────────         ─────────────
organization.id (PK)  ◀──────────  firm_profile.id (PK,FK cascade)  ◀── firm_id (FK)
member, invitation                  plan / seatLimit / timezone        clients,
                                    ownerUserId / status                obligations,
                                    createdAt / updatedAt /             pulse, ...
                                    deletedAt
```

**关键不变量**：`firmId == organization.id == firm_profile.id` —— 三个 id 永远
同一值，所有现有的 `firm_id` / `scoped(db, firmId)` / `session.activeOrganizationId`
心智不动。

### 落地细节

- Schema：`packages/db/src/schema/firm.ts`；migration `0001_tidy_shiva.sql`
- 写入路径（正常）：`apps/server/src/organization-hooks.ts` 暴露
  `buildOrganizationHooks(db)`，在 better-auth `organizationHooks.afterCreateOrganization`
  里 `db.insert(firmSchema.firmProfile).values({...})`
- 写入路径（自愈）：`apps/server/src/middleware/tenant.ts` 在缺失时 lazy create
  —— 读 `organization` 行 + 找 `member.role='owner'` 最早一条 → `INSERT ... ON
CONFLICT(id) DO NOTHING`（**幂等**：并发首请求场景下两个请求都跑 INSERT，输的
  那个 no-op 然后 reload 拿到赢的那个写下的行，避免了 PK 冲突外溢成 500）。
  代价：缺失场景的请求多 1 次 select + 1 次 insert，下次起回正常路径
- Hook 失败语义：**swallow + log**（不抛）。better-auth 不会回滚 org 行，
  抛错只让 onboarding 提交看到一个 opaque 错误且 org 已建出来；lazy create
  正是为这个场景准备的真正兜底。
- 业务状态门：`firm_profile.status != 'active'` → 返
  `ErrorCodes.TENANT_SUSPENDED`（PRD §3.6.8 plan 降级 suspend 路径）
- 工程层 `packages/auth` 不依赖 `@duedatehq/db`（强约束，
  `scripts/check-dep-direction.mjs` 守护）；hook 闭包归 server 层组装

### 命名映射（PRD §3.6.1.0）

| 层                    | 标识                                                        |
| --------------------- | ----------------------------------------------------------- |
| Better Auth DB / SDK  | `organization / member / invitation / activeOrganizationId` |
| 业务租户表            | `firm_profile`（PK = organization.id）                      |
| 业务表 tenant 列      | `firm_id` → `firm_profile.id`                               |
| 代码标识              | `firmId / tenant / scoped(db, firmId)`                      |
| Hono context          | `c.var.tenantContext`（plan/seatLimit/...）/ `c.var.firmId` |
| PRD / dev-file 行文   | `Firm`                                                      |
| 用户可见 EN（默认）   | `Practice`（onboarding/错误/空态/营销）                     |
| 用户可见 EN（管理类） | `Firm`（Settings/权限/计费/SSO policy）                     |
| 用户可见 ZH（统一）   | 事务所                                                      |

## 备选方案（Alternatives）

- **(a) 继续 `organization.metadata` 承载业务字段** —— **拒绝**，理由见上面四
  条具体后果。
- **(b) 完全独立 id + `organization_id unique` FK**（不复用 PK）—— **拒绝**。
  会把 `firmId` 单一语义打成两个值（业务 id vs 身份 id），所有 `scoped(db,
firmId)` 的调用点都得选哪个 id。PK 复用换来的"一个值贯穿所有层"是第一性
  的可读性收益；P1 即便要把 firm_profile 与 organization 解耦也是少数派
  场景，那时单独写一个 ADR 反向重构。
- **(c) 在 `organization` 表里 ALTER 添加业务字段** —— **拒绝**。`organization`
  是 Better Auth 身份语义表；本仓库虽然手工维护 schema/migration，但把业务
  字段混进去仍会让身份插件升级、权限语义和业务状态耦合在同一张表里。分表
  让业务租户字段 first-class，同时不污染插件管理的身份模型。

## 后果（Consequences）

### 好处

- 业务租户字段 first-class（可索引、可在需要时通过迁移补 CHECK、可 FK），P1 逻辑可以直接用
- `firmId` 单一语义不变，下游零改动
- Billing 接入时 `billing_customer_id` / `billing_subscription_id` 已直接 ALTER 到
  `firm_profile`，但只作为业务缓存；Better Auth `subscription` 表和 Stripe webhook
  是订阅事实来源
- middleware 拿到 `tenantContext` 后，procedures 不需要再查 firm_profile

### 代价

- 每次 RPC 多 1 次 `firm_profile` SELECT（lazy create 场景再多 1 次 INSERT）
- 多了一张表 + 一个写入 hook + 一段 lazy create 兜底逻辑
- 团队需要记住"plan/timezone 不在 organization.metadata"

### Follow-ups

> 这是本期为了维持范围而**有意识推迟**的决策点。下次接相关功能时直接读这一段。

| ID   | 触发时机                                                    | 内容                                                                                                                                                             |
| ---- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FU-1 | P1 接邀请流（PRD §3.6.4）                                   | 已完成后端网关：`membershipLimit` 由 server 注入并读取 `firm_profile.seatLimit`；`beforeAddMember` 硬约束改为 role / active firm / seat guard；UI 仍在 P1 后续   |
| FU-2 | 第一个 repo 需要读取租户业务字段（如 `plan` / `seatLimit`） | 再评估是否把 `scoped(db, firmId)` 签名扩成 `scoped(db, tenant: TenantContext)`；当前 clients / obligations / migration repo 只需要隔离键，保持 `firmId` 签名更小 |
| FU-3 | P1 onboarding 多步化                                        | 让用户在 onboarding 选 timezone（默认 `America/New_York` 是 P0 ICP 假设，PRD §2.1）；同步加 weekly start day 等 firm 级偏好                                      |
| FU-4 | Stripe billing                                              | 已完成：Better Auth Stripe plugin 写 `subscription` 表，webhook callback 同步 `firm_profile.plan / seat_limit / billing_*`；后续只补 downgrade/cancel 产品策略   |
| FU-5 | P1 Owner 转让（PRD §3.6.1）                                 | `ownerUserId` 改 RESTRICT FK 不再合适，要走应用层事务（先转让再删 user）                                                                                         |
| FU-6 | P1 Coordinator 角色（PRD §3.6.3）                           | 加 `coordinator_can_see_dollars boolean DEFAULT false` 列                                                                                                        |
| FU-7 | P1 默认 assignee（PRD §3.6.8）                              | 加 `default_assignee_user_id text → user.id NULL` 列                                                                                                             |

## 状态（Status）

accepted (2026-04-24)
