# Migration Copilot · 设计系统增量（Design System Deltas）

> 版本：v1.0（Demo Sprint · 2026-04-24）
> 上游：PRD Part1B §6A.6 / §6A.8 · Part2A §7.5.6 · Part2B §13.2.1 · `../../../DESIGN.md` · `../../Design/DueDateHQ-DESIGN.md`
> 入册位置：[`./README.md`](./README.md) §2 第 09 份
> 阅读对象：Design / Frontend Engineer / AI coding agents
> 权威口径：本文件是本册 02 ~ 08 引用、但 `DESIGN.md` 与 `docs/Design/DueDateHQ-DESIGN.md` 尚未定义的 token / 组件一次性清单。**每一条 delta 必须同时回灌两个文件**：`DESIGN.md` YAML 承载 token 原子定义；`docs/Design/DueDateHQ-DESIGN.md` 承载使用说明与可达性规格。

---

## 1. 定位

- 一句话：把 Migration Copilot 4 步向导 / Live Genesis / Migration Report Email 在本册 02 ~ 08 里引用但 DESIGN 侧尚未落子的视觉规格，一次性定义 token、锚到使用说明，并给出双文件回灌落点。
- 硬约束：
  1. 每条 delta **必须同时** 有 token 定义（回灌 [`../../../DESIGN.md`](../../../DESIGN.md)）+ 使用说明（回灌 [`../../Design/DueDateHQ-DESIGN.md`](../../Design/DueDateHQ-DESIGN.md)）。
  2. 所有颜色引用 `{colors.*}` token，不落 hex；所有字号 / 字距引用 `{typography.*}` token。
  3. 本文件中的 YAML 示例是**建议稿**，权威 YAML 以 [`../../../DESIGN.md`](../../../DESIGN.md) `components:` 段实际追加为准；两者必须字符串级一致。
- 范围外（本轮不动）：
  - `DESIGN.md` 已有 token（button-primary / risk-row-critical / hero-metric / pulse-banner / evidence-chip / command-palette / sidebar 等）
  - 完整 DueDateHQ-DESIGN 已有章节 §1 ~ §13（不修改，仅追加新顶层 §14，避免占用既有 §9 Do's and Don'ts）
  - Onboarding Agent 真实对话气泡（PRD §6A.11，本轮只标 "preview" disabled 卡片，不写完整 token）

---

## 2. Stepper（4 步向导步骤条）

对应 [`./02-ux-4step-wizard.md`](./02-ux-4step-wizard.md) §2.2 + [`./03-onboarding-agent.md`](./03-onboarding-agent.md) 首页 disabled 版本。

### 2.1 规格

- 形态：4 步水平，整栏高 32px；每格之间间距 `{spacing.3}`（12px）
- 字号：`{typography.label}`（11px Inter 500 uppercase tracking 0.08em）
- 圆角：`{rounded.sm}`（4px，chip 级）
- 可点击性：仅展示不可点击（避免跨步跳跃造成数据污染；通过底栏 `[Back]` 逐级回退）

### 2.2 状态色映射

| 状态      | 前景色                       | 背景色                    | 图标 / 装饰 | 触发条件                                       |
| --------- | ---------------------------- | ------------------------- | ----------- | ---------------------------------------------- |
| current   | `{colors.accent-default}`    | `{colors.accent-tint}`    | 无          | Step 当前焦点                                  |
| completed | `{colors.status-done}`       | `{colors.surface-canvas}` | `✓`         | Step 已 Continue 提交                          |
| upcoming  | `{colors.text-muted}`        | `{colors.surface-canvas}` | 无          | Step 尚未到达                                  |
| error     | `{colors.severity-critical}` | `{colors.surface-canvas}` | `!`         | 当前 Step 校验失败（非阻塞 warnings 不走本态） |
| disabled  | `{colors.text-disabled}`     | `{colors.surface-canvas}` | 无          | Agent preview 卡片态 / Step 4 动画期间         |

### 2.3 DESIGN.md YAML 回灌

