---
title: 'Rules Console P0.5 — Rule Detail drawer + official source links'
date: 2026-04-27
author: 'Codex'
---

# Rules Console P0.5 — Rule Detail drawer + official source links

## 背景

Rules Console 上一轮 (`docs/dev-log/2026-04-27-rules-console-shell.md`,
`docs/dev-log/2026-04-27-rules-authoritative-evidence-scope.md`) 把 26 条
obligation rules 和 31 个官方 source 接进了 4-tab 只读壳。但页面只把数据
铺成了表，结构化字段（`dueDateLogic` / `extensionPolicy` / `evidence` /
`verifiedAt` / `sourceExcerpt` / `locator` / `source.url` / ...）没有任何
出口：

- Sources 行只渲染 `title + id`，`source.url` 没用上。
- Rule Library 行右侧画了 `›` 但没 drawer；点不开。
- Generation Preview 第 358 行 evidence 链接是 `href="#" + preventDefault()`，
  看着能点，点了什么都不发生，伤可信度。
- Coverage tab 头部描述没区分 “Sources 是原料 / Rules 是模板 / Preview 是
  成品” 的三层关系。

## 做了什么

P0.5 收紧到“**让现有 26 条规则被讲清楚**”，不扩规则数量，也不做写路径或
publish flow（仍归 P1）。改动全部在 `apps/app/src/features/rules/`。

### 新增

- `use-source-lookup.ts` — 用 `orpc.rules.listSources` 的 TanStack Query
  cache 反查 `Map<sourceId, RuleSource>`。Sources tab、Rule Detail drawer、
  Generation Preview 共享同一份缓存（`client-swr-dedup`）。
- `source-external-link.tsx` — 共享外链组件，强制 `target=_blank` +
  `rel=noopener noreferrer`，自动 `stopPropagation` 避免与 row click 双触发，
  source 缺失时优雅退化为纯文本。
- `rule-detail-drawer.tsx` — `Sheet side=right sm:max-w-[440px]` 抽屉。
  6 个 section（Applicability / Due-date logic / Extension / Review reasons /
  Evidence / Verification）全部抽成模块顶层组件（`rerender-no-inline-components`）。
  - DueDateLogic 渲染人话 + raw JSON `<details>` 折叠。
  - Evidence 卡片整张是 `<a>`，跳官方页；显示 authority role 徽章、locator、
    excerpt（2 行截断）、retrievedAt / sourceUpdatedOn。
  - Candidate / applicability_review 顶部 banner 明确 “never generates user
    reminders” 或 “needs CPA confirmation at generation time”。
  - 不渲染 quality 6/6 checklist 与 version compare（P1 publish 表面）。

### 修改

- `rule-library-tab.tsx` — 行抽成 `RuleRow` 组件，`role=button` + `tabIndex=0`
  - `onKeyDown(Enter/Space)`，点击/键盘均可打开 drawer。drawer state 单值
    `selectedRuleId`，open 直接 `selected !== null` 派生
    （`rerender-derived-state-no-effect`）。
- `sources-tab.tsx` — 行抽成 `SourceRow` 组件，整行可点 → `window.open`，
  末列加 `↗` icon `<a>` 作为键盘 / SR 主入口。`manual_review` 来源的 METHOD
  列上色 `severity-medium` 并加 tooltip “Manual review source · click to open
  the official page”。
- `generation-preview-tab.tsx` — `PreviewResultRow` 的假 `href="#"` 链接换成
  `SourceExternalLink`，从 `useSourceLookup` 反查 `evidence.sourceId` 拿真实
  URL。`PreviewResultsCard` 在调用层 `useSourceLookup`，传给所有 row
  （`rerender-defer-reads`：lookup 在 card 一级订阅，不进 row）。
- `rules-console.tsx` — Coverage / Sources / Library 三段 tab 描述重写：
  - Coverage 顶部一句话讲清 “Sources / Rules / Preview” 三层关系。
  - Sources / Library 描述加 “Click any row to open …” 强提示。
- `rules-console-model.ts` — 新增 `humanizeDueDateLogic(logic)`：把五种
  `DueDateLogic` 都转成单行人话。新增 `RULE_AUTHORITY_ROLE_LABEL` 字面量表。
- `rules-console-model.test.ts` — 锁住 `humanizeDueDateLogic` 五种 kind 的
  输出。

## 设计稿对齐 pass

`rule-detail-drawer.tsx` 与 Figma `node-id=259:2`（drawer state 5/4 frame）
做了一轮对齐，确保字号/spacing/alignment 完全一致：

- 标题字号 `text-base` (13px) → `text-md` (14px)。
- Applicability grid 文本字号 `text-sm` (12px) → `text-base` (13px)；mono 值
  `text-xs` (11px) → `text-sm` (12px)。
- Due date logic 句 / Extension form name / Evidence card title 同一档：12px
  → 13px。
- Extension warning 行加 `TriangleAlertIcon`，字号从 `text-xs` (11px) 升到
  `text-sm` (12px) 配上 `font-medium`，与设计稿 `⚠ Filing only —` 视觉一致。
- `EventRow`：原先把 `eventType + isFiling/isPayment` 两个 contract 字段
  机械拼接，会渲染出 `filing · filing`（fed.1065）或 `payment · filing ·
payment`（ny.it204ll）这种重复。改成只在 is-flag **跟 eventType 不重叠**
  时才拼 `· also filing/payment`，保留信息又不冗余。
