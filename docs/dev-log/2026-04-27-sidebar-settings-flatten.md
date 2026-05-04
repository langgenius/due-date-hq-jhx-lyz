---
title: '2026-04-27 · 侧栏 Settings 折叠态拆除：非交互 section header + 子项常驻'
date: 2026-04-27
---

# 2026-04-27 · 侧栏 Settings 折叠态拆除

> 当前状态：**代码 + 文档落地完成**。`apps/app/src/components/patterns/app-shell.tsx` 删除 `ExpandableNavMenuItem`、`apps/app/src/routes/settings.tsx` 删除（已孤立）、`apps/app/src/routes/_layout.tsx` 清理无效分支。`vp check` / `vp test` / `lingui compile --strict` / `pnpm design:lint` 全部 0 errors。
>
> **2026-04-29 follow-up：** Settings 容器本身已被拆散到新的 sidebar IA：`Operations / Clients / Organization`。`Profile` 下沉到 user menu，`Rules / Members / Billing / Audit log` 属于 `Organization`。本文以下内容保留为当时移除 collapsible Settings 父项的历史记录。

## 背景

`docs/dev-log/2026-04-27-app-shell-sidebar.md` + `docs/dev-log/2026-04-27-rules-console-shell.md` 落地的侧栏把 `Settings` 实现成可展开 / 折叠的 parent，子项是 `Rules / Members / Profile`。展开行为有完整的三态点击逻辑：

1. 折叠态 + 不在 sub-route → 跳到 `defaultSubItemHref` 并展开
2. 折叠态 + 已在 sub-route → 仅展开
3. 展开态 → 仅折叠

加 `useEffect` 在 `isSectionActive` 变 true 时强制 `setOpen(true)`，让 deep-link / 程序化导航能自动展开。

视觉上 parent row 用 `SidebarMenuButton`：hover 出 neutral bg，右端 `ChevronRightIcon` rotate-90 切换展开态，加 `aria-expanded` + `Collapse {label}` / `Expand {label}` i18n label。

`/settings` 这个 path 有两条对应资产：

- `apps/app/src/router.tsx:62-64` 的 `settingsLoader` 把 `/settings` 重定向到 `/settings/rules`
- `apps/app/src/routes/settings.tsx` 的 `SettingsRoute`（Practice profile / Notification routing demo），但**已经没有 importer**（router 改为 loader 重定向后忘记删掉）

## 用户反馈与决策

`/settings/rules` 页面 feedback 指出两个交互问题：

1. **`Settings` 父项 toggle 在侧栏里是孤本**：`Main` / `Manage` / `Admin` 三个 group 里其他所有 nav item 都是单层 NavLink，只有 Settings 是「点击行 = 展开 / 折叠 / 跳转」的三态混合按钮——用户无法从外观预测点击结果。
2. **三态在真实路径里基本退化成两态**：`useEffect` 强制 active 态 → 展开，能折叠的窗口只有"我在 `/settings/rules` 上、不想看 Members/Profile 占位行"。这是窄到没意义的优化点，但代价是一整套 collapsible 复杂度。

考虑过三条路线：

| 路线                                                            | 收益                                                           | 代价                                                                                                                  | 决定 |
| --------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---- |
| A. 永远展开 + 砍 toggle                                         | 修掉孤本交互；保留 `Settings` IA 容器；不动 Figma / 不动子页面 | parent + 缩进子项的两层结构仍存在                                                                                     | ✅   |
| B. 平铺 `Rules / Members / Profile` 到 `Manage` group           | 完全单层；侧栏视觉一致                                         | `Manage` group 配置类内容会膨胀（PRD §13 / §1213 还会加 Migration history / Billing / Integrations）；Settings 语义丢 | ❌   |
| C. 单条 `Settings` 入口 + `/settings/*` 页内 sub-nav（左 rail） | Linear / Notion / Vercel 主流范式；最干净                      | 已有 4 张 settings sub-route Figma 各自独立成 page，全要重做                                                          | ❌   |

走 A，按用户细化要求把 parent 进一步收成「**非交互 section header**」：

- **无 hover bg**（用户明确要求；同时也消除"hover 给反馈、click 没结果"的歧义）
- **右端保留一个静态 chevron-down**（用户明确要求；作为"下方行属于此 section"的视觉 cue，不再是按钮、不再 rotate）
- **不可点击 / 不可聚焦**（`<div>` 而非 `<button>`，不进 tab 顺序）
- **子项 `Rules / Members / Profile` 始终渲染在下方**

