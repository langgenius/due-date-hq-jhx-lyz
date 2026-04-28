---
title: '2026-04-27 · TypeScript 配置入口收敛'
date: 2026-04-27
---

# 2026-04-27 · TypeScript 配置入口收敛

## 背景

仓库同时存在根目录 `tsconfig.base.json` 和 `packages/typescript-config/*`，容易让人误解有两套共享 TypeScript 配置。实际工作区里的 app / package 都继承 `@duedatehq/typescript-config/<variant>.json`，根目录文件只覆盖 `scripts/**/*.ts`。

当前 `scripts/` 只有 `.mjs` 运维脚本，没有 `.ts` 脚本需要根级 TypeScript project。继续保留根目录 `tsconfig.base.json` 会制造过时入口。

## 做了什么

- 删除根目录 `tsconfig.base.json`。
- 保留 `packages/typescript-config` 作为唯一共享 TypeScript 配置来源。
- 更新项目结构文档，明确根目录不放 `tsconfig.json` / `tsconfig.base.json`。
- 修正前端架构文档里的旧包名引用，从 `@repo/typescript-config` 改为 `@duedatehq/typescript-config`。

## 为什么这样做

TypeScript 的 `extends` 会按配置文件位置解析相对路径，且子配置的 `include` / `exclude` / `files` 会覆盖父配置。把共享 compiler options 放进 workspace package，再由每个 app / package 明确选择 `library`、`vite`、`worker` variant，边界更清楚。

如果未来根目录确实新增 TypeScript 脚本，优先把脚本放到合适的 workspace package。只有必须保留根级脚本时，再新增语义明确的 `tsconfig.scripts.json`，不要恢复 `tsconfig.base.json`。

2026-04-28 更新：仓库已新增根级 Playwright / e2e / TypeScript scripts 覆盖面，因此恢复根
`tsconfig.json`，但只作为 Node tooling project；共享 compiler options 仍由
`packages/typescript-config` 维护，且没有启用 TypeScript project references。

## 验证

- `pnpm ready`

备注：`vp check` 仍报告 1 个既有 warning，位于 `packages/ui/src/lib/placement.ts` 的 tuple type assertion；本次未触碰该文件。
