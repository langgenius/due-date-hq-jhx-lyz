# DueDateHQ · DESIGN.md

> 文档类型：视觉设计系统（Single Source of Truth for UI）
> 版本：v1.0
> 日期：2026-04-23
> 方向：**Ramp × Linear · Light Workbench**（浅色主导，暗色为镜像，不做方向 B 的 Bloomberg 终端风）
> 对齐：PRD v2.0 §1.3 设计原则 + §5 核心页面规格 + §10 UI/UX 规范
> 阅读对象：Designer / Frontend Engineer / AI coding agents（Cursor / v0 / Lovable）
> 语言：中文说明 + 英文 token，所有代码注释为英文

---

## 0. 为什么是 Ramp × Linear · Light Workbench

**一句话定位**：CPA 的专业工作台，不是金融 App，不是营销站，不是编辑刊物。

| 借自                 | 借什么                                                        |
| -------------------- | ------------------------------------------------------------- |
| **Ramp**             | 首屏 Hero = 用户核心工作指标（风险 $），不是客户总数 / 进度条 |
| **Linear**           | 13px 紧凑排版 + LCH 色系 + 键盘优先 + zero decoration         |
| **Stripe Dashboard** | 深 navy 权威感 + tabular-nums 金融级数字表达                  |
| **Attio**            | Progressive disclosure（hover 揭示 verbatim quote）           |

**刻意避开的风格**

- ❌ Stripe 营销页的紫色渐变（已被 fintech 过度抄袭）
- ❌ Bloomberg Terminal 的荧光色 + 全域等宽（那是 Focus Mode 才考虑的事）
- ❌ Notion / Airbnb 的暖色圆角（密度不够，压不住 $ 数字）
- ❌ 绿色做品牌主色（税务语义冲突：绿色只能表示"已完成"）

---

## 1. Visual Theme & Atmosphere

**Mood words**：precise · calm · dollar-aware · glass-box · keyboard-first

**Design philosophy**

1. **信息密度优先，留白次之**：表格一屏 10 行起；hero 数字大但周围不留豪华空白
2. **颜色只为风险服务**：灰色 = 默认安全；颜色出现必须有业务语义
3. **装饰零容忍**：无阴影、无渐变、无插画、无动画装饰
4. **证据可见**：所有 AI 输出和数字都带 `[source]` 徽章，hover 揭示原文
5. **双模平等**：浅色 / 暗色共享 token，任何页面都能无损切换

**一眼能判断的风格特征**

- 纯白画布 + 1px 发丝线分隔（`#E5E7EB`）
- 深 navy `#0A2540` 做主文字色（不是纯黑）
- Indigo `#5B5BD6` 仅作为 CTA / focus / selected nav 的 accent
- 数字全部 tabular-nums（Geist Mono / JetBrains Mono）
- 行高 36px，紧凑但不拥挤
- 风险行：浅红 / 浅橙 tint + 2px 左边框

---

## 2. Color Palette & Roles

### 2.1 核心原则：语义驱动的 token，不是命名驱动

每一个颜色都有明确的**语义角色**。禁止直接在组件里写 `text-indigo-500`，必须通过 semantic token：`text-accent-default`。

### 2.2 Light Mode（默认）

