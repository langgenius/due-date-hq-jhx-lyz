---
title: 'Marketing Preference Switcher · Footer-grouped Theme & Language'
date: 2026-04-26
commit: 'ad803c3'
author: 'Codex'
figma: 'ssejugriUJkW9vbcBzmRgd: 5:16 TopNav / 30:53 Footer cluster'
---

# Marketing Preference Switcher · Footer-grouped Theme & Language

## 背景

`apps/marketing` 已经在 `<head>` 注入 `THEME_INIT_SCRIPT` 跟随系统主题（`prefers-color-scheme`

- `localStorage["duedatehq.theme"]`），但没有可见切换器；语言切换以 `English / 中文` 文本链接
  形式埋在 footer 底部条。两点问题：

1. 主题运行时已经存在但用户无入口手动覆盖，演示场景（投影、阅读模式）没法切。
2. 语言切换是裸文本链接，视觉权重弱、与 app 内 `UserMenu` 的 Theme/Language sub-menu 心智不一致。

同步发现 marketing 顶栏的 `Sign in` / `登录` CTA 与主 `Open app` 落点相同，是一处实现细节
泄漏；TopNav 应该只表达用户意图（"打开 App"），登录、onboarding、已登录落点都属于 app auth
gate 的职责。这部分上一轮已通过 ADR 0013 / `2026-04-26-marketing-locale-handoff-nuqs.md`
落地（`getCtaHref()` 改为 root 入口 + `lng=` handoff）。

## 做了什么

### 1. 设计稿对齐（Figma）

- 删除 TopNav 节点 `5:20` `Sign in`，重排 `NavRight` 为 `StatusPill + CTA-OpenApp`，右
  边缘维持 `x=1360`。
- 删除 footer 节点 `30:54` `English / 中文` 文本，把 `30:53` 重命名为 `PreferenceCluster`，
  在 status pill 之前插入：
  - `ThemeSegmented`：3 个 `24×20` 图标按钮（System / Light / Dark），System 默认选中。容器
    填 `surface/elevated`、描边 `border/default`、圆角 `radius/md`；选中态填 `surface/subtle` +
    文本 `text/primary`，未选中文本 `text/muted`。
  - `Divider`：`1×12` 矩形，填 `border/subtle`。
  - `LangSegmented`：2 个按钮 `EN`（选中）/ `中`，规格与 ThemeSegmented 一致。
- 全部颜色与圆角绑定到 Light/Dark 双 mode 变量，不写硬编码 hex。

### 2. 共享主题运行时抽提（`@duedatehq/ui/theme`）

`packages/ui/src/theme/theme.ts` 新增 `switchThemePreference(preference, options?)`，封装四步
副作用链路（`disableThemeTransitions → applyResolvedTheme → updateThemeColor →
localStorage.setItem`），并用 `try/catch` 容忍 `localStorage` 不可用（隐私模式 / SecurityError）。
`apps/app/src/routes/_layout.tsx` 的 `applyThemePreference` + `useCallback` 内手写
`localStorage.setItem` 都换成调用这个共享函数；marketing 端 `PreferenceSwitcher.astro` 客户端
脚本也消费同一份。

理由：之前两端如果各自维护这条链路，将来加 `auto-contrast` / `high-contrast` 模式必然产生
分叉。同源单一函数是 0011 §III "禁止沉淀第 3 份真理来源" 原则的延伸。

### 3. PreferenceSwitcher.astro

新增 `apps/marketing/src/components/PreferenceSwitcher.astro`，渲染：

- Theme segmented：`role="radiogroup"`，3 个 `<button role="radio">`，lucide 风格 SVG 图标
  inline 渲染（Sun / Moon / Monitor，14px stroke 1.75）。键盘 `←/→` 在按钮之间循环；点击触发
  `switchThemePreference()` 并把所有同页面 `[data-theme-switcher]` cluster 的视觉同步为新值。
- Language segmented：`role="group"`，2 个 `<a href>` 链接（`enHref` / `zhHref`），当前 locale
  使用 `aria-current="page"` + 视觉选中态。无 JS，刷新页面切换。
