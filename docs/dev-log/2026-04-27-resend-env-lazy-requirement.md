---
title: 'Resend env lazy requirement'
date: 2026-04-27
---

# Resend env lazy requirement

## 背景

Better Auth 不强制要求 Resend。DueDateHQ 只是在 `organization()` 插件的
`sendInvitationEmail` hook 中把邀请邮件发送接到了 Resend。当前 P0 又设置
`invitationLimit: 0`，正常的 Google 登录、创建组织、进入 app 路径不会发送邀请邮件。

旧逻辑在 `validateServerEnv` 中要求非 development 环境必须配置 `RESEND_API_KEY`。
这会让 `/api/auth/*` 和 session middleware 在创建 auth 实例时提前失败，即使请求不
涉及发送邮件。

## 本次调整

- 保持 `RESEND_API_KEY` 为 optional env，不再在非 development 启动期强制要求。
- 保留发送时校验：`apps/server/src/auth.ts` 的 auth email sender 在真正发送邮件时，
  development 缺 key 只打印日志，非 development 缺 key 仍抛错。
- 补 `apps/server/src/env.test.ts`，锁定 production 缺少 Resend key 时 env 校验仍能通过。
- 同步 `.dev.vars.example`、Tech Stack 和 Security Compliance 文档，明确 Resend key
  对登录 + 组织 bootstrap 非必需，但对真实邮件发送必需。

## 校验依据

- Resend 官方 Node SDK 文档要求发送邮件时用 API key 初始化 SDK，并且 `emails.send`
  返回 `{ data, error }`。
- Better Auth organization 文档把 `sendInvitationEmail` 展示为自定义邀请邮件 hook；
  Google social provider 主要依赖 Google client id / secret 与 auth secret / url。