```css
/* === Surface === */
--bg-canvas: #ffffff; /* App 最底层 */
--bg-panel: #fafafa; /* Sidebar, sticky header */
--bg-elevated: #ffffff; /* Card, drawer, modal */
--bg-subtle: #f4f4f5; /* Disabled field, tag bg */

/* === Border === */
--border-default: #e5e7eb; /* 主要分隔线，1px hairline */
--border-strong: #d4d4d8; /* 表头下边框，tab 下边框 */
--border-subtle: #f1f5f9; /* 表格行间线（更弱） */

/* === Text === */
--text-primary: #0a2540; /* Hero 数字、主标题、客户名 */
--text-secondary: #475569; /* 说明文字、表格内容 */
--text-muted: #94a3b8; /* Metadata、占位符、timestamp */
--text-disabled: #cbd5e1;

/* === Accent (Indigo · 仅用于 CTA / focus / selected) === */
--accent-default: #5b5bd6; /* Linear indigo-600 */
--accent-hover: #4f46e5;
--accent-active: #4338ca;
--accent-tint: rgba(91, 91, 214, 0.08); /* selected nav bg */
--accent-text: #4338ca; /* indigo 文字（hover 态链接）*/

/* === Severity (风险色系 · 唯一可以鲜艳的地方) === */
--severity-critical: #dc2626; /* red-600 */
--severity-critical-tint: rgba(220, 38, 38, 0.06);
--severity-critical-border: #fca5a5;

--severity-high: #ea580c; /* orange-600 */
--severity-high-tint: rgba(234, 88, 12, 0.06);
--severity-high-border: #fdba74;

--severity-medium: #ca8a04; /* yellow-600 */
--severity-medium-tint: rgba(202, 138, 4, 0.06);
--severity-medium-border: #fde68a;

--severity-neutral: #475569; /* slate-600, 表示 OK / 不急 */
--severity-neutral-tint: rgba(71, 85, 105, 0.04);

/* === Status (状态专用 · 不和 severity 混用) === */
--status-done: #059669; /* emerald-600 · 仅 Filed / Applied 时使用 */
--status-draft: #64748b; /* slate-500 */
--status-waiting: #0284c7; /* sky-600 · Waiting on client */
--status-review: #7c3aed; /* violet-600 · Needs review */
```

### 2.3 Dark Mode（暗色镜像，不是 Bloomberg 终端）

```css
/* === Surface === */
--bg-canvas: #0d0e11; /* 暖色近黑，禁止纯黑 #000 */
--bg-panel: #101217; /* Sidebar */
--bg-elevated: #15171c; /* Card, drawer, modal */
--bg-subtle: #1a1d23; /* Disabled field */

/* === Border === */
--border-default: rgba(255, 255, 255, 0.08);
--border-strong: rgba(255, 255, 255, 0.14);
--border-subtle: rgba(255, 255, 255, 0.04);

/* === Text === */
--text-primary: rgba(255, 255, 255, 0.95);
--text-secondary: rgba(255, 255, 255, 0.65);
--text-muted: rgba(255, 255, 255, 0.45);
--text-disabled: rgba(255, 255, 255, 0.25);

/* === Accent (Indigo 提亮) === */
--accent-default: #7c7bf5;
--accent-hover: #9391f8;
--accent-active: #a5a4fa;
--accent-tint: rgba(124, 123, 245, 0.14);
--accent-text: #a5a4fa;

/* === Severity（在暗色下降饱和 · tint 加厚） === */
--severity-critical: #ef4444; /* 暗色下红色提亮一档 */
--severity-critical-tint: rgba(239, 68, 68, 0.12);
--severity-critical-border: rgba(239, 68, 68, 0.4);

--severity-high: #f97316;
--severity-high-tint: rgba(249, 115, 22, 0.12);
--severity-high-border: rgba(249, 115, 22, 0.4);

--severity-medium: #eab308;
--severity-medium-tint: rgba(234, 179, 8, 0.12);
--severity-medium-border: rgba(234, 179, 8, 0.4);

--severity-neutral: #64748b;
--severity-neutral-tint: rgba(100, 116, 139, 0.08);

/* === Status === */
--status-done: #10b981;
--status-draft: #94a3b8;
--status-waiting: #38bdf8;
--status-review: #a78bfa;
```

### 2.4 禁用色清单（防止风格漂移）

| 禁用                            | 理由                             |
| ------------------------------- | -------------------------------- |
| 纯黑 `#000000`                  | OLED 屏边缘闪烁 + 白字 halation  |
| 纯白文字 `#FFFFFF` on dark      | 对比度过高，刺眼                 |
| 鲜红 `#FF0000` / 鲜绿 `#00FF00` | 与 CPA 严肃语境冲突              |
| 任何渐变色（linear / radial）   | Stripe 抄袭陷阱                  |
| 霓虹色 `#00FFFF` / `#FF00FF`    | 方向 B 专属，浅色模式禁用        |
| 紫色做主色（非 accent）         | 稀释 navy 权威感                 |
| 绿色表示 "OK / 安全"            | 用灰色 `--severity-neutral` 代替 |

### 2.5 Radius / Shadow Token（唯一合法来源）

