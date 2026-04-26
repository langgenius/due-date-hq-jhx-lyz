---
title: '首次登录 Practice onboarding + 业务租户层闭环'
date: 2026-04-24
plan: '/.cursor/plans/first-login_firm_onboarding_787856ab.plan.md'
updates:
  - note: 'Updated apps/app workspace references.'
---

# 首次登录 Practice onboarding + 业务租户层闭环

## 背景

当前 Better Auth `organization` 插件已经接入（包括 schema、middleware、tenant
gate、scoped repo factory），但前端没注册 `organizationClient()`，没有 onboarding
路由，没有 firm 创建路径。结果是用户首次 Google 登录后 `session.activeOrganizationId`
为空 → 任何业务 RPC 直接被 `tenantMiddleware` 401 `TENANT_MISSING`。

同时 PRD §3.6.2 把 `plan / seatLimit / timezone / ownerUserId / status` 定义为
first-class 字段（不是 metadata blob），但代码层一直没建 `firm_profile` 表 —— 这
些字段无处可写。我们曾计划"先塞 `organization.metadata`、回头再拆"，但这是反模式
上线，会在 P0-23 Pay-intent 接 Stripe 时再付一次迁移代价。

本次把上面两条同时收敛：

- 建立"身份层 / 业务租户层 / 业务数据层"三层架构边界（ADR
  [`0010-firm-profile-vs-organization.md`](../adr/0010-firm-profile-vs-organization.md)）
- 落地首次登录的 Practice onboarding 单步流程
- 产品文案落地 Practice / Firm / 事务所 双层命名（PRD §3.6.1.0）
- 工程层不引入翻译层 —— `firmId / organization / firm_profile` 三个 id 永远同值

## 做了什么

### 1. firm_profile 表

新建 [`packages/db/src/schema/firm.ts`](../../packages/db/src/schema/firm.ts) +
migration `packages/db/migrations/0001_tidy_shiva.sql`。

- PK 复用 `organization.id`（`firmId == organization.id == firm_profile.id`）
- 字段：`id / name / plan ('solo'|'firm'|'pro') / seatLimit / timezone / ownerUserId /
status ('active'|'suspended'|'deleted') / createdAt / updatedAt / deletedAt`
- FK：`id → organization.id ON DELETE cascade`、`owner_user_id → user.id ON DELETE
restrict`
- billing 字段（`billingCustomerId / billingSubscriptionId`）/ RBAC 字段
  （`coordinatorCanSeeDollars`）/ 默认 assignee 等 P1 字段**故意不预占**（D1 加
  列零成本，等真用到再 ALTER；ADR 0010 Follow-ups 列出来了）

### 2. TenantContext 类型，但暂不动 scoped 签名

- [`packages/db/src/types.ts`](../../packages/db/src/types.ts) 新增 `TenantContext`
  接口 + `FirmProfile` 类型导出
- **不动** `ScopedRepo` 和 `scoped(db, firmId)` 签名 —— 当前 7 个业务 repo 都是
  `unimplementedRepo` Proxy，没有任何业务消费 `tenant.plan`。提前改签名 = 改
  类型 + 改测试 mock，纯类型工作零业务收益
- 等首个真实 repo（clients / obligations）落地时一并合并改造（ADR 0010 FU-2）

### 3. Better Auth 插件收紧 + hook 闭包搬到 server 层

[`packages/auth/src/index.ts`](../../packages/auth/src/index.ts):

- `organizationLimit: 1`（PRD §3.6.1 一邮箱一 Firm）
- `membershipLimit: 5`（= PRD Firm Plan seat_limit；P0 单 Owner 由 invitationLimit:0
  - beforeAddMember 双层兜底，membershipLimit 只是上限安全网）
- `invitationLimit: 0` + `disableOrganizationDeletion: true`
- 暴露 `createAuthPlugins({ email, organizationHooks })` 入参，hook 闭包由 server
  层注入 —— 这是因为 [`scripts/check-dep-direction.mjs`](../../scripts/check-dep-direction.mjs)
  禁止 `packages/auth` 依赖 `@duedatehq/db`，hook 要写 firm_profile 必须在 server 层

[`apps/server/src/organization-hooks.ts`](../../apps/server/src/organization-hooks.ts) 新增
`buildOrganizationHooks(db)` factory：

- `afterCreateOrganization` —— 同请求 INSERT 一行 firm_profile
- `beforeAddMember` —— 非 owner 抛 `APIError('FORBIDDEN')`

[`apps/server/src/auth.ts`](../../apps/server/src/auth.ts) 调 `createAuth({ ...,
organizationHooks: buildOrganizationHooks(db) })`。

### 4. tenantMiddleware 升级 + lazy create 自愈

[`apps/server/src/middleware/tenant.ts`](../../apps/server/src/middleware/tenant.ts)
新流程：

