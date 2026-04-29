---
title: 'Route document title metadata'
date: 2026-04-29
author: 'Codex'
---

# Route document title metadata

## 背景

`apps/app/index.html` 只有静态 `DueDateHQ` title，SPA 内部路由切换不会更新浏览器标签页标题。受保护 shell 里已经有一套 pathname switch 给 AppShell route header 生成 `eyebrow` / `title`，但这套信息没有被浏览器 document title 复用。

React 19 已经原生支持在组件树中渲染 `<title>` 并提升到 document head；React Router v7 library/data mode 则适合用 route object 的 `handle` 挂应用自定义 metadata。项目不需要引入 React Helmet，也不适合用 hook/effect 直接写 `document.title`。

## 做了什么

- 新增 `apps/app/src/routes/route-summary.ts`，把 `RouteSummaryMessages` 抽成共享类型，并集中定义每个页面的 Lingui route summary。
- 在 `apps/app/src/router.tsx` 的 route objects 上挂 `handle.routeSummary`。
- 新增 `RouteDocumentTitle`，在 root route 组件里用 `useMatches()` 取最深层 summary，并渲染 `<title>{page} | DueDateHQ</title>`。
- `RootLayout` 改为从同一个 helper 读取 route summary，删除原来的 pathname switch。
- `RouteErrorBoundary` 自己渲染错误页 title，避免 404 或 loader error 时保留上一个成功页面标题。
- `docs/dev-file/05-Frontend-Architecture.md` 补充 route metadata 与 document title 纪律。

## 为什么这样做

- `handle.routeSummary` 让路由本身持有页面摘要，AppShell header 和 browser title 不再各维护一套规则。
- React 19 原生 head metadata 覆盖当前需求，避免新增依赖和 provider。
- 保持 React Router v7 library/data mode，不切到 framework mode 的 `meta` export / `<Meta />` 体系。
- title 格式采用页面优先的 `<page> | DueDateHQ`，符合 SPA 可访问性要求：不同 view 应动态反映当前页面主题。

## 验证

- 增加 `router.test.ts` 对最深层 route summary、fallback summary、document title 格式做单元覆盖。
- 本次最终验证命令记录在交付回复中。

## 后续 / 未闭环

- 当前标题都是静态 route-level title。未来若新增客户详情等动态详情页，可以把 `routeSummary` 扩展为接收 loader data 的函数，但必须继续作为 AppShell header 与 document title 的同一来源。