```yaml
stepper:
  height: 32px
  gapBetweenSteps: '{spacing.3}'
  colorCurrent: '{colors.accent-default}'
  colorCompleted: '{colors.status-done}'
  colorUpcoming: '{colors.text-muted}'
  colorError: '{colors.severity-critical}'
  colorDisabled: '{colors.text-disabled}'
  typography: '{typography.label}'
  rounded: '{rounded.sm}'
```

### 2.4 键盘交互（补漏 Subagent B NEEDS REVIEW 1）

- `Enter` **不跳步**：步骤推进只允许 `[Continue]` / `[Back]` 按钮；数字键 `1-4` 亦不跳步（对齐 [`./01-mvp-and-journeys.md`](./01-mvp-and-journeys.md) §7.2）
- `Tab` / `Shift+Tab`：焦点顺序固定为 `[Back]` → Step body 可聚焦元素 → `[Continue]`，在 modal 内循环不逃出
- `Enter` = Continue 的生效范围：**仅** 在焦点不在 `<textarea>` / `[contenteditable="true"]` / `<select>` 时生效；否则走控件自身默认行为（例如 textarea 里 Enter = 换行）

---

## 3. Confidence Badge（置信度徽章）

对应 [`./02-ux-4step-wizard.md`](./02-ux-4step-wizard.md) §5（Mapping）+ §6（Normalize）+ [`./04-ai-prompts.md`](./04-ai-prompts.md) §2.5 后处理输出。

### 3.1 规格

- 3 档置信度（对齐 Mapper / Normalizer 输出契约）：
  - **high** `confidence ≥ 0.95`
  - **med** `0.80 ≤ confidence < 0.95`
  - **low** `confidence < 0.80`
- 形态：inline chip，高 18px，padding `0 6px`，圆角 `{rounded.sm}`
- 字号：`{typography.numeric}`（13px Geist Mono tabular-nums）
- 文案：百分整数 `95%` / `87%` / `72%`（不带小数）

### 3.2 语义与色系（与 severity / status 解耦）

| 档位 | 背景色                           | 文字色                    | 语义                             |
| ---- | -------------------------------- | ------------------------- | -------------------------------- |
| high | `{colors.accent-tint}`           | `{colors.accent-text}`    | 强先验命中 / Preset + EIN 全识别 |
| med  | `{colors.severity-neutral-tint}` | `{colors.text-secondary}` | 一般置信，可直接采纳             |
| low  | `{colors.severity-medium-tint}`  | `{colors.text-primary}`   | 需人工 review，**非阻塞**        |

### 3.3 DESIGN.md YAML 回灌

> **结构变更（2026-04-25）**：为通过 `@google/design.md` lint（component property 仅限 `backgroundColor / textColor / typography / rounded / padding / size / height / width` 8 个标量），`tone` 嵌套被拍平为独立 component entry：`confidence-badge-high / confidence-badge-med / confidence-badge-low`。base entry `confidence-badge` 仅承载共享视觉。

```yaml
confidence-badge:
  backgroundColor: '{colors.surface-elevated}'
  textColor: '{colors.text-primary}'
  typography: '{typography.numeric}'
  rounded: '{rounded.sm}'
  height: 18px
  padding: '0 6px'
confidence-badge-high:
  backgroundColor: '{colors.accent-tint}'
  textColor: '{colors.accent-text}'
  typography: '{typography.numeric}'
  rounded: '{rounded.sm}'
  height: 18px
  padding: '0 6px'
confidence-badge-med:
  backgroundColor: '{colors.severity-neutral-tint}'
  textColor: '{colors.text-secondary}'
  typography: '{typography.numeric}'
  rounded: '{rounded.sm}'
  height: 18px
  padding: '0 6px'
confidence-badge-low:
  backgroundColor: '{colors.severity-medium-tint}'
  textColor: '{colors.text-primary}'
  typography: '{typography.numeric}'
  rounded: '{rounded.sm}'
  height: 18px
  padding: '0 6px'
```

### 3.4 权威语义裁定：needs_review 用色

这是本文件的**硬裁定**（回灌到 DueDateHQ-DESIGN §14.7 与 ADR 0011 Decision III）：

