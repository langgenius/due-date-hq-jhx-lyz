# 2026-04-26 · 抽 EntryShell layout，对齐 onboarding 到 marketing 设计语汇

## 背景

上一稿
[`2026-04-26-login-design-system-alignment.md`](./2026-04-26-login-design-system-alignment.md)
重写了 `apps/app/src/routes/login.tsx`，把它从 shadcn `Card` + 两栏 hero + 三张
高亮卡 改造成 marketing landing 同款 Ramp x Linear 工作台单列。当时刻意把
header / footer 写在 login.tsx 内联：

> 没新增组件到 `components/primitives/`，因为登录页是单点使用，BrandMark / TopBar
> 本来就在文件内 inline；提取到 primitives 反而增加跨页不必要的耦合。

这次落地 `apps/app/src/routes/onboarding.tsx` 的全量重写，发现 onboarding 也需要
**完全相同**的顶栏 / 底栏 / locale switcher / 视觉节奏，再单点 inline 一份就走到反
向 ——「单点」假设不再成立，复制也违反 DRY。同时 onboarding 现状里还有 3 处违反
[`DESIGN.md`](../../DESIGN.md) 的硬伤：`bg-[radial-gradient(...)]`、`bg-primary` 圆
角块 + Sparkles 双 brand mark、`Card rounded-lg`（lg 12px 仅给 drawer/modal/command
palette 用）。

