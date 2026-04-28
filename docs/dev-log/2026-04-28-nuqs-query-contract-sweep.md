# 2026-04-28 · nuqs query contract 全仓梳理

## 背景

Rules Console 的 tab 状态接入 `nuqs` 后，继续全仓检查 app 内 URL state 是否都采用同一套
parser / type 模式。目标模式是：

```ts
export const featureSearchParamsParsers = {
  key: parser.withDefault(value).withOptions(options),
} as const

export type FeatureSearchParams = inferParserType<typeof featureSearchParamsParsers>
```

这样 runtime validation、默认值、URL 更新行为和 TypeScript 类型都落在同一份 contract 里，
避免组件 state、hook options、手写 interface 各写一份后慢慢漂移。

## 为什么这样最好

- **运行时和类型系统同源。** literal parser 负责校验 URL 里的真实字符串，
  `inferParserType` 从同一份 parser map 推导 TypeScript 类型。后续新增或删除 tab /
  status / sort 选项时，运行时校验和类型会一起变化。
- **默认值不会漂移。** 默认值放在 parser contract 里，组件拿到的就是已经 normalize
  过的值，不需要每个消费点再写 fallback。
- **URL 行为跟着 contract 走。** `history: 'replace'`、`clearOnDefault` 这类行为应该属于
  search param contract，而不是某一次 hook 调用。未来 serializer / loader 复用时不会漏掉。
- **后续扩展有固定入口。** Workboard 后续加 saved view、Rules Console 后续加 drawer /
  filter key，都只是在对应 `*SearchParamsParsers` 里扩字段，再由一个 inferred type 承接。
- **保留 server 复用路径。** 当前 app 是 React Router v7 + Vite SPA，parser map 仍从
  `nuqs` 导入即可；如果某个 contract 以后进入 React Router loader、Worker route 或其他
  server-side parser，再把 parser-only 模块切到 `nuqs/server`，消费侧类型形状不需要重写。

## 扫描结果

全仓 `nuqs` 扫描只发现这些活跃代码路径：

| 区域           | 文件                                | 结论                                                                  |
| -------------- | ----------------------------------- | --------------------------------------------------------------------- |
| Adapter        | `apps/app/src/router.tsx`           | 已固定使用 `nuqs/adapters/react-router/v7`，无需修改。                |
| Locale handoff | `apps/app/src/i18n/query.ts`        | 已有 parser map 和 serializer；本次把类型推导也改为从 parser map 来。 |
| Workboard      | `apps/app/src/routes/workboard.tsx` | 改为导出 `workboardSearchParamsParsers` + `WorkboardSearchParams`。   |
| Rules Console  | `apps/app/src/features/rules/*`     | 改为导出 `rulesConsoleSearchParamsParsers` + inferred tab type。      |

当前不需要引入 `nuqs/server`。这些 query contract 都在 client SPA 中消费；只有当它们被
React Router loader、Worker route 或 server-side parser 共享时，才需要把 parser-only 模块
迁到 `nuqs/server`。

## 实现

- `apps/app/src/i18n/query.ts`
  - 新增 `LocaleQuery = inferParserType<typeof localeQueryParsers>`。
  - `LocaleQueryValue` 改为从 parser map 推导，而不是直接从单个 parser 推导。
- `apps/app/src/routes/workboard.tsx`
  - `workboardQueryParsers` 重命名为 `workboardSearchParamsParsers`。
  - 新增 `WorkboardSearchParams`。
  - 把所有 managed key 的 `history: 'replace'` 移到 parser-level options。
- `apps/app/src/features/rules/rules-console-model.ts`
  - 新增 `rulesConsoleSearchParamsParsers`。
  - 用 `inferParserType` 推导 `RulesConsoleSearchParams` 和 `RulesTab`。
- `apps/app/src/features/rules/rules-console.tsx`
  - 直接消费 `rulesConsoleSearchParamsParsers.tab`。

## 文档

- `docs/dev-file/05-Frontend-Architecture.md` 现在把 parser map +
  `inferParserType` 记录为可复用 URL state 的默认模式。
- `docs/dev-file/12-Marketing-Architecture.md`、locale handoff devlog、Workboard
  devlog、Rules Console tab devlog 已同步到当前实现。

## 验证

- `pnpm exec vp check --fix apps/app/src/i18n/query.ts apps/app/src/routes/workboard.tsx apps/app/src/features/rules/rules-console.tsx apps/app/src/features/rules/rules-console-model.ts apps/app/src/features/rules/rules-console-model.test.ts docs/dev-file/05-Frontend-Architecture.md docs/dev-file/12-Marketing-Architecture.md docs/dev-log/2026-04-26-marketing-locale-handoff-nuqs.md docs/dev-log/2026-04-28-workboard-tanstack-table-url-state.md docs/dev-log/2026-04-28-rules-console-tab-url-state.md docs/dev-log/2026-04-28-nuqs-query-contract-sweep.md`
  — 通过，目标文件无 warning / lint / type error。
- `pnpm --filter @duedatehq/app test -- --run src/features/rules/rules-console-model.test.ts`
  — 5/5 通过。
- `pnpm --filter @duedatehq/app exec tsc --noEmit --pretty false` — 通过。
