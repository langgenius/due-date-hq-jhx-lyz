# 2026-04-26 · Login 页面对齐 marketing 设计语言

## 背景

`apps/app/src/routes/login.tsx` 是上一轮 first-login Practice onboarding 落地时
（[`2026-04-24-first-login-practice-onboarding.md`](./2026-04-24-first-login-practice-onboarding.md)）
顺手做的版本。当时只把文案从 workspace 改成 practice，UI 是 shadcn `Card` + 两栏
hero + 三张高亮卡 + 一段 radial-gradient 装饰背景，跟 `apps/marketing/`（详见
[`docs/adr/0012-marketing-astro-landing.md`](../adr/0012-marketing-astro-landing.md)）的
Ramp x Linear 工作台直觉**完全脱节**。

具体的不对齐点：

1. `bg-[radial-gradient(...)]` 装饰违反 `DESIGN.md` 第 535 行 "Don't use gradients,
   decorative glows, large shadows, or rounded SaaS template styling."
2. 登录页用 `display-large` 三档 display 字阶里没有的 `text-2xl` (24px)，没有
   `display` 系字阶为登录页这种"非 marketing landing"页面准备的入口（`DESIGN.md`
   §"Token segment index" 明确 `display-*` 只给 marketing landing 用）。
3. 三张高亮卡 (`Penalty-weighted triage` / `Glass-box evidence` / `Seven-day rhythm`)
   在登录页面塞产品功能清单 = 把营销 chrome 放到 auth surface，违反 `DESIGN.md` 第
   476 行 "First screens must show useful work, not marketing chrome."
4. 不复用 marketing TopNav 的视觉语汇（accent-default 圆点 + `/` 分隔符 + audience
   label），导致 marketing → app 跨站点视觉断层。

## 做了什么

### 1. login.tsx 重写

[`apps/app/src/routes/login.tsx`](../../apps/app/src/routes/login.tsx) 单文件 171 行
→ 简洁单列布局：

- **顶栏 h-14**：marketing TopNav 同款品牌锚点（`block h-2 w-2 rounded-full
bg-accent-default` + `DueDateHQ` + `text-text-muted` 的 `/` + audience 副标），
  右侧只放 `LocaleSwitcher` 的 ghost variant（不放 CTA，因为这就是 CTA 自身）。
- **主区单列居中** `max-w-[400px]`：marketing Hero 同款 eyebrow 胶囊
  （`bg-accent-tint` + Geist Mono `tracking-[0.16em]` + `accent-default` 圆点）→
  28px headline → 14px description → Google sign-in button → mono `status-done`
  圆点 + 加密/会话/SSO 文案 → 11px 法务段（Terms / Privacy / Support 一句话写完）。
- **底栏 h-12**：1px hairline + Geist Mono tabular `©  YYYY DueDateHQ Inc.` +
  `status-done` 圆点 + "All systems operational"，对齐 marketing Footer 的"运营状态"
  收口节奏。
- 删除：`Card / CardHeader / CardContent / CardFooter / CardDescription / CardTitle
/ Separator` shadcn 组件，所有 `lucide-react` 图标除 `Loader2Icon`，`SparklesIcon
/ GaugeIcon / ShieldCheckIcon / CalendarClockIcon`，`useHighlights` hook，
  radial-gradient 背景 div，两栏 grid 布局。
- 新增：marketing 同款的内联完整版 `GoogleIcon`（4 色 viewBox 0 0 48 48），替代
  原版只有 1 个 `<path>` + 一个透明 path 的破损 stub。

### 2. i18n 收口

新增 8 条 msgid 走 `<Trans>` / `t\`...\``：

- `SIGN IN`（eyebrow）
- `Welcome back to the workbench.`
- `Sign in with Google to access your firm's deadline queue and evidence-backed
recommendations.`
- `For US CPA practices`（顶栏 audience，对齐 marketing `t.nav.audience`）
- `Encrypted · 7-day session · SSO respected`
- `By signing in you agree to the <termsLink>Terms</termsLink> and
<privacyLink>Privacy Policy</privacyLink>. Trouble signing in? Email
<supportLink>support@duedatehq.com</supportLink>.`（Lingui 富文本占位符）
- `© {0} DueDateHQ Inc.`
- `All systems operational`

`apps/app/src/i18n/locales/zh-CN/messages.po` 的 8 条对应 msgstr 一并填上。原本 39
missing 缩到 31（剩下 31 条是历史欠账，不在本次范围）。

跑了 `pnpm --filter @duedatehq/app i18n:extract` + `i18n:compile` 校准 catalog；
路径形如 `#~ msgid "SIGN IN · GLASS-BOX WORKBENCH"` 的 obsolete 项是上一稿过度设计
留下的，按 lingui 默认行为带 `#~` 前缀注释保留，下次 extract 自动清。

### 3. 没改的地方 + 为什么