除下表以外，**所有其他圆角 / 阴影一律禁止**（包括业务组件里写 `rounded-lg` / `shadow-md` 等裸 Tailwind 类）。

```css
/* === Radius === */
--radius-sm: 0.25rem; /* 4px · Evidence Chip / Button / 小徽章                 */
--radius: 0.375rem; /* 6px · 主默认 · Banner / Input / Card / Dropdown       */
--radius-lg: 0.75rem; /* 12px · Drawer / Modal / 大容器（超过 320px 宽）          */
/* 禁止 > 12px（避免 Notion 式圆润感）                                               */

/* === Shadow（"禁止阴影"的三个例外） === */
--shadow-subtle: 0 2px 8px rgba(0, 0, 0, 0.04); /* Drawer / Popover 层 3         */
--shadow-overlay: 0 8px 24px rgba(0, 0, 0, 0.08); /* Modal / Command Palette 层 4  */
/* 暗色模式同 rgba 不变，浏览器会自动调整感知（Cloudflare Workers SPA 不做单独 dark shadow） */
/* 业务组件不可用 --shadow-overlay 之外的其他阴影                                    */
```

| Token              | 用途                                         | 禁用场景                        |
| ------------------ | -------------------------------------------- | ------------------------------- |
| `--radius-sm`      | chip / 小按钮 / 徽章                         | 卡片、容器                      |
| `--radius`         | 输入框 / 默认按钮 / Banner / Card / Dropdown | chip / 浮层                     |
| `--radius-lg`      | Drawer / Modal / Command Palette             | 普通 Card（过大显得松散）       |
| `--shadow-subtle`  | Drawer 底部、Popover、Tooltip                | 普通 Card（违反"禁止阴影"铁律） |
| `--shadow-overlay` | Command Palette / 重要 Modal                 | 其他浮层（用 subtle 即可）      |

**Tailwind 4 `@theme` 映射**：

```css
@theme {
  --radius-sm: 0.25rem;
  --radius: 0.375rem;
  --radius-lg: 0.75rem;
  --shadow-subtle: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-overlay: 0 8px 24px rgba(0, 0, 0, 0.08);
}
```

---

## 3. Typography Rules

### 3.1 字体选型

```css
/* 正文 + UI */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* 数字 / 金额 / 日期 / 规则 ID / 官方 URL / EIN */
--font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;
```

- Inter：加载 weight `400 / 500 / 600`，开启 `font-feature-settings: "cv11", "ss01"`（更好的数字样式）
- Geist Mono：所有数字必须 `font-variant-numeric: tabular-nums`（防止列对不齐）
- **禁止 serif 字体**（那是方向 C 的 Brief PDF 专属）

**全局打开 feature-settings（约束，放在 `@layer base`）：**

```css
@layer base {
  html {
    font-family: var(--font-sans);
    font-feature-settings: 'cv11', 'ss01'; /* Inter 优化数字形态 */
  }

  /* 工具类：所有金额 / 天数 / 日期 / EIN / ID 加上 .tabular 或 .font-mono 强制 tabular-nums */
  .tabular,
  .font-mono {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
  }
}
```

- `html` 层的 `font-feature-settings` 不可省略；否则 Inter 的 `cv11`（单层 l）和 `ss01`（替代 1）不会生效，设计还原度下降
- 业务组件**不允许**在行内覆盖 `font-feature-settings`

### 3.2 字号与用途（紧凑但不过密）

| Token       | Size | Weight | Line-height | 用途                                             |
| ----------- | ---- | ------ | ----------- | ------------------------------------------------ |
| `text-2xs`  | 10px | 500    | 1.3         | keyboard chip, badge 文字                        |
| `text-xs`   | 11px | 500    | 1.4         | metadata（timestamp / source）, 表头 uppercase   |
| `text-sm`   | 12px | 400    | 1.5         | 次级说明、tag、状态 label                        |
| `text-base` | 13px | 400    | 1.5         | **正文默认** / 表格行内容                        |
| `text-md`   | 14px | 500    | 1.5         | 客户名、可点击标题                               |
| `text-lg`   | 16px | 500    | 1.4         | 页面标题、Drawer 标题                            |
| `text-xl`   | 20px | 600    | 1.3         | Hero 副指标数字、Section heading                 |
| `text-2xl`  | 24px | 600    | 1.2         | Client Detail 顶部名称                           |
| `text-hero` | 56px | 700    | 1.0         | **Penalty Radar Hero 数字**（tabular-nums 必开） |

