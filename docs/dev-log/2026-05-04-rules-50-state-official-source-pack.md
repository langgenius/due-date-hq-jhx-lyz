---
title: '2026-05-04 · Rules 50-state official source pack'
date: 2026-05-04
author: 'Codex'
---

# Rules 50-state official source pack

## 背景

Rules 之前只把早期有限辖区暴露给 contract、Rules Console 和 rule generation。用户要求扩展到美国所有州，并且必须接入各州官方数据源。

## 做了什么

- 将 rules jurisdiction 从 6 个扩展为 `FED + 50 states + DC`，同步 core、contracts、server migration commit plan 和 Rules Console。
- 在 `@duedatehq/core/rules` 登记每个州/DC 的官方 source seed；后续精度修正已经移除 tax agency homepage 和 UI/workforce homepage，source 必须精确到 tax-topic、publication、calendar、form 或具体公告。
- 当前只为有精确 tax-topic / filing FAQ / statute / due-date source 的领域生成
  review-only candidate。Individual income 已保留；estimated tax 只在同一 source 明确覆盖
  estimated payments 时保留；fiduciary、business income/franchise/gross receipts、
  PTE/composite/PTET、sales/use、withholding、UI wage report 等领域在逐州补齐精确
  source 前不再生成 source-backed candidate。
- 扩展 Default Matrix：非 CA/NY verified cells 现在返回 federal overlay + state review-only tax types，而不是 federal-only demo fallback。
- 更新 Rules Console 文案和 coverage model，去掉 31/26 这类旧静态计数。

## 为什么这样做

税务 deadline 是高风险数据，不能在没有逐条官方日期核验时直接发布 `verified` rule 或 reminder-ready obligation。新增州先成为 precision-gated source-backed candidate：内部可见、可审核、有官方入口，但不会触发客户提醒。没有精确 source 的领域宁可不生成 candidate，也不再用机构首页顶替。

## 验证

- `pnpm --filter @duedatehq/core test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/server test -- migration`
- `pnpm --filter @duedatehq/app test -- rules-console-model`

## 后续闭环

- 后续变更在同日 `Rules candidate verify workflow` dev log 继续记录：官方 source snapshot/diff 和 candidate verify/reject 写路径已补上。
