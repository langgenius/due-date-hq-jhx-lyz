---
title: 'Design Tokens · Figma + DESIGN.md + UI Preset Closure'
date: 2026-04-25
author: 'Cursor'
---

# Design Tokens · Figma + DESIGN.md + UI Preset Closure

## 背景

Figma 文件 `Design Tokens — DueDateHQ`（`ssejugriUJkW9vbcBzmRgd` · 节点 `11:2`）在副标题里写着 _"Imported verbatim from /DESIGN.md"_，但实际上四方（`/DESIGN.md` YAML、`docs/Design/DueDateHQ-DESIGN.md` 长说明、`packages/ui/src/styles/preset.css` 运行时实现、Figma Token Spec Sheet）已经偏出 8 处：

1. **Buttons radius 三处自相矛盾**：`/DESIGN.md` YAML `components.button-{primary,secondary}.rounded` = `sm` (4px)、`docs/Design/DueDateHQ-DESIGN.md §2.5` / §4.8 都明确写 4px、但 `/DESIGN.md` prose `## Shapes` 段写的是 _"6px for default buttons"_，Figma §05 也跟着标了 r=md。
2. **Light tint 在 preset.css 用了 alpha 而非 hex**：`--accent-tint`、4 个 `--severity-*-tint` 在 `:root` 是 `rgba(..., 0.04~0.08)`，与 DESIGN.md / Figma 的实色 hex（`#F1F1FD / #FEF2F2 / #FFF7ED / #FEFCE8 / #F8FAFC`）不严格相等。
3. **`/DESIGN.md` YAML 没有 `shadows:` 段**：`docs/Design/DueDateHQ-DESIGN.md §2.5` 与 preset.css 都有 `--shadow-subtle / --shadow-overlay`，但 YAML 这层缺位，token 链路不闭环。
4. **Dark mode 没有 single source of truth**：`docs/Design/DueDateHQ-DESIGN.md §2.3` 与 preset.css `.dark` 都有完整 dark palette，但 YAML 与 Figma 都标着"1 mode (Light)"。
5. **Typography 5 档新 display 在 YAML 与 preset.css 缺位**：Figma 已经有 `Display / Hero` 60、`Display / Large` 40、`Section Title` 32、`Body / Medium` 13M、`Numeric / Small` 11M 共 10 个 text style，但 DESIGN.md `typography:` 只定义了核心 5 档，preset.css `--text-*` size scale 也没有 32 / 40 / 60。
6. **Risk row severity bar 宽度无 token 字段**：`09-design-system-deltas.md §5.1` 与 `DueDateHQ-DESIGN §4.1` 都明确 _"左侧 2px 高饱和 severity 色"_，但 YAML `risk-row-*` token 只有 background/text/height 三个字段；同时 Figma §05 标的是 _"left severity bar 3px"_，数字也不对。
7. **`brand/*` 别名命名冲突**：Figma 有 `brand/primary = #0A2540`，但 preset.css 的 `--primary = #5B5BD6`（被 shadcn 占用为 accent-default）。代码侧没有 `--brand-*` 别名，按 Figma 名字搜不到 token。
8. **Spacing 没暴露成 CSS 变量**：DESIGN.md 与 Figma 都有 9 档 spacing token，但 preset.css 完全依赖 Tailwind 默认 4px scale，没有 `--space-*` / `--spacing-*` 变量。

按项目 `09-design-system-deltas.md` 自己定义的权威链 _"DESIGN.md YAML = atom token 唯一权威源 → docs/Design/DueDateHQ-DESIGN.md = 使用说明 → preset.css = runtime → Figma = 视觉镜像"_，方向是修 DESIGN.md 让它内部自洽，然后反推 preset.css + Figma，而不是反过来。

## 做了什么

### `/DESIGN.md`（atom 权威源）

