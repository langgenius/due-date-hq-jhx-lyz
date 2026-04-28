---
title: 'RPC error logging boundary'
date: 2026-04-28
author: 'Codex'
---

# RPC error logging boundary

## 背景

Migration Copilot Step 2 调用 `migration.runNormalizer` 出现 500 时，本地只能看到 Wrangler access
log，缺少 procedure 级异常日志。原因是 Hono app 只挂了 request id middleware，`RPCHandler`
也没有配置 oRPC error interceptor；procedure 内异常被 oRPC 编码成 500 response 后，不会稳定冒泡到
Hono 的错误处理链路。

## 做了什么

- 在 `apps/server/src/middleware/logger.ts` 增加统一 server error log serializer，默认只输出 5xx
  或无 status 的异常。
- 在 `apps/server/src/rpc.ts` 通过 oRPC `onError` client interceptor 记录 procedure 级 5xx，并附
  `requestId`、firm/user context 和 procedure path。
- 在 `apps/server/src/app.ts` 增加 Hono `app.onError` 兜底，覆盖 Hono middleware、普通 route 和
  `rpcHandler` 外层异常。
- 更新 `docs/dev-file/02-System-Architecture.md`，明确 Hono 与 oRPC 错误边界不能混作一个 hook。
- 更新 `docs/dev-file/07-DevOps-Testing.md`，记录 server error log 字段和 PII 禁止项。

## 为什么这样做

Hono 官方推荐使用 `app.onError` 处理应用未捕获异常；oRPC 官方推荐在 `RPCHandler` 上通过
`onError` interceptor 记录服务端错误。DueDateHQ 的 `/rpc/*` 是 Hono route 挂载 oRPC handler：
Hono 负责 HTTP route/middleware 边界，oRPC 负责 procedure 边界。统一点放在日志 serializer，而不是
强行把两个框架的错误生命周期合成一个 hook。

## 验证

- `pnpm exec vp check apps/server/src/app.ts apps/server/src/rpc.ts apps/server/src/middleware/logger.ts apps/server/src/middleware/logger.test.ts docs/dev-file/02-System-Architecture.md docs/dev-file/07-DevOps-Testing.md docs/dev-log/2026-04-28-rpc-error-logging-boundary.md`：通过。
- `pnpm --filter @duedatehq/server test -- app.test.ts`：通过。
- `pnpm --filter @duedatehq/server test -- app.test.ts middleware/logger.test.ts`：通过。
- `pnpm --filter @duedatehq/server exec tsc --noEmit`：本次改动相关类型错误已清理；命令仍被既有
  `packages/db/src/repo/workboard.ts` 的 `Buffer` 类型错误阻塞。

## 后续 / 未闭环

- `migration.runNormalizer` 的 Tax Types fallback 仍需要单独定位：预期内的 normalizer 失败应转成
  `ORPCError` 或写入 `migration_error`，不应长期表现为未分类 500。
- Sentry / Logpush 正式接入后，应让当前 serializer 的字段成为上报 payload 的基础结构。
