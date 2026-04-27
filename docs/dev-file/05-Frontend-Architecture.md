# 05 · Frontend Architecture · Vite+ · React Router 7 · UI System

> 对齐 PRD §5 / §10 + 设计系统 `docs/Design/DueDateHQ-DESIGN.md`。
> 核心决策：**纯 SPA（不做 SSR） · React Router 7 library/data mode · shadcn Base UI（`base-vega`） · 工具链由 Vite+ (`vite-plus`) 统一驱动。**
>
> **PWA / Service Worker / Web Push 在 Phase 0 已移除**（见 `00-Overview.md §7` 的否决矩阵）。回头率靠 SPA chunk cache + in-app toast + Email 兜底；installable 体验推迟到 Phase 2 Tauri menu bar widget。
>
> 公开 marketing 站不属于本 SPA。`apps/marketing` 使用 Astro，详见 [12 Marketing Architecture](./12-Marketing-Architecture.md)。

---

## 1. 目录结构（约束）

```
apps/app/
├── index.html
├── vite.config.ts
├── public/
│   ├── icons/                ← 应用图标（favicon / 站点 logo）
│   └── fonts/                ← Inter / Geist Mono 本地托管（可选）
├── src/
│   ├── main.tsx              ← ReactDOM.createRoot + router provider
│   ├── router.tsx            ← createBrowserRouter + routes config
│   ├── routes/               ← 每个路由一个 .tsx（RR7 data mode：loader / action / Component）
│   │   ├── error.tsx             ← root route 全局 RouteErrorBoundary
│   │   ├── _layout.tsx           ← 登录后 shell（侧栏 + 顶栏，path='/'，loader 做认证 gate）
│   │   ├── _entry-layout.tsx     ← entry shell（顶栏 + 底栏，pathless layout route，包 /login + /onboarding；命名避开 "auth" 因为 onboarding 已在 post-auth 状态）
│   │   ├── login.tsx             ← 登录页（path='/login'，loader 把已登录用户跳走，渲染在 EntryShell 内）
│   │   ├── onboarding.tsx        ← 首登 firm 设置（path='/onboarding'，loader 校验有 session 且无 active org，渲染在 EntryShell 内）
│   │   ├── dashboard.tsx         ← index
│   │   ├── workboard.tsx
│   │   ├── settings.tsx
│   │   └── fallback.tsx          ← RouteHydrateFallback
│   │   # 目标形态（Phase 0 MVP → Phase 1）：
│   │   # clients.$id.tsx · alerts.tsx · audit.tsx · settings/*.tsx · migration.tsx
│   ├── features/             ← 业务特性（跨页面复用）
│   │   ├── migration/
│   │   ├── dashboard/
│   │   ├── pulse/
│   │   ├── workboard/
│   │   └── evidence/
│   ├── components/
│   │   ├── primitives/       ← 自建（TriageCard / DaysBadge / PenaltyPill / SourceBadge / AIHighlight / EvidenceChip / StatusDropdown）
│   │   └── patterns/         ← 跨 feature 的复合组件（evidence-drawer / cmdk / confirm-dialog）
│   ├── lib/
│   │   ├── rpc.ts            ← oRPC client + TanStack Query utils
│   │   ├── auth.ts           ← better-auth client（`createAuthClient`）
│   │   ├── utils.ts          ← cn / formatCents / formatDate
│   │   └── env.ts            ← import.meta.env 类型收敛
│   ├── hooks/
│   ├── styles/
│   │   └── globals.css       ← Tailwind 编译入口 + @duedatehq/ui preset + @source
│   └── (sw.ts 已移除 · PWA 降级见本文档头部说明)
└── tsconfig.json             ← extends @duedatehq/typescript-config/vite.json

packages/ui/
├── components.json           ← shadcn 配置（"style": "base-vega"）
└── src/
    ├── components/ui/        ← shadcn/Base UI primitives，不含业务
    ├── lib/utils.ts          ← cn()
    └── styles/preset.css     ← design tokens / @theme inline / base layer
```

