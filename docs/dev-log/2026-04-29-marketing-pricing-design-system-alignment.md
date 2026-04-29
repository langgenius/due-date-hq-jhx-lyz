# Marketing Pricing — Design System Alignment

Date: 2026-04-29
Owner: Codex

## Context

`apps/marketing /pricing` 的视觉版本最早是为 Stripe 闭环搭的最小落地页：3 列卡片 +
3 列 FAQ，padding / gap / typography 直接用 Tailwind 默认值，没有严格对齐 DESIGN.md
的 token 体系，也缺乏 Figma 端的权威稿。本次把它对齐到 Figma `Marketing →
DueDateHQ — Pricing (Marketing)` frame，并把对齐规则写回 `12-Marketing-Architecture.md`。

## Decisions

- **Card 必须 flat**。DESIGN.md §Elevation 明确 "Cards are flat: elevated surface
  plus a 1px border, no shadow"，因此 Recommended 卡片**不再使用** drop shadow /
  顶部 accent stripe / 渐变。差异化只走两条 token：`border-[1.5px]
border-accent-default` 替换默认 `border border-border-default`，CTA 切到
  `bg-accent-default` 实色按钮。这与 DESIGN.md §Components 中"indigo is reserved
  for focus, selected navigation, and primary actions"一致。
- **Card 内呼吸节奏由 token 派生**。`p-8`（32 px = `space.6`）四边一致，top group
  内部 `gap-7`（28 px），CTA 与内容之间 `mt-10`（40 px = `space.6 + space.1`）。
  之前的视觉问题是 CTA 高度 `h-10` 且 `mt-auto` 没有 min-gap，靠 `min-h-[430px]`
  撑高度，结果出现"按钮和最后一条 feature 贴在一起"。新写法显式给 40 px gap，
  CTA 高度提到 `h-11`（44 px），与按钮的 36 px primary 形成层级。
- **Feature ✓ icon 不再使用 status-done**。DESIGN.md 把 `status-done`（#059669）
  限定为 filed/done/applied 状态。Marketing 列表里的勾选项语义是"该套餐包含此功
  能"，不是"已完成"。改用 `bg-accent-tint text-text-accent` 的 16 × 16
  `rounded-sm` 标记，色调与 DESIGN.md `confidence-badge-high` 同源，calm 不抢戏。
- **价格 typography 按内容分流**：数字（`$0` / `$99`）走 `font-mono font-bold
text-[40px]`（DESIGN.md：amounts must use mono tabular numerals）；非数字
  （`Custom`）走 `font-sans font-semibold text-[40px]`。两者共用 40 px 字号但
  font family 区分，避免 Geist Mono 把"Custom"撑得过重。
- **Plans Header / FAQ Header 是新结构**。Figma 把这两段 section 标题独立成 frame：
  PLANS eyebrow + 22 px 副标题 + 右侧 mono `BILLED USD · STRIPE-HOSTED CHECKOUT`；
  FAQ eyebrow + 24 px heading。i18n 契约 `PricingCopy.plansHeader` /
  `PricingCopy.faqHeader` 现在是必填字段，en + zh-CN 同步。
- **Plans 列表 4 条 features，并使用 cascade 写法**：Solo 列原子能力，Pro 第一
  条 "Everything in Solo"，Firm 第一条 "Everything in Pro"。这让卡片在视觉上等高
  （Tailwind grid `items-stretch`），同时在内容上传达 plan tier 关系。
- **`PricingPlanCopy.priceKind` 字段固化在 contract**：`'numeric' | 'text'` 决定
  价格 token 走 mono 还是 sans。这是 i18n 翻译人员不必知道前端怎么排版就能写出
  正确稿件的契约。

## Changes

- 重写 `apps/marketing/src/components/Pricing.astro`，去掉所有装饰性 chrome，按
  Figma `Hero / Plans Header / Plans Row / FAQ` 四段重排，所有间距 / 颜色 / 字体
  统一走 DESIGN.md token（`bg-bg-{canvas,panel,elevated}`、`border-border-{default,
strong,subtle}`、`text-text-{primary,secondary,muted,accent}`、`bg-accent-{default,
tint}`）。
- 扩展 `apps/marketing/src/i18n/types.ts`：`PricingCopy` 增加 `plansHeader` /
  `faqHeader`，`PricingPlanCopy` 增加 `priceKind`。
- 更新 `apps/marketing/src/i18n/{en,zh-CN}.ts`：plansHeader / faqHeader 文案、4 条
  features、cadence/seats 文案改为与 Figma 对齐（`/ month`、`5 SEATS · 14-DAY
TRIAL`、`Everything in Solo` 等）。
- 在 Figma `Marketing` 页右侧产出 `DueDateHQ — Pricing (Marketing)` 1440 × 1792
  权威稿（id `375:2`），后续视觉变更必须同时更新该 frame 与本组件。
- `docs/dev-file/12-Marketing-Architecture.md` 新增 Pricing 视觉契约段，把上述卡片
  / 价格 / icon / i18n 规则固化到 dev-file。

## Validation

- `pnpm --filter @duedatehq/marketing build` ✅ 4 page(s) built。
- `pnpm format:fix` 在改动文件上跑通。
- `pnpm --filter @duedatehq/marketing exec astro check` 仍报既有的
  `pricing.astro:4 ts(2440) Import declaration conflicts with local declaration of 'Pricing'`
  错误。这是 main 上预先存在的 astro `astro check` 报错（与本 PR 无关，stash 全部改
  动后仍能复现），后续单独修。
- 本地 dev `astro dev` 起服务、导航 `/pricing`，三档卡片渲染正确（Hero + Plans
  Header + Solo / Pro Recommended / Firm + FAQ + Footer）。

## Follow-ups

- 修复 main 上既有的 `astro check` 报错（pricing.astro 与 zh-CN/pricing.astro 的
  TS2440），与本次设计稿对齐无关，但会让 `pnpm check` 现在仍标 fail。
- e2e Playwright 现有 spec 只断言 CTA href / locale，不会被新文案打破。等
  feature flagging 落地后，再决定是否给 Plans Header / FAQ heading 增加可见性
  断言。
- 将 Pricing 卡片抽到 shadcn pricing-card 风格的复用组件，仅在新增 `Yearly`
  toggle 或 plan tier 后再做（保持 YAGNI）。
