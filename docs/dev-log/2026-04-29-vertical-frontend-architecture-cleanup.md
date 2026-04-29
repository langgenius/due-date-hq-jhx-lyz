---
title: 'Vertical frontend architecture cleanup'
date: 2026-04-29
author: 'Codex'
---

# Vertical frontend architecture cleanup

## 背景

TkDodo 的 vertical codebase 思路要求一起变化的代码放在同一个业务 vertical 下，而不是按
`lib` / `components` / `utils` 这类技术类型横向聚合。仓库已有 `apps/app/src/features/*`
基础，但 billing model 和 dashboard risk UI 已经开始漂到 `lib` 与横向 primitives。

## 做了什么

- 将 billing plan / interval / URL parser / href / owner plan 判断从 `apps/app/src/lib` 归位到
  `apps/app/src/features/billing/model.ts`。
- 新增 `apps/app/src/features/dashboard/`，承接 dashboard 专属 `RiskBanner` 和
  `severityRowClass`。
- 更新 `docs/dev-file/05-Frontend-Architecture.md`、`docs/dev-file/08-Project-Structure.md` 和
  `AGENTS.md`，明确业务代码按 vertical colocate。

## 为什么这样做

`apps/app/src/lib` 继续作为 app runtime / integration 边界，例如 auth、oRPC、theme storage 和
RPC error mapping。业务 model 和 feature-specific UI 如果继续进入横向目录，会让后续修改 billing
或 dashboard 时需要跨目录追踪，降低 cohesion。

## 验证

- `pnpm check`
- `pnpm test`
- `pnpm check:deps`
- `pnpm exec playwright test e2e/tests/authenticated-shell.spec.ts e2e/tests/billing-checkout.spec.ts e2e/tests/billing-success.spec.ts`
- `rg "apps/app/src/lib/billing.ts|components/primitives/risk-banner|components/primitives/severity-row|@/lib/billing" apps/app/src docs/dev-file docs/product-design AGENTS.md`

## 后续 / 未闭环

- 本次不拆 `dashboard.tsx`、`workboard.tsx`、`settings.members.tsx` 等大 route 文件。
- 本次不新增 feature public API 或禁止跨 feature 深 import 的 lint 规则；等跨 feature 引用继续增多时单独规划。