- **数据质量类 `needs_review`**（Mapper 低置信 / Normalizer 冲突 / Default Matrix 非种子辖区）→ `{colors.severity-medium}`（黄 · severity-medium），使用 `confidence-badge-low` 的色系
- **工作流态 Review**（Workboard "Needs review" 状态列 / Client Detail 的 review 抽屉）→ `{colors.status-review}`（紫 · violet-600）

两者**绝不混用**。依据：

- `{colors.status-review}` 已在 DESIGN.md §2.2 定义为工作流状态色（对齐 DueDateHQ-DESIGN §7 与 §2.2 "Status 与 Severity 两套 token 独立"铁律）
- Migration / Onboarding 阶段的"数据质量弱信号"属风险域 → 走 severity-medium，便于 CPA 在 Dry-Run 预览与 Dashboard 保持一致的视觉语言

---

## 4. Toast（3 tone + 2 variant）

对应 [`./02-ux-4step-wizard.md`](./02-ux-4step-wizard.md) §7.4（Step 4 导入成功 toast） + [`./07-live-genesis.md`](./07-live-genesis.md) §2 动画收尾 + [`./08-migration-report-email.md`](./08-migration-report-email.md)（Revert 链接同源 24h toast 文案）。

### 4.1 规格

- 形态：右下 stack；宽 360px；padding 12px；圆角 `{rounded.md}`（6px）
- 字号：`{typography.body}`
- 层级：Level 3（Drawer / Popover）；`box-shadow: var(--shadow-subtle)`
- 关闭：右上 icon-only `×` + `Esc` 焦点在 toast 时关闭

### 4.2 Tone（3 档）

| tone    | 背景                            | 文字                    | 用途                                                        |
| ------- | ------------------------------- | ----------------------- | ----------------------------------------------------------- |
| info    | `{colors.surface-elevated}`     | `{colors.text-primary}` | 一般信息（例如"Draft saved"）                               |
| success | `{colors.surface-elevated}`     | `{colors.status-done}`  | 导入成功 / Revert 成功 / Undo 成功（绿文字 + 白背景，flat） |
| warning | `{colors.severity-medium-tint}` | `{colors.text-primary}` | 数据质量类非阻塞提示（"3 rows skipped"、"Needs review"）    |

### 4.3 Variant（2 种）

| variant    | timeoutMs                                  | 辅助 UI                                                            |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------ |
| default    | 3000（自动消失）；含 500ms undo 计时窗口   | 行内 `[Undo]` 按钮（对齐 DESIGN §9 Do's 第 8 条 "500ms undo"）     |
| persistent | null（不自动消失，直到用户显式关闭或过期） | Migration Report toast：右下 sticky 展示至 `revertible_until` 过期 |

### 4.4 DESIGN.md YAML 回灌

> **结构变更（2026-04-25）**：tone 拍平为独立 component entry。`toast-info` 和 `toast-warning` 在 `components:`（对比度通过 WCAG AA），`toast-success` 因绿字+白底故意低对比（3.77:1）放在 `componentExtensions:`，每条带 `note:` 解释豁免理由。`shadow + variant.{default,persistent}` 的行为字段也在 `componentExtensions:`，linter 忽略。

```yaml
toast:
  backgroundColor: '{colors.surface-elevated}'
  textColor: '{colors.text-primary}'
  typography: '{typography.body}'
  rounded: '{rounded.md}'
  padding: 12px
  width: 360px
toast-info:
  backgroundColor: '{colors.surface-elevated}'
  textColor: '{colors.text-primary}'
  typography: '{typography.body}'
  rounded: '{rounded.md}'
  padding: 12px
  width: 360px
toast-warning:
  backgroundColor: '{colors.severity-medium-tint}'
  textColor: '{colors.text-primary}'
  typography: '{typography.body}'
  rounded: '{rounded.md}'
  padding: 12px
  width: 360px
componentExtensions:
  toast:
    shadow: '{shadows.subtle}'
    variant:
      default: { timeoutMs: 3000, undoTimeoutMs: 500 }
      persistent: { timeoutMs: null, expiresUsing: 'serverReturnedRevertibleUntil' }
  toast-success:
    backgroundColor: '{colors.surface-elevated}'
    textColor: '{colors.status-done}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: 12px
    width: 360px
    note: 'Intentionally low contrast (3.77:1) — green text on white reads as success affirmation, not body content.'
```