### 3.3 字母间距

- UPPERCASE 短语（`AT RISK · NEXT 7 DAYS`）：`letter-spacing: 0.08em`
- Hero 数字：`letter-spacing: -0.02em`（收紧）
- 其他：0

### 3.4 数字铁律

```tsx
// ✅ 正确
<span className="font-mono tabular-nums">${amount.toLocaleString()}</span>

// ❌ 错误：用 sans-serif 显示金额，列无法对齐
<span>${amount}</span>
```

所有需要**纵向对齐**的数字（金额、天数、日期、EIN、ID）**必须** 使用 `--font-mono` + `tabular-nums`。

---

## 4. Component Stylings

### 4.1 Risk Row（Workboard / Dashboard 表格行）

```text
┌─────────────────────────────────────────────────────────────────────┐
│ ▌ Acme Holdings LLC  ·  Form 1120  ·  Mar 15  ·  3d  ·  $28,400  ·  Draft  ·  [Apply] │  ← Critical 行
└─────────────────────────────────────────────────────────────────────┘
│
└─ 2px 左边框 severity-critical + 背景 severity-critical-tint
```

**规格**

- 高度：36px（默认）/ 32px（Compact）/ 40px（Spacious）
- Critical / High 行：`border-left: 2px solid var(--severity-*)` + `background: var(--severity-*-tint)`
- Neutral 行：无 tint，仅靠 `--border-subtle` 1px 底线分隔
- Hover：叠加 `background: rgba(0,0,0,0.02)`（light）/ `rgba(255,255,255,0.04)`（dark）
- Selected：`background: var(--accent-tint)` + 2px 左 `--accent-default`
- **行内操作区** `[Apply]` `[Start]` 用 `text-accent-default`，hover underline

### 4.2 Hero Metric（Dashboard 顶部 $ 风险聚合）

```tsx
<div className="flex items-baseline gap-8 py-6">
  {/* 主指标 */}
  <div>
    <div className="text-xs uppercase tracking-wide text-muted">AT RISK · NEXT 7 DAYS</div>
    <div className="text-hero font-mono font-bold tabular-nums text-primary">$142,300</div>
  </div>
  {/* 副指标（重复 3 次） */}
  <div>
    <div className="text-xl font-mono font-semibold tabular-nums">5</div>
    <div className="text-xs uppercase tracking-wide text-muted">CRITICAL CLIENTS</div>
  </div>
</div>
```

- 严禁加阴影 / 边框 / 卡片背景 —— Hero 靠排版层级而不是容器
- Hero 数字永远是**页面上最大的东西**，第二大的元素至少小 50%

### 4.3 Pulse Banner（监管提醒 · Layer 2）

```text
┌───────────────────────────────────────────────────────────────┐
│ ⚠  IRS Notice 2026-14 · Form 941 clarification affects 3 clients│
│    Verified from IRS.gov 2h ago          [Review]  [Dismiss] │
└───────────────────────────────────────────────────────────────┘
```

**规格**

- Light：`background: #FEF9C3` + `border: 1px solid #EAB308` + `radius: 6px`
- Dark：`background: rgba(234, 179, 8, 0.08)` + `border: 1px solid rgba(234, 179, 8, 0.3)`
- 左侧 16x16 warning icon（lucide `AlertTriangle`）
- 右侧 `[Review]` 主按钮 + `[Dismiss]` 次级链接
- 多条时：`1 of 3 alerts · [Show 2 more ▾]`
- **禁止使用红色做 Banner** —— 红色留给行内 Critical 风险

### 4.4 Evidence Chip（证据徽章 · Glass-Box 核心）

这是 DueDateHQ **独占的设计资产**，其他 CPA 产品没有。

```tsx
<a
  href={sourceUrl}
  className="inline-flex items-center gap-1 rounded border border-default px-1.5 py-0.5
             font-mono text-2xs text-muted hover:border-accent hover:text-accent-text"
>
  <span>IRS.GOV</span>
  <ExternalLink size={10} />
</a>
```

