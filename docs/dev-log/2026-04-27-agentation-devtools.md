---
title: 'Agentation devtools'
date: 2026-04-27
author: 'Codex'
---

# Agentation devtools

## 背景

Vite SPA 现在没有面向 AI 代码修改反馈的浏览器内标注工具。用户希望按照官方最佳
实践添加 Agentation devtools，让开发者能在页面上点选元素、添加反馈，并把结构化
上下文交给 coding agent。

官方文档建议安装 `agentation`，在 React 根部渲染 `<Agentation />`，并用开发环境
判断避免生产环境启用。

## 做了什么

- 在 workspace catalog 固定 `agentation@3.0.2`。
- 在 `@duedatehq/app` devDependencies 中通过 `catalog:` 引用 `agentation`。
- 在 `apps/app/src/main.tsx` 增加 `AppDevtools`：
  - 使用 `import.meta.env.DEV` 作为 Vite SPA 的开发环境 guard。
  - 使用 `React.lazy` 动态加载 `agentation`，保持生产路径不加载 devtools 组件。
  - 将 devtools 放在 `RouterProvider` 和 `Toaster` 同级、`TooltipProvider` 内部，
    覆盖整个 SPA DOM。

## 为什么这样做

把 Agentation 放在 React 根部符合官方推荐，也避免把标注能力绑到某个 route 或
feature。使用 Vite 的 `import.meta.env.DEV` 比 `process.env.NODE_ENV` 更符合当前
SPA 工具链；配合动态 import，可以让生产构建在常量折叠后跳过 devtools 路径。

没有新增 app 环境变量或 Vite 插件，因为 Agentation 是客户端 React 组件，当前需求
只需要开发环境内的浏览器工具入口。

## 验证

```bash
pnpm install
pnpm --filter @duedatehq/app test
pnpm --filter @duedatehq/app build
pnpm check:deps
pnpm check
rg -n "agentation|Agentation" apps/app/dist/assets/*.js --glob '!*.map' || true
```

`pnpm --filter @duedatehq/app test` 通过 7 个测试文件、45 个测试。生产构建通过，
并且生产 JS 产物中没有 `agentation` / `Agentation` 字符串；只有 sourcemap 保留了
原始源码内容。`pnpm check:deps` 通过。`pnpm check` 退出成功，仍报告仓库既有的两个
unsafe type assertion warning：`packages/ui/src/lib/placement.ts` 和
`apps/server/src/env.test.ts`。

## 后续 / 未闭环

- 如果后续要把 annotation 自动发送到后端或 agent inbox，再接入 Agentation 的
  `onAnnotationAdd` 回调；本次只启用本地 devtools。
- 稳定架构文档没有新增运行时约束，本次无需更新 `docs/dev-file/*` 或 `DESIGN.md`。