## 1.1 多前端应用边界

| 应用      | 路径             | 域名                | 渲染模型                                    | 共享                                                 |
| --------- | ---------------- | ------------------- | ------------------------------------------- | ---------------------------------------------------- |
| SaaS app  | `apps/app`       | `app.duedatehq.com` | Vite SPA + React Router data mode           | `packages/contracts`、`packages/ui`、locale contract |
| Marketing | `apps/marketing` | `duedatehq.com`     | Astro static HTML + selective React islands | `packages/ui`、locale contract                       |

`apps/marketing` 不导入 `apps/app/src/*`，不调用内部 `/rpc`，不复用 app 的 Lingui catalog。它可以通过 `@astrojs/react` 在需要交互的局部 island 中使用 `@duedatehq/ui/components/ui/*`。静态 landing section 优先写 `.astro`，避免把公开站做成第二个 SPA。

Marketing 的 Tailwind 入口必须导入共享 preset，并扫描 shared UI：

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import '@duedatehq/ui/styles/preset.css';

@source '../../../packages/ui/src';
@source '../components';
@source '../islands';
```

公开页 SEO、metadata、canonical、hreflang、sitemap、robots 和 OG 图由 Astro 负责；`apps/app/index.html` 只负责 SaaS SPA shell。

---

## 2. 路由模型（React Router 7 · data mode）

**纪律：**

- 用 `createBrowserRouter` + 路由配置对象，**不走 framework mode**（framework mode 引入 Node 依赖，与 Worker 冲突）
- Loader / action **可选使用**；数据获取主路径是 **TanStack Query**（统一 server state + 乐观 UI + 缓存）
- Loader 仅用于必须 pre-resolve 的场景（**认证 gate / 权限跳转**）——这是目前 loader 的主要用法
- 全局错误处理只挂在 React Router root route：`AppRoot` 同时包裹
  `<NuqsAdapter><Outlet /></NuqsAdapter>` 并声明 `ErrorBoundary: RouteErrorBoundary`。
  子 route 默认不重复挂同一个 boundary；React Router 会把 loader / lazy / render 错误冒泡到最近的
  boundary。只有未来需要“保留 app shell、内容区局部失败”这类不同 UX 时，才在更深层加专用
  boundary。
- Hydrate fallback 按 route group 定义，不像 error boundary 一样 root-only 收敛：
  entry route 使用 `EntryRouteHydrateFallback`（空白占位，保留 entry shell 的静态 header /
  footer，不显示 skeleton）；protected shell 初始认证 gate 使用 `ShellSkeleton`；dashboard /
  workboard / settings 等内容 route 使用 `RouteHydrateFallback`。
- 业务路由按 session/org 状态分成三个顶级 route group，并额外保留一个 public catch-all：
  - **EntryShell（pathless layout route，`Component: EntryShell`）** — 包 `/login` + `/onboarding` 共享同一套 header / footer / locale switcher chrome。子路由各自挂自己的 loader（`guestLoader` / `onboardingLoader`），EntryShell 自身不带 loader 也不带 path，详见 `apps/app/src/routes/_entry-layout.tsx`。**命名避开 "auth"：** `/login` 是 pre-auth、`/onboarding` 是 post-auth/pre-active-org，两者唯一共性是「在用户进 dashboard shell 之前要走完的过渡 surface」 → "entry"
    - `/login` — `guestLoader` 把已登录用户 `redirect(redirectTo)` 推出去
    - `/onboarding` — `onboardingLoader` 要求有 session 且无 `activeOrganizationId`；已有 active org 直接 `redirect(redirectTo)`，无 session 跳 `/login?redirectTo=/onboarding`
  - `/` — 受保护路由组（`id: 'protected'`，`Component: RootLayout`），`protectedLoader` 未命中 session 时 `redirect('/login?redirectTo=...')`。`dashboard` / `workboard` / `settings` 都作为它的 children
  - `*` — 公开 catch-all route，loader 主动抛 404 `Response`，由 root `RouteErrorBoundary`
    渲染统一 not found UI；未知 URL 不进入认证 gate，也不显示 React Router 默认开发错误页

**Auth flow**：

- 认证 gate 放在 **layout route 的 loader** 里，不放进组件渲染（避免 `<Navigate>` 造成中间帧闪烁，详见 `docs/dev-log/2026-04-23-auth-gate-loader-refactor.md`）
- 未登录访问 `/` 树 → `protectedLoader` → `throw redirect('/login?redirectTo=<当前路径>')`
- 已登录访问 `/login` → `guestLoader` → `throw redirect(redirectTo || '/')`（`redirectTo` 只接受 `/` 开头的 in-app 路径，避免 open redirect）
- 受保护页面通过 `useLoaderData<{ user }>()`（或子路由 `useRouteLoaderData('protected')`）读取 `user`，**禁止**在受保护组件里再订阅 `useSession`——否则 sign-out 清 session store 会触发中间态 re-render

**URL state 约定：**

- 所有可分享的过滤 / 排序 / 分页走 URL（用 `nuqs`）
- 任何抽屉开关 / 选中项也写 URL（`?drawer=obligation&id=xxx`）
- **不要**把分页 / 筛选塞进 Zustand

---

## 3. 状态管理分层（约束）

| 层           | 工具                                         | 管什么                                                                                                   |
| ------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Server state | **TanStack Query + `@orpc/tanstack-query`**  | 所有内部 RPC 消费必须走 `orpc.*.queryOptions()` / `mutationOptions()`；自动缓存 / 乐观 UI / invalidation |
| URL state    | **nuqs** + `react-router` params             | 筛选 / 排序 / 分页 / 抽屉打开项                                                                          |
| Form state   | **react-hook-form** + Zod（复用契约 schema） | 所有表单                                                                                                 |
| UI state     | **Zustand**                                  | Cmd-K 开关 / drawer 堆栈 / Evidence Mode 目标；**不超 3 个 store**                                       |
| Feature flag | **PostHog JS SDK**                           | 运行时开关                                                                                               |

**禁止：** Redux、MobX、Recoil、自造 context 状态容器。

---

## 4. oRPC 客户端（约束）

`apps/app/src/lib/rpc.ts`（唯一 oRPC client 初始化位置）：

```ts
// 约束
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { AppContract } from '@duedatehq/contracts'

