# 0014 · Dify token tree 收敛为运行时 SSoT

## 状态（Status）

accepted · 2026-04-27

## 背景（Context）

设计 token 链路当前有**两套并行命名**，源自两次未闭环的迁移：

1. **Atom YAML 路径**（早期 SSoT，2026-04-23 ~ 04-25 闭环）
   - `/DESIGN.md`（YAML front-matter） → `colors / typography / rounded / shadows / spacing / components` 段
   - `docs/Design/DueDateHQ-DESIGN.md`（长说明）§2 ~ §8 + §14 Migration 增量
   - `packages/ui/src/styles/preset.css`（运行时镜像）
   - Figma `Design Tokens — DueDateHQ`（视觉镜像）
   - 权威链由 `docs/dev-log/2026-04-25-design-tokens-figma-closure.md` 锁定为 _"DESIGN.md YAML = atom 唯一权威源 → DueDateHQ-DESIGN.md = 使用说明 → preset.css = runtime → Figma = 视觉镜像"_。

2. **Dify token tree 路径**（后续 UI 组件包重构，2026-04-26 至今）
   - `packages/ui/src/styles/tokens/{primitives,semantic-light,semantic-dark}.css`
   - `packages/ui/AGENTS.md` § _Page Typography & Spacing_ + § _Border Radius: Figma Token → Tailwind Class_ 钦定 page-level recipe
   - 命名空间：`text-text-*` / `bg-background-*` / `border-divider-*` / `bg-state-*` / `bg-components-*`，全部由 `@theme inline` 暴露成 Tailwind utility
   - 实际生效面：`apps/app` 全部 dashboard / workboard / migration / settings 路由、`@duedatehq/ui` 全部 shadcn 组件均已挂在这套 token 上

两条链对**同一物理像素**给出了不同的契约值，已经在 review 与 design-to-code 工作流里产生具体误导：

| 维度           | Atom YAML / DESIGN.md                   | Dify token tree (实际运行时)                                                                | 实例                                          |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Card 圆角      | `{rounded.md}` = 6px                    | `rounded-xl` = 12px                                                                         | `packages/ui/src/components/ui/card`          |
| 正文默认字号   | `text-base` 13px                        | `text-md` 14px                                                                              | dashboard `<p>` / wizard step body            |
| Stepper 当前态 | `{colors.accent-tint}` = `#eff4ff` 实色 | `bg-state-accent-hover-alt` (`#d1e0ff`) + `border-state-accent-active` + `text-text-accent` | `apps/app/src/features/migration/Stepper.tsx` |
| 选中态背景     | `accent-tint` 单一 token                | `state-accent-{hover,hover-alt,active}` 三段 + `state-base-*` 中性回退                      | dropdown / select / table row hover           |
| 颜色 utility   | `bg-bg-canvas` / `text-primary`         | `bg-background-body` / `text-text-primary`                                                  | `_layout.tsx` · migration features            |

`docs/dev-log/2026-04-26-entry-surface-design-alignment.md` 已显式把"DESIGN.md 命名 vs Dify 命名整体迁移"挂回 backlog，并写明 _"任何一刀切都需要先在 ADR 里写决策"_。本 ADR 即为那条决策。

不裁定的代价：

- Reviewer 拿 DESIGN.md 卡数值与代码对不上（card 6px vs 12px、body 13px vs 14px），每次 review 都得当场口头释义
- AI coding agents（Cursor / v0）按 DESIGN.md 生成代码会与项目实际跑出来的视觉漂移
- Figma `Design Tokens — DueDateHQ` 副标题写着 _"Imported verbatim from /DESIGN.md"_，但 swatch 没有 Dify 命名集合，design-to-code 链路断
- 任何后续 token 改动会持续两边跑（preset.css 加了，YAML 不闭环；或反向）

## 决策（Decision）

### D1 · 关系裁定：替换 (replace)，不叠加 (overlay)

**Dify token tree 是运行时与 page-level recipe 的唯一权威源**。Atom YAML / DueDateHQ-DESIGN.md 不再承担运行时契约，仅保留两个角色：(a) 历史快照与设计语言叙事；(b) Figma 视觉镜像参考。

不是 _共存_ — 共存意味着任一处改动需要双写双 review，已被证明留不住。
不是 _叠加_ — 叠加意味着 Dify 是 DESIGN.md 的扩展层，而事实是 page-level recipe（card r=12px、body 14px）已经直接颠覆了 DESIGN.md 的核心数值，不是新增。
是 _替换_ — 凡 DESIGN.md 与 Dify token tree 的数值/语义有分歧，**以 Dify token tree + `packages/ui/AGENTS.md` 为准**；DESIGN.md 对应章节标注 "已被 ADR-0014 取代" 或将数值改齐 Dify 取向。

