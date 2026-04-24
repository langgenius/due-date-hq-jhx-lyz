---
version: alpha
name: DueDateHQ
description: Dense CPA compliance workbench for dollar-aware deadline triage with glass-box provenance.
colors:
  primary: '#0A2540'
  secondary: '#475569'
  tertiary: '#5B5BD6'
  neutral: '#FFFFFF'
  surface-canvas: '#FFFFFF'
  surface-panel: '#FAFAFA'
  surface-elevated: '#FFFFFF'
  surface-subtle: '#F4F4F5'
  border-default: '#E5E7EB'
  border-strong: '#D4D4D8'
  border-subtle: '#F1F5F9'
  text-primary: '#0A2540'
  text-secondary: '#475569'
  text-muted: '#94A3B8'
  text-disabled: '#CBD5E1'
  accent-default: '#5B5BD6'
  accent-hover: '#4F46E5'
  accent-active: '#4338CA'
  accent-text: '#4338CA'
  accent-tint: '#F1F1FD'
  severity-critical: '#DC2626'
  severity-critical-tint: '#FEF2F2'
  severity-critical-border: '#FCA5A5'
  severity-high: '#EA580C'
  severity-high-tint: '#FFF7ED'
  severity-high-border: '#FDBA74'
  severity-medium: '#CA8A04'
  severity-medium-tint: '#FEFCE8'
  severity-medium-border: '#FDE68A'
  severity-neutral: '#475569'
  severity-neutral-tint: '#F8FAFC'
  status-done: '#059669'
  status-draft: '#64748B'
  status-waiting: '#0284C7'
  status-review: '#7C3AED'
typography:
  body:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
    fontFeature: "'cv11', 'ss01'"
  label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.08em
  title:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0px
  hero-metric:
    fontFamily: Geist Mono
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.02em
    fontFeature: "'tnum'"
  numeric:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0px
    fontFeature: "'tnum'"
rounded:
  sm: 4px
  md: 6px
  lg: 12px
spacing:
  0: 0px
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 24px
  6: 32px
  8: 48px
  12: 80px
components:
  button-primary:
    backgroundColor: '{colors.accent-default}'
    textColor: '#FFFFFF'
    typography: '{typography.body}'
    rounded: '{rounded.sm}'
    padding: 12px
    height: 32px
  button-secondary:
    backgroundColor: '{colors.surface-elevated}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.sm}'
    padding: 12px
    height: 32px
  risk-row-critical:
    backgroundColor: '{colors.severity-critical-tint}'
    textColor: '{colors.text-primary}'
    height: 36px
  risk-row-high:
    backgroundColor: '{colors.severity-high-tint}'
    textColor: '{colors.text-primary}'
    height: 36px
  risk-row-upcoming:
    backgroundColor: '{colors.severity-medium-tint}'
    textColor: '{colors.text-primary}'
    height: 36px
  hero-metric:
    backgroundColor: '{colors.surface-canvas}'
    textColor: '{colors.text-primary}'
    typography: '{typography.hero-metric}'
  pulse-banner:
    backgroundColor: '{colors.severity-medium-tint}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.md}'
  evidence-chip:
    backgroundColor: '{colors.surface-elevated}'
    textColor: '{colors.text-secondary}'
    typography: '{typography.numeric}'
    rounded: '{rounded.sm}'
    height: 18px
  command-palette:
    backgroundColor: '{colors.surface-elevated}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.lg}'
    width: 560px
  sidebar:
    backgroundColor: '{colors.surface-panel}'
    textColor: '{colors.text-secondary}'
    width: 220px
  genesis-odometer:
    typography: '{typography.hero-metric}'
    color: '{colors.text-primary}'
    digitEase: 'cubic-bezier(0.4, 0, 0.2, 1)'
    reduceMotionFadeInMs: 200
  genesis-particle:
    size: 6px
    color: '{colors.accent-default}'
    trailAlpha: 0.1
    bezier: [start, startPlus(0, -200), endPlus(0, -100), end]
    maxConcurrent: 30
  email-shell:
    width: 640px
    backgroundColor: '{colors.surface-canvas}'
    textColor: '{colors.text-primary}'
    typography: '{typography.body}'
    numericFontFamily: 'Geist Mono'
    footer:
      typography: '{typography.label}'
      color: '{colors.text-muted}'
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
  confidence-badge:
    height: 18px
    padding: '0 6px'
    rounded: '{rounded.sm}'
    typography: '{typography.numeric}'
    tone:
      high: { background: '{colors.accent-tint}', text: '{colors.accent-text}' }
      med: { background: '{colors.severity-neutral-tint}', text: '{colors.text-secondary}' }
      low: { background: '{colors.severity-medium-tint}', text: '{colors.text-primary}' }
  toast:
    width: 360px
    padding: 12px
    rounded: '{rounded.md}'
    typography: '{typography.body}'
    shadow: subtle
    tone:
      info: { background: '{colors.surface-elevated}', text: '{colors.text-primary}' }
      success: { background: '{colors.surface-elevated}', text: '{colors.status-done}' }
      warning: { background: '{colors.severity-medium-tint}', text: '{colors.text-primary}' }
    variant:
      default: { timeoutMs: 3000, undoTimeoutMs: 500 }
      persistent: { timeoutMs: null, expiresUsing: 'serverReturnedRevertibleUntil' }
