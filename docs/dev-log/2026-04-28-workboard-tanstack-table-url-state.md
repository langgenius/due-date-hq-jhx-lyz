---
title: 'Workboard TanStack Table URL State'
date: 2026-04-28
author: 'Codex'
---

# Workboard TanStack Table URL State

## 背景

Workboard 是 PRD 和 `docs/dev-file/05-Frontend-Architecture.md` 明确要求的高密度表格面。实现迁移前，`apps/app/src/routes/workboard.tsx` 直接手写 `<Table>` rows，并把 `statusFilter`、`searchInput`、`sort`、cursor stack 和 active row 放在组件 state 里。这样能跑当前 4 列队列，但和后续 10–20 列、自定义列、批量选择、Saved Views 的方向不一致。

本次实现前重新核对了 TanStack Table v8 官方文档和项目内 `vercel-react-best-practices`。官方推荐 server-side 场景使用 `useReactTable` + `getCoreRowModel()`，开启 `manualPagination` / `manualSorting` / `manualFiltering`，并保持 `data` / `columns` 引用稳定；Vercel 规则侧重点是避免派生状态 effect、使用稳定 memo/callback、避免输入导致重渲染阻塞。

## 做了什么

- `apps/app/src/routes/workboard.tsx`
  - 接入 `useReactTable`、`getCoreRowModel`、`flexRender`。
  - 将列定义集中为稳定 `ColumnDef<WorkboardRow>[]`，继续复用现有 `@duedatehq/ui/components/ui/table` 语义 table primitive。
  - 开启 `manualFiltering`、`manualSorting`、`manualPagination`，让筛选 / 排序 / cursor pagination 继续由 `workboard.list` 服务端 read model 负责。
  - 使用 `nuqs` 管 `q/status/sort/cursor/row`，替代本地 filter/sort/cursor/active-row state。
  - 搜索查询使用 `useDeferredValue(searchInput.trim())` 参与 React Query input，保留输入响应优先级。
  - 使用 TanStack row selection state 表达 active row，`J/K` 快捷键和点击行都会写回 URL 中的 `row`。
  - React Query 增加 `placeholderData: keepPreviousData`，翻 cursor 页时避免当前页闪成空表。

- `docs/dev-file/05-Frontend-Architecture.md`
  - 将 Workboard 表格章节从计划项更新为当前实现口径。
  - 明确当前是 cursor pagination，所以 URL 持久化 `cursor`，不是 page index；接口没有 `rowCount` 前不使用页码式 `rowCount/pageCount` 控件。
  - 记录 `@tanstack/react-virtual` 暂不启用，等 PRD 的 10–20 列和长滚动容器到位再接。

## 为什么这样做

TanStack Table 在这里的价值不是替换样式组件，而是把表格状态、列模型、row model、row selection 统一到一个 headless table instance。当前代码仍保持轻量：不引入全局 DataTable 抽象，不迁移 Dashboard / Rules / Migration 的小型展示表，也不提前引入虚拟化。

对 pagination 做了一个有意的偏离：官方 page-based 示例使用 `rowCount` 或 `pageCount`，但当前 D1 read model 是 cursor pagination，`workboard.list` 只返回 `nextCursor`。因此本次只把 `cursor` 持久化到 URL，并在文档中标注原因。等后端需要页码、总数或 Saved Views 时，再扩展 contract。

## 验证

- `pnpm exec vp fmt --write apps/app/src/routes/workboard.tsx docs/dev-file/05-Frontend-Architecture.md`
- `pnpm exec vp fmt --check apps/app/src/routes/workboard.tsx docs/dev-file/05-Frontend-Architecture.md docs/dev-log/2026-04-28-workboard-tanstack-table-url-state.md`
- `pnpm --filter @duedatehq/app test -- --run`
- `pnpm --filter @duedatehq/app exec tsc --noEmit --pretty false`

`fmt --check` 通过；app 测试 8 files / 49 tests 通过。`tsc` 中 Workboard 相关类型通过；命令仍被既有 `packages/ui/src/components/ui/sidebar.tsx` Base UI `render` prop 类型错误挡住：

- `packages/ui/src/components/ui/sidebar.tsx:302`
- `packages/ui/src/components/ui/sidebar.tsx:355`

## 后续 / 未闭环

- 真正 optimistic status rollback 尚未做，当前仍是 mutation 成功后 invalidate + toast audit id。
- 批量选择、列可见性、自定义列、Saved Views 需要在后续 PRD workboard 扩列时继续走 TanStack controlled state。
- 如果 `workboard.list` 未来返回 `rowCount`，可以改为官方推荐的 `rowCount` / page controls；否则保持 cursor URL state。