`/settings` URL 仍由 `settingsLoader` 重定向到 `/settings/rules`，所以书签 / 直链不丢；但 sidebar 里没有点 `Settings` 这一动作。

## 做了什么

### 1. `apps/app/src/components/patterns/app-shell.tsx`

- 删除 `ExpandableNavMenuItem`（~64 行：`useState/useEffect/useCallback` + 三态 click + `aria-expanded` + chevron 旋转 + `Collapse/Expand` i18n label）
- 新增 `SectionGroupNavItem`：`<div>` 形 section header（icon + label + 静态 `ChevronDownIcon`），无 hover / focus / active 状态；下方紧跟 `subItems.map(SidebarSubMenuItem)`
- `NavItem` type 删 `defaultSubItemHref` 字段
- `NavSubItem` type 加 `tag?: string` 字段，让 sub-item 也能渲染 `P1` mono 标签
- `SidebarSubMenuItem` 渲染：
  - 有 `href` 路径走 `<NavLink>`，保留 `pl-[18px]` 缩进 + `accent-tint` 选中态
  - 无 `href` 走 `aria-disabled="true"` + `opacity-55` + 中性灰，与 Admin group 的 disabled 视觉一致
  - 任一形态都把 `tag`（如 `P1`）右对齐渲染
- `useNavItems()` 中 Settings 子项把 `Members` / `Profile` 标 `tag: 'P1'`，与 `Admin · P1` 群组的 disabled 表示同语义——避免它们看起来像坏掉的链接
- 清理 imports：去掉 `useEffect` / `useState` / `useLocation` / `ChevronRightIcon`，新增 `ChevronDownIcon`

### 2. `apps/app/src/routes/settings.tsx` 删除

`SettingsRoute`（Practice profile / Notification routing demo card）自从 `router.tsx` 改为 `settingsLoader` 重定向后已是孤儿——文件存在但无任何 importer。借这次清理一起删掉，避免误以为 `/settings` 还有真实 demo 页可以渲染。

### 3. `apps/app/src/routes/_layout.tsx`

`getRouteSummaryMessages` 里删除 `pathname === '/settings'` 的死分支（永远不可达，因为 loader 已重定向）。同时省掉 `Firm settings` 这条 i18n message，下次 `i18n:extract` 会清理 `zh-CN` / `en` catalog。

### 4. 文档同步