- 极小：高度 18px，font 10px mono
- 外观：1px 描边 + 圆角 2px，无背景填充
- Hover：边框变 accent 色，0.5s 延迟弹出迷你 verbatim quote 卡片（Popover 200px 宽）
- 点击：打开新 tab 到 `source_url`
- 任何 AI 输出、规则引用、Pulse 条目都**必须**挂一个 Evidence Chip

### 4.5 Command Palette（`⌘K` 三合一）

```text
┌─ Search, Ask, or Navigate... ⌘K ──────────────┐
│  > apply all critical                         │
├───────────────────────────────────────────────┤
│  → APPLY · 5 critical filings · ↵ to confirm  │
│  → FILTER: show only $>$10,000                │
│  → ASK: "What's my CA exposure this week?"    │
│  → NAV: Workboard · Clients · Rules           │
├───────────────────────────────────────────────┤
│  ↵ execute · esc close · ⌘K toggle            │
└───────────────────────────────────────────────┘
```

**规格**

- 居中浮层 560px 宽，`background: var(--bg-elevated)` + `border: 1px solid border-default` + `shadow: 0 8px 24px rgba(0,0,0,0.08)`
- 输入框 mono 14px，光标是 `--accent-default`
- 三类结果分段，section header 11px uppercase muted
- 快捷键提示用 `<kbd>` 小胶囊，`background: bg-subtle` + 1px border

### 4.6 Penalty Radar Strip（首屏顶栏）

- 始终 sticky 顶部，高度 48px
- 默认灰色文字；有新 alert 时 `background: var(--severity-critical-tint)` 脉冲 1.5s 后淡出
- 右侧 `▲ up $3,100 vs last week` 带小三角趋势指示

### 4.7 Triage Tabs（时间分组）

```
[ This Week · 15 · $12,400 ]   [ This Month · 42 · $46k ]   [ Long-term · 86 · $210k ]
```

- 未选中：`text-secondary`，hover `text-primary`
- 选中：`text-primary` + 2px 底边框 `--accent-default` + mono 数字 semibold
- 右侧 `$` 金额：mono tabular-nums，和普通文字用 `·` 分隔

### 4.8 Button 系统

| 类型                                | 规格                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| **Primary**（Apply / Save / Start） | `bg: accent-default` + `text: white` + `radius: 4px` + padding `6px 12px` + 13px 500 |
| **Secondary**（Cancel / Dismiss）   | `bg: transparent` + `border: 1px border-default` + `text: primary`                   |
| **Ghost**（row 内操作）             | `text: accent-default` + no bg / border + hover underline                            |
| **Destructive**（Delete）           | `bg: severity-critical` + `text: white`                                              |
| **Icon-only**                       | 28x28，`radius: 4px`，hover `bg: bg-subtle`                                          |

**禁止**：圆形按钮、pill 按钮（radius > 8px）、带渐变的按钮。

### 4.9 Sidebar Navigation

- 宽度：220px，`bg: var(--bg-panel)`
- 每项：36px 高，13px Inter 500，左 padding 16px
- Selected：2px 左边框 `--accent-default` + `background: var(--accent-tint)` + `text: primary`
- Icon：16x16 lucide，`color: text-secondary`（unselected）→ `text-primary`（selected）
- 底部固定用户行：40px，avatar + 名字 + firm

---

## 5. Layout Principles

### 5.1 Spacing Scale（4px base）

```
0   · 0px
1   · 4px       —— icon gap, chip padding
2   · 8px       —— form field padding, small gap
3   · 12px      —— button padding-x, table cell padding-x
4   · 16px      —— default section padding, card padding
5   · 24px      —— between sections
6   · 32px      —— page section separator
8   · 48px      —— page top padding
12  · 80px      —— hero section vertical
```

**禁用**：5px、10px、15px、18px、22px（非 4 倍数破坏节奏）。

### 5.2 Grid

- Container max-width：`1440px`，左右 auto margin
- Dashboard / Workboard：全宽，不限 max-width
- Content page（Settings / Rules）：max-width `880px`
- Drawer：400px（right slide-in），modal max-width `640px`

### 5.3 Density 三档

