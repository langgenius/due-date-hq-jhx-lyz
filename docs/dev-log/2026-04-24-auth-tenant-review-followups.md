# Auth / tenant review follow-ups

日期：2026-04-24（同日 · 首登 onboarding commit `e74db86` 之后）

## 背景

首登 onboarding + `firm_profile` 业务租户层上线后的外部 review 提了 5 条
findings（2 P1 + 2 P2 + 1 P3）。本次一次性收敛。

## 做了什么

### [P1] `databaseHooks.session.create.before` — 防返回用户 onboarding trap

问题：`protectedLoader` 把"session 无 `activeOrganizationId`"一律当首登，重定向到
`/onboarding`；`/onboarding` 只做 `organization.create`；`organizationLimit:1`
又卡死二次创建。任何已注册用户的 session 一旦 `activeOrganizationId=NULL`（跨
设备签退、cookie cache 失效、等等），就变"死循环用户"。

修：

- 新建 [`apps/server/src/session-hooks.ts`](../../apps/server/src/session-hooks.ts)
  导出 `buildDatabaseHooks(db)`，注册 `session.create.before` —— 新 session
  写入前查 `member` 表，若该用户已有 active 成员关系（按 `createdAt` 升序取
  第一条），就把 `activeOrganizationId` 填回 session data。首次用户仍返
  `undefined`，原样写入让 loader 带他去 onboarding
- [`packages/auth/src/index.ts`](../../packages/auth/src/index.ts) 新增
  `databaseHooks?: DatabaseHooks` 到 `CreateAuthDeps`（类型从 better-auth 的
  `BetterAuthOptions` 推导，避免版本漂移）；`createAuth` 按需透传
- [`apps/server/src/auth.ts`](../../apps/server/src/auth.ts) `createWorkerAuth`
  组装 `buildDatabaseHooks(db)` 传入
- Belt-and-braces：[`apps/app/src/routes/onboarding.tsx`](../../apps/app/src/routes/onboarding.tsx)
  `handleSubmit` 先 `authClient.organization.list()`，若已有 org 就 `setActive`
  第一个而**不**调 create。即使 hook 因任何原因没跑，用户也能自救出来
- 测试：[`apps/server/src/session-hooks.test.ts`](../../apps/server/src/session-hooks.test.ts)
  3 场景（有成员 / 无成员 / 缺 userId）

### [P1] Permissions merge — owner 能通过 Better Auth 的内部 permission gate

问题：`packages/auth/src/permissions.ts` 用 `createAccessControl(statement)` 替换
了 Better Auth 的默认 org ACL，但统计表里缺了 plugin 自己要用的
`organization:update / member:create/update/delete / invitation:create/cancel /
team:* / ac:*`。等 Settings 一接 `organization.update`，owner 自己都会被 403。

修 [`packages/auth/src/permissions.ts`](../../packages/auth/src/permissions.ts)：

- `statement` 先 `...defaultStatements`，再用 `member: [...defaultStatements.member,
'invite','suspend','remove','change_role']` 在已有基础上扩展我们的 P1 动作，
  最后加业务资源（`client / obligation / pulse / migration / rule / billing /
audit / dollars`）
- `roles.owner` 明确列出完整 org/member/invitation/team/ac + 业务资源（不再指
  望全集 spread 的简写）
- `roles.manager/preparer/coordinator` 按 PRD §3.6.3 RBAC 矩阵重填：
  - manager 得 `member:create/invite/suspend` + `invitation:create/cancel`，但
    不得改他人 role（`member:update`）、不得删 org
  - coordinator 不再默认 `dollars:read`（PRD §3.6 对 $ 字段默认隐藏）
- 测试：[`packages/auth/src/auth.test.ts`](../../packages/auth/src/auth.test.ts)
  从 1 个用例扩到 5 个，锁死 statement 形状 + 角色差异

### [P2] `member (organization_id, user_id)` unique 约束

问题：`member` 表只有 `organizationId` 和 `userId` 分开的索引，没有联合
unique。任何并发、migration 脚本、或直接写库造成的重复行都会让
`tenantMiddleware` 的 `.limit(1)` 读成不确定（active vs suspended 随机命
中）。better-auth 也不在应用层强制这条唯一性。

修：

- [`packages/db/src/schema/auth.ts`](../../packages/db/src/schema/auth.ts)
  `member` 表加 `uniqueIndex('member_organization_user_unique').on(organizationId,
userId)`；注释警告：如果 `pnpm --filter @duedatehq/auth auth:schema`
  脚本重跑 better-auth CLI，这条约束会被覆盖 —— 维护策略改为"schema 手工
  维护，不再重跑 auth:schema"
- 新迁移 [`packages/db/migrations/0002_numerous_johnny_blaze.sql`](../../packages/db/migrations/0002_numerous_johnny_blaze.sql)
  `CREATE UNIQUE INDEX`
- [`apps/server/src/middleware/tenant.ts`](../../apps/server/src/middleware/tenant.ts)
  membership 查询加 `.orderBy(asc(member.createdAt))`（有 unique index 后是
  单行，这只是未来 schema drift 的防御）

### [P2] `docs/dev-file/06-Security-Compliance.md §4.3` 对齐现实

问题：§4.3 列了一份"oxlintrc.json"虚构文件，但仓库里没有 —— 真实的静态
isolation 在 `vite.config.ts` 根配置的 `lint` 块（`vp check` 运行的 ESLint
plugin pipeline）。

