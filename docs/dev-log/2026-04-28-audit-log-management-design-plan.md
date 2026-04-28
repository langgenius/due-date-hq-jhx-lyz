---
title: '2026-04-28 · Audit Log 管理页设计与实施计划'
date: 2026-04-28
author: 'LYZ'
---

# 2026-04-28 · Audit Log 管理页设计与实施计划

## 背景

用户要求先独立完成侧边栏 `Audit log` 的产品设计和代码架构变更分析，不写代码；
随后要求开始落地文档和实现计划。

现状梳理后确认：

- 侧边栏已有 `Audit log`，但在 `Admin · P1` 禁用分组下。
- `packages/db` 已有 `audit_event` schema、append-only writer 和
  `scoped.audit.listByFirm()`。
- `packages/contracts`、`apps/server/src/procedures`、`apps/app/src/router.tsx`
  还没有 audit read surface。
- PRD §13.2.1 已定义 Firm-wide Audit Log 的目标字段、过滤、导出和保留策略，
  但其中一部分属于 Team/P1。

## 做了什么

新增产品设计文档：

- `docs/product-design/audit/01-audit-log-management-page.md`

新增实施计划：

- `docs/product-design/audit/02-audit-log-implementation-plan.md`

新增索引：

- `docs/product-design/audit/README.md`

本次没有修改产品代码，也没有把架构稳定文档改成“已实现”。实现落地时再同步
`docs/dev-file/*`、`DESIGN.md` 和设计系统文档，避免稳定文档提前声明不存在的能力。

## 为什么这样做

选择 “Activation Slice 版 Firm-wide Audit Console”，而不是一次性做完 P1 合规页：

| 方案                         | 收益                                                             | 代价                                                          | 结论 |
| ---------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- | ---- |
| 只读 Firm-wide Audit Console | 复用现有 audit write 基础；最快闭环 Workboard/Migration 可追溯性 | 暂无导出和完整 RBAC                                           | 采用 |
| 全量 P1 合规页               | 覆盖导出、Owner/Manager 权限、邮件附件、自审计                   | 牵出 Team/RBAC/Email attachment/Audit Package，多模块范围过大 | 暂缓 |
| 单客户 Audit tab             | 更小                                                             | 与侧边栏 `Audit log` 入口和 PRD P1-22 不匹配                  | 放弃 |

核心边界：

- `audit_event.action` 是稳定工程字符串，不进 Lingui，不翻译，不回写。
- Category 是 UI 查询派生概念，不做 DB enum。
- 本 slice 只读，不增加 delete/update/redact 能力。
- Export 显示为 P1 或不显示，不能伪装为可用功能。

## 后续 / 未闭环

实现阶段按 `02-audit-log-implementation-plan.md` 执行：

1. Contract: `audit.list`。
2. DB: keyset pagination + safe filters。
3. Server: tenant-scoped procedure。
4. App: `/audit` route、sidebar 启用、table、filters、detail drawer。
5. E2E: sidebar navigation、filter reset、drawer visibility。
6. Docs: 同步 `docs/dev-file/*`、`DESIGN.md`、设计系统文档和最终 dev-log。

需要特别处理的文档债务：PRD / dev-file 中 audit action 示例与当前代码存在命名漂移。
实现时应把稳定文档对齐到“action 是 append-only string；示例以当前代码为准，不作枚举闭集”。

## 验证

本次为文档规划，无代码测试。自查项：

- 未把 P1 export/RBAC 写成当前 scope。
- 未要求 DB migration。
- 未引入新的文档顶层体系。
- 实施计划覆盖 contract、DB repo、server procedure、frontend route、E2E 和文档同步。