- Authority role badge 背景 token 从 `bg-state-accent-active-alt/30`
  （0.18 alpha 再叠 30% opacity，发灰）换成 `bg-accent-tint`，与
  `coverage-tab.tsx` candidate pill 用同一份 token，颜色与 Figma `#eeeefa`
  一致。
- Rule Library 候选行不再加 `bg-accent-tint` row tint。设计稿里候选行只靠
  右侧 `● Candidate` pill 区分；之前的 row tint 与 `bg-state-base-hover`
  撞色，看起来像被 hover 卡住，移除后 hover 视觉干净。

### Evidence card layout 关键 bug 修复

最初版 `EvidenceCard` 复用了 `SourceExternalLink` 作 wrapper，
`SourceExternalLink` 的基样式是 `inline-flex items-center`。`cn` 只能
deduplicate 同一 prop 的 Tailwind 类（`flex` 覆盖 `inline-flex`），但
`items-center` 一直留着 → 在 `flex flex-col` 列方向变成「横向居中」，让
locator / excerpt / meta 全部居中。再叠加上 title 没接通 `min-w-0 flex-1`
truncate 链，长 title（例如 `California FTB 2025 Limited Liability Company
Tax Booklet`）撑爆 row width，把 `[BASIS]` badge 挤出 card 左边界。

修法：

- `EvidenceCard` 不再走 `SourceExternalLink`。block-level 卡片当 `<a>`
  （或 `source.url` 缺失时退化 `<div>`），自己写 `flex flex-col
items-stretch`，没有 `inline-flex items-center` 的污染。
- header row 显式 `flex w-full min-w-0 items-start justify-between gap-2`。
  badge+title group 是 `flex min-w-0 flex-1 items-center gap-2`，title
  `min-w-0 flex-1 truncate` 让长 title 在 card 里以 `…` 截断，badge 永远
  贴左，arrow 永远贴右。
- `SourceExternalLink` 仍保留给 Generation Preview 那种 inline 单行链接
  使用，没动它的语义。

### Figma 对照

`Settings · Rules` section 里现在有 5 个 frame：原 4 个（Coverage / Sources /
Rule Library / Generation Preview）加 1 个新增的「Rule Library + Detail
drawer (5/4)」状态稿（`node-id=259:2` 即是这个 drawer panel）。设计稿和
代码渲染共享同一份 token tree（`@duedatehq/ui` 的 semantic-light/dark css），
所以颜色/字号/圆角值文档化为一份。

## 用户验收路径

> 打开 `/settings/rules?tab=library` → 点 `fed.1065.return.2025` 行 →
> drawer 看到 dueDateLogic 人话句、
> extension policy、3 条 evidence → 点 “IRS Instructions 1065 ↗” → 浏览器
> 新 tab 打开 https://www.irs.gov/instructions/i1065 → 关 drawer，切到
> Generation Preview → 默认 demo client 跑出来的 obligation 右侧 evidence
> 链接也是真的，再点一次能验证“这条规则确实从我刚才看到的 IRS 页面来的”。

## 为什么这样取舍

- **没有做 Source Drawer**。Source 的权威表达就是官方页面本身，drawer 复
  刻一层只是中介；MVP 直接把人送到 IRS / FTB / Comptroller 页面。等有了
  source diff、related rules 反查这种站内才能做的能力时再加 drawer。
- **没有做 metrics summary card**。MVP 边界声明明确不做内部管理后台；
  Coverage 表 + Library / Sources tab 头计数已经覆盖了同样的信息。
- **没有暴露 quality 6/6 checklist 与 version compare**。这两项属于 publish
  flow 工具，read-only console 用户拿不到“修这一项”的入口，提前暴露反而
  迷惑。
- **没有扩规则数量**。`docs/dev-log/2026-04-27-rules-authoritative-evidence-scope.md`
  § 后续 已经把 Default Matrix v1.1 自动推断和 IL/MA 扩州明确划到本轮之后。

## 验证

```sh
pnpm --filter @duedatehq/app i18n:extract
pnpm --filter @duedatehq/app i18n:compile     # strict, 0 missing
pnpm -r test                                  # 11 workspace projects, 216 tests pass
vp check                                      # 0 errors, 2 pre-existing warnings
                                              # (apps/server/src/env.test.ts, packages/ui/src/lib/placement.ts)
```

新增 zh-CN 翻译 27 条；compile 在 `--strict` 模式下通过，零 missing。
（对齐 pass 删了 `· filing` / `· payment` 两条原 catalog entry，因为
`EventRow` 改造之后这俩 lingui id 不再被引用；`lingui extract --clean` 自动
清理。）

## 后续 / 未闭环

- Drawer 内 `defaultTip` 目前只在 candidate / applicability_review banner
  下显示。verified + 非 review 的 rule 没有出口；如果要展示，应该单独做
  一个独立的 “Tip” section，不要混进 banner，避免误导信任层级。
- Generation Preview row 当前**不会**再向上打开 Rule Detail drawer。IA 上
  Rule Library 是 rule 的“家”，preview 只展示输出。如果未来用户反馈强烈想
  从 preview 直接追溯，再加一个轻量 “Open in Library ↗” 链接。
- `EvidenceCard` 用 `sourceId + authorityRole + locator.heading` 组合作为
  React key。当前 26 条 rule 的 evidence 数组这一组合天然唯一（已在
  `packages/core/src/rules/index.test.ts` 间接锁住）；未来若 evidence 模型
  允许同一 source 同一 role 同一 heading 多条，需要给 RuleEvidence 加显式
  ID。
