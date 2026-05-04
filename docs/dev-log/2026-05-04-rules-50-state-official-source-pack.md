---
title: '2026-05-04 · Rules 50-state official source pack'
date: 2026-05-04
author: 'Codex'
---

# Rules 50-state official source pack

## 背景

Rules 之前只把 `FED/CA/NY/TX/FL/WA` 暴露给 contract、Rules Console 和 rule generation。用户要求扩展到美国所有州，并且必须接入各州官方数据源。

## 做了什么

- 将 rules jurisdiction 从 6 个扩展为 `FED + 50 states + DC`，同步 core、contracts、server migration commit plan 和 Rules Console。
- 在 `@duedatehq/core/rules` 登记每个州/DC 的官方 tax agency 和 UI/workforce agency source seed，新增 source 默认 `manual_review + degraded`，避免未验证来源被伪装成自动 watcher。
- 为每个州/DC 生成 8 个 review-only candidate domains：individual income、individual estimated tax、fiduciary、business income/franchise/gross receipts、PTE/composite/PTET、sales/use、withholding、UI wage report。
- 扩展 Default Matrix：非 CA/NY verified cells 现在返回 federal overlay + state review-only tax types，而不是 federal-only demo fallback。
- 更新 Rules Console 文案和 coverage model，去掉 31/26 这类旧静态计数。

## 为什么这样做

税务 deadline 是高风险数据，不能在没有逐条官方日期核验时直接发布 `verified` rule 或 reminder-ready obligation。新增州先成为 source-backed candidate：内部可见、可审核、有官方入口，但不会触发客户提醒。

## 验证

- `pnpm --filter @duedatehq/core test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/server test -- migration`
- `pnpm --filter @duedatehq/app test -- rules-console-model`

## 后续闭环

- 后续变更在同日 `Rules candidate verify workflow` dev log 继续记录：官方 source snapshot/diff 和 candidate verify/reject 写路径已补上。
