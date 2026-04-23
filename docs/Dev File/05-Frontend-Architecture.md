# 05 · Frontend Architecture · Vite+ · React Router 7 · UI System

> 对齐 PRD §5 / §10 + 设计系统 `docs/Design/DueDateHQ-DESIGN.md`。
> 核心决策：**纯 SPA（不做 SSR） · React Router 7 library/data mode · shadcn Base UI（`base-vega`） · 工具链由 Vite+ (`vite-plus`) 统一驱动。**
>
> **PWA / Service Worker / Web Push 在 Phase 0 已移除**（见 `00-Overview.md §7` 的否决矩阵）。回头率靠 SPA chunk cache + in-app toast + Email 兜底；installable 体验推迟到 Phase 2 Tauri menu bar widget。

---

## 1. 目录结构（约束）

```
apps/web/
├── index.html
├── vite.config.ts
├── components.json           ← shadcn 配置（"style": "base-vega"）
├── public/
│   ├── icons/                ← 应用图标（favicon / 站点 logo）
│   └── fonts/                ← Inter / Geist Mono 本地托管（可选）
├── src/
│   ├── main.tsx              ← ReactDOM.createRoot + router provider
│   ├── router.tsx            ← createBrowserRouter + routes config
│   ├── routes/               ← 每个路由一个 .tsx（RR7 data mode：loader / action / Component）
│   │   ├── _layout.tsx
│   │   ├── auth.login.tsx
│   │   ├── auth.verify.tsx
│   │   ├── _app._layout.tsx      ← 登录后 shell（侧栏 + 顶栏）
│   │   ├── _app.dashboard.tsx
│   │   ├── _app.workboard.tsx
│   │   ├── _app.clients.$id.tsx
│   │   ├── _app.alerts.tsx
│   │   ├── _app.audit.tsx
│   │   ├── _app.settings._layout.tsx
│   │   └── _app.migration.tsx
│   ├── features/             ← 业务特性（跨页面复用）
│   │   ├── migration/
│   │   ├── dashboard/
│   │   ├── pulse/
│   │   ├── workboard/
│   │   └── evidence/
│   ├── components/
│   │   ├── ui/               ← shadcn 生成（base-vega）
│   │   ├── primitives/       ← 自建（TriageCard / DaysBadge / PenaltyPill / SourceBadge / AIHighlight / EvidenceChip / StatusDropdown）
│   │   └── patterns/         ← 跨 feature 的复合组件（evidence-drawer / cmdk / confirm-dialog）
│   ├── lib/
│   │   ├── rpc.ts            ← oRPC client + TanStack Query utils
│   │   ├── auth.ts           ← better-auth client（`createAuthClient`）
│   │   ├── utils.ts          ← cn / formatCents / formatDate
│   │   └── env.ts            ← import.meta.env 类型收敛
│   ├── hooks/
│   ├── styles/
│   │   ├── globals.css       ← Tailwind @theme + 设计系统 token（§05.5）
│   │   └── fonts.css
│   └── (sw.ts 已移除 · PWA 降级见本文档头部说明)
└── tsconfig.json             ← extends @repo/typescript-config/vite.json
```

---

## 2. 路由模型（React Router 7 · data mode）

**纪律：**

- 用 `createBrowserRouter` + 路由配置对象，**不走 framework mode**（framework mode 引入 Node 依赖，与 Worker 冲突）
- Loader / action **可选使用**；数据获取主路径是 **TanStack Query**（统一 server state + 乐观 UI + 缓存）
- Loader 仅用于必须 pre-resolve 的场景（如权限跳转）
- 路由树通过 nested layout 组织：
  - `_layout`（全站）
  - `_app._layout`（登录后 shell；内嵌 `<AuthedGate>` 组件，检测 session）
  - `_app.settings._layout`（Settings 子 shell）

**Auth flow**：

- 未登录访问 `_app.*` → `_app._layout` loader 检测 `better-auth session` → 无则 `redirect('/auth/login')`
- 登录成功 → `redirect('/dashboard')`

**URL state 约定：**

- 所有可分享的过滤 / 排序 / 分页走 URL（用 `nuqs`）
- 任何抽屉开关 / 选中项也写 URL（`?drawer=obligation&id=xxx`）
- **不要**把分页 / 筛选塞进 Zustand