---

# DueDateHQ Design System

## Overview

DueDateHQ uses a Ramp x Linear light workbench direction: precise, calm, dollar-aware, glass-box, and keyboard-first. The product is a CPA operational console, not a marketing site, financial app, or editorial surface.

The UI must prioritize dense scanning, clear risk hierarchy, and traceable evidence. Use semantic color only when it carries business meaning. Favor 1px hairlines, compact tables, and tabular numbers over decorative panels.

## Colors

The palette is semantic, not decorative. Navy is the authoritative text color, indigo is reserved for focus, selected navigation, and primary actions, and risk colors are the only intentionally saturated colors.

- Primary `#0A2540`: core headings, hero risk numbers, and client names.
- Secondary `#475569`: standard operational copy and table content.
- Tertiary `#5B5BD6`: CTA, focus, selected state, and active navigation.
- Neutral `#FFFFFF`: light workbench canvas.

Do not place raw color utilities in business components. Use semantic utilities such as `text-accent-default`, `bg-bg-panel`, `border-border-default`, and `text-severity-critical`.

## Typography

Inter is the UI font. Geist Mono is reserved for aligned operational data: amounts, days, dates, EINs, rule IDs, URLs, and source labels.

Default UI text is 13px. Metadata and table headers use 11px. Page and drawer titles use 16px. The dashboard risk hero uses 56px Geist Mono with tabular numbers and tight letter spacing.

All numbers that need vertical comparison must use mono tabular numerals.

## Layout

The spacing scale is based on 4px. Dashboard and Workboard views are full-width work surfaces. Settings and secondary content pages should stay around 880px max width. The sidebar is 220px on desktop. Right drawers are 400px, and modals are capped at 640px.

First screens must show useful work, not marketing chrome. Dashboard should reveal Pulse, the dollar risk hero, and at least eight customer rows. Workboard should reveal at least twelve rows.

## Elevation & Depth

Use borders before shadows. Cards are flat: elevated surface plus a 1px border, no shadow. Drawers, popovers, and tooltips may use the subtle shadow. Modals and command palette may use the overlay shadow.

Avoid nested cards and decorative depth. Depth exists to preserve focus and layering, not to create visual ornament.

## Shapes

Radii are intentionally restrained:

- 4px for chips, small controls, and compact buttons.
- 6px for default buttons, inputs, cards, banners, and dropdowns.
- 12px only for drawers, modals, and the command palette.

Do not use pill buttons, circular decorative controls, or radius above 12px.

## Components

Use shadcn Base UI `base-vega` primitives as the foundation. Project-specific components belong above them in this order: `routes -> features -> patterns -> primitives -> ui -> lib`.

Primary buttons use indigo and are reserved for the most important action on a surface. Risk rows encode severity with both label and color. Evidence chips are mandatory for AI output, rules, Pulse entries, and cited numeric claims. Command palette, drawer, and toast behavior must remain keyboard-friendly.

No provenance means no render. If an AI output lacks `source_url`, `verified_at`, and `verbatim_quote`, show a verification-needed state instead of a recommendation.

### Migration Copilot 向导扩展 token

Demo Sprint 期间新增的 Migration Copilot 相关 token 已追加到 front-matter `components:` 段；详细使用说明 + 可达性规格见 `docs/Design/DueDateHQ-DESIGN.md` §14 Migration Copilot 向导 与 `docs/product-design/migration-copilot/09-design-system-deltas.md`。

- `stepper` · 4 步向导步骤条；5 状态（current / completed / upcoming / error / disabled）；`Enter` 与数字键 1-4 **不**跳步
- `confidence-badge` · 3 档置信度（high ≥ 0.95 / med 0.80–0.94 / low < 0.80）；色系与 severity / status 解耦；**数据质量类 needs_review 走 severity-medium 黄，工作流 Review 走 status-review 紫**（ADR 0011 Decision III 裁定）
- `toast` · 3 tone（info / success / warning）× 2 variant（default 3s + 500ms undo / persistent 至服务端返回的 `revertible_until` 过期，前端不本地倒计时）
- `risk-row-high` / `risk-row-upcoming` · 补齐 severity-high / severity-medium 两档行视觉，与 `risk-row-critical` 组成 Dashboard / Dry-run 三档表格行
- `genesis-odometer` / `genesis-particle` · Live Genesis 顶栏数字滚动 + 粒子弧线；`prefers-reduced-motion` 降级为 200ms fade-in
- `email-shell` · Migration Report 邮件外壳（640px table 布局 + Geist Mono tabular num）

## Do's and Don'ts

Do use gray for OK or not urgent states. Do express risk in dollars before days. Do keep amount, date, deadline, EIN, and source labels in mono tabular numerals. Do keep UI dense, flat, and scannable.

Don't use gradients, decorative glows, large shadows, or rounded SaaS template styling. Don't use green for safe states; green is only for filed, done, or applied. Don't render AI advice without evidence. Don't use raw Tailwind color utilities in business components.