- **A1** prose `## Shapes` 段重写：4px buttons + 4px chips/evidence/badges / 6px inputs+cards+banners+dropdowns+toasts / 12px drawers+modals+command palette；并标注 button 4px 是 components.button-\* / DueDateHQ-DESIGN §2.5 §4.8 / Figma §05 三处的 canonical 值。
- **A2** 新增顶层 `shadows: subtle / overlay`；`components.toast.shadow` 改成 `'{shadows.subtle}'` 引用，闭环 token 链路。
- **A3** 新增 `colorsDark:` 段，35 个 key 镜像 `colors`（实色用 hex、半透明用 rgba）；`primary` 在 dark 下解析为 `rgba(255,255,255,0.95)` 与 `text-primary` dark 一致。
- **A4** 三档 risk-row token 全加 `severityBarWidth: 2px` + `severityBarColor: '{colors.severity-*}'`。
- **A5** typography 段补 5 档：`display-hero` 60 / `display-large` 40 / `section-title` 32 / `body-medium` 13M / `numeric-small` 11M。
- 新增 `### Token segment index` 7 段速查表（colors / colorsDark / typography / rounded / shadows / spacing / components）。

### `packages/ui/src/styles/preset.css`（runtime 镜像）

- **B1** Light 模式 `--accent / --sidebar-accent / --severity-{critical,high,medium,neutral}-tint` 全部从 `rgba(...)` 改回 DESIGN.md 实色 hex（`#f1f1fd / #fef2f2 / #fff7ed / #fefce8 / #f8fafc`）。Dark 继续走 alpha 不动。
- **B2** 新增 9 个 `--space-{0,1,2,3,4,5,6,8,12}` 变量。
- **B3** `:root` + `.dark` 都加 `--brand-{primary,secondary,tertiary,neutral}` 别名（指向 text-primary / text-secondary / accent-default / bg-canvas），并在 `@theme inline` 暴露 `--color-brand-*` 给 Tailwind。
- **B5** 字号阶梯补 `--text-section-title: 32px` / `--text-display-large: 40px` / `--text-display-hero: 60px`，与 `--text-hero: 56px` 共存。

### `docs/Design/DueDateHQ-DESIGN.md`（长说明）

- §2.3 Dark Mode 节首加权威指针 _"权威值在 /DESIGN.md `colorsDark:` YAML 段，禁止单点修改"_。
- §2.5 Radius/Shadow 用途列重写，按钮归 sm；节首加权威指针 _"唯一权威值在 /DESIGN.md `rounded:` / `shadows:` YAML 段"_。
- §3.2 typography 表格扩到 12 行，新增 3 档 display + 加铁律 _"display 类仅 marketing 使用，禁止进入 workbench"_。
- §4.1 Risk Row 新增 4 行表格（critical / high / upcoming / neutral）每行带 severity bar 描述与触发条件。

### Figma `Design Tokens — DueDateHQ`（fileKey `ssejugriUJkW9vbcBzmRgd`）

通过 `use_figma` Plugin API 写入：

| 改动                                                                                                                            | 落点                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **C5/A3 镜像** Color 集合 `addMode('Dark')` + 35 个变量 `setValueForMode`                                                       | collection `VariableCollectionId:11:3` 现有 2 modes：Light (`11:0`) + Dark (`31:0`) |
| **C3** 创建 effect styles `shadow/subtle` + `shadow/overlay`，参数对齐 DESIGN.md `shadows:`                                     | local effect styles count 0 → 2                                                     |
| **C3** 新建 `ShadowsSection`（节点 `40:2`）1440×351，挂 2 张 280×200 卡片 apply 对应 effect style                               | spec `12:2` 总高 5076 → 5925                                                        |
| **C4** §05 grid `16:8` 追加 4 张 cards：Sidebar / Genesis Odometer / Genesis Particle / Email Shell，全部用 Color 变量绑定 fill | grid 9 → 13 子节点；§05 段高 668 → 1086                                             |
| **C1** text `16:12` _"r=md"_ → _"r=sm"_                                                                                         | 与 DESIGN.md 闭环                                                                   |
| **C2** text `16:44` _"left severity bar 3px"_ → _"2px"_                                                                         | 与 deltas §5.1 + DueDateHQ §4.1 闭环                                                |
| **C6** text `12:174` BRAND header 加 alias 映射注释                                                                             | 消除"两套 primary 含义"歧义                                                         |
| 颜色段 header `12:17` _"1 mode (Light)"_ → _"2 modes (Light + Dark)"_                                                           | 反映 Dark mode                                                                      |
| §05 subtitle `16:7` 列出全部 13 个组件                                                                                          | 反映 4 个新增                                                                       |