---

## 3. 状态管理分层（约束）

| 层           | 工具                                         | 管什么                                                             |
| ------------ | -------------------------------------------- | ------------------------------------------------------------------ |
| Server state | **TanStack Query + `@orpc/tanstack-query`**  | 所有 `rpc.*.query/mutation`；自动缓存 / 乐观 UI / invalidation     |
| URL state    | **nuqs** + `react-router` params             | 筛选 / 排序 / 分页 / 抽屉打开项                                    |
| Form state   | **react-hook-form** + Zod（复用契约 schema） | 所有表单                                                           |
| UI state     | **Zustand**                                  | Cmd-K 开关 / drawer 堆栈 / Evidence Mode 目标；**不超 3 个 store** |
| Feature flag | **PostHog JS SDK**                           | 运行时开关                                                         |

**禁止：** Redux、MobX、Recoil、自造 context 状态容器。

---

## 4. oRPC 客户端（约束）

`apps/web/src/lib/rpc.ts`（唯一形态）：

```ts
// 约束
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { AppContract } from '@duedatehq/contracts'

const link = new RPCLink({
  url: `${window.location.origin}/rpc`,
  fetch: (req, init) => fetch(req, { ...init, credentials: 'include' }), // 带 better-auth cookie
})

export const rpc = createORPCClient<AppContract>(link)
export const orpc = createTanstackQueryUtils(rpc)
```

业务代码只 import `rpc` 和 `orpc`；不允许任何地方出现 `fetch('/rpc/...')` 裸调用。

---

## 5. UI 系统（对齐设计文档）

### 5.1 shadcn Base UI 配置

`apps/web/components.json`（**约束**）：

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-vega",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 5.2 Tailwind 4 `@theme`（对齐 DESIGN.md）

`src/styles/globals.css` 的 token 必须**与 DESIGN.md §2 完全一致**：

```css
@import 'tailwindcss';
@import 'tw-animate-css';

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

| 层                        | 位置        | 职责                                                                                                                 |
| ------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `components/ui/*`         | shadcn 生成 | Button / Input / Dialog 等基础 primitives，不含业务                                                                  |
| `components/primitives/*` | 手写        | DueDateHQ 专有组件：TriageCard / DaysBadge / PenaltyPill / SourceBadge / AIHighlight / EvidenceChip / StatusDropdown |
| `components/patterns/*`   | 手写        | 跨 feature 复用：evidence-drawer / cmdk / confirm-dialog                                                             |
| `features/<slice>/*`      | 手写        | 特性内部：migration-wizard / pulse-banner / workboard-table                                                          |
| `routes/*`                | 手写        | 路由级 page 组件，拼装 feature                                                                                       |

**依赖方向**：`routes → features → patterns → primitives → ui → lib`。下层**不得**依赖上层。

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
- **Command Palette (Cmd-K)**：全局快捷键，三段（Search / Ask / Navigate），Ask 在 Phase 1 前留占位 `Coming soon`
- **Evidence Mode**：全局按 `E` 或点 source chip → 打开 `evidence-drawer`，Zustand 存 target

---

## 10. 无障碍

- WCAG 2.2 AA 基线
- 所有交互元素 `tabindex` 正确；Base UI 自带正确 focus management
- 颜色对比度 ≥ 4.5:1（DESIGN.md 的 token 已满足）
- 暗色模式真实切换（不只是 media query）
- `prefers-reduced-motion` → 关闭 Penalty Radar 数字滚动动画

---

## 11. i18n（Phase 2）

- 预埋：所有文案通过 `t('key')` 访问（`i18next` + `react-i18next`）
- MVP 只有 `en` locale
- 日期 / 金额用 `Intl.DateTimeFormat` / `Intl.NumberFormat`；不引 moment / dayjs

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

- 组件库（`components/ui` + `components/primitives`）走 Storybook
- Story 每个组件至少：default / hover / disabled / dark / error 5 个
- Visual regression 用 Chromatic（免费层够用）

Phase 0 不做 Storybook，优先跑 Demo。

---

继续阅读：[06-Security-Compliance.md](./06-Security-Compliance.md)