### 4.5 权威裁定：Persistent toast 的时钟源

这是本册对 **Subagent B NEEDS REVIEW 4（时钟源分歧）** 的裁定：

- Migration Report 常驻 24h toast 的过期时点 **以后端返回的 `revertible_until` ISO-8601 字段为准**（`rpc.migration.apply` summary 返回值 + Migration Report Email 模板共享同一字段，见 [`./08-migration-report-email.md`](./08-migration-report-email.md) §2）。
- **前端只渲染、不本地倒计时**：客户端不在浏览器里起 `setTimeout(24 * 3600 * 1000)`；每次 toast 挂载 / 焦点返回时比较 `Date.now() < revertible_until` 决定显示与否。
- 降级：若浏览器时钟偏移超过 5 分钟（与服务端 timestamp 对比），toast 仍展示但 `[Revert 24h]` 按钮点击时走服务端二次校验失败提示。

---

## 5. Risk Row（补漏：`risk-row-high` + `risk-row-upcoming`）

[`../../../DESIGN.md`](../../../DESIGN.md) 当前只定义了 `risk-row-critical`（severity-critical-tint 背景 + 36px 行高）；本册 [`./02-ux-4step-wizard.md`](./02-ux-4step-wizard.md) Step 4 Dry-Run 预览与 Dashboard This Week / This Month 三档风险行需要 `risk-row-high`（橙 · High）与 `risk-row-upcoming`（黄 · Medium）补齐对齐。

### 5.1 规格

- 高度：36px（与已有 `risk-row-critical` 一致；Compact 32px / Spacious 40px 由 `--row-height` 变量外部覆盖，不走 component token 字段）
- 左边框：2px 高饱和 severity 色（参照 DueDateHQ-DESIGN §4.1 铁律 "Tint + Border 双信号"）
- 背景：tint 6% 低饱和，不干扰文字对比度

### 5.2 DESIGN.md YAML 回灌

```yaml
risk-row-high:
  backgroundColor: '{colors.severity-high-tint}'
  textColor: '{colors.text-primary}'
  height: 36px
risk-row-upcoming:
  backgroundColor: '{colors.severity-medium-tint}'
  textColor: '{colors.text-primary}'
  height: 36px
```

### 5.3 语义映射（本补漏解决 Subagent B NEEDS REVIEW 3）

| Row kind            | 触发条件                                   | 视觉                                                                        |
| ------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| `risk-row-critical` | `days_left ≤ 2` 或 `exposure > $10,000`    | 红 tint + 2px `{colors.severity-critical}` 左边                             |
| `risk-row-high`     | `3 ≤ days_left ≤ 7` 或 `exposure > $3,000` | 橙 tint + 2px `{colors.severity-high}` 左边                                 |
| `risk-row-upcoming` | `8 ≤ days_left ≤ 30`                       | 黄 tint + 2px `{colors.severity-medium}` 左边                               |
| （不单独定义）      | `days_left > 30` 或 `status = OK`          | 无 tint，仅 `{colors.border-subtle}` 1px 底线（沿用 DueDateHQ-DESIGN §4.1） |

---

## 6. Genesis Odometer（Live Genesis 主数字）

对应 [`./07-live-genesis.md`](./07-live-genesis.md) §4 Odometer 规格 · Phase 3（1.0–1.5s 顶栏 `$0 → total_exposure_cents` 滚动）。

### 6.1 规格

- 字号 / 行高 / 字距：`{typography.hero-metric}`（56px · Geist Mono 700 · letter-spacing -0.02em · fontFeature `'tnum'`）
- 色：`{colors.text-primary}`（navy）
- 滚动缓动：`cubic-bezier(0.4, 0, 0.2, 1)`（Material "standard"）；每位数字独立 linear-interpolate
- 固定不滚动：货币符 `$` + 千分位 `,`（对齐 07 §4.3）
- 可达性：`role="status"` + `aria-live="polite"`；结束广播 `"{formattedAmount} at risk this quarter"`

