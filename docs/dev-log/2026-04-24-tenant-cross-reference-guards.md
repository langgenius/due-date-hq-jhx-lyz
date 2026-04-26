---
title: 'Tenant cross-reference guards'
date: 2026-04-24
author: 'Codex'
---

# Tenant cross-reference guards

## 背景

今天的多租户架构复核结论是：`activeOrganizationId == firmId == organization.id == firm_profile.id`
这条主线清晰，`tenantMiddleware + scoped(db, firmId)` 也已经把大多数业务查询收敛到
repo 层。但两个 tenant-scoped 子关系还缺 repo 级 parent 归属校验：

- `obligation_instance` 同时有 `firm_id` 和 `client_id`，单列 FK 只能证明 client 存在，不能证明 client 属于同一 firm。
- `evidence_link` 同时有 `firm_id` 和 `obligation_instance_id`，单列 FK 只能证明 obligation 存在，不能证明 obligation 属于同一 firm。

D1 没有 RLS，当前项目的租户隔离策略是工程防线，所以这种跨表写入必须在 scoped repo 内补校验。

## 做了什么

- `packages/db/src/repo/obligations.ts`
  - `createBatch` 写入前按当前 `firmId` 批量验证所有 `clientId`。
  - 查询按 90 个 id 分批，避免接近 D1 100 bound-param 上限。
  - 批次之间用 `Promise.all()` 并行执行，避免不必要的 waterfall。
- `packages/db/src/repo/evidence.ts`
  - `write` / `writeBatch` 写入前按当前 `firmId` 验证所有 `obligationInstanceId`。
  - `aiOutputId` 仍按现状跳过归属校验，因为 `ai_output` schema 尚未 materialize。
- `packages/db/src/repo/tenant-scope.test.ts`
  - 覆盖 obligation 写入拒绝外 firm client。
  - 覆盖 evidence 写入拒绝外 firm obligation。
- 文档同步
  - `docs/dev-file/03-Data-Model.md` 补上 `schema/firm.ts`，拆清 `auth.ts` 与 `firm.ts` 的职责。
  - `docs/dev-file/06-Security-Compliance.md` 更新 middleware 当前行为，并记录跨表 parent 归属校验规则。
  - `docs/adr/0010-firm-profile-vs-organization.md` 更新过时的 Better Auth migration 表述。

## 为什么这样做

没有直接上复合外键或 schema 迁移，原因是当前表的主键仍是单列 id，迁移到 `(firm_id, id)` 复合唯一约束会影响 schema、migration、seed 和现有 repo 写法。repo 级校验是当前架构下最小且直接的安全修复：写入口已经被 `scoped(db, firmId)` 收口，校验放在 repo 内能保护 procedure 调用者少犯错。

批量校验而不是逐行校验，是为了避免 import/migration 场景出现 N+1 查询；按 90 个 id 分批，是为了给 D1 参数上限留空间。

## 验证

- `pnpm --filter @duedatehq/db test`
- `pnpm check:deps`
- `pnpm check`
- `pnpm format`
- `pnpm ready`

## 后续 / 未闭环

- `ai_output` materialize 后，`evidence.write` 也要验证 `aiOutputId` 的 firm 归属。
- 如果后续频繁出现跨表归属校验，可以抽一个 db 内部 helper，但当前先保持 repo 局部实现，避免过早抽象。
