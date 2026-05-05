# Migration Copilot · 13 · Onboarding Activation Route

> 版本：v1.0（Phase 0 · 2026-05-05）
> 上游：`./01-mvp-and-journeys.md` §5 · `./02-ux-4step-wizard.md` §1/§2 · `./03-onboarding-agent.md` §1.3 · `./11-agentic-enhancements.md` §4
> 入册位置：[`./README.md`](./README.md) §2 第 13 份

本文件固定 Practice onboarding 完成后的迁移交接：新建 practice 之后不再直接进入
Dashboard 并自动弹出 Migration dialog，而是进入 route-level activation surface。

## 1. 产品裁定

首登链路分三段：

1. `/onboarding`：只负责创建或激活 Practice workspace。
2. `/migration/new?source=onboarding`：渲染在 EntryShell（无 sidebar / AppShell）里，
   解释为什么下一步是导入客户，并在页面内承载 Migration Copilot 4 步 wizard。
3. `/` Dashboard：用户完成导入或主动 skip 后才进入日常 triage surface。

这个 route 不是长期导航目的地，也不进入 sidebar。它是 activation/setup path：把 CPA
已有客户表转换成 DueDateHQ 的 clients、obligations、evidence 和首个 dashboard risk view。

## 2. 首屏内容

Route 顶部是无卡片的页面说明区，和 EntryShell 的轻量过渡语义一致；只有下面的
Migration Copilot wizard 使用 workbench frame：

- eyebrow：`PRACTICE ACTIVATION`
- 标题：`Generate your first deadline queue.`
- 说明：workspace 已就绪；导入客户表后系统会生成 deadlines、evidence 和 dashboard risk。
- 后续入口说明：不准备导入时可以 skip，后续从 Dashboard、Clients 或 Command Palette
  再打开 `Import clients`。Skip 只出现在 route header，workbench frame 内不重复展示退出
  CTA；已有导入输入时点击 skip 或按 Esc 都先打开 discard confirmation。
- 结果清单：`Client facts`、`Deadline queue`、`Dashboard risk`。

页面下方直接渲染同一套 Migration Copilot wizard。用户不需要再点击一次“打开 dialog”。

## 3. Skip 与恢复

`Skip for now` 明确进入 Dashboard。Skip 不创建 batch、不写 audit、不消耗 AI budget。
进入 Dashboard 后，导入仍通过这些入口可达：

- Dashboard header / empty state：`Run migration`
- Clients header / empty state：`Import clients`
- Command Palette：`Import clients`

历史 `/imports` 继续只是兼容入口，跳到 `/clients?importHistory=open`。

## 4. 实现边界

- `/onboarding` 新建 practice 后跳 `/migration/new?source=onboarding`；复用已有 active
  practice 时继续尊重 `redirectTo`。
- `source=onboarding` 的 activation-complete 判断放在 route loader：当前 practice 已有 open
  obligations 或已有 applied migration batch 时，在页面渲染前直接进入 Dashboard。直接访问
  `/migration/new`（或未来显式 route 入口）不套用这个跳转，仍允许追加导入；当前
  Dashboard、Clients 和 Cmd-K operating surfaces 继续打开 dialog shell。
- Onboarding 来源 loader 会把当前 practice 一并交给 route permission guard，避免首屏重复读取
  firm 列表。
- Migration wizard 的 reducer、RPC mutation、Step 组件和 apply/revert 逻辑只能有一份。
- Route 属于 EntryShell 过渡 surface，不挂 AppShell、sidebar、practice switcher 或通知。
- Route 使用 EntryShell header，但隐藏 EntryShell footer；滚动只发生在 main 区域，避免 footer
  挤压 wizard。
- Route header 是唯一可见 skip 承载；route shell 仍监听 Esc，但 workbench header 不显示
  第二个 skip/close 控件。
- Dialog 入口和 route 入口只更换 shell。
- Dialog shell 保留给 Dashboard、Clients、Obligations empty state 和 Command Palette。
- Route shell 使用同一个 Stepper、processing overlay、footer、discard confirmation。
- 不使用 `location.state.autoOpenMigration` 作为首登交接机制。

## 5. 验收

- 新建 practice 后用户看到 route-level activation 解释，而不是 Dashboard 上的自动弹窗。
- Skip 后进入 Dashboard，并且后续导入入口文案清晰可见。
- Dialog 入口仍可从已有 operating surfaces 打开，且导入行为与 route 入口一致。
- 刷新 `/migration/new?source=onboarding` 不丢失 route 语义；未登录回 `/login`，无 active
  practice 回 `/onboarding`，完成或 skip 后才进入 Dashboard shell。

## 变更记录

| 版本 | 日期       | 作者  | 摘要                                                 |
| ---- | ---------- | ----- | ---------------------------------------------------- |
| v1.1 | 2026-05-05 | Codex | 将 onboarding 来源完成态收敛到 route loader          |
| v1.0 | 2026-05-05 | Codex | 固定首登 activation route 与 route/dialog shell 复用 |
