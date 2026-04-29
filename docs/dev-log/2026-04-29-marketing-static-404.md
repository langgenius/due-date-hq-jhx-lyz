---
title: 'Marketing static 404 fallback'
date: 2026-04-29
author: 'Codex'
---

# Marketing static 404 fallback

## 背景

`apps/marketing` 是 Astro static output，Cloudflare Workers Static Assets 已配置
`not_found_handling = "404-page"`，但站点没有 `src/pages/404.astro`。构建产物因此没有
`dist/404.html`；访问未发布路径时会落到平台默认 404，而不是 DueDateHQ 的品牌化兜底。

这和 `apps/app` 的 React Router root `RouteErrorBoundary` 是两套机制。Marketing 不应该为了
404 引入 SPA router 或 React island；Astro 官方静态站实践是创建特殊 `404.astro` 页面，让部署
平台识别生成的 `404.html`。

## 做了什么

- 新增 `apps/marketing/src/pages/404.astro`，复用 `BaseLayout`、`TopNav`、`Footer` 和 shared
  design tokens。
- 扩展 `BaseLayout` 支持 `/404` canonical path 和可选 `noindex` robots meta。
- 将 404 文案纳入 marketing i18n contract：`notFound` copy 同步补齐 en / zh-CN，当前根级
  fallback 使用英文默认页。
- 更新 `docs/dev-file/12-Marketing-Architecture.md`，明确 Astro static 404 和 React Router
  boundary 的边界。
- 更新 `docs/dev-file/07-DevOps-Testing.md`，把 `404.html` 纳入 marketing smoke。

## 设计约束

404 页保持静态、无 React island、无数据请求。顶部导航里的 homepage anchor 会被改写成
`/#section`，避免用户在 404 页点击锚点后停留在空 section。页面标记 `noindex, nofollow`，不让
错误路径进入公开 SEO 内容。

## 验证

- `pnpm --filter @duedatehq/marketing build`
- 构建产物包含 `apps/marketing/dist/404.html`