| Density                 | Row height | Table padding-y | 适用                             |
| ----------------------- | ---------- | --------------- | -------------------------------- |
| **Compact**             | 32px       | 6px             | Workboard（File In Time 老用户） |
| **Comfortable**（默认） | 36px       | 8px             | Dashboard / Client list          |
| **Spacious**            | 40px       | 10px            | Demo / onboarding                |

切换：用户 Settings → 持久化到 `user.preferences.density` → CSS variable `--row-height`。

### 5.4 Max information, minimum chrome

- Dashboard 首屏必须能看见：Pulse Banner + Hero 数字 + ≥ 8 行客户
- Workboard 首屏必须能看见：≥ 12 行
- 侧栏不折叠（Drawer 除外）

---

## 6. Depth & Elevation

**铁律：能用 1px 线分层就不要用阴影。**阴影 token 唯一来自 §2.5。

| 层级                                 | 方案                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Level 0 · Canvas                     | `--bg-canvas`，无边框                                                                                       |
| Level 1 · Panel                      | `--bg-panel`，无边框；或 canvas + `border: 1px --border-default`                                            |
| Level 2 · Card                       | `--bg-elevated` + `border: 1px --border-default`，**无阴影**                                                |
| Level 3 · Drawer / Popover / Tooltip | `--bg-elevated` + `border: 1px --border-strong` + `box-shadow: var(--shadow-subtle)` · radius `--radius-lg` |
| Level 4 · Modal / Command Palette    | Level 3 规格 + `box-shadow: var(--shadow-overlay)` · radius `--radius-lg`                                   |

**禁用**

- 除 `--shadow-subtle` / `--shadow-overlay` 外的任何 `box-shadow`
- 多层嵌套卡片（卡片里套卡片套卡片）
- 超过 `--radius-lg`（12px）的圆角

---

## 7. Risk Severity System（CPA 独占的视觉语言）

### 7.1 四档严重度

| Level        | 条件                                       | 颜色                  | 图标               |
| ------------ | ------------------------------------------ | --------------------- | ------------------ |
| **Critical** | `days_left ≤ 2` 或 `exposure > $10,000`    | `--severity-critical` | 无（行首文字徽章） |
| **High**     | `3 ≤ days_left ≤ 7` 或 `exposure > $3,000` | `--severity-high`     | 同上               |
| **Medium**   | `8 ≤ days_left ≤ 30`                       | `--severity-medium`   | 同上               |
| **Neutral**  | `days_left > 30` 或 `status = OK`          | `--severity-neutral`  | 同上               |

### 7.2 视觉呈现规则

1. **Color + Label 双编码**（色盲友好）：行首永远有 `CRITICAL` / `HIGH` / `MEDIUM` / `NEUTRAL` 文字徽章
2. **Tint + Border 双信号**：背景 tint（低饱和）+ 2px 左边框（高饱和）组合
3. **计算必须可解释**：hover 行首徽章 → 弹出说明 "3 days to deadline + $28k exposure → CRITICAL"
4. **不和 Status 混用**：Status = 工作流状态（Draft / Waiting / Filed），Severity = 风险等级，两套 token 独立

### 7.3 特殊情况

- **OVERDUE**（`days_left < 0`）：Critical + 额外闪烁动画 1.5s（尊重 `prefers-reduced-motion`）
- **Filed / Applied**：用 `--status-done` 绿色 checkmark，**不再显示 severity 色**
- **Not Applicable**：灰色 + 删除线样式

---

## 8. Evidence & Provenance Visual Language（DueDateHQ 独占资产）

### 8.1 四类 Evidence 标记

| 场景                      | 组件                                           | 视觉                                 |
| ------------------------- | ---------------------------------------------- | ------------------------------------ |
| AI 生成句子结尾           | Footnote chip `[1]`                            | mono 10px + 下划线，hover 弹 Popover |
| 数据字段旁（金额 / 日期） | Evidence Chip `[IRS.GOV]`                      | 见 §4.4                              |
| 规则链接                  | Source Badge `🔗 CA FTB · ✓ Verified · 2d ago` | 12px Inter + link icon               |
| 大段 AI 摘要              | Evidence Mode 全屏 overlay                     | 右抽屉，列所有源 + verbatim quote    |

### 8.2 Verbatim Quote Popover

