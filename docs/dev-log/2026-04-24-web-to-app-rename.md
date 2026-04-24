# Rename SaaS SPA from web to app

日期：2026-04-24 · 作者：Codex · 相关 commit：待提交

## 背景

新增 Astro marketing site 后，`apps/web` 会变成一个含糊名称：公开站点也是 web，登录后的 SaaS 产品也是 web。UI primitives 和 design tokens 已经下沉到 `packages/ui`，因此下一步可以把 React SPA 的 workspace 名称从 `web` 收紧为 `app`。

## 做了什么

- 将 `apps/web` 重命名为 `apps/app`。
- 将 workspace package 从 `@duedatehq/web` 重命名为 `@duedatehq/app`。
- 更新根构建脚本、server fullstack dev 脚本、Wrangler Assets binding 路径和依赖方向检查。
- 更新当前架构文档、ADR、product design 里的路径引用，避免文档链接指向不存在的旧目录。

## 为什么这样做

`app` 表达的是产品语义：登录后的 SaaS application。它和未来的 `apps/marketing`、现有 `apps/server` 并列时边界清楚。

没有选择 `client`，因为它偏技术角色，容易和 oRPC client、Better Auth client、browser client 混淆；也没有继续保留 `web`，因为 Astro 加入后会继续产生“哪个 web”的问题。

## 验证

- `rg "apps/web|@duedatehq/web|../web|web/dist|web#build" --glob '!docs/dev-log/2026-04-24-web-to-app-rename.md'`：无命中。
- `pnpm check:deps`：通过。
- `pnpm --filter @duedatehq/app test`：4 个 test files、26 个 tests 通过。
- `pnpm --filter @duedatehq/app build`：通过；保留既有 500 kB chunk warning。
- `pnpm --filter @duedatehq/server build`：通过；Wrangler 从 `apps/app/dist` 读取 assets。
- `pnpm check`：格式、lint、type-aware checks 通过。

## 后续 / 未闭环

`apps/marketing` 尚未创建。本次只处理 SaaS SPA 命名，不引入 Astro、不调整部署拓扑。