修 [`docs/dev-file/06-Security-Compliance.md`](../dev-file/06-Security-Compliance.md)
§4.3：

- 标题改为 "Lint 层（静态隔离）"
- 示例代码改为 `vite.config.ts` 摘录（真实路径），包括 `overrides` 的完整列表
  （`packages/db/**`、`jobs/**`、`webhooks/**`、`packages/db/seed/**`、
  `packages/core/**`、`packages/contracts/**`、`packages/ai/**`）
- 加 `packages/auth` 不在 override 里的强约束说明 + 指向
  `organization-hooks.ts` / `session-hooks.ts` 两个唯一写入面
- 点明 `pnpm check:deps`（`scripts/check-dep-direction.mjs`）是 workspace
  粒度的复校

### [P3] `docs/dev-file/03 §2.1.b` CHECK 降级为 drizzle TS-level enum

问题：doc 写字段是 `CHECK IN (...)`，实际 drizzle 的 `text({ enum: [...] })`
只做 TS 层 enum，生成的 migration SQL 里没有 `CHECK` 约束。

修 [`docs/dev-file/03-Data-Model.md`](../dev-file/03-Data-Model.md)：

- §2.1.b firm_profile `plan` / `status` 列描述改为"enum ... (drizzle+TS 层)"
- §2.2 clients 表同类字段同样降级（`entity_type / importance /
estimated_annual_revenue_band`）
- §2.1.b 末尾新增 "**关于 enum / CHECK**" 小节，解释 SQLite `ALTER TABLE` 不
  支持 ADD CHECK、为什么先不做、什么时候补（`drizzle.check('<name>', sql\`...\`)`
  - 手写重建迁移，在业务表需要状态机硬约束时做）

## 为什么这样做

- **P1#1 选 session hook 而非改 loader**：loader 做 side effect
  （setActive）不是 react-router 惯例；hook 在 session 真正写入前统一处理
  更简单。但 onboarding submit 的 list+setActive 兜底是小成本大收益的
  defense-in-depth，加上
- **P1#2 merge 而非 namespace 分开**：reviewer 给了两个选项（merge / 分开
  namespace）。merge 更省心，因为 better-auth 的默认 `member` 已经用了这个
  名字，再造 `tenant_member` 不如直接扩 actions
- **P2#3 unique index 现在就加**：D1 `CREATE UNIQUE INDEX` 是零代价操作
  （不影响现有行、立即生效、不需要重建表），没理由拖
- **P3#5 只降级 doc、不加 CHECK**：SQLite `ALTER TABLE ADD CONSTRAINT CHECK`
  不被支持；手动重建表仅为了 CHECK 加分数量级不够大的安全收益不值。等业
  务表真实有"非 enum 越界会污染状态机"的场景（比如 `obligation.status`）再
  在那张表上一次做

## 偏离 review 的地方

- **P1#1** reviewer 给了两个选项，我做了 session hook（主）+ onboarding list
  fallback（副）两条一起上，不是二选一。理由：session hook 是正路；
  onboarding list 是 edge-case tripwire，代价小
- **P1#2** reviewer 的备选是"保持 plugin 和业务权限分 namespace"。没选，
  因为 better-auth 的 `member` 已占用这个名字，分开要改名业务侧 `member`
  资源为 `tenant_member` 之类，所有下游引用要跟，ROI 不够

## 测试结果

| package              | before | after  | Δ                        |
| -------------------- | ------ | ------ | ------------------------ |
| @duedatehq/core      | 18     | 18     | —                        |
| @duedatehq/db        | 10     | 10     | —                        |
| @duedatehq/auth      | 1      | 5      | +4（权限 shape 锁定）    |
| @duedatehq/server    | 25     | 28     | +3（session-hooks.test） |
| @duedatehq/app       | 26     | 26     | —                        |
| @duedatehq/contracts | 2      | 2      | —                        |
| @duedatehq/ai        | 1      | 1      | —                        |
| **合计**             | **83** | **90** | **+7**                   |

## 验证

```bash
pnpm db:generate       # → 0002_numerous_johnny_blaze.sql
pnpm check             # 全绿
pnpm check:deps        # ✓ Dependency direction OK
pnpm -r test           # 90 passed
pnpm ready             # 全绿
```

## 后续 / 未闭环

- ADR 0010 Follow-ups 保留（仍然 7 条，尤其 FU-1 membershipLimit 函数式在
  P1 接邀请流时要做 —— 权限 statement 已经准备好，闸门开一下就生效）
- ~~`auth:schema` 脚本是个隐患：如果有人误跑它会覆盖 `member` 表的 unique
  index 和 `firmProfile` 的存在。下个 plan（业务表实现）同时把 `auth:schema`
  从 package.json 移除或改成 check-only 模式~~ → **2026-04-24 同日关闭**，见
  [`2026-04-24-close-auth-schema-script.md`](./2026-04-24-close-auth-schema-script.md)
- Settings 里的 "Practice profile" input 写库 + `organization.update` 调用：
  下个 plan；现在权限已经就位，wire 一下就行
- `apps/app/src/routes/onboarding.tsx` 的 list+setActive 兜底没有单测覆盖
  （onboarding 整体没有 happy-path UI 测试），等 Playwright E2E 落地时一起
  补
