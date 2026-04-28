---
title: '2026-04-28 · Audit Log 管理页落地'
date: 2026-04-28
author: 'LYZ'
---

# 2026-04-28 · Audit Log 管理页落地

## 背景

侧边栏已有 `Audit log` 入口，但此前处于禁用状态；DB 层已有 append-only
`audit_event`、writer 和基础 `scoped.audit.listByFirm()`，缺少 contract、server
procedure、前端 route 和管理页。

本次按 `docs/product-design/audit/01-audit-log-management-page.md` 的 Activation
Slice 范围实现：只读 firm-wide Audit Log，不做 CSV/PDF 导出、不做 Owner/Manager
完整 RBAC、不做 Audit-Ready Evidence Package。

## 做了什么

### Contract

- 新增 `packages/contracts/src/audit.ts`
  - `audit.list`
  - `AuditEventPublic`
  - `AuditListInput`
  - `AuditActionCategory`
  - `AuditRange`
- 在 `appContract` 挂载 `audit` 并 re-export public types。
- `contracts.test.ts` 锁住 action category 顺序、输入上限和 null actor/JSON shape。

### DB

- 扩展 `packages/db/src/repo/audit.ts`
  - 新增 `list(input)`，默认 `(created_at, id)` 倒序 keyset pagination。
  - 支持 `range`、`category`、`action`、`actorId`、`entityType`、`entityId`、`search`。
  - 保留 `listByFirm()` 兼容 wrapper。
  - `action` 仍是 append-only string；`category` 只是 prefix 派生查询。
- 新增 `packages/db/src/repo/audit.test.ts`，覆盖 search normalization、limit clamp、
  cursor sentinel、invalid cursor 和 wrapper。

### Server

- 新增 `apps/server/src/procedures/audit/index.ts`。
- `auditHandlers.list` 只通过 `requireTenant(context)` 读取 `scoped.audit`。
- 序列化层把 `Date` 转 ISO，并把 undefined JSON payload 规整成 `null`。
- root router 挂载 `audit.list`。

### App

- 新增 `/audit` protected route。
- 新增 `apps/app/src/features/audit/*`
  - URL state 用 `nuqs`。
  - 数据读取用 `useInfiniteQuery(orpc.audit.list.infiniteOptions(...))`。
  - 表格显示 Time / Actor / Action / Entity / Change / Detail。
  - Sheet drawer 显示 before/after JSON、reason、hash 后设备字段和 raw metadata。
  - 搜索输入 debounce，默认 range 为 24h。
- 侧边栏 `Audit log` 启用；`Team workload` 继续 `P1` disabled。
- Command Palette 增加 `Audit log` 导航项。

### 文档

- 同步 `docs/dev-file/02-System-Architecture.md`、`03-Data-Model.md`、
  `05-Frontend-Architecture.md`、`06-Security-Compliance.md`。
- 同步 `DESIGN.md` 和 `docs/Design/DueDateHQ-DESIGN.md` 的 sidebar/Admin 描述。
- 将 Audit 产品设计文档状态从 planned 更新为 implemented。

## 为什么这样做

选择 read-only Activation Slice 是为了把已有 audit write 基础变成用户可见证据面，
同时避免把 Team/RBAC、导出邮件附件、Evidence Package ZIP 拉进同一 PR。

关键取舍：

- `audit_event.action` 不做 enum。合规日志需要只增不删；UI category 由 prefix 派生。
- 不显示明文 IP / UA，只显示 hash 字段是否存在和 hash 值。
- Export 只显示 disabled `Export · P1`，不伪装成可用下载。
- `/audit` 复用现有 RootLayout/AppShell，不拆 Owner-only 独立 shell。

## 验证

已通过：

- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/db test -- src/repo/audit.test.ts`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/server build`

已知非本次阻塞：

- `pnpm --filter @duedatehq/db test` 仍失败于 `packages/db/src/firm.test.ts`：
  当前工作树已有非 Audit 的 firm profile schema 变更，测试期望尚未同步。
- `pnpm check` 仍失败于 `packages/auth/src/index.ts` 格式问题，该文件属于当前
  工作树已有非 Audit 改动，本次没有改它。

本次 Audit 相关 DB 测试已单独通过；失败项与 Audit Log 无关。

## 后续

- Team/RBAC slice 落地后给 `audit.list` 加 `audit.read` permission middleware。
- Export slice 落地后实现 Owner-only audit export，并写 `export.audit` self-audit event。
- E2E seed 稳定后补 `/audit` 的 Playwright coverage：侧边栏导航、筛选 reset、详情 drawer。