## 为什么这样做

- **方向选择**：四方分歧时按 `09-design-system-deltas.md` 写明的权威链来定，DESIGN.md YAML 是源、Figma 是下游镜像，所以"修 DESIGN.md → 反推下游"是默认方向；只有 Figma 比 DESIGN.md 多出来的 5 档 display typography 是反向决策（Figma 是对的，DESIGN.md 与 preset.css 补齐）。
- **Light tint 改 hex 而非保留 alpha**：DESIGN.md 与 Figma 都标的是实色 hex，而 alpha 在叠到 surface-panel `#FAFAFA` 或 surface-subtle `#F4F4F5` 上时会偏色，破坏"single source of truth"的等价关系。Dark 模式继续用 alpha 是因为 dark 表面层级更复杂，alpha 反而是 DueDateHQ-DESIGN §2.3 明确写的实现方式。
- **Dark 入 YAML 用 `colorsDark:` 平行段而不是 `colors.{light,dark}` 嵌套**：嵌套结构会破坏现有所有 `{colors.X}` 引用（含 `09-design-system-deltas.md` 4 处、`02-ux-4step-wizard.md` 等），平行段是零破坏的最小改动。
- **`brand/*` 用 alias 而不是新引入颜色**：Figma 的 `brand/*` 与 DESIGN.md 顶层 `primary/secondary/tertiary/neutral` 在语义上就是 text-primary / text-secondary / accent-default / surface-canvas 的别名（值 1:1 一致），写成 alias 而不是新颜色避免 dark mode 维护两份。
- **Risk row severity bar 加字段而不是写在 prose**：YAML token 的契约是机器可读，dashboard / obligations / dry-run preview 三处 row 实现需要从 token 读 width 与 color，不能靠"读文档"。

## 验证

- `pnpm check` → `All 257 files are correctly formatted` + `Found no warnings, lint errors, or type errors in 127 files`
- Figma 抽样 `valuesByMode` 读取，5 个代表性变量两个 mode 全部对得上 DESIGN.md：
  - `text/primary` Light `#0A2540` / Dark `rgba(255,255,255,0.95)`
  - `surface/canvas` Light `#FFFFFF` / Dark `#0D0E11`
  - `accent/default` Light `#5B5BD6` / Dark `#7C7BF5`
  - `severity/critical-tint` Light `#FEF2F2` / Dark `rgba(239,68,68,0.12)`
  - `brand/primary` Light `#0A2540` / Dark `rgba(255,255,255,0.95)`（与 `text/primary` 一致，符合 alias 语义）
- Figma 抓 `get_screenshot` 验证 §05 + §06 视觉无 clip / overlap，13 个组件卡片 + 2 个 shadow 卡片渲染正确，sidebar mini-instance 的 accent 左 bar、genesis particle 6 颗主点 + 5 颗 ghost、email shell mock 全部到位。
- 5 个文本 label 编辑后用 `getNodeByIdAsync().characters` 复读确认。

## 后续 / 未闭环

- **Spacing CSS 变量已暴露但未替换 Tailwind 默认 scale**：消费者仍可用 `gap-3` (Tailwind 12px) 或 `gap-[var(--space-3)]`（明确 token 化）。如果要强制 token 化，需要在 preset.css `@theme inline` 加 `--spacing-*` 把 Tailwind 默认 scale 也覆盖；本轮没动，避免影响现有 routes。
- **`text-display-*` / `text-section-title` 还没有 `apps/marketing` 消费者**：这 3 档 size token 当前只是 reserved，等 marketing 应用接入再开始用。`docs/Design/DueDateHQ-DESIGN.md §3.2` 已标铁律"display 类禁止进入 workbench"，防止误用。
- **Figma 的 Spacing / Radius collection 仍是 1 mode (Default)**：值与设备无关，无需 dark 镜像；不动。
- **Figma 还没有 Code Connect 映射**：本轮只补 token / 视觉镜像，未把 Figma 组件 instance 与 `packages/ui/src/components/ui/*` 做 Code Connect 绑定。后续如果要做 Figma → Code 自动生成，需要单独一轮。
