---
title: 'Pitch deck HTML'
date: 2026-05-05
author: 'Codex'
updates:
  - note: 'Replaced all Dify logo usages in the deck with the DueDateHQ project mark.'
  - note: 'Revised pitch wording to use formal product language and align the table badges with the app status patterns.'
  - note: 'Applied the second browser review pass: simplified the cover, moved product UI labels back to English-first language, and replaced the source appendix with an audience-facing closing slide.'
  - note: 'Applied the third browser review pass: removed the print hint, localized explanatory copy, and matched Pulse approved badges to the product success style.'
  - note: 'Applied the fourth browser review pass: replaced evidence markers with the product FileSearch icon, localized the trust-boundary table headers, and merged the final two pages into one summary slide.'
  - note: 'Applied the fifth browser review pass: right-aligned numeric table headers with their values and replaced the trust-boundary table with three audience-facing proof points.'
  - note: 'Applied the sixth browser review pass: localized AI output-rule explanations and rewrote the architecture slide to remove repo-path-heavy implementation language.'
  - note: 'Added the product capability names Penalty Radar™, Migration Copilot, and Glass-Box AI™ to their dedicated slides while keeping the final summary generic.'
---

# Pitch deck HTML

## 背景

为公司内部 pitch 准备一版 DueDateHQ 项目介绍 deck。要求最终产物是 HTML，放在
`docs/pitch-deck/`，并且数据、表格样式必须来自项目真实实现，不套用 marketing 页面风格。

## 做了什么

- 新增 `docs/pitch-deck/index.html`，做成可键盘翻页、可打印的静态 pitch deck。
- 新增 `docs/pitch-deck/duedatehq-logo.svg`，使用项目自己的 DueDateHQ brand mark。
- Deck 外壳使用简洁演示规则；产品 surface 使用 DueDateHQ 产品内的表格、状态标记、风险行和证据标记。
- 当前版本收敛为 10 页，最后一页把产品亮点和收束观点合并展示。
- 指标、客户行、导入批次、Pulse 记录、证据和审计口径来自 `mock/demo.sql`、
  `apps/app/src/routes/dashboard.tsx`、`packages/db/src/repo/dashboard.ts` 和相关 dev-file。

## 为什么这样做

`dify-deck` 的 React 模板和 `dify-brand` 的 HTML 输出要求存在形式差异；本次以用户明确要求的
HTML 为最终产物，同时沿用 deck 的叙事结构。为了避免 pitch deck 变成营销页，样式没有引用
`apps/marketing` 的 layout 或 table helper，而是复刻 app 内部 table primitive、badge、metric strip、
hairline divider、mono tabular number 等产品语言。

## 验证

- `python3 -c "... HTMLParser ..."` 校验 HTML 可解析。
- `pnpm exec playwright screenshot --viewport-size=1280,720 file://.../docs/pitch-deck/index.html`
  验证封面渲染。
- `pnpm exec playwright screenshot --viewport-size=1280,720 file://.../docs/pitch-deck/index.html#slide-4`
  验证表格页渲染。
- 第四轮浏览器复核后，用 `HTMLParser` 校验 HTML，并在 Codex in-app browser 中确认 slide 数为
  10、Evidence 标记数量为 5、安全边界页中文表头存在、旧 Closing 页已删除且控制台无 error。
- `pnpm exec prettier --check ...` 尝试校验格式，但当前 workspace 未安装 `prettier`，命令返回
  `Command "prettier" not found`。

## 后续 / 未闭环

- 如需现场演示，可再补一版 PDF 导出或截图版，但当前 HTML 已可直接打开和打印。
