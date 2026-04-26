---
title: 'Entry surface 视觉一致性整理：root error boundary + onboarding eyebrow'
date: 2026-04-26
author: 'Codex'
---

# Entry surface 视觉一致性整理：root error boundary + onboarding eyebrow

范围：

- `apps/app/src/routes/error.tsx`
- `apps/app/src/routes/onboarding.tsx`
- `apps/app/src/i18n/locales/{en,zh-CN}/messages.{po,ts}`
- Figma file `due-date-hq-jhx-lyz` page `login & onboarding page` (`112:2`)

## 背景

Phase 0 的 entry surface 一共三屏（`/login` · `/onboarding` · root error boundary）。
登录改造对齐之后（dev-log `2026-04-26-login-design-system-alignment.md` +
`2026-04-26-root-error-boundary.md`）剩下两个 review 翻出来的小账：

1. **Root error boundary 视觉与 entry 家族脱节 + 文案误导**
   - `error.tsx` 用 Dify 风格 `bg-background-body`，但视觉邻居 `_entry-layout.tsx` 是
     `DESIGN.md §2.2` 钦定的 `bg-bg-canvas`。两者都解析到 `#ffffff`，不算 bug，是
     命名风格不齐。
   - 按钮文案 `Return to dashboard` 在未登录态会误导：用户撞 404 点击 → `<Link to="/" />`
     → `protectedLoader` 没 session → 又被弹回 `/login`。能 work，但语义错位。
   - Figma `login & onboarding page` (`112:2`) 之前只有 Sign In / Onboarding 两个 frame，
     错误页没有任何设计稿留底，reviewer 必须翻代码才能复述这页长什么样。

2. **Onboarding eyebrow 是个不兑现的 step counter**
   - `onboarding.tsx` 顶部 eyebrow 写 `STEP 01 · PRACTICE PROFILE`，但 onboarding surface
     只有这一屏：用户填 practice name 提交 → 直接 `navigate('/')` → dashboard shell 弹出
     Migration Wizard modal。**用户在 onboarding surface 上永远看不到 STEP 02**。
   - Login 的 eyebrow 是 `SIGN IN`（label 范式），onboarding 是 `STEP 01 · PRACTICE PROFILE`
     （计数器 + label），两屏共享同一套 chrome 但 eyebrow 语法结构不齐。
   - Migration Wizard 内部 (`features/migration/Stepper.tsx`) 自己的步骤从 1 重新开始，所以
     即使把它当成 onboarding 第二步，"STEP 01" 也对不上后续的步骤系统——两套 step
     counter 在用户视角下打架。

## 做了什么

### 1. Root error boundary 收敛到 entry 家族

- `apps/app/src/routes/error.tsx`
  - `bg-background-body` → `bg-bg-canvas`（与 `_entry-layout.tsx` / DESIGN.md §2.2 对齐）
  - `<Trans>Return to dashboard</Trans>` → `<Trans>Return home</Trans>`
- `apps/app/src/i18n/locales/{en,zh-CN}/messages.po`
  - 新 message `Return home`，zh-CN 翻成「返回首页」
  - 旧 `Return to dashboard` 自动标记为 `#~` obsolete

### 2. Onboarding eyebrow 从 step counter 降级为 label

- `apps/app/src/routes/onboarding.tsx`
  - `<Trans>STEP 01 · PRACTICE PROFILE</Trans>` → `<Trans>PRACTICE PROFILE</Trans>`
  - 视觉容器（圆角 pill / 间距 / mono caps / accent dot）保持不变；只是不再宣告
    一个虚假的多步流程
- `apps/app/src/i18n/locales/{en,zh-CN}/messages.po`
  - 新 message `PRACTICE PROFILE`，zh-CN 翻成「事务所资料」
  - 旧 `STEP 01 · PRACTICE PROFILE` 自动标记 obsolete
- `pnpm --filter @duedatehq/app i18n:compile` 重新产出 `messages.ts`

### 3. Figma 设计稿对齐

Page `login & onboarding page` (`112:2`)：

