# 关闭 `auth:schema` 脚本后门

日期：2026-04-24（承接同日 `2026-04-24-auth-tenant-review-followups.md` "后续 / 未闭环" 第 2 条）

## 背景

上一条 dev-log（auth/tenant review 收敛）里 P2 改动在 `member` 表加了
`(organization_id, user_id)` 的 unique index，并给 `member` 加了 `status`
业务字段；更早的 ADR 0010 则让 `firm_profile` 以 PK FK 挂到
`organization.id`。这三处让 `packages/db/src/schema/auth.ts` 成为"手工维护"文
件 —— 但老的 `pnpm --filter @duedatehq/auth auth:schema` 脚本（= `better-auth
generate --config auth.cli.ts --output ../../packages/db/src/schema/auth.ts
--yes`）只要被谁误跑一次，就会按 better-auth 默认 schema 重新覆盖这个文件，
unique index / `member.status` / 对 `firm_profile` 的耦合全部一并蒸发。

原计划是"下个 plan 做业务表时顺手把这个脚本拿掉"，本次提前关掉。

## 做了什么

1. **移除 `auth:schema` 脚本入口**
   - 根 `package.json`：删掉 `"auth:schema": "pnpm --filter @duedatehq/auth
auth:schema"`
   - `packages/auth/package.json`：删掉包内 `"auth:schema": "better-auth
generate --config auth.cli.ts --output ../../packages/db/src/schema/auth.ts
--yes"`，并从 `devDependencies` 里删掉无人消费的 `@better-auth/cli`
2. **删除 `packages/auth/auth.cli.ts`**（唯一作用就是喂上面那条生成命令，现在无消费者）
3. **扩写 `packages/db/src/schema/auth.ts` 的顶部注释**：把原本指向"不要跑
   auth:schema 脚本"的警告，换成"本文件手工维护 · `@better-auth/cli generate`
   已从 package.json 卸下"的永久声明 + 指向本 dev-log
4. **更新 `packages/auth/package.json` 的 `//` 字段**，说明为何不再 wire
   better-auth CLI
5. **同步文档**
   - `docs/dev-file/03-Data-Model.md §1 约束`：原来的"better-auth 接管的 7 张表
     由其 migrations 管理，不要手改"是站在"生成脚本是真理来源"的视角写的，
     现在改成"`schema/auth.ts` 手工维护 · 已加 member unique index + status
     字段 + `firm_profile` FK 耦合 · 不跑 `@better-auth/cli generate` · 后续
     变更走 `pnpm db:generate`"
   - 上一篇 dev-log 的 "后续 / 未闭环" 里对应条目标删除线 + 回链本文

## 为什么这样做（对齐最佳实践 skills）

`.claude/skills/better-auth-best-practices/SKILL.md` §Setup 第 5 步的通用建议
是 `npx @better-auth/cli@latest migrate` / `generate`——这是"better-auth 官方
schema 是唯一真理"的工作流。DueDateHQ 的 schema 已经不满足这个前置条件：

| 分歧点                    | 位置                                     | 原因                                                                       |
| ------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| `member` unique index     | `packages/db/src/schema/auth.ts`         | `tenantMiddleware.limit(1)` 的确定性（见 auth-tenant-review-followups P2） |
| `member.status` 附加字段  | `packages/db/src/schema/auth.ts`         | PRD §3.6.4 席位灰化 / suspend 语义                                         |
| `firm_profile` PK FK 级联 | `packages/db/src/schema/firm.ts`（新增） | ADR 0010 业务租户表与身份层解耦                                            |

这些"手工加出来的约束" Better Auth CLI 不知道，也不会保留。一旦允许
`generate` 脚本存在，任何不熟悉上下文的 contributor（或 AI agent）跑一次就
把它们洗掉，而 CI 只会报"schema changed"——不会告诉你"你刚删掉的东西是救命
约束"。

把脚本从 `package.json` 移除是最廉价的"policy-as-code"落点：

- 不再存在"一键全自动重生 auth 模型"的文档路径，skills/README 里引用
  `auth:schema` 的地方也就自然消失
- `@better-auth/cli` devDep 一并移除，`npx` 调用路径需要显式加版本或安装，形成
  一次额外的"你确定吗"闸门
- `organization-best-practices` SKILL 里 "Run `npx @better-auth/cli migrate`"
  的建议仍然正确——那是 **migrate**（应用 SQL），不是 **generate**（重生 TS
  schema）；我们用 `pnpm db:migrate:local / :remote` 走 wrangler，`generate`
  的通路才是真正被关的那个

## 偏离 skill 官方建议的地方（显式记录）

- **不跑 `better-auth generate`**：因为我们手工加了字段和约束，上游不可能自
  动推断；下次 better-auth 升级导致的 schema shift 需要人工对照 changelog +
  手改 `schema/auth.ts` + 新 drizzle migration。trade-off 已经在
  `packages/db/src/schema/auth.ts` 顶部注释固化
- **保留 `@better-auth/cli` 出现在 `pnpm-lock.yaml` 的传递依赖里不是问题**，
  只要没有 script 把它挂到别名上就够；未来做 P1 邀请流 / Team 之类扩展时，
  同样通过手改 schema 实现，不重启 generate 路径

## 测试结果

无代码逻辑改动，套件数量不变：

```
@duedatehq/auth      5 tests (权限 shape 锁定，来自上一条 P1)
@duedatehq/db       10 tests
@duedatehq/server   28 tests
@duedatehq/app      26 tests
@duedatehq/core     18 tests
@duedatehq/contracts 2 tests
@duedatehq/ai        1 test
合计                90 tests · 全绿
```

## 验证

```bash
pnpm install           # lockfile 按 @better-auth/cli 卸下重写
pnpm check             # 全绿
pnpm check:deps        # ✓ Dependency direction OK
pnpm -r test           # 90 passed
```

## 后续 / 未闭环

延续前一篇 dev-log 的"未闭环"列表，除本条已关闭外，其余三项状态不变：

- ADR 0010 Follow-ups 7 条（feature-gated · 等 P1 邀请流 / 第一个 repo /
  Pay-intent / Owner 转让 / Coordinator 等触发点到了再做）
- Settings 的 "Practice profile" input 写库 + `organization.update` 调用
  （下个 plan）
- onboarding list+setActive 兜底的 E2E 覆盖（等 Playwright E2E 基座）