### 6.2 `prefers-reduced-motion` 降级

- 触发条件：CSS media `prefers-reduced-motion: reduce` 或运行时 5 帧 > 33ms 或 URL `?reducedMotion=1`
- 降级行为：**一次性显示 final 值 + 200ms fade-in**（不滚动；总时长 ≤ 800ms，对齐 07 §5.2）

### 6.3 DESIGN.md YAML 回灌

> **结构变更（2026-04-25）**：Genesis Odometer 是动效规格而非视觉 token，从 `components:` 段移到顶层 `motion:` 段（不在 `@google/design.md` spec 内，linter 忽略）。

```yaml
motion:
  genesis-odometer:
    typography: '{typography.hero-metric}'
    color: '{colors.text-primary}'
    digitEase: 'cubic-bezier(0.4, 0, 0.2, 1)'
    reduceMotionFadeInMs: 200
```

---

## 7. Genesis Particle（粒子弧线）

对应 [`./07-live-genesis.md`](./07-live-genesis.md) §3 粒子参数 · Phase 2（2.0–2.5s 粒子从 obligation 卡片飞向顶栏 Radar）。

### 7.1 规格

- 尺寸：6px × 6px（逻辑像素，DPI ≤ 2x）
- 形状：圆形（`arc(0, 0, 3, 0, 2π)`）
- 颜色：`{colors.accent-default}` 实心 + 10% alpha glow（`shadowBlur: 8`，`shadowColor` 同色）
- 运动：4 点三次贝塞尔 `[startPos, startPos + (0, -200), radarPos + (0, -100), radarPos]`
- 时间：1200–1800ms / 粒子；stagger 60ms
- 同屏上限：30 颗（超限走抽样 + `+{remaining} more` 聚合气泡）

### 7.2 DESIGN.md YAML 回灌

> **结构变更（2026-04-25）**：见 §6.3，Genesis Particle 同样在顶层 `motion:` 段。

```yaml
motion:
  genesis-particle:
    size: 6px
    color: '{colors.accent-default}'
    trailAlpha: 0.1
    bezier: ['start', 'startPlus(0, -200)', 'endPlus(0, -100)', 'end']
    maxConcurrent: 30
```

### 7.3 抽样策略提醒

- `obligations ≤ 50` → 每卡 1 粒子
- `obligations > 50` → 随机抽样 50 颗，剩余金额直接聚合跳入 Radar（无弧线），对齐 07 §3.2

---

## 8. Email Shell（Migration Report 邮件外壳）

对应 [`./08-migration-report-email.md`](./08-migration-report-email.md) §3.2 HTML 模板 / §4 布局 token。Email shell **不属于** 产品 UI workbench token，但本文件把它挂到 `DESIGN.md` 作为 "email surface"——目的是让 Resend / React Email 模板的样式常量有唯一事实源。

### 8.1 规格

- 宽度：640px（对齐 08 §3.2 HTML 模板实际 `width="640"`；Gmail / Outlook 主流渲染宽）；外层 table 布局
- 背景：`{colors.surface-canvas}`
- 文字：`{colors.text-primary}`；正文 `{typography.body}`
- 数字（金额 / 日期 / EIN）：Geist Mono tabular-nums；hex 展开由 Worker 薄字典模板在渲染时替换
- 页脚（"Sent by DueDateHQ on behalf of {firm_name}" + Unsub）：`{typography.label}` + `{colors.text-muted}`

### 8.2 DESIGN.md YAML 回灌

> **结构变更（2026-04-25）**：footer 拍平为独立 component entry `email-shell-footer`；`numericFontFamily` 移到 `componentExtensions:` 段。

```yaml
email-shell:
  backgroundColor: '{colors.surface-canvas}'
  textColor: '{colors.text-primary}'
  typography: '{typography.body}'
  width: 640px
email-shell-footer:
  backgroundColor: '{colors.surface-canvas}'
  textColor: '{colors.text-primary}'
  typography: '{typography.label}'
componentExtensions:
  email-shell:
    numericFontFamily: 'Geist Mono'
```