const link = new RPCLink({
  url: `${window.location.origin}/rpc`,
  fetch: (req, init) => fetch(req, { ...init, credentials: 'include' }), // 带 better-auth cookie
})

const rpc: ContractRouterClient<AppContract> = createORPCClient(link)
export const orpc = createTanstackQueryUtils(rpc)
```

业务代码只 import `orpc`，并把官方 `queryOptions()` / `mutationOptions()` 直接传给 TanStack Query hooks：

```ts
const mutation = useMutation(orpc.migration.createBatch.mutationOptions())
const query = useQuery(orpc.migration.getBatch.queryOptions({ input: { batchId } }))
```

**禁止：**

- 业务代码 import 或调用 raw `rpc.*` client。
- 业务代码 import `@orpc/client` / `@orpc/client/*`。
- 任何地方出现 `fetch('/rpc/...')` 裸调用。

读取型 RPC 优先 `useQuery`；需要由 route/section fallback 接管 loading 时用
`useSuspenseQuery` 并放在明确的 Suspense 边界内。用户动作触发的写流程用
`useMutation(...mutationOptions())`，事件 handler 内优先调用 `mutate(input, callbacks)`。
`mutateAsync` 只允许在确实需要 promise composition 且同一作用域有完整
`try/catch/finally` 的底层工具代码里使用。

```ts
// ✅ mutation lifecycle stays with TanStack Query callbacks.
mutation.mutate(data, {
  onSuccess: (result) => router.push(result.url),
  onError: showError,
})

// ❌ Avoid async event handlers that await mutations.
const result = await mutation.mutateAsync(data)
router.push(result.url)
```

---

## 5. UI 系统（对齐设计文档）

### 5.1 shadcn Base UI 配置

`packages/ui/components.json`（**约束**）：

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-vega",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/preset.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@duedatehq/ui/components",
    "utils": "@duedatehq/ui/lib/utils",
    "ui": "@duedatehq/ui/components/ui",
    "lib": "@duedatehq/ui/lib",
    "hooks": "@duedatehq/ui/hooks"
  }
}
```

### 5.2 Tailwind 4 `@theme`（对齐 DESIGN.md）

`packages/ui/src/styles/preset.css` 的 token 必须**与 DESIGN.md §2 完全一致**。`apps/app/src/styles/globals.css` 只是消费端 Tailwind 编译入口：

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import '@duedatehq/ui/styles/preset.css';

@source '../../../../packages/ui/src';
```

`@source` 必须存在；它让 Tailwind 扫描 shared UI 源码并生成 shadcn 组件内部使用的 `bg-popover`、`text-card-foreground`、`border-input`、`data-open:animate-in` 等 utilities。

Theme runtime 同样由 `packages/ui` 持有：

- `@duedatehq/ui/theme`：storage key、`light | dark | system` contract、解析与应用 helper。
- `@duedatehq/ui/theme/no-flash-script`：首屏主题初始化脚本字符串。
- `disableThemeTransitions()`：theme 切换瞬间临时禁用 CSS transitions，避免 token 大面积变更时
  各组件颜色、背景、边框以不同 duration 交错动画；做法对齐 `next-themes`
  `disableTransitionOnChange`。

`apps/app` 不在 React component / effect 中决定初始主题；Vite `transformIndexHtml` 会把
`THEME_INIT_SCRIPT` 注入 `<head>`，在 React 入口脚本执行前同步设置：

- `html.dark`
- `html[data-theme="light" | "dark"]`
- `html { color-scheme }`
- `<meta name="theme-color">`

这样 light/dark token 在 CSS 首次应用前已经选定，避免 hydration 后再切 class 造成闪烁。
后续 UI 层的 theme switcher 只更新 `localStorage["duedatehq.theme"]` 并复用
`@duedatehq/ui/theme` helper。

共享 preset 文件形态：

```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;

  --radius-sm: 0.25rem; /* 4px · chip */
  --radius: 0.375rem; /* 6px · 主 · Banner / Button / Input */
  --radius-lg: 0.75rem; /* 12px · Drawer / Card 大容器 */

  --text-2xs: 10px;
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 13px;
  --text-md: 14px;
  --text-lg: 16px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-hero: 56px;

  --shadow-overlay: 0 8px 24px rgba(0, 0, 0, 0.08); /* 仅 Cmd-K / Drawer / Tooltip 等浮层例外 */
}