### D2 · SSoT 分层指定

| 层级                              | 文件 / 路径                                                                                                                                             | 角色                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Atom token**                    | `packages/ui/src/styles/tokens/primitives.css` · `packages/ui/src/styles/tokens/semantic-light.css` · `packages/ui/src/styles/tokens/semantic-dark.css` | **Runtime SSoT**。颜色 / 字号 / 圆角 / 阴影 / 间距 任一改动从这三处出，`preset.css` 仅做 `@theme inline` 暴露               |
| **Page-level composition recipe** | `packages/ui/AGENTS.md` § _Page Typography & Spacing_ + § _Border Radius: Figma Token → Tailwind Class_                                                 | **Recipe SSoT**。Card padding / body 字号 / radius 层级 / page header 结构 由它定义                                         |
| **设计语言叙事**                  | `docs/Design/DueDateHQ-DESIGN.md`                                                                                                                       | 只读历史 + 视觉哲学（§0 Mood / §1 Atmosphere / §6 Depth / §7 Severity / §8 Evidence / §9 Do/Don't），与 atom token 数值脱钩 |
| **Atom YAML（历史快照）**         | `/DESIGN.md`                                                                                                                                            | 不再是 SSoT。保留为 Figma 镜像参照与 marketing AI prompt 输入；新增/修改时以 ADR-0014 D2 为准回退到 Dify token tree         |
| **Figma 视觉镜像**                | `Design Tokens — DueDateHQ` (fileKey `ssejugriUJkW9vbcBzmRgd`) · `App Page` canvas                                                                      | 视觉参照与 design-to-code 输入；token swatch 必须**同时**承载 Dify 命名集合（见 D4）                                        |

### D3 · 命名等价表（legacy → Dify）

仅列**不可双向通用**或**已经在代码里用 Dify 名**的关键映射；其它 legacy 别名继续在 `semantic-light.css` 末尾保留以避免一次性大改。

| 业务语义                          | Legacy（DESIGN.md / preset.css）      | Dify token tree（新 SSoT）                                                                            |
| --------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 主文字                            | `text-primary` / `--text-primary`     | `text-text-primary`                                                                                   |
| 次级文字                          | `text-secondary` / `--text-secondary` | `text-text-secondary`                                                                                 |
| 三级 metadata                     | `text-muted`                          | `text-text-tertiary`（深一档）/ `text-text-quaternary`（更弱）                                        |
| 画布底色                          | `bg-bg-canvas`                        | `bg-background-body`                                                                                  |
| 浮层 / Card 底                    | `bg-bg-elevated`                      | `bg-components-panel-bg`                                                                              |
| 主分隔线（1px hairline）          | `border-default` / `border-border`    | `border-divider-regular`                                                                              |
| 极弱分隔线                        | `border-subtle`                       | `border-divider-subtle`                                                                               |
| 选中态背景（Stepper / nav / row） | `bg-accent-tint`                      | `bg-state-accent-hover-alt`（背景）+ `border-state-accent-active`（边框）+ `text-text-accent`（文字） |
| Hover 态（中性 row）              | `rgba(0,0,0,0.02)` 写死               | `bg-state-base-hover` / `bg-state-base-hover-alt`                                                     |
| Card 圆角                         | `{rounded.md}` 6px                    | `rounded-xl` 12px（`Card` 默认；图见 `packages/ui/AGENTS.md` _Border radius hierarchy_）              |
| Page 默认正文                     | `text-base` 13px                      | `text-md` 14px                                                                                        |
| 表格 / 行内紧凑正文               | `text-base` 13px                      | `text-base` 13px（保留，但语义改为 _compact body_）                                                   |
| Severity hover row                | `bg-severity-*-tint`                  | `bg-severity-*-tint`（保留 legacy 别名 → 同色）                                                       |

凡 legacy 名仍在 `semantic-light.css` 与 `semantic-dark.css` 末尾，作为**只读兼容层**：禁止再新增 legacy 名，已存在的允许继续被引用，但应在自然 touch 时迁到 Dify 命名。

### D4 · Figma 视觉镜像同步

Figma `Design Tokens — DueDateHQ` (`ssejugriUJkW9vbcBzmRgd`) 与 Figma `App Page` canvas 必须执行：