> 说明：`width: 640px` 与 [`./08-migration-report-email.md`](./08-migration-report-email.md) §3.2 HTML 模板 `<table width="640" ...>` 保持一致；640px 是 Gmail / Outlook / Apple Mail 三端主流兼容宽度。

---

## 9. Keyboard Rules（键盘裁定）

本节对齐 [`./01-mvp-and-journeys.md`](./01-mvp-and-journeys.md) §7 键盘基线，补漏 **Subagent B NEEDS REVIEW 1 / 2**。

### 9.1 `A` 键（Apply-all）

- **生效位**：**仅** Step 3 Normalize 的"Apply to all similar"确认按钮焦点区域
- **全局 `A`**：本轮**不占用**（PRD §7.7 暂未列入全局 shortcut 表）；保留位给未来可能的 Ask 快捷，标 `reserved: false`。Demo Sprint 期间任何组件**禁止**全局监听 `A` 键

### 9.2 `Enter` 键（Continue）

- **生效位**：Wizard 底栏 `[Continue →]` 等价快捷
- **不生效位**：焦点在 `<textarea>`、`[contenteditable="true"]`、`<select>` 控件时（让控件自身默认行为保留，例如 textarea 换行）
- **Step 4 动画期间**：Enter 不生效（对齐 [`./02-ux-4step-wizard.md`](./02-ux-4step-wizard.md) §2.1 "动画中 Esc 失效"同原则）

### 9.3 其他全局（沿用 DueDateHQ-DESIGN §9）

- `?` 快捷键帮助浮层
- `Esc` 打开关闭确认（非 destructive；动画期间失效）
- `Cmd + K` 命令面板
- `Cmd + Shift + D` 暗色切换
- 数字键 `1` - `4` 在向导内**不跳步**

---

## 10. 回灌清单（双文件落点）

每一条 delta 必须同时写入以下两处。

| 组件 / Token                | `DESIGN.md` YAML 段落位置                                                                  | `DueDateHQ-DESIGN.md` §                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `stepper`                   | 追加到 `components:` 尾（`sidebar:` 之后、`genesis-odometer:` 之前的区块中 `stepper:` 位） | 新增 §14.1 Stepper（4 步向导步骤条）                                                     |
| `confidence-badge`          | 同上，紧随 `stepper:`                                                                      | 新增 §14.2 Confidence Badge（置信度徽章） + §14.7 needs_review 用色语义                  |
| `toast`                     | 同上，紧随 `confidence-badge:`                                                             | 新增 §14.3 Toast（3 tone + 2 variant）                                                   |
| `risk-row-high`             | 补齐到 `risk-row-critical:` 之后                                                           | 追加到 §14.3 规格段落的"对齐 §4.1 Risk Row"引用处（不新拆章节；指向 §4.1 Risk Row 表格） |
| `risk-row-upcoming`         | 紧随 `risk-row-high:`                                                                      | 同上                                                                                     |
| `genesis-odometer`          | 追加到 `sidebar:` 之后（新 block 首位）                                                    | 新增 §14.4 Genesis Odometer & Particles（含 `prefers-reduced-motion` 降级，对齐 §7.3）   |
| `genesis-particle`          | 紧随 `genesis-odometer:`                                                                   | 同上                                                                                     |
| `email-shell`               | 紧随 `genesis-particle:`，`stepper:` 之前                                                  | 新增 §14.5 Email Shell（HTML table 布局、hex 展开说明）                                  |
| Keyboard 裁定 `A` / `Enter` | —（非 token，YAML 不新增；裁定仅在本文件 + DueDateHQ-DESIGN §14.6）                        | 新增 §14.6 Keyboard                                                                      |

> 说明：`DESIGN.md` 正文 `## Components` 段末尾追加一小段 `### Migration Copilot 向导扩展 token` bullets 索引，指向本文件 + DueDateHQ-DESIGN §14。

---

## 11. 变更记录

| 版本 | 日期       | 作者       | 摘要                                                                                                                                          |
| ---- | ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0 | 2026-04-24 | Subagent F | 初稿：Stepper / Confidence Badge / Toast / risk-row 补漏 / Genesis Odometer / Genesis Particle / Email Shell / Keyboard 裁定 · 双文件回灌清单 |