| 文件                                                           | 改动                                                                                                                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/Design/DueDateHQ-DESIGN.md` §4.9 三段式结构表            | `MANAGE` 行内容明确为「`Settings` 非交互 section header（icon + label + 静态 chevron-down，无 hover bg、不可点击）」+ 子项视觉规格                                |
| `docs/dev-log/2026-04-27-app-shell-sidebar.md` 顶部            | 加 follow-up callout，指向本 dev-log，并标记 §5「Expandable parent 左对齐」条目历史化                                                                             |
| `docs/dev-log/2026-04-27-rules-console-shell.md` Sidebar IA    | 在 Sidebar IA Decision 段落顶加 follow-up update：三态 click 已被简化为非交互 section header，但 "Settings 作为容器" 的 IA 决策仍生效；i18n catalogs 段同步备注。 |
| `docs/product-design/rules/02-rules-console-product-design.md` | 变更记录加 v0.3 行                                                                                                                                                |
| `docs/product-design/rules/README.md`                          | 变更记录加 v1.1 行                                                                                                                                                |

历史 dev-log（如 `2026-04-24-first-login-practice-onboarding.md`、`2026-04-24-auth-tenant-review-followups.md`）里提到 `apps/app/src/routes/settings.tsx` 的 Practice profile / Firm settings 文案，是当时的真实状态记录，**不改**——历史 log 保留为时间快照。

PRD / 产品设计 docs 里以 `/settings/migration`、`/settings/imports`、`/settings/setup-history`、`/settings/notifications`、`/settings/priority` 等形式出现的 P1 sub-route，与本次决策正交（这些都是未来 sub-route 而非 settings root），不动。

## 为什么这样做

### parent 为什么变非交互而不是仍然可点击

候选 (a)：parent 仍然是 `<NavLink to="/settings" end>`，hover 出 bg，click 跳 `/settings/rules`（通过 loader 重定向）。

候选 (b)：parent 是 `<div>`，无 hover / 无 click。

选 (b) 因为：

- 用户明确说"hover settings 这个地方就没有 bg"——若保留 NavLink 但抑制 hover bg，会造成"看起来不可点但其实可点"的反向歧义，比"完全不可点"更难解释。
- `Settings` 在 IA 里不是一个独立 destination——它是 `Rules / Members / Profile` 的容器名，没有"自己的内容"。原 `apps/app/src/routes/settings.tsx` 的 demo 内容（Practice profile / Notification routing）从一开始就是占位，已经不挂了。这意味着 click `Settings` 没有有意义的目的地，和"不可点"是一致的语义。
- 主侧栏所有可点击行（NavLink）都遵循"hover 出 bg + click 跳转 + active 时 `accent-tint`"三套响应。一个例外行（hover 不出 bg、click 跳到子项的默认值、active 不点亮）会比当前更难理解。

### 静态 chevron-down 的存在意义

如果完全砍掉 chevron，parent 会在视觉上更像一个普通行——和下方缩进子项的层级差仅靠 `ml-5` + `pl-[18px]` 表达，对快速扫视的用户不够强。`ChevronDownIcon` 在主流 IDE / 文件树（VS Code Explorer、Notion sidebar、IntelliJ Project tool window）里是稳定的"下面这些是我的子项"信号，即便它不再是按钮——这是一个被广泛默认接受的视觉俗成。

替代方案（虚线、缩进底线、左侧 vertical rail）我们都没引入，因为它们都需要新 design token / 新组件，违反"零新 token / 零新组件"原则（dev-log §6 引文段已经在 Figma 验证里立过的纪律）。

### 为什么 `Members` / `Profile` 加 `P1` mono tag

它们本来就没有 `href`，`SidebarSubMenuItem` 的 fallback 渲染只是中性灰行——视觉上和"坏掉的链接"无法区分。`Admin · P1` 群组的处理已经验证过这种 disabled 的好做法：行末 mono `P1` 标签 + 行级 / 群组级 opacity 0.55 = 用户秒读"这是排期里的，不是 bug"。

把同套 disabled 视觉用到 settings 子项一致，履约 `2026-04-27-app-shell-sidebar.md` §4 row 5 的 "Clients 入口位置：不假装已交付" 同纪律。

## 验证

- `vp run -r check` — 0 errors / 0 warnings（在 1 pre-existing warning in `placement.ts` 之外）
- `pnpm --filter @duedatehq/app i18n:extract` — `Collapse {0}` / `Expand {0}` / `Firm settings` 三条消息从 `apps/app/src/i18n/locales/{en,zh-CN}/messages.po` 中清除
- `pnpm --filter @duedatehq/app i18n:compile --strict` — 0 missing
- `vp run -r test` — 全部通过
- `pnpm design:lint` — 0 errors / 0 warnings
- `vp run @duedatehq/app#build` — pass
- 手测（`pnpm dev`）：
  - `/` / `/obligations` 行为不变
  - `/settings/rules` parent 行无 hover bg；chevron 静态向下；当时 Members 为灰显 `P1` 标，后续已在 2026-04-29 落地为 `/settings/members` 可访问子项
  - 直接访问 `/settings` → loader redirect → 落到 `/settings/rules`
  - mobile（`<md`）drawer 内同款渲染：parent 不可点、子项可点

## 后续 / 未闭环

1. 后续新的 settings sub-route 真正落地时（未来的 Migration history / Integrations 等），把对应 `subItems` 项从 `tag: 'P1'` + 无 href 改为带 `href`。Members 已在 2026-04-29 按这一路径切换为真实 `/settings/members` 子项。
2. 如果后续要恢复"点击 `Settings` 跳到默认 sub-route"的便利（用户调研里反映需要），最简单的回退是把 `SectionGroupNavItem` 的 `<div>` 换成 `<NavLink to="/settings" end={false}>` + 保留无 hover bg 的 className（覆盖 `hover:bg-` 为透明）。但这个反向迁移除非有数据支撑，否则不要做——它会让 parent 既不是普通 NavLink 也不是普通 header，回到本 log 改之前的位置。
3. PRD §3.2.6 的偏离记录（firm switcher 位置）依然 deferred，与本次决策无关——下一个 PRD revise 窗口一并同步。

## 引用

- `apps/app/src/components/patterns/app-shell.tsx`（`SectionGroupNavItem` / `SidebarSubMenuItem`）
- `apps/app/src/router.tsx:62-64` `settingsLoader`
- `docs/dev-log/2026-04-27-app-shell-sidebar.md`（前序 dev-log）
- `docs/dev-log/2026-04-27-rules-console-shell.md` Sidebar IA Decision（前序决策）
- `docs/Design/DueDateHQ-DESIGN.md` §4.9 三段式结构
- `DESIGN.md` `## Components` `components.sidebar` token
- Vercel React best practices · `rerender-derived-state-no-effect`（删 `useEffect` 同步 open 态正是这条规则的直接案例）
