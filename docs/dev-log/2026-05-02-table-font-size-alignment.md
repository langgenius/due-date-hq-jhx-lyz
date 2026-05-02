---
title: 'Table Font Size Alignment'
date: 2026-05-02
author: 'Codex'
---

# Table Font Size Alignment

## 背景

表格内容在共享 `Table` 组件、业务单元格、表格内 badge/pill、以及 marketing hero 的
模拟表格里混用了 `text-md`、`text-base`、`text-sm` 和任意 px 字号。用户要求项目表格
字号保持一致，并全局收敛到 `text-xs`。

## 做了什么

- 将 `packages/ui` 的共享 `Table` 和 `TableCaption` 默认字号改为 `text-xs`。
- 清理 App 内表格单元格、空状态、badge/pill、表格内按钮 / 状态控件、TanStack Table
  column meta 中会覆盖字号的 `text-sm` / `text-base` / `text-[11px]` / `text-[12px]`。
- 将 marketing hero 中模拟风险表格的 header 与 row 文案统一为 `text-xs`。
- 更新 `docs/Design/DueDateHQ-DESIGN.md`，把表格行内容从 13px 正文规范迁移到
  `text-xs` 规范。

## 验证

- `rg` 定向确认 `<Table>` / `<TableCell>` / `<TableHead>` 不再保留
  `text-sm`、`text-base`、`text-md` 覆盖。
- `pnpm check` 通过：格式、lint、类型检查均无错误。
