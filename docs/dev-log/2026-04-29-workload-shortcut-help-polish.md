---
title: '2026-04-29 · Workload shortcut and keyboard help polish'
date: 2026-04-29
author: 'Codex'
---

# Workload shortcut and keyboard help polish

## 背景

Sidebar IA 已经把 `Team workload` 提升为 `Practice` 下的付费团队容量面，但全局 `G then ...`
导航序列仍只覆盖 Dashboard / Obligations / Clients / Alerts。与此同时，`?` 帮助浮层虽然从
TanStack registry 生成，但旧布局是单列列表，视觉密度低，内部滚动边界不稳定。

## 做了什么

- 新增 `G then T` 全局导航序列，跳转到 `/workload`，并在 shortcut help registry 中显示
  `Go to Team workload`。
- 将全局导航序列抽到 `navigation-shortcuts.ts`，避免实现、测试和文档各自维护页面集合。
- 按 TanStack Hotkeys 文档和源码口径整理格式：导航用 `useHotkeySequence(['G', 'T'])`；
  shifted punctuation 的 `?` 用 RawHotkey 对象 `{ key: '/', shift: true }` 注册，展示层仍显示
  `?`。
- 重做 `ShortcutHelpDialog`：保留 Dialog + registry 数据源，改为固定最大高度、内部
  `overflow-y-auto`、左侧分类摘要、右侧按 category 分组的 shortcut rows。
- 使用现有 DueDateHQ semantic tokens：`bg-components-panel-bg`、`border-components-panel-border`、
  `shadow-overlay`、`bg-background-*`、`text-text-*`，保持与 Command Palette / AppShell 一致。
- 同步 PRD、ADR、DESIGN 和前端架构文档，把导航序列更新为 `G then D/W/C/A/T`。

## 为什么这样做

`Team workload` 仍属于高频团队调度工作流，值得保留 `G then T`；Rules 归入 Operations 后仍
通过 Cmd-K 和 sidebar 进入，不增加全局导航序列，避免快捷键集合膨胀。

## 验证

- `pnpm --filter @duedatehq/app test -- src/components/patterns/keyboard-shell/types.test.ts`
- `pnpm exec vp check --fix apps/app/src/components/patterns/keyboard-shell/KeyboardProvider.tsx apps/app/src/components/patterns/keyboard-shell/ShortcutHelpDialog.tsx apps/app/src/components/patterns/keyboard-shell/navigation-shortcuts.ts apps/app/src/components/patterns/keyboard-shell/types.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile --strict`
- `pnpm exec playwright test e2e/tests/authenticated-shell.spec.ts --grep "E2E-AUTH-SHORTCUTS" --reporter=list`
- `pnpm exec playwright test e2e/tests/authenticated-shell.spec.ts --reporter=list`
- `pnpm check`（通过；保留既有 `apps/marketing/src/pages/404.astro` 的 `oxc(no-map-spread)`
  warning，非本次改动）