- Status pill：`● all systems operational`（绿点 + `bg-status-done`）原样保留。

SSR 输出**不带**主题选中态。挂载后客户端脚本读 `localStorage["duedatehq.theme"]`，再补
`aria-checked` 与 `tabindex`，避免静态 HTML 缓存导致不同访客看到错误高亮。脚本同时监听：

- `(prefers-color-scheme: dark)` 变化：仅当当前偏好是 `system` 时调用
  `switchThemePreference('system')` 重新解析。
- `storage` 事件：跨标签同步（用户在另一个标签切了主题，本标签视觉跟随）。

### 4. i18n 契约扩展

`apps/marketing/src/i18n/types.ts` 把 `FooterCopy.language: string` 替换为结构化
`ThemeSwitcherCopy` + `LanguageSwitcherCopy`，包含按钮 `aria-label`、segmented 短标签、长名
（屏幕阅读器可读）。`en.ts` / `zh-CN.ts` 同步补齐：

- en：System = "Match system" / Light / Dark；Language EN/中 (long: English / 简体中文)。
- zh-CN：主题 = 跟随系统 / 浅色 / 深色；语言 EN/中（同短标签）。

### 5. 平滑滚动（CSS-only）

`apps/marketing/src/styles/globals.css` 在 `@layer base` 加 `html { scroll-behavior: smooth;
scroll-padding-top: 72px }` + `prefers-reduced-motion: reduce` 兜底。修复点击 TopNav 锚点链接
（`#hero` / `#workflow` / …）瞬移而不是滚动的体验问题；`scroll-padding-top` 让目标章节标题
不被 72px sticky topnav 遮挡。无 JS。

## 设计决策与备选方案

- **位置**：footer-grouped vs TopNav-grouped。选 footer：营销页顶栏的视觉首要性必须留给 CTA，
  主题/语言都是 set-once-then-forget 的"housekeeping"控件，放 footer 与 Stripe / Linear /
  Vercel 的同类布局一致。
- **主题控件形态**：segmented 三段 vs 单图标循环 vs popover。选 segmented 三段：发现性、可
  访问性、轻量三者最平衡，且 footer 横向空间够。单图标循环（Vercel 风）省地方但用户没法直选
  `System`；popover 需要引入 `@floating-ui` 或手写 ~40 行 vanilla popover JS，超出此次
  改动收益。
- **图标**：lucide SVG inline。Astro 不便引入 lucide-react（会把整套 React + 解析器也拖进来），
  使用 inline SVG 三个图标共 ~600 字节 gz，远低于 §5.1 island 预算。
- **状态条**：`all systems operational` 当前是占位文案（无真实 status endpoint）。本次不外链
  到不存在的 `status.duedatehq.com`，留作后续 follow-up；视觉上保持 Figma 同款 pill。

## 验证

- `pnpm --filter @duedatehq/app test`：应通过（新增 `theme-switch.test.ts` 3 个 case 覆盖
  dark / system / storage-throws）。
- `pnpm --filter @duedatehq/marketing build`：Astro 静态构建期望通过；`<script>` 客户端脚本
  会被 Vite 处理 + 打包，PreferenceSwitcher 是首版 marketing 的第一个有 JS 的组件，预计
  bundle 净增 < 2 KB gz。
- `pnpm check` / `pnpm check:fix`：无 lint / type 错误。

## 后续 / 未闭环

- `status.duedatehq.com` 真实状态页接入：现在 status pill 是占位绿点，未来挂真实健康度 API
  时把它包成 `<a target="_blank" rel="noopener">`，并按 `status/done`、`severity/medium`、
  `severity/critical` token 切色。
- TopNav 主题切换 island：当前只在 footer 提供。如果未来 A/B 数据显示发现性不足，可以把同
  一个 `PreferenceSwitcher` 挂到 TopNav 的 `StatusPill` 旁（同组件，零改动）。
- App ↔ Marketing 主题跨子域同步：仍按 §5.2 保持不做。如果以后做，应该走一次性 query
  handoff，不引入 cookie 共享。
