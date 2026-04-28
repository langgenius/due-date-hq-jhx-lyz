---
title: 'Dashboard canonical root route'
date: 2026-04-28
author: 'Codex'
---

# Dashboard canonical root route

## 背景

Migration Step 4 apply 成功后跳转到 `/dashboard`，但 React Router 里 Dashboard 实际是受保护
shell 下的 index route，也就是 `/`。这会让 import 完成后的导航落到未声明路由，同时让产品语义
出现两个入口：`/` 和 `/dashboard`。

## 做了什么

- 把 migration apply 成功后的内部跳转改为 `/`。
- 新增 `/dashboard` alias loader，访问旧链接时 302 到 `/`。
- 补单测覆盖 alias loader。
- 同步架构 / 产品文档，把 Dashboard canonical URL 记录为 `/`，`/dashboard` 仅保留为历史兼容入口。

## 为什么这样做

Dashboard 是登录后的 app root，侧边栏、命令面板和 `G D` 快捷键都已经以 `/` 作为目标。保留一个
canonical URL 可以避免 active nav、`redirectTo`、埋点和分享链接出现重复语义；兼容 redirect 则让
旧链接和历史登录回跳不至于 404。

## 验证

- `pnpm --filter @duedatehq/app test -- --run src/router.test.ts`
- `pnpm check`

## 后续 / 未闭环

无。