```text
┌──── CA Revenue & Taxation Code §19131 ────┐
│  "Every corporation required to file a    │
│   return... shall pay a penalty of..."   │
│                                           │
│  ftb.ca.gov/…/rtc-19131                   │
│  ✓ Verified by Sarah K., 2026-04-20      │
│  [Copy as citation]                       │
└───────────────────────────────────────────┘
```

- 宽度 320px，背景 `--bg-elevated` + border strong
- Verbatim quote 用斜体 `--text-secondary`，italic
- 底部 source URL 用 `--font-mono` 11px 截断
- **Copy as citation** 按钮复制结构化文本（内容 + URL + verified_at）

### 8.3 "No Provenance = No Render" 规则

AI 输出的任何内容，如果没有 `source_url + verified_at + verbatim_quote`，**必须**渲染为：

```
⚠ I don't have a verified source for this yet.
  [Ask human to verify]
```

**禁止**渲染一条没有引用的 AI 建议。宁可空，不可幻觉。

---

## 9. Do's and Don'ts

### ✅ Do

- 用灰色表示"OK / 不急"，不用绿色
- 所有金额 / 天数 / EIN / 日期走 `--font-mono` + `tabular-nums`
- 每个交互元素都有键盘快捷键，并在 hover 时展示
- 风险用美元表达（`$28,400 at risk`），其次才是天数（`3d`）
- AI 输出必带 Evidence Chip
- 暗色模式使用 `--bg-canvas: #0D0E11`（偏暖近黑），不是纯黑
- 批量操作（Bulk actions）有 `[Undo]` 500ms toast
- 表格行数 ≥ 10 行可见（Workboard ≥ 12 行）

### ❌ Don't

- 用紫色渐变（Stripe 陷阱）
- 给按钮 / 卡片加大阴影（`shadow: 0 10px 30px`）
- 圆角 > 8px（pill 按钮、胶囊卡片）
- Status = Filed 时还显示 red severity tint（语义矛盾）
- 用 serif 字体（除非是方向 C 的 Brief PDF）
- 用 emoji 做核心 UI（🚨 只在 Pulse Banner 图标位置可以）
- 首屏 Hero 放客户总数 / 任务完成率 / 进度条（应该是 $ 风险数字）
- 在 modal 里完成状态切换（应该是行内 dropdown + 500ms undo）
- 让 AI 输出没有 `[source]` 徽章就渲染出来
- Dark mode 用纯黑 `#000000`

---

## 10. Responsive Behavior

### 10.1 断点

```css
--bp-sm: 640px; /* Mobile landscape */
--bp-md: 768px; /* Tablet */
--bp-lg: 1024px; /* Laptop */
--bp-xl: 1280px; /* Desktop */
--bp-2xl: 1536px; /* Wide desktop */
```

### 10.2 降级策略

| 断点      | Dashboard                                 | Workboard  | Sidebar       |
| --------- | ----------------------------------------- | ---------- | ------------- |
| ≥ 1280px  | 三栏 + 右 Pulse 面板                      | 全 14 列   | 固定 220px    |
| 1024–1279 | 两栏，Pulse 下沉                          | 默认 10 列 | 固定 220px    |
| 768–1023  | 单栏纵向                                  | 精简 6 列  | 折叠为 Drawer |
| < 768     | 只读优先：Hero + Triage Tabs + Top 5 rows | 卡片化     | 底部 Tab Bar  |

### 10.3 触控目标

Mobile 下所有可点击元素 ≥ **40x40px**（WCAG 2.2 AA）。Critical 行的 `[Apply]` 按钮可放大到 44px 高。

---

## 11. Agent Prompt Guide（for Cursor / v0 / Lovable）

### 11.1 Quick color reference

```
BG canvas:    white / near-black warm (#FFFFFF / #0D0E11)
Text primary: deep navy / near-white (#0A2540 / rgba(255,255,255,0.95))
Accent CTA:   indigo-600 / indigo-400 (#5B5BD6 / #7C7BF5)
Critical:     red-600 (#DC2626) · tint 6% light / 12% dark
High:         orange-600 (#EA580C)
Medium:       yellow-600 (#CA8A04)
Neutral OK:   slate-600 (#475569)  ← NOT green
Done/Applied: emerald-600 (#059669) ← only for completed
```

