---
title: 'Workboard TanStack Table URL State'
date: 2026-04-28
author: 'Codex'
updates:
  - note: 'Replaced URL cursor paging with oRPC infinite query pageParam consumption after page feedback.'
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
  - 使用 `nuqs` 管 `q/status/sort/row`，替代本地 filter/sort/active-row state。
  - 2026-04-28 follow-up：`q/status/sort/row` 收敛为模块级
    `workboardSearchParamsParsers`，并导出 `WorkboardSearchParams =
inferParserType<typeof workboardSearchParamsParsers>`；`history: 'replace'`
    也移到 parser contract 上，避免未来 serializer / loader 复用时漏掉 URL 行为。
  - 2026-04-28 follow-up：移除 URL `cursor`。`workboard.list` 分页仍由后端
    contract 负责；前端改为 `useInfiniteQuery(orpc.workboard.list.infiniteOptions(...))`
    消费 `pageParam` / `nextCursor`，`Load more` 追加 `data.pages[].rows`，不再把下一页替换当前页。
  - 搜索查询使用 `useDeferredValue(searchInput.trim())` 参与 React Query input，保留输入响应优先级。
  - 使用 TanStack row selection state 表达 active row，`J/K` 快捷键和点击行都会写回 URL 中的 `row`。

- `docs/dev-file/05-Frontend-Architecture.md`
  - 将 Workboard 表格章节从计划项更新为当前实现口径。
  - 明确当前是 cursor pagination；cursor 属于 oRPC infinite query 的
    `pageParam`，不是 URL state 或 page index。接口没有 `rowCount` 前不使用页码式
    `rowCount/pageCount` 控件。
  - 记录 `@tanstack/react-virtual` 暂不启用，等 PRD 的 10–20 列和长滚动容器到位再接。

## 为什么这样做

TanStack Table 在这里的价值不是替换样式组件，而是把表格状态、列模型、row model、row selection 统一到一个 headless table instance。当前代码仍保持轻量：不引入全局 DataTable 抽象，不迁移 Dashboard / Rules / Migration 的小型展示表，也不提前引入虚拟化。

分页现在走 TanStack Query v5 的 infinite query 形态，但不手写 fetcher 或 query
key：`orpc.workboard.list.infiniteOptions()` 负责从 contract 推导输入 / 输出类型。
后端仍负责 cursor pagination，前端只把 infinite query 传入的 `pageParam` 作为
`cursor` 发给后端，再用后端返回的 `nextCursor` 作为下一页参数。这样 `Load more`
追加已加载 pages，而不是把 URL cursor 改成下一页后整表替换。

官方 page-based 示例使用 `rowCount` 或 `pageCount`，但当前 D1 read model 是 cursor
pagination，`workboard.list` 只返回 `nextCursor`。等后端需要页码、总数或 Saved
Views 时，再扩展 contract。

## 验证

- `pnpm exec vp fmt --write apps/app/src/routes/workboard.tsx docs/dev-file/05-Frontend-Architecture.md`
- `pnpm exec vp fmt --check apps/app/src/routes/workboard.tsx docs/dev-file/05-Frontend-Architecture.md docs/dev-log/2026-04-28-workboard-tanstack-table-url-state.md`
- `pnpm --filter @duedatehq/app test -- --run`
- `pnpm --filter @duedatehq/app exec tsc --noEmit --pretty false`
- 2026-04-28 follow-up：`pnpm exec vp check apps/app/src/routes/workboard.tsx`
- 2026-04-28 follow-up：`pnpm exec vp fmt --check apps/app/src/routes/workboard.tsx`

`fmt --check` 通过；app 测试 8 files / 49 tests 通过。`tsc` 中 Workboard 相关类型通过；随后修复了既有 `packages/ui/src/components/ui/sidebar.tsx` Base UI `render` prop 类型错误，并重新跑通：

- `packages/ui/src/components/ui/sidebar.tsx:302`
- `packages/ui/src/components/ui/sidebar.tsx:355`
- `pnpm --filter @duedatehq/app exec tsc --noEmit --pretty false`

根因是 `mergeProps<'button'>` 的 object-literal 入参按 `React.ComponentPropsWithRef<'button'>` 收窄，不接受 `data-*` key；而 Base UI `useRender({ props })` 本身接受 `Record<string, unknown>` 并负责把 props 合成到默认元素或 `render` 元素。sidebar 现在直接把合并后的 props 传给 `useRender`，`SidebarTrigger` 仍显式包住外部 `onClick` 后再切换 mobile sheet。

## 后续 / 未闭环

- 真正 optimistic status rollback 尚未做，当前仍是 mutation 成功后 invalidate + toast audit id。
- 批量选择、列可见性、自定义列、Saved Views 需要在后续 PRD workboard 扩列时继续走 TanStack controlled state。
- 如果 `workboard.list` 未来返回 `rowCount`，可以改为官方推荐的 `rowCount` / page controls；否则保持 cursor infinite query。