/* Light / Dark 下的颜色 token 详见 DESIGN.md §2.2 / §2.3，逐项对齐；不在此重复 */

/* Inter 数字特性全局打开 */
@layer base {
  html {
    font-feature-settings: 'cv11', 'ss01';
  }
  .tabular {
    font-variant-numeric: tabular-nums;
  }
}

/* 扩展 token 注入 Tailwind utilities */
@theme inline {
  --color-bg-canvas: var(--bg-canvas);
  --color-bg-panel: var(--bg-panel);
  --color-bg-elevated: var(--bg-elevated);
  --color-bg-subtle: var(--bg-subtle);
  /* border / text / accent / severity / status 见 DESIGN.md；逐项补齐 */
}
```

**强制约束：**

1. **禁止在业务组件里写原子颜色值**（如 `text-indigo-500`）；必须用语义 token（`text-accent-default` / `text-severity-critical`）
2. **禁止在业务组件里写 `shadow-*`**，除 Cmd-K / Drawer / Tooltip 等浮层例外（用 `shadow-overlay`）
3. **所有数字展示**（金额 / 天数 / 日期 / EIN）必须 `font-mono tabular-nums`

### 5.3 组件分层

| 层                                     | 位置        | 职责                                                                                                                 |
| -------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `@duedatehq/ui/components/ui/*`        | shadcn 生成 | Button / Input / Dialog 等基础 primitives，不含业务、路由、session、oRPC                                             |
| `apps/app/src/components/primitives/*` | 手写        | DueDateHQ 专有组件：TriageCard / DaysBadge / PenaltyPill / SourceBadge / AIHighlight / EvidenceChip / StatusDropdown |
| `apps/app/src/components/patterns/*`   | 手写        | 跨 feature 复用：evidence-drawer / cmdk / confirm-dialog                                                             |
| `apps/app/src/features/<slice>/*`      | 手写        | 特性内部：migration-wizard / pulse-banner / workboard-table                                                          |
| `apps/app/src/routes/*`                | 手写        | 路由级 page 组件，拼装 feature                                                                                       |

**依赖方向**：`routes → features → patterns → primitives → @duedatehq/ui → @duedatehq/ui/lib`。下层**不得**依赖上层。`packages/ui` 不得依赖 Better Auth session、React Router、TanStack Query、oRPC 或 app 专属业务组件。

---

## 6. 表格（Workboard）

- **TanStack Table 8** + 服务端分页（50 行 / 页）+ 虚拟化（`@tanstack/react-virtual`）
- 列可见性 / 排序 / 筛选状态全部 URL persist（`nuqs`）
- 行内 `[status ▾]` 乐观 UI：先改前端 → mutation → 失败 toast + 回滚
- 键盘：`J/K` 上下行 · `E` 展开 Evidence · `F/X/I/W` 改状态 · `Enter` 打开 Detail

---

## 7. 表单

- **react-hook-form + Zod**；Zod schema **必须** import 自 `packages/contracts`（前后端同源）
- `@hookform/resolvers/zod` 做表单级校验
- Server error（oRPC 返回 `ORPCError`）映射到字段级 error 由统一 hook `useRpcMutation` 处理

---

## 8. 客户端缓存与通知策略（替代原 PWA 方案）

原先这里的 PWA + Service Worker + Web Push 方案在 Phase 0 已整体降级（见 `00-Overview.md §7`、`01-Tech-Stack.md §2.1`）。当前约束：

- **HTTP 级缓存**：静态 asset 走 Cloudflare Worker Assets binding 的自带 immutable caching（hash 化 chunk 名 + `cache-control: public, max-age=31536000, immutable`）；`index.html` 不缓存。Vite+ `vp build` 输出已满足。
- **SPA runtime cache**：TanStack Query 的 `staleTime` / `gcTime` + nuqs URL state 承担"秒开回访"；不引入 Service Worker。
- **通知回路**：Pulse / Deadline 提醒全部走 Email Outbox（Resend）+ in-app toast（Sonner）。没有 Web Push、没有浏览器通知权限 prompt。
- **Installable 体验**：推迟到 Phase 2 Tauri menu bar widget 统一覆盖 install / 后台驻留 / 系统通知。不再通过 manifest 走 PWA install。

如未来重新开启 PWA，需要先满足两个前置：(1) vite-plus 生态有稳定的 vite 8 兼容 PWA 插件；(2) Pulse / Deadline 有真实"即时到达"需求（Phase 0 日常场景 email 足够）。重启时要在 `00-Overview.md §7` 把 PWA 从否决矩阵移除，并在本章补回 manifest / SW / push 三小节。

---

## 9. 关键交互模式

- **Optimistic UI**：所有改状态 / 改 assignee 的 mutation 先改 cache，失败回滚 + toast
- **Loading skeleton**：每页至少一张 skeleton；冷启动避免白屏
- **Keyboard Shell**：`apps/app/src/components/patterns/keyboard-shell` 是唯一 app 级快捷键入口，基于 `@tanstack/react-hotkeys`。全局层注册 `?` / `Cmd/Ctrl+K` / `Cmd/Ctrl+Shift+D`，导航序列层注册 `G then D/W/C/A`，Workboard route 层注册 `J/K/Enter/E/F/X/I/W`，Wizard/Overlay 层压住 route/navigation 快捷键。裸字母键保留 TanStack 的 input ignore 行为，`Enter` 只在明确声明 `ignoreInputs: false` 且手动排除 textarea/contenteditable/select 时使用。
- **Command Palette (Cmd-K)**：全局快捷键，三段（Search / Ask / Navigate），Ask 在 Phase 1 前留占位 `Coming soon`。Palette 使用 lazy import，第一次 `Cmd/Ctrl+K` 后加载，避免进入首屏 bundle 热路径。
- **Shortcut Help (?)**：帮助浮层从 TanStack `useHotkeyRegistrations()` 读取当前已 mount 快捷键，再合并 reserved slots（Ask `/`、Firm switch、Evidence selected），避免文档与实现分叉。
- **Evidence Mode**：当前 Workboard `E` 和全局 `Cmd/Ctrl+E` 先作为 reserved / placeholder 展示；真实 selection → `evidence-drawer` wiring 在 Day 6 接入。

---

## 10. 无障碍

- WCAG 2.2 AA 基线
- 所有交互元素 `tabindex` 正确；Base UI 自带正确 focus management
- 颜色对比度 ≥ 4.5:1（DESIGN.md 的 token 已满足）
- 暗色模式真实切换（不只是 media query）
- `prefers-reduced-motion` → 关闭 Penalty Radar 数字滚动动画

---

## 11. i18n

> 选型依据：[ADR 0009 · Lingui as the i18n library](../adr/0009-lingui-for-i18n.md)。原 `i18next + react-i18next`
> 线已废止。

- **库**：Lingui v6 —— `@lingui/core` + `@lingui/react`（runtime），`@lingui/cli` +
  `@lingui/vite-plugin` + `@lingui/babel-plugin-lingui-macro` + `@rolldown/plugin-babel`（dev），
  版本全部入 `pnpm-workspace.yaml` catalog 精确锁
- **书写**：所有用户可见文案走宏 `<Trans>…</Trans>` / ``t`…` ``，**禁止**运行时 `i18n._(dynamicStr)`
  ；模块级惰性文案使用 `msg` + `i18n._(MessageDescriptor)`，只允许已抽取的 descriptor
- **Zod 保持 locale-free**：`packages/contracts` schemas 只返回结构化错误 `{ code, path }`，不含文案；
  前端 RHF 的错误 UI 用 `<Trans>` 按 `code` 分支渲染
- **Catalog 布局**：`apps/app/src/i18n/locales/{locale}/messages.po`（源）→ `lingui compile --strict`
  出 `.ts`（产物）；当前 `en` + `zh-CN` 体积可忽略，先静态 import，新增第三种语言时再改
  `dynamicActivate`
- **Catalog 完整性**：`i18n:extract` 固定使用 `lingui extract --clean`，删除源码已移除的 obsolete
  entries；`i18n:compile` 固定使用官方 `lingui compile --strict`，任何活跃 catalog 的 missing
  translation 都直接失败，不再维护 missing baseline
- **PO formatter**：`@lingui/format-po` 保留 file-level origins，但关闭 line numbers，避免纯代码移动
  造成 `.po` diff churn
- **共享 contract**：`SUPPORTED_LOCALES`、`DEFAULT_LOCALE`、`INTL_LOCALE`、`LOCALE_HEADER` 位于 `packages/i18n`；app、server、marketing 共享这些常量，但 catalog 分离
- **Marketing i18n**：`apps/marketing` 使用 Astro i18n routing + 静态 copy dictionary；不把 landing 文案写进 app 的 Lingui PO
- **服务端**（Hono 中间件 + React Email 模板）：Worker 不加载 Lingui runtime；`x-locale` >
  `Accept-Language` > `en` 解析后走 `apps/server/src/i18n/messages.ts` 类型化薄字典
- **Node / Vite 约束**：Lingui v6 是 ESM-only，要求 Node `>=22.19`；`@lingui/vite-plugin`
  要求 Vite `^6.3.0 || ^7 || ^8`，由 Vite+ 工具链统一承载
- **Macro transform**：`apps/app/vite.config.ts` 使用
  `@rolldown/plugin-babel + linguiTransformerBabelPreset()`；若收窄 `include`，必须用能匹配
  绝对 module id 的正则，不能用 `src/**/*.{ts,tsx}` 这类 picomatch brace glob
- **富文本占位符**：`lingui.config.ts` 启用 `data-t` 与常见 tag 默认 placeholder 名，避免
  `<0>` / `<1>` 这类对译者不友好的占位符
- **日期 / 金额** 用 `Intl.DateTimeFormat` / `Intl.NumberFormat`，不引 moment / dayjs
- **复数 / 选择**用 Lingui 原生 `<Plural>` / `<Select>`（ICU MessageFormat），不额外装 `i18next-icu`

### 11.1 操作命令

1. `pnpm --filter @duedatehq/app i18n:extract`：扫描源码、更新 `.po`，并清理 obsolete entries
2. `pnpm --filter @duedatehq/app i18n:compile`：用 `lingui compile --strict` 编译 catalog 到 `.ts`；
   任意 missing translation 都让本地命令和 CI 失败
3. CI drift check：在每次 `main` push 与 PR 上执行 extract + compile 后，对
   `apps/app/src/i18n/locales` 跑 `git diff --exit-code`，同时阻止 missing translation 与
   源码文案 / catalog / 编译产物脱节；Lingui CLI 没有只检查不写入的官方 `--check` /
   dry-run 模式，所以 `git diff` 是外层 generated-artifact 同步断言；该 workflow 不使用
   `paths` 过滤，因为 catalog drift 是仓库状态检查
4. `pnpm ready`：覆盖 check、test、build；Vite 插件会在 build 中再次编译 `.po`，但
   不替代 extract + strict compile + diff 这一独立 catalog gate
5. 排查 CLI 并行问题时可临时加 `--workers 1`

---

## 12. 性能优化清单

- 路由级 code-splitting（RR7 `lazy` 动态 import）
- 图标 tree-shake（`lucide-react` 按需导入）
- Tailwind 4 JIT + Vite 8 Rolldown minify（由 `vp build` 驱动）
- Critical CSS inline（index.html）
- 静态 chunk 走 Worker Assets binding 的长 cache（hash 化文件名 + `immutable`）
- Chunk 大小 budget：单 chunk < 150 KB gz，总 bundle < 500 KB gz

---

## 13. Storybook（Phase 1 可选）

- 组件库（`packages/ui/src/components/ui` + `apps/app/src/components/primitives`）走 Storybook
- Story 每个组件至少：default / hover / disabled / dark / error 5 个
- Visual regression 用 Chromatic（免费层够用）

Phase 0 不做 Storybook，优先跑 Demo。

---

## 14. TODO

- ~~接入 auth 时：登录态检查必须放在 app layout route 的 `loader` 或统一组件 gate 中，不要散落在各页面组件里。~~ 已在 `apps/app/src/router.tsx` 里用 `protectedLoader` / `guestLoader` 两个 loader 落地（`protected` 路由组 + 独立 `/login` 路由组），`RootLayout` 通过 `useLoaderData` 读取 `user`，不再订阅 `useSession`。
- Workboard 接真实筛选 / 分页时：筛选、排序、分页和选中项必须通过 React Router search params 或 `nuqs` 管 URL state，不要放进普通组件 state。

---

继续阅读：[06-Security-Compliance.md](./06-Security-Compliance.md)