```
1) member.status='active' 校验（既有）
2) firm_profile 加载
3) 若缺失 → lazy create
   a. organization 行存在 → 找 member.role='owner' 最早一条作 ownerUserId
   b. organization 行不存在 → 401 TENANT_MISSING（stale activeOrganizationId）
   c. 缺失任何 owner member → fallback 当前 userId + console.warn 监控
4) firm_profile.status != 'active' → 403 TENANT_SUSPENDED（PRD §3.6.8）
5) 注入 c.var.tenantContext + c.var.scoped
```

[`packages/contracts/src/errors.ts`](../../packages/contracts/src/errors.ts) 加
`TENANT_SUSPENDED` 错误码；[`apps/server/src/env.ts`](../../apps/server/src/env.ts)
`ContextVars` 加 `tenantContext?: TenantContext`。

### 5. 默认名派生工具

新建 [`packages/core/src/practice-name.ts`](../../packages/core/src/practice-name.ts)：

- `derivePracticeName(input, fallback)` —— 永远返回非空可提交字符串
  - 自定义邮箱域名 → titleCase + 缩写词大写（`bright-cpa.com` → `Bright CPA`）
  - 否则人名（`Alex Chen`，**不再加** `'s Firm/Practice` 后缀 —— 系统硬凑感）
  - 兜底 → caller 注入的 i18n 占位串（`My Practice` / `我的事务所`）
- `slugifyPracticeName(name)` —— kebab-case body + `crypto.getRandomValues` 6-char
  base32 子集后缀（去 0/O/1/I/L 视觉混淆）；不做提交前 unique pre-check，依赖 DB
  约束 + 客户端 catch unique violation 单次重试

### 6. 前端

- [`apps/app/src/lib/auth.ts`](../../apps/app/src/lib/auth.ts) 注册
  `organizationClient()` plugin
- [`apps/app/src/router.tsx`](../../apps/app/src/router.tsx) `protectedLoader` 缺
  `activeOrganizationId` 时跳 `/onboarding?redirectTo=...`；新增 `/onboarding`
  顶层路由 + `onboardingLoader`（对称 `guestLoader`，复用 `pickSafeRedirect` 防
  open redirect）
- 新建 [`apps/app/src/routes/onboarding.tsx`](../../apps/app/src/routes/onboarding.tsx) ——
  单卡片 Confirm your practice profile 表单：
  - input 加 `required + minLength=2 + trim>=2` 客户端校验
  - fallback 在组件层注入（`t\`My Practice\``）—— 不在 loader 注入（loader 跑在
    React 树外没有 i18n context）
  - 提交：`organization.create({ name, slug })` → catch unique slug 一次重试 →
    `setActive({ organizationId })` → `navigate(redirectTo)`

### 7. 文案双层命名落地

按 PRD §3.6.1.0：

| 文件                                      | 改                                                                                 | 语境                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| `apps/app/src/routes/settings.tsx` L35    | `Workspace defaults` → `Firm settings`                                             | 管理类 → Firm                  |
| `apps/app/src/routes/settings.tsx` L48/58 | `Firm profile` / `Firm name` → `Practice profile` / `Practice name`                | section 是日常感知 → Practice  |
| `apps/app/src/lib/i18n-error.ts`          | `TENANT_MISSING` / `TENANT_MISMATCH` workspace → practice；新增 `TENANT_SUSPENDED` | 错误日常感知 → Practice        |
| `apps/app/src/routes/_layout.tsx` L344    | `Phase 0 demo workspace` → `Phase 0 demo practice`                                 | 品牌副标 → Practice            |
| `apps/app/src/routes/login.tsx` 多处      | workspace → practice；保留 SSO policy 的 `firm`                                    | 营销 → Practice，policy → Firm |

中文 catalog 22 条新词全部翻成"事务所"（不区分 Practice/Firm —— 中文里硬造
"执业"作名词比"事务所"生硬）。

### 8. 测试

