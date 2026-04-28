---
title: '2026-04-28 · Node tooling tsconfig'
date: 2026-04-28
---

# 2026-04-28 · Node tooling tsconfig

## 背景

TypeScript 6 不再默认把所有 `@types/*` 暴露到全局 scope。根级 Playwright 配置、
e2e specs、`scripts/**/*.ts` 和 Vite 配置都运行在 Node 环境里，直接使用
`process` 时需要从 tsconfig 显式引入 `@types/node`。

用 `/// <reference types="node" />` 逐文件补洞会把运行时边界散落到源码里，也容易漏掉
新文件。

## 做了什么

- 在 `packages/typescript-config` 新增 `node.json`，集中声明 Node globals。
- 让 `library.json` 继承 `node.json`，避免重复声明 `types: ["node"]`。
- 新增根 `tsconfig.json`，只覆盖 Node tooling 文件和 Vite config 文件。
- 从 `apps/app/tsconfig.json` 移出 `vite.config.ts`，避免 SPA runtime tsconfig 暴露 Node globals。
- 删除 `playwright.config.ts` 和 `scripts/check-rule-sources.ts` 里的 Node triple-slash reference。

## 验证

- `pnpm exec tsc --showConfig --project tsconfig.json`
- `pnpm exec tsc --noEmit --pretty false --project tsconfig.json`
- `pnpm exec tsc --noEmit --pretty false --project apps/app/tsconfig.json`
- `pnpm exec tsc --noEmit --pretty false --project packages/core/tsconfig.json`
- `pnpm exec tsc --noEmit --pretty false --project packages/db/tsconfig.json`
- `pnpm check`

备注：`pnpm check` 仍报告 1 个既有 warning，位于
`packages/ui/src/lib/placement.ts` 的 tuple type assertion；本次未触碰该文件。