- [`docs/dev-file/05-Frontend-Architecture.md`](../dev-file/05-Frontend-Architecture.md)
  第 26 行登录页描述"登录页（path='/login'，loader 把已登录用户跳走）"只讲路由
  职责不讲样式，仍然准确，不动。
- 登录 loader / `guestLoader` / `pickSafeRedirect` 行为未动，
  [`apps/app/src/router.tsx`](../../apps/app/src/router.tsx) 不改。
- `apps/app/src/lib/auth.ts` 的 `signInWithGoogle(redirectTo)` 行为不变，UI 只换皮。
- 没新增组件到 `components/primitives/`，因为登录页是单点使用，BrandMark / TopBar
  本来就在文件内 inline；提取到 primitives 反而增加跨页不必要的耦合。

## 为什么这样做

### 为什么不直接复用 marketing 的 TopNav.astro / Hero.astro

- `apps/marketing` 是 Astro，`apps/app` 是 React SPA，运行时不同，组件不可跨包导
  入（[`docs/adr/0012-marketing-astro-landing.md`](../adr/0012-marketing-astro-landing.md)
  Decision III）。
- `@duedatehq/ui` 只放 shadcn Base UI primitives，不放业务/营销组件
  （[`docs/dev-file/05-Frontend-Architecture.md`](../dev-file/05-Frontend-Architecture.md)
  §1）。
- 共享的是**设计 token**（`bg-bg-canvas` / `bg-accent-tint` / `text-accent-text`
  / `border-border-default` / `font-mono` / `text-display-*` 等），通过
  `packages/ui/src/styles/preset.css` 跨 Astro/React 两端镜像。这次的对齐路径就是
  "复用同一组 Tailwind utility，结构本地写"，不抽组件。

### 为什么不用 `display-large` (36px) 做 headline

- `DESIGN.md` 第 508 行明确 `display-hero / display-large / section-title` 三档
  display "仅 marketing landing 使用"。
- 登录页是 auth surface 不是 hero/landing，`text-[28px]` 比 `display-large` 36px
  更适合 400px 单列宽度，也不会跟 marketing 的真 hero 抢视觉权重。
- 这是 `DESIGN.md` token 段没明确兜底的一档（24px `text-2xl` 太小，36px 太大），
  用 inline `text-[28px]` 是有意识的本地选择，未来如果三个以上页面都需要这一档可
  以再考虑加 token；现阶段加 token 反而违反 token 段的"semantic, not decorative"
  原则。

### 为什么 Google icon 换成 4 色完整版

原版只渲染 #4285F4 蓝色一个 path + 一个 `opacity="0"` 的隐藏 path，视觉上是单色
蓝色块，跟真实 Google G logo 不一致。Google Sign-In 品牌指南要求 4 色完整 G mark
（unmodified colors），换成完整版同时也提升按钮品牌识别度——这是登录按钮唯一的
视觉锚点，不能将就。

### 为什么手填 zh-CN msgstr 而不是留空等翻译

[`docs/dev-log/2026-04-25-lingui-catalog-line-number-churn.md`](./2026-04-25-lingui-catalog-line-number-churn.md)
确立了 ".po 进 git，手动维护"的工作流（`lineNumbers: false` 就是为减少手动维护
的 noise）。`docs/dev-log/2026-04-24-first-login-practice-onboarding.md` 第 131
行也写明"中文 catalog 22 条新词全部翻成"事务所""。所以本次也手填，不是绕脚本。

repo 没有 `i18n:translate` 这类 LLM 翻译 step，是后续可以加的事（dev-file/05 §13
i18n 段没规划，留作 follow-up）。

## 验证

```bash
vp check                                                              # 0 errors / 0 warnings (190 files)
pnpm --filter @duedatehq/app exec tsc --noEmit                        # exit 0
pnpm --filter @duedatehq/app i18n:extract                             # en 265 / zh-CN 31 missing（- 8）
pnpm --filter @duedatehq/app i18n:compile                             # ok
```

人工 visual diff（dev server）：

- light / dark theme 切换不破布局，1px hairline 在两边都清楚
- locale 切到 zh-CN：eyebrow / headline / button / 加密说明 / 法务段 / footer 全
  部走中文 catalog，无 fallback 残留
- 窄到 mobile (375w)：单列居中保持，TopBar 的 audience 文本不溢出
- Google sign-in 失败用户取消：toast 不弹（`isUserCanceled` 行为未动）

## 后续 / 未闭环

- 31 条 zh-CN 历史欠账（与本次无关）：等下次走专项翻译梳理或接 LLM 翻译 step 时
  统一清。
- 如果未来登录页要做 SSO / Magic Link / SAML 等多种登录方式，目前的 400px 单列
  布局可以横向放 2-3 个按钮；继续走 marketing 风格的 button 而不是引入登录专用
  设计语言。
- Google G mark 的 4 色 path 写在 login.tsx 内联，未来如果有第二处用到（比如
  account settings 的 connected providers 列表），抽到 `components/primitives/
brand-glyphs.tsx` 一处维护。
