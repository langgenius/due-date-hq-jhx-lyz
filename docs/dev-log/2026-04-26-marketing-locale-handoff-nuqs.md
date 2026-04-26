# Marketing Locale Handoff with nuqs

日期：2026-04-26 · 作者：Codex · 相关 commit：同本变更提交

## 背景

中文 marketing 页需要把 CTA 指向 app root 并携带 `?lng=zh-CN`，但 app 入口没有读取
`lng` query。实际行为是 app 只看 `localStorage["lng"]`、浏览器语言和默认英文，导致中文
landing 到 app 的首屏语言无法由 CTA 稳定决定。

## 做了什么

- 将 `lng` 作为一次性 URL handoff 状态纳入 nuqs，而不是手写 `URLSearchParams`。
- 使用 `parseAsStringLiteral(SUPPORTED_LOCALES)`，让 runtime validation 和 TypeScript 类型都从
  `packages/i18n` 的单一 locale list 推导。
- 在 React Router v7 root route 接入 `nuqs/adapters/react-router/v7`。
- 在 `createAppRouter()` 创建前执行 app i18n bootstrap，同步消费有效 `lng`、同步 Lingui
  locale、`<html lang>` 和 `localStorage["lng"]`，然后用 nuqs serializer +
  `history.replaceState` 清理 query。
- React Router loaders 遇到有效 `lng` 时只消费、不透传，避免 auth/onboarding redirect 后 URL
  仍残留一次性 handoff 参数。
- Marketing CTA 改为 app root：英文 `https://app.duedatehq.com`，中文
  `https://app.duedatehq.com/?lng=zh-CN`。Top nav 删除同 href 的 `Sign in` / `登录` 文本
  CTA，只保留一个 `Open app` / `打开 App` 主按钮。
- 更新 ADR 0013、Marketing Architecture §6.3 和 Lingui ADR 的数据流说明。

## 为什么这样做

nuqs 官方文档建议 React Router v7 使用 `nuqs/adapters/react-router/v7`，并用
`parseAsStringLiteral` 校验有限字符串集合。把 `lng` 放在 root-level sync 中，而不是塞进
`/login` 组件，可以覆盖 loader 重定向、onboarding 和未来公开 route。

同步 bootstrap 负责首屏语言、持久化和 URL cleanup，这是为了避免中文 CTA 首屏先渲染英文再切换。
本轮刻意不使用 `useEffect` bridge：入口语言不是派生 UI 状态，不应在渲染后修正。

后续复查发现，若只在 React provider 首次挂载时消费，`createBrowserRouter()` 可能已经捕获带
`lng` 的初始 URL 并启动 loader，进而把 `lng` 追加到 redirect。修正后 bootstrap 前移到
`main.tsx`，在 `createAppRouter()` 前显式运行；loader 也改为消费并丢弃 `lng`，保证参数生效但
不留在最终 URL。

## 验证

- `pnpm --filter @duedatehq/app test -- src/i18n/provider.test.tsx src/router.test.ts`：通过，2
  个文件 / 25 个测试。
- `pnpm --filter @duedatehq/app test`：通过，4 个文件 / 33 个测试。
- `pnpm --filter @duedatehq/app i18n:extract`：通过，catalog 统计 en/zh-CN 均 220 条。
- `pnpm --filter @duedatehq/app i18n:compile`：通过。
- `pnpm --filter @duedatehq/app build`：通过。
- `pnpm --filter @duedatehq/marketing build`：通过。
- `pnpm check:deps`：通过。
- `pnpm check:fix`：通过，完成格式化并确认 187 个文件无 lint/type 错误。
- `pnpm check`：通过，312 个文件格式正确，187 个文件无 lint/type 错误。

## 后续 / 未闭环

- PostHog cross-domain `ph_did` 仍是单独的 analytics handoff，不在本次范围。
- Theme cross-domain sync 仍按 `docs/dev-file/12-Marketing-Architecture.md` §5.2 保持不做。