- **Token 文件**：副标题改为 _"Mirrors `packages/ui/src/styles/tokens/*.css` (Dify token tree). Atom YAML legacy aliases shown for reference only."_；颜色 / spacing / components 三段 swatch 追加 Dify 命名集合（`text/*`、`background/*`、`divider/*`、`state/*`、`components/*`）；保留 legacy 别名 swatch 但加灰底标 _"legacy alias"_。
- **App Page canvas**：补 Migration Wizard 4 帧（Step 1 Intake / Step 2 Mapping / Step 3 Normalize / Step 4 Dry-Run）+ Dashboard 主帧 + Obligations 主帧，全部用 Dify token 变量绑定 fill / stroke / typography。
- 落地工单见 _Follow-ups_ F1 / F2。

### D5 · 文档收口

- `docs/Design/DueDateHQ-DESIGN.md` §2.5（Radius/Shadow）/ §3.2（Typography）/ §14（Migration Wizard）三段头加 banner _"已被 ADR-0014 取代 — 数值以 packages/ui/AGENTS.md 与 packages/ui/src/styles/tokens/\*.css 为准"_。
- 涉及 Migration Wizard 的组件文件头（`Stepper.tsx` · `WizardShell.tsx`）注释里 _"DESIGN.md `stepper-*` tokens"_ 这类 reference 改为指向 `packages/ui/AGENTS.md` + ADR-0014。
- `/DESIGN.md` 顶部 front-matter 加 `supersededBy: docs/adr/0014-dify-token-tree-adoption.md`，提示 reviewer 与 AI agents 走新链路。

## 后果（Consequences）

### Good

- Token 链路单源：runtime + page recipe 全集中在 `packages/ui/`，Cursor / v0 / Lovable / Reviewer 都按这两份文件取值
- Card / body / state 颜色 三处长期对不上的争议数值定调，PR 里不再当场口头释义
- Figma 副标题与 swatch 与代码一致，design-to-code 不再产生跨集合命名失配
- ADR 引用唯一，Migration 组件 reviewer 跟着注释能直达权威源

### Bad / Uncertain

- Atom YAML / DueDateHQ-DESIGN.md 仍然存在，任何新人或外部 AI 看到 _"Single source of truth"_ 字样仍可能被误导 — 缓解：D5 在三段加 banner，front-matter 加 `supersededBy`
- legacy 别名继续保留意味着 `semantic-light.css` 末尾的兼容段不会立刻清空 — 接受，避免一次性大改的回归风险；PR 触及自然清理
- Figma 镜像追加 Dify swatch 的工作量集中在 F1（Token 文件）+ F2（App Page），由 design-to-code skill 拉起一次性写入
- 暗色 mode 仍然双链：`/DESIGN.md` `colorsDark:` + `semantic-dark.css`。本 ADR 不动暗色，等 P1 Pulse Obligations 真正进入暗色调试再单独拉 ADR

## 迁移计划（Migration plan）

| 阶段                      | 范围                                                                                                                                                     | 谁负责                 | 何时    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------- |
| **本 PR**                 | (a) 写本 ADR (b) DESIGN.md §2.5/§3.2/§14 加 banner (c) `Stepper.tsx` / `WizardShell.tsx` 文件头注释指向新源 (d) `/DESIGN.md` front-matter `supersededBy` | 当前 chat              | Day 4   |
| **F1 · Figma Token 文件** | 副标题改 + 追加 Dify swatch 集合（colors / spacing / components 三段）；legacy alias 段加灰底标                                                          | 设计 + Figma MCP skill | Day 4–5 |
| **F2 · Figma App Page**   | 补 4 帧 Migration Wizard + Dashboard + Obligations 主帧，全部走 Dify variable                                                                            | 设计 + Figma MCP skill | Day 4–5 |
| **F3 · 全局组件迁移**     | dashboard `_layout.tsx` / migration features 中残留的 legacy 名 → Dify 命名（自然 touch 时一次一个 PR）                                                  | 后续 sprint            | P1      |
| **F4 · YAML 收尾**        | `/DESIGN.md` `components.stepper` 段加 `supersededBy: ADR-0014` 字段；后续不再扩展                                                                       | 后续 sprint            | P1      |

## 引用（References）

- `docs/dev-log/2026-04-25-design-tokens-figma-closure.md` — 上一轮 token 闭环（建立 atom YAML 权威链）
- `docs/dev-log/2026-04-26-entry-surface-design-alignment.md` § _DESIGN.md → Dify 命名整体迁移_ — 把本 ADR 列入 backlog
- `packages/ui/AGENTS.md` § _Token Tree_ + § _Page Typography & Spacing_ — recipe SSoT
- `packages/ui/src/styles/tokens/{primitives,semantic-light,semantic-dark}.css` — runtime SSoT
- ADR 0011 § Decision III · 14 Design system deltas — 上一轮 stepper / confidence-badge / toast token 增量裁定（本 ADR 不冲突，仅替换运行时命名）
