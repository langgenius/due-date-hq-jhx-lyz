---
title: 'Foxact Obligations Search Debounce'
date: 2026-04-28
author: 'Codex'
updates:
  - note: '2026-04-29 helper renamed from search-specific Obligations defaults to generic query input debounce.'
---

# Foxact Obligations Search Debounce

## 背景

`/obligations` 的搜索框会进入 `orpc.obligations.list`，筛选 / 排序 / 分页都由服务端
read model 处理。之前代码用 `useDeferredValue(searchInput.trim())` 参与 React
Query input，但 `useDeferredValue` 只调整 React 渲染优先级，不能保证“用户停止输入
N ms 后再发请求”。nuqs 官方文档也明确区分：

- `limitUrlUpdates: debounce(...)` 适合 loader / RSC 这类 URL 更新触发服务端请求的场景。
- 客户端 fetching（例如 TanStack Query）应 debounce hook 返回的 state，再把 debounced
  state 放进 query key / input。

## 调研

本次扫描了 app 与 ui 包里可疑的 timing / browser hook 使用点：

- `apps/app/src/routes/obligations.tsx`：唯一直接把搜索输入接到客户端 query input 的位置，需要
  `useDebouncedValue`。
- `apps/app/src/lib/theme-preference-store.ts` 与 i18n provider：使用
  `useSyncExternalStore` 订阅外部 store / storage / media query，不能用普通 debounce 或
  media hook 替代。
- `packages/ui/src/hooks/use-mobile.ts`：已经是 Base UI `useMediaQuery` 的 project-semantic
  wrapper，继续留在 `packages/ui`，避免让 ui 包依赖 app-only hook library。
- 普通 `useState` open/confirming/showAll 状态没有 timing 或 external-store 需求，不替换。

结论：引入 foxact，但只 deep import `foxact/use-debounced-value` 到 app 层公共 helper；
不做全仓库机械替换。

## 做了什么

- 在 `pnpm-workspace.yaml` catalog 与 `apps/app/package.json` 中加入 `foxact@0.3.0`。
- 新增 `apps/app/src/lib/query-rate-limit.ts`（2026-04-29 已泛化命名）：
  - `QUERY_INPUT_DEBOUNCE_MS = 350`
  - `queryInputUrlUpdateRateLimit = debounce(350)`，用于 nuqs URL 写入降频
  - `useDebouncedQueryInput(value, { maxLength })`，底层使用 `foxact/use-debounced-value`
- Obligations 搜索输入继续即时显示 `nuqs` state；`obligations.list` input 改为使用
  debounced search。清空搜索时立即返回空查询，避免“清空后还等 350ms”。
- `ObligationQueueListInputSchema.search` 上限收紧为 64 字符，并导出
  `OBLIGATIONS_SEARCH_MAX_LENGTH` 给 app 层裁剪使用。
- `packages/db/src/repo/obligations.ts` 在进入 D1 `LIKE` 前 normalize 搜索词、过滤不适合
  客户名搜索的复杂标点、转义 LIKE wildcard，避免任意用户输入触发 SQLite pattern
  编译错误并冒成 500。
- Obligations sort/status select trigger 显式渲染 Lingui label，避免 Base UI trigger
  回退展示 raw value。
- 更新 `docs/dev-file/01-Tech-Stack.md` 与 `docs/dev-file/05-Frontend-Architecture.md`。

## 为什么这样做

Vercel 规则侧重点：

- `bundle-barrel-imports`：使用 `foxact/use-debounced-value` deep import，不从 barrel 拉整包。
- `rerender-use-deferred-value`：`useDeferredValue` 适合昂贵渲染降优先级，不适合减少网络请求。
- `rerender-derived-state-no-effect`：请求参数在 render 阶段从 debounced state 派生，不用 effect
  同步第二份状态。

TanStack Query 的 query input 应该包含实际影响请求的变量。把 debounced search 放进
`orpc.obligations.list.infiniteOptions({ input })`，让 query key 与请求参数保持一致。

## 验证

- `pnpm install`
- `pnpm exec vp check apps/app/src/lib/query-rate-limit.ts apps/app/src/routes/obligations.tsx apps/app/src/features/obligations/status-control.tsx docs/dev-file/01-Tech-Stack.md docs/dev-file/05-Frontend-Architecture.md docs/dev-log/2026-04-28-obligations-tanstack-table-url-state.md docs/dev-log/2026-04-28-foxact-obligations-search-debounce.md pnpm-workspace.yaml apps/app/package.json`
- `pnpm --filter @duedatehq/app exec tsc --noEmit --pretty false`
- `pnpm --filter @duedatehq/app test -- --run`
- `pnpm --filter @duedatehq/db test -- --run`
- `pnpm --filter @duedatehq/contracts test -- --run`

## 后续 / 未闭环

- 如果后续新增客户端搜索 / slider / high-frequency filter，同样先评估是否需要
  `useDebouncedQueryInput(value, { maxLength })`；不要在 route 内手写 timer。
