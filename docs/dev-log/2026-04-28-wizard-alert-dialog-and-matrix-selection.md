---
title: 'Wizard alert dialog and matrix selection'
date: 2026-04-28
author: 'Codex'
---

# Wizard alert dialog and matrix selection

## 背景

Migration Wizard 关闭确认此前用普通 Dialog 模拟 `alertdialog`，且文案承诺
"draft is saved / resume from Settings › Imports history"。DDL cut 还没有完整 Import History
和 resume UI，关闭后 reducer 会 reset，因此文案和实际行为不一致。

Step 3 的 `Apply to all` 原本只写前端本地 state，`applyDefaultMatrix`、`dryRun` 和最终
`apply` 都不消费。该控件的产品语义是按 `(entity_type, state)` cell 决定是否把 Default
Matrix 应用到缺失 `tax_types` 的客户；如果没有后端链路，它会误导用户。

## 做了什么

- 新增 `@duedatehq/ui/components/ui/alert-dialog`，沿用 shadcn Alert Dialog 组合 API，
  底层使用 Base UI primitive，并消费现有 overlay、panel、shadow 和 Button design tokens。
- Wizard 关闭确认改为真实 Alert Dialog，文案明确说明粘贴数据和未保存编辑会丢失；busy/importing
  时禁用 Esc、overlay close 和右上角关闭。
- `applyDefaultMatrix` contract 新增 `matrixSelections`，server 将选择写入
  `mapping_json.matrixSelections` 与 `matrixApplied[].enabled`。
- Step 3 恢复 `Apply to all` checkbox 和局部 `A` 快捷键；选择默认 true，只影响没有原始
  `client.tax_types` 的导入行。
- `dryRun` 和最终 `apply` 都读取同一份 `matrixApplied[].enabled`，disabled cell 不再 fallback
  `inferTaxTypes` 生成 obligations。
- 同步 PRD、Design、migration product design docs、ADR 和 keyboard dev log。

## 质量约束

- Vercel React guidance：保持直接 import，避免新增 barrel；matrix preview 用 `useMemo` 并以
  primitive/owned state slices 作为依赖，避免无关 reducer 更新触发重复 CSV 解析。
- UI 状态不再是孤立本地 toggle；Continue 时把 matrix selections 作为 contract input 提交，由后端持久化后统一驱动 Step 4 和 apply。

## 验证

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/server test -- --run src/procedures/migration/_service.test.ts`
- `pnpm --filter @duedatehq/contracts test -- --run src/contracts.test.ts`
- `pnpm --filter @duedatehq/app test -- --run src/features/migration/continue-rules.test.ts`
- `pnpm check`：通过；仍保留仓库既有的两个 unsafe type assertion warnings：
  `packages/ui/src/lib/placement.ts:30`、`apps/server/src/env.test.ts:5`
- `pnpm test`
- `pnpm build`：通过；Wrangler `unsafe`、Astro/Vite deprecation warnings 仍为既有构建警告
