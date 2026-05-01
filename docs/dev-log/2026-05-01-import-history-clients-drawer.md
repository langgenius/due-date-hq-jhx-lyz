---
title: 'Import history moves under Clients'
date: 2026-05-01
author: 'Codex'
---

# Import history moves under Clients

## 背景

`/imports` 作为 sidebar 下的一等页面会让用户误以为导入后的客户资料修正应该通过 import
revert 完成。实际产品语义不同：单个客户事实错误应在 Clients 里改；revert 只处理错误文件、
重复导入、字段映射错误这类批量副作用。

## 做了什么

- 从 sidebar Clients 组移除 `Imports`。
- 将导入历史改成 `/clients` header 的弱入口，打开右侧 `ImportHistoryDrawer`。
- drawer 复用现有 batch list / full revert / single undo API，并增加危险操作确认。
- `View` imported client 会回到 Clients 列表并打开 fact profile。
- 历史 `/imports` URL 保留兼容，重定向到 `/clients?importHistory=open`。
- 同步 stable design / frontend architecture / migration copilot 文档。

## 为什么这样做

Clients 是客户事实的日常维护面；Import history 只是 batch recovery。把历史和撤销放进 Clients
drawer，可以保留恢复能力，又不把低频危险操作提升成日常导航。

## 验证

- `pnpm --filter @duedatehq/app test -- --run src/router.test.ts`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