| 文件                                         | 范围                                                                                                                                                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/practice-name.test.ts`    | 派生函数表驱动 + slugify 同名两次得不同 slug + 截断 + 去 diacritics                                                                                                                                              |
| `packages/db/src/schema/firm.test.ts`        | drizzle `getTableConfig` 反射：表名 / 列 / 默认值 / enum / FK + cascade/restrict                                                                                                                                 |
| `apps/server/src/middleware/tenant.test.ts`  | 8 场景：缺 firmId / 缺 userId / membership 不存在 / membership suspended / firm_profile suspended / 正常路径 / **lazy create + ownerUserId 取 owner 最早** / **缺所有 owner 回退 userId + warn** / 删 org orphan |
| `apps/server/src/organization-hooks.test.ts` | hook factory 纯单测：`afterCreateOrganization` 写 firm_profile 入参形状 / swallow + log on insert error / `beforeAddMember` 非 owner 抛 APIError                                                                 |
| `apps/app/src/router.test.ts`                | `pickSafeRedirect` 防外站 + `protectedLoader` / `onboardingLoader` / `guestLoader` 各三态                                                                                                                        |

汇总：`@duedatehq/core` 18 + `@duedatehq/db` 10 + `@duedatehq/server` 25 +
`@duedatehq/app` 26 + `@duedatehq/auth` 1 + `@duedatehq/contracts` 2 +
`@duedatehq/ai` 1 = 83 个测试全绿。

### 9. 文档

- [`docs/PRD/DueDateHQ-PRD-v2.0-Part1A.md`](../PRD/DueDateHQ-PRD-v2.0-Part1A.md) §3.6.1
  顶部插入 §3.6.1.0 命名规范；`User.firm_id` shortcut 标 `⚠ deprecated as of 2026-04-24`
- [`docs/dev-file/00-Overview.md`](../dev-file/00-Overview.md) §9 术语简表追加
  firm_profile / tenantContext / Practice-Firm-事务所 / lazy create 自愈
- [`docs/dev-file/03-Data-Model.md`](../dev-file/03-Data-Model.md) §2.1.b 新增
  firm_profile 小节（结构 + 与 organization 关系 + 写入时机 + 加列原则）
- 新写 [`docs/adr/0010-firm-profile-vs-organization.md`](../adr/0010-firm-profile-vs-organization.md)
  含 `Consequences > Follow-ups` 7 条 P1 任务

## 为什么这样做

### 为什么 Plan B（一步 onboarding）而不是 A（静默自动建）

A 把"创建 firm"做成完全无感的 server hook，但 B 把这一步留给用户，理由：

1. PRD §6A.11 定义的"首次登录强制空态"是给 Migration Copilot（P0-2）和
   Onboarding AI Agent（P1-27）的位置 —— A 会让用户被两个空态打两次
2. CPA 看到名字预填正确比看到一个不知道哪儿冒出来的"Sarah Chen's Firm"安心
3. B 的成本只多一个表单，且文案是业务化的（"Confirm your firm profile"，不是
   "Setup workspace"）

### 为什么 firm_profile 现在做（不延后）

- 不做就只能塞 `organization.metadata`，next sprint 拆要付迁移成本
- `afterCreateOrganization → INSERT firm_profile` 跟 `beforeCreateOrganization →
写 metadata` 是同一行 hook，工作量等价
- PRD §3.6.4 邀请席位灰化等 P1 逻辑要按 plan 查询，metadata TEXT 不可索引

### 为什么 Practice / Firm / 事务所 三套词

- `Practice` 对 solo CPA 比 `Firm` 自然（一个人也叫 practice）
- `Firm` 在管理类语境（Settings / 权限 / 计费 / SSO policy）更准确（"my practice
  settings" 听起来像个人偏好，"firm settings" 是事务所级配置）
- 中文统一"事务所"是因为"执业"作中文名词不自然，CPA 中文圈对"事务所"接受度
  100%

### 为什么 hook 失败 swallow + log

- better-auth 不会回滚 organization 行（确认过源码），抛错只让 onboarding 提交看
  到 opaque 错误且 org 已建出来
- lazy create 是为这个场景准备的真兜底，next request 自动修复
- 选 throw 会引入"用户看到错误页 + 后台 org 已存在 + 重试又被 organizationLimit:1
  挡住"的死锁
- P1 接 invitation 流时如果决策反转切 throw，需要重新评估（Follow-up 写进 ADR
  0010 FU-1）

## 偏离 plan 的地方

> plan 要求每条偏离含：plan 行号 / 实际实现 / 原因。

1. **`test-auth-hook` todo 文件位置不在 packages/auth/src/auth.test.ts**
   - plan: `test-auth-hook` 行 47–49 写"扩展 packages/auth/src/auth.test.ts"
   - 实际: 新建 [`apps/server/src/organization-hooks.test.ts`](../../apps/server/src/organization-hooks.test.ts)
   - 原因: 工厂 `buildOrganizationHooks` 在 apps/server 层（导入 firm_profile schema），
     packages/auth 不能跨层 import → 测试必须放 apps/server，否则违反
     `scripts/check-dep-direction.mjs`

2. **`test-firm-schema` todo 没用 vitest-pool-workers + 真实 D1**
   - plan: `test-firm-schema` 行 38–40 写"在 vitest-pool-workers D1 验证 INSERT/SELECT、
     enum 约束、PK FK cascade、user FK restrict、updatedAt 触发"
   - 实际: 用 drizzle 的 `getTableConfig` 做 schema 反射断言（10 个测试），FK cascade /
     restrict / enum 都靠反射对照，**不在真实 D1 跑**
   - 原因: `packages/db` 当前没有 vitest-pool-workers + miniflare D1 的配置，新加只
     为这一张表的 SQL 行为验证收益不抵成本（migration SQL 由 drizzle-kit 生成 +
     视觉 review 已可信）。Follow-up：等业务表（clients / obligations）落地需要真
     实 D1 测试时，一起把 packages/db 的 vitest-pool 配齐
   - 风险评估: ON DELETE cascade / restrict 行为依赖 SQLite 引擎实现，反射只能保证
     drizzle 模型 → SQL 生成的对应正确性，不能保证 SQLite 真的执行该行为。如果未来
     发现行为差异，加 D1 测试是单点改动

3. **`tighten-org-plugin` todo 改 `createAuthPlugins` 签名为 hooks 注入而非 plugin
   array 注入**
   - plan: 行 11–13 写"暴露 createAuthPlugins({ email, organizationHooks }) 入参"
   - 实际: 完全按 plan 实现 `createAuthPlugins({ email, organizationHooks })`；
     **额外**：`createAuth` 的 `CreateAuthDeps` 也加了 `organizationHooks` 字段
     直接转发，**没有**接受 `plugins` 数组 override（避免 organization plugin 的
     强类型 `$Infer.Schema.activeOrganizationId` 在 `readonly AuthPlugin[]` 上被
     擦除）
   - 原因: 第一版尝试加 `plugins?: readonly AuthPlugin[]` override，结果 `[
...plugins]` 把 organization plugin 的强类型打成 generic，`session
.activeOrganizationId` 在 8 处下游全 TS 报错。换成 deps 字段直转是干净的

4. **`packages/db/src/firm.test.ts` 物理位置移出 `schema/` 目录**
   - plan: 行 38–40 写 `packages/db/src/schema/firm.test.ts`
   - 实际: 文件落在 `packages/db/src/firm.test.ts`（同一 package、同一目录树深度，但与 schema 分离）
   - 原因: drizzle-kit 的 `schema: './src/schema/*.ts'` glob 会扫到 `*.test.ts` 文件并尝试通过 CJS `require()` 加载它们；`vitest` 是 ESM-only 包，触发
     `Vitest cannot be imported in a CommonJS module using require()` 致 `db:generate` 崩溃。最小代价改动 = 把测试搬出 schema 目录，import 路径改成 `'./schema/firm'`

5. **`tenant.ts` `insertLazyFirmProfile` 增加 `onConflictDoNothing` —— 来自 code-reviewer subagent 的关键发现**
   - plan: 行 14–16 写"lazy create 自愈"，未指定并发语义
   - 实际: code-reviewer 指出原版 check-then-insert 在并发首请求场景下会触发 PK 冲突 → 未捕获 → 用户看到 500，违反"lazy create 是确定性兜底"的 ADR 0010 承诺。
     已改成 `db.insert(firm_profile).values({...}).onConflictDoNothing({ target: firm_profile.id })` + 强制 reload；新增 `tenant.test.ts > 'lazy-create insert goes through onConflictDoNothing for concurrency safety'`
     回归测试断言 `onConflictDoNothing` 被调用
   - 原因: 真实 dashboard hydration 模式（首次进 `/` 时同时打 `clients` / `obligations` / `pulse` 等 RPC）就是并发首请求场景。如果 hook 失败留下孤儿 org，N
     个并发 RPC 中只有 1 个 INSERT 会赢，剩下 N-1 个看到的是 PK 违反 → 500。修
     完后两个并发 RPC 都拿到正常 200，下次起回正常路径。这次发现也补强了 ADR 0010
     `Decision > Lazy create` 章节的"幂等"承诺

## 验证

```bash
pnpm db:generate                                  # → 0001_tidy_shiva.sql ， 二次跑 "No schema changes"
pnpm --filter @duedatehq/core test                # 18 passed
pnpm --filter @duedatehq/db test                  # 10 passed
pnpm --filter @duedatehq/auth test                # 1 passed
pnpm --filter @duedatehq/server test              # 25 passed
pnpm --filter @duedatehq/app test                 # 26 passed
pnpm --filter @duedatehq/app i18n:extract && pnpm --filter @duedatehq/app i18n:compile  # 0 missing
pnpm check                                        # 全绿
pnpm check:deps                                   # ✓ Dependency direction OK
```

## 后续 / 未闭环

- 见 ADR 0010 Follow-ups 7 条
- Settings 内的"Practice profile" input 还是 demo defaultValue，需要等
  `organization.update` + firm_profile 的反查 wire 上来才真正可改名（plan §6 留了
  TODO 注释）
- E2E（Playwright Google OAuth → onboarding → dashboard）本期不做，OAuth e2e 太
  重；单测已覆盖 gate 行为。等 P0 业务表 + Migration Copilot 一起接 e2e 时统一做
