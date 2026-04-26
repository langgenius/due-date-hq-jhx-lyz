---
title: 'Migration Copilot Pre-Work'
date: 2026-04-24
commit: '15ad692'
author: 'Codex'
---

# Migration Copilot Pre-Work

## 背景

Migration Copilot 的 Day 2 / Day 3 并行开发依赖 4 条共享契约先冻结：AI Execution、Audit/Evidence、Client Domain、Obligation Domain。ADR 0011 已锁定 Demo Sprint 范围，本轮把计划中的 schema、repo、AI facade、contract 与设计系统回灌补齐到可继续并行的状态。

## 做了什么

- 新增 Demo Sprint 子集 D1 schema：`client`、`obligation_instance`、`migration_*`、`audit_event`、`evidence_link`，并生成 `packages/db/migrations/0003_clear_star_brand.sql`。
- 将 audit / evidence writer 从 no-op 改为真实 insert writer，并接入 `scoped(db, firmId)` 下的 audit / evidence repo。
- 新增 clients / obligations / migration scoped repo，所有 tenant 读取带 firm 约束；migration 子表读写先验证 batch 属于当前 firm。
- 冻结 contracts 包中的 clients、obligations、migration router 签名，并新增 audit action / evidence source type 共享常量。
- 补 `packages/ai` facade：prompt registry、ZDR route 头部 prompt、无 API key structured refusal、Zod parse、EIN 80% guard、trace payload。
- 回灌设计系统增量：`DESIGN.md` YAML token 与 `docs/Design/DueDateHQ-DESIGN.md` §14 使用说明保持一致。
- 同步 dev-file 03 / 04 / 08 / 09 / 10，以及产品 prompt 文档中的 evidence source type 命名。

## 裁定决策

- FU-1 已兑现：`client.entity_type` 扩为 8 项，包含 `individual`。
- Evidence source type 统一为 `ai_mapper` / `ai_normalizer`，与 contracts / DB 常量一致。
- Confidence 存 `REAL 0..1`，不存百分整数或 basis points。
- `migration_mapping` / `migration_normalization` 持久化 `prompt_version`；normalization 同步持久化 `user_overridden`。
- 设计系统口径明确为 9 条 delta：8 个 YAML token + 1 条 Keyboard 裁定。Email Shell 宽度统一为 640px。

## 验证

- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/ai test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/server test`
- `pnpm check`

## 后续 / 未闭环

- FU-2：Migration 专属 LLM 配额已在文档和 facade 留位，后续接 KV budget enforcement。
- FU-3 ~ FU-7：仍按 ADR 0011 留位，不在本轮实现。
- Procedure 当前是 typed stub，真实 handler 由 Day 3 / Day 4 各 owner 按冻结契约补实现。