### 11.2 Ready-to-use prompts

**生成一个 Dashboard 风险表格行**

> Build a table row component for DueDateHQ. Light mode. Use Inter 13px for client name, Geist Mono tabular-nums for "$28,400" and "3d", font-weight 600 on name. Row height 36px. Critical status → `border-left: 2px solid #DC2626` + `background: rgba(220,38,38,0.06)`. No shadow. Hover state adds `background: rgba(0,0,0,0.02)`. Right-aligned dollar amount. Inline `[Apply]` button uses `color: #5B5BD6` no border no bg with hover underline. Status label 12px slate-500.

**生成一个 Hero 风险聚合区**

> Build the Dashboard hero metric section for DueDateHQ. Display "$142,300" in Geist Mono Bold 56px, color `#0A2540`, `tabular-nums`, `letter-spacing: -0.02em`. Above it: "AT RISK · NEXT 7 DAYS" in Inter 11px uppercase `letter-spacing: 0.08em` color `#94A3B8`. To the right, three side metrics stacked as `<big mono number> + <small uppercase label>`, separator is just spacing not a line. No card border, no shadow, no background. Padding vertical 24px.

**生成 Evidence Chip**

> Build an inline Evidence Chip for DueDateHQ. Format: `[IRS.GOV]` in uppercase Geist Mono 10px. Style: 1px solid `#E5E7EB` border, 2px border-radius, padding 2px 6px, color `#94A3B8`. Hover: border color becomes `#5B5BD6`, text color becomes `#4338CA`. Show a tiny external-link icon (10px) next to the label. On hover, delay 500ms then show a popover 320px wide with verbatim quote in italic, source URL in mono 11px, and a "Copy as citation" button at bottom.

### 11.3 必须避免的 prompt 关键词

不要用这些词描述 DueDateHQ UI，否则会生成错误风格：

- ❌ "modern gradient", "hero gradient", "purple glow"
- ❌ "playful", "friendly", "rounded", "vibrant"
- ❌ "glassmorphism", "neumorphism", "3D"
- ❌ "colorful dashboard", "data visualization colors"
- ❌ "saas template", "dribbble style"

应该用：

- ✅ "dense data table", "tabular nums", "1px hairline"
- ✅ "Linear style", "Ramp dashboard", "Stripe navy"
- ✅ "zero shadow", "flat", "precise", "editorial"
- ✅ "keyboard-first", "command palette", "progressive disclosure"

---

## 12. 对应 PRD / Dev File 的落地映射

| 本文件章节               | 对应                                           |
| ------------------------ | ---------------------------------------------- |
| §1 / §2 / §3             | PRD v2.0 §1.3（设计原则）+ §10.1（视觉语言）   |
| §4.1 Risk Row            | PRD v2.0 §5.2 Workboard                        |
| §4.2 Hero Metric         | PRD v2.0 §5.1.1 Layer 1 Penalty Radar          |
| §4.3 Pulse Banner        | PRD v2.0 §5.1.4 + §6.3                         |
| §4.4 Evidence Chip       | PRD v2.0 §5.5 Evidence Mode + §6.2 Glass-Box   |
| §4.5 Command Palette     | PRD v2.0 §10.3 + §6.6 Ask                      |
| §7 Risk Severity         | PRD v2.0 §5.1.2 三段颜色次级信号               |
| §8 Evidence & Provenance | PRD v2.0 §6.2 + §5.5                           |
| §2 / §3 / §5 tokens      | `docs/dev-file/05-Frontend-Architecture.md` §5 |

---

## 13. 变更纪律

1. **本文件是 UI 单一事实源**。组件实现和 PRD 描述如与本文件冲突，以本文件为准
2. **Token 改动 → 同步 PR**：必须同步更新 `tailwind.config.ts`、Storybook 主题、`app/manifest.ts` 的 `theme_color`
3. **新增颜色 → 先定义 semantic role**：禁止直接引用 hex 值到组件
4. **重大视觉改版** 走 RFC 流程，附 before/after 截图 + 对应 PRD 章节链接

---

_This document is a single source of truth. If in doubt, choose density over decoration, precision over friendliness._