- **新增 frame** `Error — root boundary (default · 404)`，节点 `123:2`，
  位于 Onboarding (`119:2`) 右侧 `x=3040`，1440×900，与 Sign In ↔ Onboarding 间距 80px 一致
  - 1:1 镜像 `error.tsx`：白底 `bg-bg-canvas`，无 header / footer，居中 max-w 560 一列，
    gap 16
  - Alert / destructive：bg `state-destructive-hover` (#fef2f2)，border
    `state-destructive-hover-alt` (#fee2e2)，左上 lucide `AlertTriangle`
    `text-destructive` (#dc2626)，title `text-primary` (#0a2540) Inter Medium 12，
    description `text-destructive-secondary` (#ef4444) Inter Regular 12
  - Primary button：高 32 / 圆角 6，bg `components-button-primary-bg` (#5b5bd6)，
    text "Return home" 白 Inter Medium 12

- **修改** Onboarding eyebrow：
  - text node `120:5`：`STEP 01 · PRACTICE PROFILE` → `PRACTICE PROFILE`
  - frame node `120:3`：`Eyebrow / STEP 01` → `Eyebrow / PRACTICE PROFILE`，
    宽度由 250 收到 166（适配新文案）

## 为什么这样改

### Token 方向选 entry 家族而不是 dashboard 家族

Root error boundary 的触发场景里，pre-auth（`/login` 撞 404）和公开 catch-all 占多数；
这一类视觉上和 entry surface 同族（全屏单列、无侧边导航、无 firm 信息）。
DESIGN.md 是产品设计 SSoT，`bg-bg-canvas` 在那里有明文定义；entry shell 已经按这个方向
收敛过（dev-log `2026-04-26-login-design-system-alignment.md`）。把 `error.tsx` 拉过来
= 4 个 entry-like surface（Sign In / Onboarding / EntryShell / Error）保持同款 token，
未来要改家族色更稳。

dashboard `_layout.tsx` + migration features 还是 Dify 风格 `bg-background-body`，
本次不动——那是另一桩"DESIGN.md → Dify 命名整体迁移"的 PR，scope 不在这里。

### 错误页不加 EntryShell chrome

考虑过加 header / footer / locale switcher，理由是 pre-auth 也会被命中、视觉一致性更好。
最终按"就跟代码现在长得一样"做：错误页是中断态，单纯 Alert + button 居中最不分散
注意；如果未来想加 chrome，是单独一次产品决策。Figma frame 也按这个方向画。

### Onboarding eyebrow 选 label 范式而不是补完 step counter

三个候选方案：

| 方案                                                                       | 取舍                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------ |
| **A** 去掉 `STEP 01 ·`，eyebrow 变 `PRACTICE PROFILE`                      | 和 login `SIGN IN` 对齐成 label 范式；最诚实，不造概念 |
| **B** 改成 `WELCOME · PRACTICE PROFILE` 这类欢迎语                         | 仍是 label，但和 login 不对称（动作名词 vs 状态短语）  |
| **C** 真的把 onboarding 做成多步（邀请协作者 / 接入数据源 = STEP 02 / 03） | 要改 PRD / loader / DB 状态机，Phase 0 不做            |

选 A：onboarding 现在就是单屏，eyebrow 只能客观反映"这是练习信息那一栏"，不能预支
未来才有的步骤。Phase 1 如果真的拆出多步，再升级为 step counter 也很自然——把
`PRACTICE PROFILE` 重新写回 `STEP 01 · PRACTICE PROFILE` 就够。

### Figma frame 同 page 而不是单开 page

错误页和 Sign In / Onboarding 是同族 surface（都不进 dashboard shell），就近排列方便
译者 / reviewer 视觉对照。

## 验证

- `pnpm --filter @duedatehq/app i18n:extract`：drift check 干净
- `pnpm --filter @duedatehq/app i18n:compile`：catalog 重新产出
- `pnpm --filter @duedatehq/app test`：5 文件 / 37 用例全过
- Figma `get_screenshot` 复检 Error frame + Onboarding eyebrow 视觉

## 后续 / 未闭环

- 错误页未来若加 EntryShell chrome，DESIGN.md / 05-Frontend-Architecture.md 不需要改，
  仅需更新 Figma frame 和 `error.tsx`，dev-log 单独记一篇。
- DESIGN.md token 命名 vs Dify 命名的全局收敛仍在 backlog（dashboard `_layout`、
  migration features 都还是 Dify 风格）。任何一刀切都需要先在 ADR 里写决策。
- Onboarding 真的要拆成多步时（Phase 1 候选：邀请协作者 / 接入数据源），再升级
  eyebrow 为 step counter，并补完 STEP 02 / 03 的实际 surface。

## 相关文档（已确认无偏移）

- `docs/dev-file/05-Frontend-Architecture.md` §2 / §5：仅按名字引用 `RouteErrorBoundary`
  和路由结构，本次不动语义不需要更新
- `docs/dev-file/12-Marketing-Architecture.md`：仅提到 root boundary 存在，不动
- `docs/Design/DueDateHQ-DESIGN.md`：`--bg-canvas` 仍是 light/dark canvas 的钦定 token，
  本次让 `error.tsx` 回到这条路径，符合 DESIGN.md 的 SSoT 角色；onboarding eyebrow
  视觉不变（仍是 accent-tint pill + accent dot + mono caps 11px / 0.16em tracking），
  只改了 copy
- `docs/dev-log/2026-04-26-root-error-boundary.md`：架构层决策的历史记录，本次不修改
- `docs/dev-log/2026-04-26-login-design-system-alignment.md`：login eyebrow 范式的来源，
  本次让 onboarding eyebrow 跟齐