[Figma](https://www.figma.com/design/ssejugriUJkW9vbcBzmRgd/due-date-hq-jhx-lyz)
里建了一个独立 page（建议名 `DueDateHQ — Auth & Onboarding`，由用户自己拍板），
画了 `Sign In — /login` + `Onboarding — /onboarding` 两个 1440×900 frame，复用同一
组 Color / Spacing / Radius variable + text style。这次代码就是把这两个 frame 的
设计严格落地，并把共享 chrome 抽成 React Router v7 pathless layout route。

## 做了什么

### 1. 新增 `_entry-layout.tsx`（pathless layout route）

[`apps/app/src/routes/_entry-layout.tsx`](../../apps/app/src/routes/_entry-layout.tsx)
导出 `EntryShell` —— h-14 header（accent-default 8px 圆点 + `DueDateHQ` + `/` +
audience 文案 + ghost variant LocaleSwitcher）+ `<main>` 居中容器 + h-12 footer
（mono 11 © 年份 + status-done 圆点 + "All systems operational"）。组件内部把
header / footer 拆成两个**文件作用域**的子组件 `EntryShellHeader`、`EntryShellFooter`
组织代码，**不导出**，避免 barrel surface 扩散。

[`apps/app/src/router.tsx`](../../apps/app/src/router.tsx) 改成：

```ts
{
  Component: EntryShell, // pathless layout — no path, no loader
  children: [
    { path: '/login',      loader: guestLoader,      lazy: ... },
    { path: '/onboarding', loader: onboardingLoader, lazy: ... },
  ],
}
```

`EntryShell` 自身不挂 loader —— 它是纯 chrome；`/login` 与 `/onboarding` 各跑各的
gate（`guestLoader` / `onboardingLoader`），互不干扰。

Entry route 的 hydration fallback 也单独处理：`/login` 和 `/onboarding` 使用
`EntryRouteHydrateFallback`，只渲染一个透明的 400px 宽空白占位，保留 EntryShell 的
header / footer，不复用 dashboard/content route 的 `RouteHydrateFallback` skeleton。原因是
entry surface 的加载态应该安静过渡；把内容 skeleton 放进 EntryShell 的居中 `<main>` 会在刷新
时变成屏幕中间的闪烁块。

### 2. 命名决策：为什么不是 `_auth-layout`

`_auth-layout` 是 NextAuth/Clerk/shadcn templates 的行业惯例命名，**第一稿就是这个
名字**。但仔细审视：

| Route                          | session | activeOrganizationId | 状态语义               |
| ------------------------------ | ------- | -------------------- | ---------------------- |
| `/login`                       | ❌      | n/a                  | **pre-auth**           |
| `/onboarding`                  | ✅      | ❌                   | **post-auth, pre-org** |
| `/`, `/workboard`, `/settings` | ✅      | ✅                   | post-auth, post-org    |

`/onboarding` 已经走完 OAuth 是 _post-auth_ 的，把它跟 `/login` 一起命名为 "auth"
有歧义（"auth" 在英文里 authentication / authorization 两义），新人会以为这个
layout 仅服务 unauthenticated 状态。

最后改成 **`EntryShell` / `_entry-layout.tsx`**：

- 「Entry」语义清晰 —— 用户进入 dashboard shell **之前**所有过渡 surface
- 不绑定具体 session 状态，未来加 magic link landing / SSO consent / email
  verification / password reset 都自然归属
- Linear 源码也用 "entry" 这个词描述这一类页面

EntryShell 的 JSDoc 里把这个权衡写明，避免下一次有人再来质疑。

### 3. `login.tsx` 瘦身 —— 留中心列，header/footer 上提

[`apps/app/src/routes/login.tsx`](../../apps/app/src/routes/login.tsx) 删掉
`<header>` / `<main>` / `<footer>` 三个元素 + 外层 `min-h-screen` flex 容器；只留
内层 `<div className="flex w-full max-w-[400px] flex-col">` —— 它现在是 EntryShell
`<main>` 的唯一直接子节点。

修了 dev-log #1 留下的两个小问题：

- `isUserCanceled(message)` 内联函数 + 调用时新建 `RegExp` → 提到模块级常量
  `USER_CANCELED = /cancel|popup|closed/i`（Vercel `js-hoist-regexp`），不在每次失
  败重试时重新编译正则。
- Headline 加 `min-h-[2lh] whitespace-pre-line`：英文 `Welcome back to the
workbench.` 在 400px 宽 + 28/600/-2.5%/leading-1.15 下自然 wrap 成两行，中文原
  catalog 翻译只有 8 字一行，导致 button 及以下元素在不同 locale 下垂直跳位。
  `min-h-[2lh]` 兜底 2 行高度（`lh` = line-height 单位，2lh ≈ 64.4px，落在
  `spacing.16` 4px 网格里）；`whitespace-pre-line` 让 zh-CN catalog 通过 `\n` 显式
  指定换行点，详见下一节。

### 4. zh-CN headline 改成自然 2 行

[`apps/app/src/i18n/locales/zh-CN/messages.po`](../../apps/app/src/i18n/locales/zh-CN/messages.po)：

```diff
 #: src/routes/login.tsx
 msgid "Welcome back to the workbench."
-msgstr "欢迎回到工作台。"
+msgstr "欢迎回来。\n事务所工作台已就绪。"
```

`whitespace-pre-line` CSS 把 msgstr 里的 `\n` 渲染成实际换行。英文 msgstr 不带
`\n` 仍然走自然 wrap。两边都是 2 行，外加 `min-h-[2lh]` 兜底 → 跨 locale 布局完
全锁死。

### 5. `onboarding.tsx` 全量重写

[`apps/app/src/routes/onboarding.tsx`](../../apps/app/src/routes/onboarding.tsx)
单文件 257 → 244 行，但删除内容远多于新增。砍掉的：

- `bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(...))]` 装饰背景 →
  `DESIGN.md` §535 ban 项
- 绝对定位的 `LocaleSwitcher` 浮在右上角 → 现在走 EntryShellHeader 的 ghost variant
- `<div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><SparklesIcon /></div>` + 旁边的 "DueDateHQ" 文字 + "CPA deadline console" 副标 → 变成 EntryShellHeader 的单 8px accent-default 圆点 + 文字
- `<Card rounded-lg>` 包裹 + `CardHeader / CardContent / CardFooter` 三段切分 →
  全部去掉，扁平单列。`rounded-lg` 12px 仅给 drawer/modal/command palette 用
  （`DESIGN.md` §490），用在卡片上是越权
- `shadcn Field/FieldGroup/FieldLabel/FieldDescription` → 替换成自写 `<label>` +
  `<Input>` + `<p>` 三件套，因为 FieldLabel 默认是 13px medium 普通 label，这里要
  的是 11px Medium uppercase letter-spacing 0.08em（DESIGN.md `label` token），自
  写更直接，不绕过组件
- `"You can rename or invite teammates later."` 普通安抚 SaaS 文案 → 改成 mono 11
  status-done 圆点 + `Encrypted · Auto-saves · Renamable later`，对齐 login 加密
  说明的密度感

新增的：

- Eyebrow 胶囊 `STEP 01 · PRACTICE PROFILE`（accent-tint bg + 6px accent-default
  圆点 + Geist Mono 11 +16% letter-spacing accent-text），跟 login 的 `SIGN IN`
  胶囊同结构
- 28px Inter Semi Bold 标题 `Set up your practice.`（替代原 `text-xl` 的
  `Confirm your practice profile`，跟 login headline 同字阶）
- `accent/default` indigo `Continue` 按钮 + 8gap `ChevronRightIcon`（默认 shadcn
  Button variant 走的就是 `var(--primary)` = `var(--color-util-colors-primary-500)` =
  `#5b5bd6` indigo，不需要 variant 改写）
- 一组 Vercel React 性能规则适配（详见下一节）

### 6. Vercel React 性能规则 application

| 规则                                 | 应用点                                                                                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `js-hoist-regexp`                    | `login.tsx` 的 `USER_CANCELED` 与 `onboarding.tsx` 的 `SLUG_CONFLICT_PATTERN` 提到模块级，避免 hot path（每次 sign-in 失败重试 / 每次 slug 冲突重试）重新编译正则    |
| `rerender-no-inline-components`      | `EntryShellHeader` / `EntryShellFooter` 是文件作用域**同级函数**，不在 `EntryShell` 内部定义，避免每次 EntryShell 重渲染时身份变化导致 children 整树 unmount/remount |
| `rerender-derived-state-no-effect`   | `onboarding.tsx` 的 `defaultName` 走 `useMemo` 在 render 期推导，不放进 `useEffect` 里 setState                                                                      |
| `js-early-exit`                      | `handleSubmit` 里 `trimmed.length < MIN_NAME_LENGTH` 与 `if (existing)` 都是 early return                                                                            |
| `bundle-barrel-imports`              | 新增的 `LOCALE_SHORT_LABELS` 走 `@duedatehq/i18n/locales` 子路径而非 barrel `@duedatehq/i18n`；EntryShell 直接走 `@duedatehq/ui/components/ui/button` 等子路径       |
| `rendering-conditional-render`       | submit 按钮的 loading / 默认两态用 ternary `isSubmitting ? <>…</> : <>…</>`，不用 `&&` 做条件渲染（避免 0 / "" 这类 falsy 值意外渲染）                               |
| `async-cheap-condition-before-await` | `handleSubmit` 里 `isSubmitting` 短路 + `trimmed.length` 验证都是 sync check，发生在 `startSubmit` 启动之前                                                          |

未应用 / 不适用的：

- `async-parallel`：onboarding 里 `loadExistingOrganizationId` → `setActive` 与
  `createOrgWithRetry` → `setActive` 都是真依赖（必须先看 list 再决定 reuse vs
  create），不能 Promise.all 并行
- `bundle-dynamic-imports`：login / onboarding 已经在 router.tsx 走 `lazy: async
() => import(...)`，是 chunk-split 入口
- `server-*`：纯 SPA + better-auth client，不存在 RSC / server action 路径

### 7. `LOCALE_SHORT_LABELS` —— 短码 trigger

[`packages/i18n/src/locales.ts`](../../packages/i18n/src/locales.ts) 新增：

```ts
export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  en: 'EN',
  'zh-CN': '中',
}
```

跟 `apps/marketing/src/i18n/{en,zh-CN}.ts` 的 `language.{enShort,zhShort}` 对齐
（marketing TopBar 的 segmented control 已经走 `EN` / `中`），跨站点视觉一致。

[`apps/app/src/components/primitives/locale-switcher.tsx`](../../apps/app/src/components/primitives/locale-switcher.tsx)
trigger 从 `LOCALE_LABELS[locale]`（`English` / `简体中文`）改成
`LOCALE_SHORT_LABELS[locale]`（`EN` / `中`）。dropdown menu items 仍然渲染长名字
（`LOCALE_LABELS`），让用户在选时能识别完整语言名 —— 不破坏 a11y。

刻意走 `@duedatehq/i18n/locales` 子路径而不是 barrel `@duedatehq/i18n`，**避免扩
大 barrel surface**。`packages/i18n/package.json` 早就声明了：

```json
"exports": {
  ".":         "./src/index.ts",
  "./headers": "./src/headers.ts",
  "./locales": "./src/locales.ts"
}
```

`packages/i18n/src/index.ts` 这次**没有改动**，避免顺手往 barrel 里再塞一条
re-export。

### 8. 文档对齐

- [`docs/dev-file/05-Frontend-Architecture.md`](../dev-file/05-Frontend-Architecture.md) §1
  目录树补 `_entry-layout.tsx` 与 `onboarding.tsx`，§"业务路由按 session/org 状态分
  成三个顶级 route group" 改写成 EntryShell + protected + catch-all 三组结构，附上命名
  权衡。
- 没改 [`docs/dev-log/2026-04-26-login-design-system-alignment.md`](./2026-04-26-login-design-system-alignment.md) ——
  dev-log 是历史快照不动；该文里"没新增组件到 `components/primitives/`"的判断**在当时是对的**，是这次抽 EntryShell 才让前提失效，本文记录新前提。
- 没改 [`docs/dev-log/2026-04-24-first-login-practice-onboarding.md`](./2026-04-24-first-login-practice-onboarding.md) ——
  同理，那一稿的 onboarding 设计当时是合理的，被本次 commit 替换。

## 为什么这样做

### 为什么先在 Figma 画完再写代码

第一性原理 —— 这次的 ask 是「设计 + 代码对齐」，先把设计稿（含 Color variable
binding / text style apply / 1px hairline / spacer 节奏）落到 Figma file 里，再
对着 Figma 1:1 翻译成 React + Tailwind utility，比反向"先写代码再补设计稿"减少视
觉漂移：

- Figma 阶段强制讨论 token 边界（哪些走 `accent/text`、哪些走 `text/primary`、
  哪些走 mono），代码阶段只是 utility class 替换
- 设计稿在 Figma file 里的位置是平行 frame（`Sign In` + `Onboarding`），跨 frame
  视觉差异肉眼可见，避免单页 review 漏看
- 用户能在 Figma 里直接做样式 review，不必跑 dev server

### 为什么 EntryShell 而不是 EntryLayout

React Router v7 把 layout route 的 component 称作 layout（"layout route"），但
**组件名**用 "Layout" 后缀会跟 `RootLayout`（protected shell）撞概念 —— 后者是个
**带数据 + 带交互**的 layout（侧栏、用户菜单、命令面板触发器、迁移向导
provider），而 EntryShell 是**纯展示 chrome**。叫 `Shell` 比 `Layout` 更准确表达
"骨架"语义，跟 `ShellSkeleton`（`_layout.tsx` 导出的 hydrate fallback）也呼应。

### 为什么不直接复用 marketing 的 TopNav.astro

[`docs/dev-log/2026-04-26-login-design-system-alignment.md`](./2026-04-26-login-design-system-alignment.md)
§"为什么不直接复用 marketing 的 TopNav.astro / Hero.astro" 已经回答 ——
`apps/marketing` 是 Astro，运行时不可跨包导入。共享的是 token 与 utility，结构本
地写。

### 为什么 onboarding 的 input 不复用 shadcn Field / FieldLabel

`packages/ui/src/components/ui/field.tsx` 的 `FieldLabel` 默认走 `text-sm
font-medium`（13px medium 普通 label），跟设计稿的 `Inter Medium 11px
letter-spacing 0.08em uppercase`（DESIGN.md `label` token）不一致。两条出路：

1. 给 FieldLabel 加 variant `<FieldLabel variant="caps">` 把 11px caps 抽成
   primitive
2. 本地自写 `<label className="text-[11px] font-medium uppercase tracking-[0.08em]
text-text-secondary">`，不引 FieldLabel

选 2，因为：

- `FieldLabel` 是 shadcn Base UI primitive 的薄封装，它的 base style 跟
  shadcn upstream 锁死；加 variant 等于 fork shadcn，未来 `pnpm dlx shadcn@latest add`
  升级会冲突
- 当前只有 onboarding 一个 form 用到 caps label。如果未来 settings / migration
  intake 等都用上 caps label，再抽 `<UppercaseLabel>` primitive 不迟（YAGNI）
- 自写 `<label>` + `<Input>` + `<p>` 三件套读起来比 shadcn 的 `Field /
FieldLabel / FieldDescription` 嵌套更短

### 为什么 zh-CN 用 `\n` 显式换行而不是写一段 16+ 字让浏览器自然 wrap

字符宽度依赖字体渲染（不同 OS / 不同浏览器 / 不同 Inter 版本下 Chinese 字宽 +
tracking 都微调），靠"刚好越过 400px"来强制 wrap 不稳定 —— 一次浏览器更新或字体
版本切换就回退到 1 行。`\n` + `whitespace-pre-line` 是显式语义，不依赖渲染。

英文 msgid `Welcome back to the workbench.` 28 字符 / 5 单词，每次渲染都稳定 wrap
在 `the / workbench.`，所以英文不需要 `\n`。

## 验证

```bash
pnpm --filter @duedatehq/app i18n:extract                    # 269 / zh-CN 31 missing（已填上 3 条新词，剩 31 条历史欠账）
pnpm --filter @duedatehq/app i18n:compile                    # ok
pnpm --filter @duedatehq/app exec tsc --noEmit               # exit 0
vp check                                                     # 0 errors / 1 warning（pre-existing in packages/ui/src/lib/placement.ts，不相关）
pnpm --filter @duedatehq/app test --run                      # 5 files / 37 tests passed
pnpm --filter @duedatehq/i18n test --run                     # ok
```

人工 visual diff：

- light / dark theme 切换 —— EntryShell header / footer 的 1px hairline 在两种主
  题下都能区分；onboarding indigo button 在 dark 下走 `--color-util-colors-primary-400`
  （DESIGN.md `colorsDark.accent-default`）自动上调亮度
- locale 切到 zh-CN —— login 标题渲染成 "欢迎回来。\n事务所工作台已就绪。" 两行
  中文，onboarding 标题 "设置你的事务所。" 一行；button / status note 位置稳定
- 窄到 mobile (375w) —— 单列 max-w-[400px] 居中，header audience 文本 "For US CPA
  practices" 在 zh-CN 下不溢出
- LocaleSwitcher trigger 显示 `EN` / `中` 短码；点开 dropdown 见 `English` / `简
体中文` 全名 + 当前 locale 的 check
- onboarding 提交流程未变 —— `loadExistingOrganizationId` 复用、`createOrgWithRetry`
  重试、setActive 错误 toast 行为都跟原 onboarding 一致
- `/login` ↔ `/onboarding` 之间通过 RR v7 navigation 切换时 EntryShell 不卸载（验证
  `<Outlet />` 工作正常 + `EntryShell` mount 一次后 children swap）

## 后续 / 未闭环

- 31 条 zh-CN 历史欠账（与本次无关）：留作下一次专项翻译梳理 / 接 LLM 翻译 step
  时统一清。
- `apps/app/src/routes/_layout.tsx`（protected shell）和 `_entry-layout.tsx`（entry
  shell）的 header 是**两套实现**：protected 的有 user menu + nav + actions、entry
  的没有。它们当前没共享代码 —— 真要共享只有 brand cluster 那几行（accent dot +
  DueDateHQ + `/` + audience）。如果未来 settings 顶栏 / migration intake 顶栏也都
  长这样，再抽 `<BrandLockup>` 这一最小原子到 `components/primitives/`，YAGNI 暂
  缓。
- onboarding 是单 step（PRACTICE PROFILE）。如果未来加 step 02（团队邀请）/ step
  03（导入）走"真" stepper，eyebrow `STEP 01 · PRACTICE PROFILE` 文本已经为 step
  迭代留了语义位 —— 升级时把 hardcoded "01" 换成 stepper state 即可。
- LocaleSwitcher 的 globe icon 大小 / 间距在新短码下视觉略不平衡（`EN` / `中` 字符
  宽度比 `English` / `简体中文` 短，整个 trigger 显得偏空）。等 marketing 的
  segmented control 设计在 app 里也用上时一起调，本次先跟齐 marketing。
