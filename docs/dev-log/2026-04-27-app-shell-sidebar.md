---
title: '2026-04-27 · AppShell pattern + 自建 sidebar primitives（不走 shadcn 注册组件）'
date: 2026-04-27
---

# 2026-04-27 · AppShell pattern + 自建 sidebar primitives

> 当前状态：**设计 + 代码落地完成**。本次提交包含 `@duedatehq/ui` 自建 sidebar primitives + `useIsMobile` hook + `apps/app/src/components/patterns/app-shell.tsx` + `_layout.tsx` 重构。`vp check` / `vp test` / `lingui compile --strict` / `vp build` / `pnpm design:lint` 全部 0 errors。Figma 设计在 [App Page · App Shell — Layout](https://www.figma.com/design/ssejugriUJkW9vbcBzmRgd/due-date-hq-jhx-lyz?node-id=145-2)。
>
> **2026-04-27 follow-up：** Settings 父项的 collapsible 交互在落地后被简化为非交互 section header（无 hover bg、静态 chevron-down、子项常驻），相关代码（`ExpandableNavMenuItem` / `defaultSubItemHref` / `Collapse {0}` / `Expand {0}`）已删除。详见 `docs/dev-log/2026-04-27-sidebar-settings-flatten.md`。本文件 §5 关于 "Expandable parent 左对齐" 的条目仅作历史保留——`SidebarMenuButton` 的 `text-left` 默认在其他 trigger 上仍然生效，但 Settings 父项不再走 `<button>` 路径。
>
> **2026-04-29 follow-up，2026-05-04 refined：** Sidebar IA 从历史 `MAIN / MANAGE / ADMIN` 收敛为 `Operations / Clients / Practice`。`Import clients` 不再作为 footer 常驻 CTA；它是 activation/setup path，入口回到 `/clients`、Dashboard empty state 和 Command Palette。Rules 归入 Operations，承载规则引擎、来源变更和 Pulse badge；Team workload 归入 Practice，作为付费可见的团队容量 surface：Solo 显示 locked `Pro` hint，Pro/Firm 启用 route。详见 `docs/dev-log/2026-04-29-sidebar-ia-import-semantics.md` 和 `docs/dev-log/2026-04-29-team-workload-paid-surface.md`。
>
> **2026-05-02 follow-up：** Dashboard / Workboard nav badges were removed because their `12` / `34` values were hardcoded placeholders, not tenant-scoped counts. Sidebar badges should only appear when backed by a real source, as with the dynamic Alerts count.

## 背景

[`apps/app/src/routes/_layout.tsx`](../../apps/app/src/routes/_layout.tsx)（`RootLayout`）目前把侧栏 + 顶栏 + 用户菜单 + PendingBar + WizardProvider 全部内联：

- `<aside>` 是裸 `<div>` + 自己撸的 `<NavLink>` map，没有任何复用接口；未来要加第二个 protected layout（如 Owner-only Audit Console、Workload Console）只能复制粘贴
- 视觉规格只对了部分 DESIGN §4.9：宽度 220px ✓、行高 36px ✓，但 selected 态没做 spec 要求的 "2px 左 accent border + accent-tint 背景"，icon hover 颜色也不到位
- 与 [`DESIGN.md`](../../DESIGN.md) front-matter 的 `components.sidebar` token 没有任何机器可读绑定

[PRD v2.0](../PRD/) 多处明确**侧栏会持续承载导航入口**：§3.6.7 Workload View（Owner / Manager）、§13.2.1 Audit Log（Owner / Manager）、§5 侧栏底部常驻 `+ Import`、§3.2.6 多事务所切换。同时 [`DESIGN.md`](../../DESIGN.md) §5.4 + [`docs/Design/DueDateHQ-DESIGN.md`](../Design/DueDateHQ-DESIGN.md) §5.4 是硬规则「侧栏不折叠（Drawer 除外）」。

## 决策

### 1. 不用 shadcn `Sidebar` 注册组件，自建 thin primitives

最初准备直接拉 shadcn `base-vega` 的 `sidebar.tsx`（730 行）改造业务 token；做到 Pass A 之后做了一次"我们到底用了它什么"的盘点：

| shadcn 提供                                         | 我们用    | 理由                                                                                                                          |
| --------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `collapsible="offcanvas"` / `"icon"` / 三种折叠模式 | ❌        | DESIGN §5.4「侧栏不折叠」一刀切死                                                                                             |
| `SidebarRail`（拖拽折叠）                           | ❌        | 同上                                                                                                                          |
| Cookie 持久化 + `useSidebar` open state（desktop）  | ❌        | desktop 永远 expanded，无 open/close 概念可持久化                                                                             |
| `Cmd+B` 全局快捷键                                  | ❌        | 我们 ⌘K 是 Command Palette；⌘⇧O 是 firm switcher。Cmd+B 没业务对位                                                            |
| `floating` / `inset` variant                        | ❌        | DESIGN §6「borders before shadows」反对装饰深度                                                                               |
| `data-state="expanded"/"collapsed"` 派生属性        | ❌        | 没折叠态就没意义                                                                                                              |
| Mobile sheet 自动切换（< md）                       | ✅        | 但我们已经有 `@duedatehq/ui/components/ui/sheet`，自己包一行 `useIsMobile() ? <Sheet>...</Sheet> : <aside>...</aside>` 就完了 |
| 语义槽（Header / Content / Footer / Menu / Group）  | ✅ 但太薄 | 每个就是一个 `<div data-slot="x" className="...">`，shadcn 用 `useRender` + `mergeProps` 包裹有点 over-engineering            |
| `SidebarMenuButton` cva 变体 + `render` prop        | ✅        | 这个有价值，但自己写 cva + `data-active` 也只 30 行                                                                           |

**结论**：自建 ~200 行 vs 引入 730 行未用 API + 一整套 `bg-sidebar-foreground` token alias（最终也要 redirect 到我们业务 token）。**不值**。

### 2. 自建 primitives 清单

`packages/ui/src/components/ui/sidebar.tsx` 暴露 11 个组件 + 1 个 hook：

```
Sidebar                  - <aside> root, mobile 自动切换 Sheet
SidebarHeader / SidebarContent / SidebarFooter
                         - 三段式槽，纯 div + data-slot
SidebarGroup / SidebarGroupLabel / SidebarGroupContent
                         - 分组结构，label 自带 11/16 mono uppercase 8% letter-spacing
SidebarMenu              - <ul>
SidebarMenuItem          - <li>
SidebarMenuButton        - cva({ variant, isActive }) + data-active + render prop
SidebarMenuBadge         - mono 计数胶囊（Numeric/Small + tabular-nums）
SidebarTrigger           - mobile-only toggle (md:hidden)
SidebarProvider          - context, mobile sheet open state
useSidebar()             - context consumer
```

`packages/ui/src/hooks/use-mobile.ts` 的 `useIsMobile()`：直接复用 [`@base-ui/react/unstable-use-media-query`](https://base-ui.com)（`useMediaQuery('(max-width: 767px)', { defaultMatches: false })`），而不是手写 `matchMedia` 监听 + cleanup。`unstable-` 前缀只是 API 表面契约的标记，底层 `matchMedia` 实现稳定；不自己写 listener 模板代码就不会因为 `addEventListener('change', ...)` 漏 cleanup 而泄露监听。

### 3. AppShell pattern 在 app 侧

`apps/app/src/components/patterns/app-shell.tsx` 把以上 primitives 拼成产品形态：

```
<SidebarProvider>
  <Sidebar>
    <SidebarHeader>
      <FirmSwitcher firm={...} role="Owner" memberCount={7} />   ← 顶部, h=56
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>MAIN</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={...} render={<NavLink to="/" end />}>
              <DashboardIcon /> Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
          ...
        </SidebarMenu>
      </SidebarGroup>
      ...
    </SidebarContent>
    <SidebarFooter>
      <PlanStatusLink firm={...} />
      <UserMenuTrigger user={...} />        ← 头像右下挂 status-done 绿点
    </SidebarFooter>
  </Sidebar>
  <SidebarInset>
    <RouteHeader>                            ← h=56, 与 sidebar firm switcher hairline collinear
      <RouteTitle eyebrow={...} title={...} />
      <HeaderUtility>                        ← AppShell-owned: ⌘K hint + bell
        <CmdKHint />
        <NotificationsBell unreadCount={...} />
      </HeaderUtility>
    </RouteHeader>
    <main>{children /* <Outlet /> */}</main>
  </SidebarInset>
</SidebarProvider>
```

每条 protected layout 都用同一个 AppShell。EntryShell（`/login` / `/onboarding`）不挂。

### 4. 视觉决策（最终版）

| 项                                  | 旧 spec                                                                              | 新 spec                                                                                                                                                                                        | 理由                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Selected nav 态**                 | 2px 左 accent border + accent-tint bg + accent-text                                  | **bg-only**: `bg-accent-tint`（DESIGN 自家 wayfinding token，`#F1F1FD` light · 14 % indigo dark）+ `text-primary` + Inter Semi Bold；hover 保持中性 `bg-background-default-hover`（`#F9FAFB`） | 三轮迭代结果：原 spec 的 "2px border + tint + accent-text" 太响；中间过渡版本的 "纯中性 `bg-background-subtle`" 在 `#FAFAFA` panel 上只有 1-2% 亮度差实际不可见。`accent-tint` 单层 wash 是 calm + visible 的中点——既给 selected 一个清晰锚点，又把饱和 `accent-default` 留给 CTA / focus / 风险。`accent-tint` 这个 token 在 DESIGN front-matter 里本来就是给 selected 状态准备的（confidence-badge-high / stepper-current 同源）。 |
| **Brand mark fill**                 | accent/default (indigo `#5B5BD6`)                                                    | **brand/primary (navy `#0A2540`)** + white monogram                                                                                                                                            | 与 DESIGN.md `brand-mark-primary` token 对齐；shell 现在 0 个装饰 accent                                                                                                                                                                                                                                                                                                                                                             |
| **Cmd-K 入口**                      | sidebar 顶部一条独立 pill                                                            | **删除**，⌘K hint 移到右上角 header utility                                                                                                                                                    | 三段式 sidebar（身份 / 导航 / 行动+身份）不被第三元素打断                                                                                                                                                                                                                                                                                                                                                                            |
| **Migration history / import 入口** | sidebar MANAGE 群组                                                                  | 历史中曾改为 footer `+ Import clients`；**2026-04-29 后删除 footer 常驻 CTA**，入口回到 `/clients` 页面、Dashboard empty state 和 Command Palette                                              | Import 是 activation/setup path，不是日常导航或 footer utility                                                                                                                                                                                                                                                                                                                                                                       |
| **Clients 入口位置**                | MAIN 群组（P0 假象）                                                                 | 先挪到 ADMIN；**2026-04-29 后独立为 `Clients` group**                                                                                                                                          | Clients 是客户事实与导入落点，不是 Admin-only 审计工具                                                                                                                                                                                                                                                                                                                                                                               |
| **Status row**                      | 32h 独立行（dot + "All systems normal" + uptime）                                    | **折进 user 头像右下 6px 绿点**（包 surface-panel ring）                                                                                                                                       | 节省 33h 给 nav body；trust 信号没丢                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Header 右侧**                     | 路由 actions（"Pulse" / "Import clients" 按钮）                                      | **AppShell-owned utility**：`⌘K` kbd hint + 28×28 通知 bell ghost button                                                                                                                       | 全局通知是 shell 责任不是路由责任；header 右侧不再随路由切换变样                                                                                                                                                                                                                                                                                                                                                                     |
| **PendingBar**                      | 4px hairline + 静态 accent 段                                                        | **2px**, idle 几乎不可见                                                                                                                                                                       | idle 时不抢戏；导航中才呼吸 accent                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Body 占位**                       | 居中 `<Outlet />` 文字大块                                                           | **左上 mono ownership tag**「`• DASHBOARD ROUTE · route-owned content area`」opacity 0.45                                                                                                      | 不再有"未填空"既视感                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **横向 ribs 对齐**                  | sidebar hairline 用独立 1px rect (y=60-61)；header 用 inside-bottom-stroke (y=59-60) | **统一独立 1px rect 路线**，两条都在 y=58 collinear                                                                                                                                            | auto-layout `strokeAlign: 'INSIDE'` 与 sibling 1px Rectangle 天然差 1px，混用 = 错位                                                                                                                                                                                                                                                                                                                                                 |

### 5. 实现期补充修正（落地一周内的细节）

| 项                              | 修正                                                                                                                                              | 理由                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **代码侧 ribs 同样纪律**        | 两边都用 `<SidebarSeparator />` 兄弟节点（FirmSwitcher 后 + RouteHeader 后），不用 `border-b`                                                     | `border-b` + `box-sizing: border-box` 把线画在 56h 容器内（y=55-56），sibling div 画在容器外（y=56-57）。混用必错位。代码侧重新踩了 Figma 那次的同一个坑。                                                                                                                                              |
| **`⌘K` kbd 字体**               | `font-mono` (Geist Mono) → Inter `font-medium` + `\u2318\u202fK`（窄不换行空格）                                                                  | Geist Mono 没有匹配粗细的 ⌘ glyph，per-char 回退导致 ⌘ 与 K 大小不一致。Inter 两字符同字重渲染。                                                                                                                                                                                                        |
| **Import CTA 标签**             | `+ Import clients · Migration` 双段 → `+ Import clients` 单标签                                                                                   | 220 sidebar 减去 padding/icon/hint 后 label 区只有 ~88px，"Import clients" 13px Medium ≈ 95px 必换行。砍后缀 hint。                                                                                                                                                                                     |
| **FirmSwitcher 可点性**         | 静态 `<button>` 不出 popover → 真 `DropdownMenu`，单 firm 也展开「Workspaces / 当前 firm 行 / Add firm (P1)」                                     | 用户即使只有 1 个 firm 也要看到这个 gesture 是 firm picker 的入口；可发现性 > 极简                                                                                                                                                                                                                      |
| **AppShell 滚动行为**           | 整个文档滚动（sidebar 跟主区一起滚） → 外层 `h-svh` + `overflow-hidden`，仅 `<main>` `overflow-y-auto overscroll-contain`                         | sidebar 永远在视野中，footer 的 plan status / user row 不会被滚出去                                                                                                                                                                                                                                     |
| **KeyboardProvider 集成**       | 重构时漏掉 → 任何用 `useKeyboardShell` 的路由（workboard / 等）报错                                                                               | `_layout.tsx` 在 `MigrationWizardProvider` 内、`AppShell` 外加 `<KeyboardProvider>`。它读 wizard open 状态压制 hotkeys，所以必须 wizard provider 之内；shell 包它之内是为了 cmd-K / shortcut-help dialog 能 portal 到 shell 上方                                                                        |
| **DropdownMenu 结构纪律**       | FirmSwitcher 直接放 `DropdownMenuLabel` / `DropdownMenuItem` → 抛 `MenuGroupRootContext is missing`                                               | `DropdownMenuLabel` 是 `Menu.GroupLabel`，base-ui 强制 `Menu.Group` 内。**全局规则**：`DropdownMenuLabel` / `DropdownMenuItem` 都必须 wrap 在 `<DropdownMenuGroup>` 内（与 shadcn skill `Items always inside their Group` 一致）。                                                                      |
| **`⌘K` kbd 二次校对**           | 我之前为绕开 ⌘ glyph 顾虑切到 Inter；Figma 159:2 实际 spec 是 `Numeric / Small`（Geist Mono Medium 11/16）+ `surface/subtle` 填充 + **无 border** | 切回 Geist Mono：`font-mono text-xs tabular-nums`；bg 改 `bg-background-subtle`（`#F8FAFC`，与 Figma `surface/subtle` `#F4F4F5` 同语义）；删 `border border-divider-regular`。Geist Mono 实际有 `U+2318` glyph，前一次的 size mismatch 是 `tabular-nums` + 字色组合的视觉假象，不是字体问题             |
| **`Migration` route hint 还原** | 我在 import CTA squeeze 那一轮把 `Migration` 后缀干掉了，但 Figma 158:3 明确要求保留                                                              | 重做几何对齐 Figma：`gap-2.5→gap-2`、`size-4→size-3.5`（Figma 14px icon），label + `Migration` 在 220px 内不换行；`Migration` 用 `font-mono text-xs tabular-nums text-text-muted`                                                                                                                       |
| **Selected nav 视觉收敛**       | "纯中性 `bg-background-subtle`" 在 `#FAFAFA` panel 上视觉差不到 1-2%，几乎不可见                                                                  | 切到 **`bg-accent-tint`**（DESIGN.md 自家 wayfinding token，`#F1F1FD` light · 14% indigo dark）+ `text-primary` + Inter Semi Bold；**仍无 2px border、无 `accent-text` label** —— 颜色只为 wayfinding 服务，不为装饰；`SidebarMenuBadge` 同时简化成永远白底 + 1px hairline，不再针对 active 态 override |
| **`cursor-pointer` 漏配**       | Tailwind v4 preflight 不再默认给 `<button>` 加 `cursor: pointer`                                                                                  | 所有 shell-side `<button>`（FirmSwitcher trigger / UserMenuTrigger / NotificationsBell / SidebarTrigger / `SidebarMenuButton` cva）都显式加 `cursor-pointer`；与 `packages/ui/src/components/ui/button.tsx` 现行做法对齐                                                                                |
| **Expandable parent 左对齐**    | `Settings` 父项用 `<button>` 渲染，浏览器默认 `text-align: center` 会让 `flex-1` label 居中                                                       | `SidebarMenuButton` primitive 默认加 `text-left`。Figma `214:27` / `214:29` 中 parent row 204px 宽、图标 left 12px、文本 left 36px，所有菜单行都应左对齐                                                                                                                                                |

### 6. Firm switcher 位置（PRD §3.2.6 偏离）

PRD §3.2.6 原写「**右上角 Firm 切换 dropdown** + `⌘⇧O`」（Slack workspace picker 风格）。本设计把可见 trigger 移到 sidebar 顶部（Linear / Notion / Vercel 流派），右上角空间留给 AppShell-owned utility（通知 bell + `⌘K` hint）。

`⌘⇧O` 全局快捷键**保留不变**，依然唤起 firm picker popover；只是 popover 现在锚定在 sidebar 顶部 trigger 上而非右上角。

PRD §3.2.6 的同步更新留到下一个 PRD revise 窗口；本次仅在 [`docs/Design/DueDateHQ-DESIGN.md`](../Design/DueDateHQ-DESIGN.md) §4.9 + 本 dev-log 记录偏离。

## vercel-react-best-practices 红线（实现时一定踩稳）

| 规则                               | 落地点                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rerender-no-inline-components`    | 所有 sidebar primitive 都是模块级组件；**严禁**在 `AppShell` render 里 inline 定义子组件                                                          |
| `rerender-derived-state-no-effect` | active nav state **完全派生自 URL**（react-router `<NavLink>` 内部派生），不存 React state、不开 effect 同步                                      |
| `rerender-functional-setstate`     | mobile sheet open 状态用 `setOpen(o => !o)`，`toggleSidebar` 才能 `useCallback([setOpen])` 稳定引用                                               |
| `rerender-memo-with-default-value` | `navItems` 在 `useNavItems` 里 `useMemo`（依赖 `t` lingui locale），不在 render 内 inline 数组                                                    |
| `rerender-dependencies`            | `useEffect` 依赖只用 primitive（`isMobile` 布尔安全）；non-stable function 不入依赖数组                                                           |
| `bundle-analyzable-paths`          | `@duedatehq/ui/components/ui/sidebar` 直接 named export；app 端 `import { Sidebar, ... } from '@duedatehq/ui/components/ui/sidebar'`，不走 barrel |
| `client-event-listeners`           | `useIsMobile` `matchMedia` 监听在 cleanup 里 `removeEventListener`                                                                                |
| `advanced-init-once`               | `SidebarProvider` context value `useMemo`，`toggleSidebar` `useCallback`；避免每次 render 推新引用                                                |

## Figma 验证

[App Page](https://www.figma.com/design/ssejugriUJkW9vbcBzmRgd/due-date-hq-jhx-lyz?node-id=112-2) 上新增的 `App Shell — Layout (sidebar + content)` frame（id `145:2`）是本次定稿。Pass A → B → C 共 3 轮迭代记录在与本文件同 PR 的对话里。frame 完全用文件已有的 `Color (Light/Dark)` 35 个语义变量、`Spacing` 9 档、`Radius` 3 档、10 个 text style + 2 个 effect style 拼出，**没有引入任何新 token / style / component**——后续 design lint 与 dev tree 不会出现孤立 token。

## 落地状态

| 文件                                                 | 状态                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `packages/ui/src/hooks/use-mobile.ts`                | ✅ 落地 — Base UI `useMediaQuery` 包装                                                |
| `packages/ui/src/components/ui/sidebar.tsx`          | ✅ 11 primitive + `SidebarProvider` + `useSidebar` + 导出 `sidebarMenuButtonVariants` |
| `packages/ui/package.json` exports                   | ✅ 加 `./hooks/*` glob                                                                |
| `apps/app/src/components/patterns/app-shell.tsx`     | ✅ compose primitives + react-router `<NavLink>` 注入 + i18n nav items                |
| `apps/app/src/routes/_layout.tsx`                    | ✅ 重构为 ~150 行（之前 547 行），`<AppShell>` 拼装                                   |
| `pnpm design:lint`                                   | ✅ 0 errors / 0 warnings                                                              |
| `vp check`                                           | ✅ 0 errors（1 pre-existing warning in `placement.ts`）                               |
| `vp run -r test`                                     | ✅ 110 tests passed                                                                   |
| `pnpm --filter @duedatehq/app i18n:compile --strict` | ✅                                                                                    |
| `vp run @duedatehq/app#build`                        | ✅                                                                                    |

## 仍 deferred（下一个 PR）

1. **firm switcher popover** — 当前 `<button>` trigger 是静态视觉占位，`⌘⇧O` 快捷键、popover 内容（authClient.organization.list() + setActive）尚未接通。本次只做 layout 形态；功能落地走 P1。
2. **per-route eyebrow / title** — 目前 RootLayout 把 generic `Phase 0 demo practice` / `Compliance risk operations` 传给 AppShell；后续每个路由（dashboard / workboard / settings）应该自己出 eyebrow + title，AppShell 改为只渲染 utility 右侧。
3. **NotificationsBell unread count** — 当前 `unreadNotificationCount` prop 默认 0，`hasUnread` 视觉路径没数据源；接到 inbox 查询后再开启。
4. **firm 真实数据** — `useFirmSummary` 用 `user.name` 拼凑了 monogram + meta；接 `authClient.organization.getFullOrganization()` 后 RootLayout 直接喂真值。
5. **PRD §3.2.6 同步更新** — firm switcher 从「右上 dropdown」改到 sidebar 顶部的偏离暂时只在本 dev-log + DESIGN doc 里记录；下个 PRD revise 窗口同步原文。

## 引用

- PRD v2.0 §1.3 / §3.2 / §3.2.6 / §3.6.7 / §5 / §10 / §13.2.1 / §1213
- [`DESIGN.md`](../../DESIGN.md) `## Components` + `components.sidebar` / `brand-mark-primary` token
- [`docs/Design/DueDateHQ-DESIGN.md`](../Design/DueDateHQ-DESIGN.md) §4.9 / §5.4
- [`docs/dev-log/2026-04-26-entry-shell-extraction.md`](./2026-04-26-entry-shell-extraction.md)
- Vercel React best practices · `rerender-*` / `bundle-*` / `client-*` / `advanced-*`
- Figma frame · `145:2` on App Page
