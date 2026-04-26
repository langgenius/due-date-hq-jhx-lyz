---
title: 'Root route error boundary'
date: 2026-04-26
commit: 'db53af0'
author: 'Codex'
---

# Root route error boundary

## 背景

未知 app 路由会显示 React Router 默认的 `Unexpected Application Error! 404 Not Found`
开发提示。原因是 `RouteErrorBoundary` 只挂在 `/login`、`/onboarding` 和 protected `/`
路由上；React Router 匹配阶段产生的 404 不属于这些 route subtree，因此没有命中自定义
boundary。

## 做了什么

- 将 `RouteErrorBoundary` 收敛到 React Router root route，只保留一个全局 boundary。
- 删除 `/login`、`/onboarding` 和 protected `/` 上重复的同款 `ErrorBoundary` 配置。
- 增加 public `*` catch-all route，loader 抛 404 `Response`，由 root boundary 渲染统一
  not found UI。
- 为 404 增加专用标题和说明文案，并更新 Lingui catalog。
- 更新 `docs/dev-file/05-Frontend-Architecture.md`、
  `docs/dev-file/12-Marketing-Architecture.md` 和 ADR 0013 中关于 root route 职责的描述。

## 为什么这样做

React Router v7 data router 的错误会冒泡到最近的 route `ErrorBoundary`。当前
`RouteErrorBoundary` 是全屏错误页，并不保留某个子 layout，所以在多个 route 上重复挂同一个
boundary 只增加配置噪声，没有改善 UX。

root-only boundary 更符合当前产品状态：所有 loader、lazy route、render error 和 unmatched
404 都有同一个兜底。未来如果 protected app 需要“保留 shell，只替换内容区”的错误体验，再在
protected layout 加一个不同的局部 boundary。

参考：

- React Router `error-boundary` how-to：route boundary 接住自身和 child route 错误，错误向最近
  parent boundary 冒泡。
- React Router routing docs：catch-all `*` route 的 loader 可抛 404 `Response`，再由
  `ErrorBoundary` 渲染 not found UI。

## 验证

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test`
- `pnpm check`

## 后续 / 未闭环

无。当前只是统一错误兜底；没有引入新的 error reporting 或 telemetry。
