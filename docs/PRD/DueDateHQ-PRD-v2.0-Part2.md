# DueDateHQ PRD v2.0 — Unified PRD · Part 2（§7–§19：其他功能 + 数据 + 工程 + 运营）

> 文档类型：产品需求文档（统一版 / Build-complete PRD）· **Part 2 / 2**
> 版本：v2.0（集成 v1.0 主 PRD 与 v1.0-FileInTime-Competitor 优势）
> 日期：2026-04-23

> **📄 分册导航**
>
> - **Part 1**：§0 版本对比 · §1 产品定位 · §2 用户与场景 · §3 用户故事与 AC · §4 功能范围 · §5 核心页面 · §6 / §6A / §6B / §6C / §6D 四大亮点模块 → 见 [`DueDateHQ-PRD-v2.0-Unified-Part1.md`](./DueDateHQ-PRD-v2.0-Unified-Part1.md)
> - **Part 2（本册）**：§7 其他核心功能 · §8 数据模型 · §9 AI 架构 · §10 UI/UX · §11 信息架构 · §12 指标 · §13 安全合规 · §14 路线图 · §15 GTM Playbook · §16 风险 · §17 交付物 · §18 附录 · §19 产品一句话

---

## 7. 其他核心功能规格

### 7.1 Reminders（P0-21 / P0-22）

#### 7.1.1 阶梯规则

| 触发日    | 渠道           | 内容                              |
| --------- | -------------- | --------------------------------- |
| due - 30d | Email          | 温和提醒 + 建议动作 + source link |
| due - 7d  | Email + In-app | 紧急提醒 + Penalty $              |
| due - 1d  | Email + In-app | 最后提醒                          |
| overdue   | In-app daily   | 红色警示                          |

#### 7.1.2 模板（含上下文）

```
Subject: [DueDateHQ] Acme LLC — CA Franchise Tax due in 7 days

Hi Sarah,

Here's your 7-day reminder:

  Client:       Acme LLC
  Form:         CA Form 3522 (Franchise Tax)
  Due date:     March 15, 2026
  Days left:    7
  $ at risk:    $4,200 if missed 90 days
  Status:       Waiting on client
  Source:       CA FTB Publication 3556
                https://ftb.ca.gov/forms/misc/3556.html
  Verified by DueDateHQ on 2026-04-12.

[Open in DueDateHQ]   [Mark as handled]   [Snooze reminders]

AI-assisted. Verify with official sources.
```

#### 7.1.3 Team 路由规则（§3.6 Gap 4）

| 通知类型                         | 默认收件人（Solo） | 默认收件人（Team）                                                                                                            |
| -------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Reminder 30d**                 | Owner              | Assignee（未分派 fallback 到 default_assignee）                                                                               |
| **Reminder 7d**                  | Owner              | Assignee + cc Owner                                                                                                           |
| **Reminder 1d**                  | Owner              | Assignee + cc Owner + cc Manager                                                                                              |
| **Overdue（每日）**              | Owner              | Owner + Manager（即便 assignee 为空也升级）                                                                                   |
| **Weekly Brief 邮件（Mon 8am）** | Owner              | **每人一份**（按 `scope=me` 过滤生成），Owner / Manager 收 Firm-wide 版；Preparer 收 My work 版；Coordinator 收简化版（无 $） |
| **In-app 未读计数**              | Owner              | **per-user**（bell icon 只计自己的）                                                                                          |

#### 7.1.4 用户偏好

Settings → Notifications：

- 全局开关
- 按渠道开关（Email / In-app）
- 按类型开关（Reminders / Pulse / Weekly Brief）
- Pulse 通知不可关闭（法定级），但可切 Daily Digest
- **Manager 额外选项**：`Subscribe to all firm Pulse alerts`（订阅全量 Firm Pulse，默认关）
- **Manager / Owner 额外选项**：`Receive reminders for unassigned obligations`（默认开）

### 7.2 Status & Readiness 状态机（P0-16）

```
Status:
  not_started → in_progress → (filed | paid | extended | not_applicable)
  + waiting_on_client (subflow)
  + needs_review (quality gate)

Readiness (independent of status):
  ready / waiting_on_client / needs_review

Extension Decision (P1-9):
  not_considered / applied / rejected
```

### 7.3 Extension Decision Panel（P1-9 · 场景 C）

```
┌─ Extension decision · Acme LLC · 1120-S ──────────┐
│                                                    │
│  Current situation                                 │
│    Due: Mar 15 · 5 days                            │
│    Readiness: Waiting on K-1                       │
│    $ at risk if missed: ~$2,800                    │
│                                                    │
│  Extension (Form 7004)                             │
│    New filing due: Sep 15 (+6 months)              │
│    Payment still due Mar 15 (no extension of $)    │
│    Source: IRS Pub 7004                            │
│                                                    │
│  What-If Simulator                                 │
│    ○ File on time        $0 penalty                │
│    ● Extend + pay est.   $0 penalty (recommended)  │
│    ○ Extend + no pay     $21/mo interest           │
│    ○ Miss both           $210/mo × 5 = $1,050 max  │
│                                                    │
│  [Apply extension]   [Cancel]                      │
└────────────────────────────────────────────────────┘
```

### 7.4 Client PDF Report（P1-10 · VPC Medium）

一客户一份 PDF（也可单 obligation 生成），Letter 尺寸：

```
─────────────────────────────────────────
 DueDateHQ · Tax Deadlines for Acme LLC
 Prepared by Sarah Mitchell, CPA · 2026-04-23
─────────────────────────────────────────

Next 90 days                    3 items · $4,200 at risk
───────────────────────────────────────
Mar 15   CA Franchise Tax — $800 min       $4,200 at risk
          Source: CA FTB Pub 3556 · verified 2026-04-12
Apr 15   Form 1120-S                        $2,100 at risk
          Source: IRS Publication 509
Jun 15   Q2 Estimated Tax (Federal)         $  800 at risk
───────────────────────────────────────
Full year 2026 calendar  ………………  (table view)

Notes & assumptions
 • Exposure amounts are estimates based on IRC §6651 formulas.
 • Not tax advice. See your CPA for decisions.

Every item in this report has a source link.
Verified by DueDateHQ Glass-Box engine as of 2026-04-23.
─────────────────────────────────────────
```

**实现：**

- 入口：Client Detail → `Export PDF`；Workboard bulk `Export selected as PDF`
- 技术：`@react-pdf/renderer`，S3 存储，邮件链接 24h 过期
- 不嵌入 AI narrative；只嵌入 **已 human-verified 的 rule + penalty 数字**（避免把 LLM 幻觉送客户）
- 每条 obligation 右下 QR 码回链到在线 Evidence Mode

### 7.5 Penalty Radar™（P0-18 · 跨页面）

#### 7.5.1 为什么必须做

CPA 的脑回路："客户会怪我什么？" → 怪你让他多交了钱。DueDateHQ 把风险单位从"天数"换成"美元"，直接对接 CPA 的职业恐惧。

#### 7.5.2 美元敞口计算（纯函数 · 零幻觉 · 融合两份 PRD）

```typescript
// Formulas from IRS IRC §6651 + public state statutes.
function estimateExposure(o: ObligationInstance, c: Client): ExposureReport {
  const months_late = monthsBetween(o.current_due_date, today)

  // Federal
  const failure_to_file = min(0.05 * months_late, 0.25) * o.estimated_tax_due
  const failure_to_pay = min(0.005 * months_late, 0.25) * o.estimated_tax_due
  const interest = months_late * (AFR_SHORT_TERM / 12) * o.estimated_tax_due

  // State surcharge lookup (§7.5.3)
  const state_surcharge = lookupStatePenalty(o.state, o.tax_type, o.estimated_tax_due, months_late)

  // Per-partner / per-shareholder (1065 / 1120-S)
  const per_partner =
    o.tax_type === 'federal_1065' || o.tax_type === 'federal_1120s'
      ? 245 * min(months_late, 12) * (c.num_partners || 1)
      : 0

  const total = failure_to_file + failure_to_pay + interest + state_surcharge + per_partner

  return {
    failure_to_file,
    failure_to_pay,
    interest,
    state_surcharge,
    per_partner,
    total,
    assumptions: [
      `estimated_tax_due = $${o.estimated_tax_due} (source: ${o.estimated_tax_due_source})`,
      `AFR_SHORT_TERM = ${AFR_SHORT_TERM * 100}% (source: IRS Rev Rul 2026-xx)`,
    ],
    source_urls: [
      'https://www.irs.gov/publications/p17', // IRC §6651
      stateSourceUrl(o.state, o.tax_type),
    ],
    confidence: o.estimated_tax_due_source === 'user_entered' ? 'high' : 'industry_median',
  }
}
```

#### 7.5.3 计算表（硬编码、官方规则）

| 表单             | 基础规则                       | Liability 来源                                            | 覆盖 |
| ---------------- | ------------------------------ | --------------------------------------------------------- | ---- |
| 1040             | 5%/mo FTF + 0.5%/mo FTP        | `estimated_tax_liability`（可选，无则返回 `needs_input`） | ✓    |
| 1065             | $245/partner/mo × up to 12     | `num_partners`                                            | ✓    |
| 1120-S           | $245/shareholder/mo × up to 12 | `num_shareholders`                                        | ✓    |
| 1120             | 5%/mo FTF + 0.5%/mo FTP        | `estimated_tax_liability`                                 | ✓    |
| CA Franchise Tax | $800 min + 5%/mo               | 固定                                                      | ✓    |
| NY PTET / CT-3-S | 查 rule.penalty_formula        | 按表单                                                    | ✓    |
| TX Franchise Tax | 5% 1-30d / 10% > 30d late      | 按 revenue                                                | ✓    |
| FL F-1120        | 10% base + 5%/mo               | 按 liability                                              | ✓    |
| WA B&O           | 5% base + 1%/mo                | 按 B&O tax due                                            | ✓    |
| MA Form 1        | 1%/mo FTF + 1%/mo FTP          | 按 liability                                              | ✓    |
| 命中不了         | 返回 `null`，UI 不显示胶囊     | —                                                         | —    |

#### 7.5.4 UI 呈现

- **Dashboard 顶栏聚合**：`This week: $X at risk` + up/down 箭头 + 上周对比
- **每条 TriageCard / Workboard 行**：`$X at risk` 胶囊，hover 显示细分
- **What-If Simulator**（P1-9 配套）：滑块 30 / 60 / 90 / 180 天 → 实时敞口曲线
- **"Needs input" 降级**：未填 `estimated_tax_liability` 时，胶囊显示 `needs input` 而非 `$0`，点击打开 Edit 对话框

#### 7.5.5 用户覆盖

CPA 可手动覆盖某条 obligation 的 `estimated_tax_liability`，写 `audit_event(action='penalty.override', before, after)`。

#### 7.5.6 ★ Scoreboard 游戏化规格（集训记忆钩子）

> 所有组都会做美元敞口数字。本节规定**怎么把它做成"赌场分数面板级别"**的视觉体验——让现场观众 2 小时看 20 组 Demo 后仍记得这一个数字。

##### 7.5.6.1 顶栏 Hero 视觉规格

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│        $31,400    at risk this week                          │
│   ─────────────                                              │
│        ▲ up $3,100 vs last week  ·  trending ↗               │
│                                                              │
│   🔴 Critical (3)   🟠 High (7)   🟡 Upcoming (12)            │
│                                                              │
│   [ This Week ▾ ]  [ Sparkline of last 8 weeks — 📊 ]        │
└──────────────────────────────────────────────────────────────┘
```

| 元素      | 规格                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| 金额数字  | **76px** JetBrains Mono **Bold** / `tabular-nums`（等宽对齐）/ 字间距 -0.02em                               |
| 金额颜色  | $10k+ = Ruby `#EF4444` / $1k–10k = Amber `#F59E0B` / <$1k = Emerald `#10B981` / $0 = 灰 `#8a8a8a` + 🎉 icon |
| 单位后缀  | `at risk this week` — 13px Inter Medium slate 灰                                                            |
| 对比行    | `▲ up $3,100 vs last week` — 箭头随趋势变色 / 字号 14px                                                     |
| 趋势箭头  | ↗ 红 `#EF4444`（总额在升）/ ↘ 绿 `#10B981`（总额在降）/ → 灰（持平 ±5%）                                    |
| Sparkline | 过去 8 周 mini line chart，hover 显示每周数字                                                               |
| 周期切换  | `This Week / This Month / All Open / Custom Range` 下拉，URL 持久化                                         |

##### 7.5.6.2 数字滚动动画（"Odometer Roll"）

触发：任意导致聚合 $ 变化的操作。

```typescript
// Framer Motion / react-spring 实现 · rAF-based tween
function animateCounter(from: number, to: number) {
  const duration = Math.min(800, Math.abs(to - from) / 5) // 最长 0.8s
  const easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)' // 弹性收尾
  // 每 16ms 刷新一次，每位数字独立 tween，像老虎机滚动
}
```

**关键细节：**

- 每一位数字独立滚动（千位、百位、十位、个位**错峰到位** ≈ 80ms stagger）
- 数字下降（减少敞口）= 柔和 odometer 滚动
- 数字上升（增加敞口）= 同滚动 + 轻微红色短促 shake（200ms，±2px x 轴）
- Live Genesis 时：**粒子动画** `+$4,200` `+$2,800` `+$1,650` 从每张新生成的 deadline 卡片**弧线飞入顶栏**，消失瞬间顶栏数字对应增长

##### 7.5.6.3 状态变化反馈（"Score Pop")

```
事件                         视觉反馈
──────────────────────────────────────────────────────────────
Mark Filed / Paid            顶栏 -$X，绿色 halo pulse（800ms）
                            + 卡片淡出 + 短音效 "chime"（可选）
Mark Extended                 顶栏 -$X，琥珀色 halo
Pulse Batch Apply (20 条)    顶栏 -$Y（总），琥珀 + 绿混合脉冲
Import（Live Genesis）       顶栏 从 0 奔跑到 final，粒子雨
New overdue（定时任务）      顶栏 +$Z，红色短促 shake +
                            顶栏短暂显示 `+$Z overdue` banner 3s
```

所有动效**尊重 `prefers-reduced-motion`**：系统设置 reduce 时退化为瞬时切换 + 文字 toast。

##### 7.5.6.4 Milestone 庆祝（Confetti · 稀缺性设计）

这是 Scoreboard 的情感高点。必须稀缺，否则就变成噪音。

| Milestone              | 触发条件                       | 庆祝形式                                                                                      |
| ---------------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| 🎯 **Zero Week**       | 本周 $ at risk 从正数降到 $0   | 全屏 canvas-confetti 彩带 + 顶栏 🎉 icon 替换数字 + Toast `Zero risk this week. Nicely done.` |
| 🏆 **Streak +3 Weeks** | 连续 3 个自然周 Zero Week      | 徽章永久加到 Profile + 弱化版彩带                                                             |
| 💪 **Big Drop**        | 单次操作使 $ 减少 > $10,000    | 半屏 confetti + Toast `$10k+ wiped in one move.`                                              |
| 🔥 **Firm Best**       | 本周总额低于 firm 历史同期最低 | Sparkline 上 firm-best 线位置高亮 + 弱庆祝                                                    |

**每周最多展示 1 次全屏 confetti，避免滥情。** Settings 可关闭庆祝（"Focus mode"）。

##### 7.5.6.5 Scoreboard Feed（类 Strava Activity Feed）

顶栏旁边可折叠的小侧栏（P1），显示本周已完成的"杀分数"动作：

```
This week's wins
────────────────
✓ 14:32  Acme LLC · CA Franchise filed            −$4,200
✓ 11:08  Bright Studio · 1120-S extended          −$2,800
✓ 09:41  12 clients · CA storm relief applied     −$6,500
✓ Mon    Zen Holdings · Q1 Est. paid              −$1,650
────────────────
Total this week: −$15,150
```

- 每条是一次"减分动作"带时间戳 + 操作者（Team 版显示 actor）
- 点任一条 → 打开对应 Obligation / Pulse Detail
- Weekly Summary 邮件周一 8am 把本 feed 发 Owner（"Here's what your firm crushed last week"）

##### 7.5.6.6 响应式与移动端

| Breakpoint | 金额字号             | 布局                            |
| ---------- | -------------------- | ------------------------------- |
| ≥1280px    | 76px                 | 顶栏 Hero 横排 + Sparkline 右侧 |
| 1024–1279  | 64px                 | 同上 + Sparkline 下折           |
| 768–1023   | 52px                 | Sparkline 收折入 hover tooltip  |
| <768       | 44px + 缩写 `$31.4k` | 对比行收折入点击展开            |

##### 7.5.6.7 无障碍

- 每次数字变化触发 `aria-live="polite"` 通告：`Penalty radar updated to thirty-one thousand four hundred dollars`
- 彩带动画全程非阻塞（`pointer-events: none`）
- 庆祝有"关闭动效"偏好 + 纯文本 toast 备份

##### 7.5.6.8 工程估算

- 核心 Odometer 滚动：`react-odometerjs` 或手写 ≈ 0.3 人天
- 状态反馈 halo / shake：Tailwind 动画 class + Framer Motion ≈ 0.4 人天
- Live Genesis 粒子：CSS keyframes + 5 个 div 粒子预计 ≈ 0.5 人天
- Confetti：`canvas-confetti` 现成库 ≈ 0.1 人天
- Scoreboard Feed：复用 AuditEvent 查询 ≈ 0.3 人天

**合计 ≈ 1.5 人天。投入产出比在整份 PRD 里 Top 3。**

##### 7.5.6.9 Demo Day 的使用（与 §15.3 联动）

- **90–180s 段** Live Genesis：粒子飞入是"入场秀"
- **Mark Filed 那一下**：-$4,200 + 绿色 pulse = 现场观众脑内的"多巴胺瞬间"
- **Pulse Batch Apply 那一下**：-$6,500 + 琥珀脉冲 = "这个工具是有魔力的"感知

这三下组合在一起，就是"赌场分数面板"的叙事闭环。

### 7.6 Cmd-K 命令面板（P1-14）

三合一：

```
┌─ Cmd-K ─────────────────────────────────────────┐
│  [Search] [Ask ✨] [Navigate]                    │
├──────────────────────────────────────────────────┤
│  Search:                                         │
│    > acme                                        │
│    Clients: Acme LLC · Acme Industries          │
│    Obligations: Acme LLC — CA Franchise · 3d    │
│    Rules: CA Franchise Tax Rule v3.2            │
│                                                  │
│  Ask ✨:                                         │
│    > Which clients owe CA PTE this month?       │
│                                                  │
│  Navigate:                                       │
│    > import                                      │
│    Import clients → Paste / Upload / Preset     │
│    Settings → Imports History                    │
└──────────────────────────────────────────────────┘
```

### 7.7 Keyboard Shortcuts（P1-15）

| 键             | 动作                       | 范围              |
| -------------- | -------------------------- | ----------------- |
| `?`            | 显示所有快捷键             | 全局              |
| `Cmd/Ctrl + K` | 命令面板                   | 全局              |
| `Cmd/Ctrl + E` | Evidence Mode for selected | 全局              |
| `/`            | 聚焦 Ask 输入框            | 全局              |
| `J / K`        | 上下行                     | Workboard / Lists |
| `Enter`        | 打开详情                   | Workboard         |
| `E`            | 展开 Evidence              | 列表              |
| `F`            | Mark Filed                 | 列表              |
| `X`            | Mark Extended              | 列表              |
| `I`            | Mark In progress           | 列表              |
| `W`            | Mark Waiting on client     | 列表              |
| `G then D`     | 跳 Dashboard               | 全局              |
| `G then W`     | 跳 Workboard               | 全局              |
| `G then C`     | 跳 Clients                 | 全局              |
| `G then A`     | 跳 Alerts                  | 全局              |

### 7.8 PWA 壳 与 Native Wrappers（交付形态补强）

> 本节明确 DueDateHQ 的"跨设备交付战略"：**坚持 Web-first，但通过 PWA + macOS Menu Bar Widget 两层壳补齐 native 体验**，在保留 cloud-native 优势的同时消除"浏览器 tab 迷失 / 推送不及时 / 与桌面体验脱节"的痛点。
>
> 战略意图：在对 File In Time 的竞品叙事里补足最后一维 —— **"FIT 是一个桌面软件；DueDateHQ 是一个无处不在的税务副驾"**。

#### 7.8.1 PWA 壳（P1-36 · 必做）

##### 能力清单

| 能力                          | 覆盖平台                                                        | 用户体感                                                                      |
| ----------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Add to Dock / Home Screen** | macOS Safari+Chrome · Windows Chrome+Edge · iOS 16.4+ · Android | Dock / Home 独立图标；点击启动独立窗口，无浏览器 UI；开机自启（macOS）        |
| **独立窗口**                  | 所有桌面平台                                                    | 不再被隐藏在 100 个 Chrome tab 里；alt-tab 可见                               |
| **Web Push Notification**     | macOS 16+ / Windows 10+ / iOS 16.4+ / Android                   | IRS Pulse / Overdue / Client Readiness 实时推送到设备通知中心                 |
| **Offline Cache（最近数据）** | 所有平台                                                        | 飞机上或地铁隧道仍能看 Dashboard 近 24h 数据，恢复网络自动同步                |
| **App Badge（未读数）**       | macOS Dock / Android Home                                       | Dock 图标右上角红点显示 overdue count（等同原生 iMessage）                    |
| **Install Prompt 时机**       | Chrome/Edge 自动触发                                            | 用户第 3 次访问 + 完成 Migration 后 inline 提示 `Add DueDateHQ to your Dock?` |

##### 工程交付（≈ 0.5 人天）

```
public/manifest.json          # PWA manifest（name / icons / theme_color / display=standalone）
public/sw.js                  # Service worker (Workbox 生成)
src/lib/push/
  subscribe.ts                # 前端请求权限 + 注册 subscription
  register-sw.ts              # SW 注册 + 更新提示
  handlers/                   # Push / fetch / sync handlers
app/api/push/
  subscribe/route.ts          # 后端存储 PushSubscription
  send/route.ts               # VAPID 签名 + 推送分发
```

依赖：VAPID 密钥对（环境变量）+ Workers-compatible Web Push/VAPID 实现 + Workbox CLI。无额外 infra；不得默认选择依赖 Node-only API 的 push 库，除非已在 `workerd` 下验证。

##### 推送事件映射

| 事件类型                      | 推送条件                               | 默认开关               | Setting 路径             |
| ----------------------------- | -------------------------------------- | ---------------------- | ------------------------ |
| **Pulse Applied**             | 新 Pulse approved 且匹配到受影响客户   | **强制开启**（法定级） | —                        |
| **Obligation Overdue**        | 任意 obligation 超过 due_date 未 Filed | 默认开                 | Settings → Notifications |
| **Client Readiness Response** | 客户在 Readiness Portal 提交           | 默认开                 | Settings → Notifications |
| **Quiet Hours 尊重**          | 23:00–06:00 本地时间                   | 默认开                 | Settings → Notifications |
| **Weekly Rhythm Report**      | 周一 8am（同 §6D.6）                   | 默认关                 | Settings → Notifications |

##### 验收（T-PWA-\*）

| Test ID  | 描述                        | 预期                                                                      |
| -------- | --------------------------- | ------------------------------------------------------------------------- |
| T-PWA-01 | macOS Safari 首访           | 地址栏右侧显示 Install 图标                                               |
| T-PWA-02 | 点 Install → 出现 Dock 图标 | 独立窗口启动，无 Safari UI                                                |
| T-PWA-03 | iPhone 添加到主屏           | 全屏启动 + Status bar 匹配主题                                            |
| T-PWA-04 | Pulse Approved              | 桌面 + 手机 2s 内 native 通知到达                                         |
| T-PWA-05 | 离线打开 app                | Dashboard 加载缓存数据 + 顶部 banner `Offline — showing last sync 2h ago` |
| T-PWA-06 | 点击通知跳转                | 唤起独立窗口 + 直接跳 Pulse Detail                                        |
| T-PWA-07 | Quiet Hours 内推送          | 仅系统 silent 投递，不弹声响                                              |
| T-PWA-08 | 一用户多设备订阅            | 同一事件在所有设备送达（去重按 endpoint）                                 |
| T-PWA-09 | 取消订阅                    | 从 Settings 关闭 + 立即失效                                               |

##### 与 Penalty Radar Scoreboard 联动

PWA 壳内**Dock / Home 图标的 App Badge 实时显示 overdue count**：

```
Dock icon:  [DueDateHQ] · 🔴 3   ← 3 overdue obligations
```

这是 FIT 绝对做不到的 OS 级集成信号。

#### 7.8.2 macOS Menu Bar Widget（P1-37 · Phase 2 · 可选差异化）

##### 目标与边界

**只做一件事**：在 macOS menu bar 永久显示一行：

```
◎ DueDateHQ · $31,400 at risk · 3 overdue
```

- 点击 → 小下拉面板（最紧急 3 条 + `Open Dashboard`）
- 不复制主 App 功能，是 **Web 的"瞭望塔"**
- 与 §7.5.6 Penalty Scoreboard 游戏化叙事一致 —— "你的分数 24/7 在 menu bar 跳动"

##### 技术选型

| 方案                     | 权衡                                            |
| ------------------------ | ----------------------------------------------- |
| **Tauri + Rust**（推荐） | 体积 ≈ 1 MB，跨平台未来可扩 Windows；学习曲线低 |
| SwiftUI menu bar app     | 体积 ≈ 400 KB，macOS 最 native；但只覆盖 macOS  |
| Electron menubar         | 体积 > 100 MB，不考虑                           |

Phase 2 先做 Tauri 版（跨平台 future-proof），SwiftUI 视 GTM 需求决定。

##### 工程估算（≈ 2 人天）

- Tauri 壳 + menu bar icon + 下拉面板 UI ≈ 1 人天
- 轮询 API `/api/v1/me/radar-summary`（30s 间隔）+ auth token 同步 ≈ 0.5 人天
- 点击唤起浏览器主 Dashboard（深链 URL handler）≈ 0.3 人天
- 签名 + 打包 + Sparkle auto-update ≈ 0.2 人天

##### 验收（T-MB-\*）

| Test ID | 描述                  | 预期                                                   |
| ------- | --------------------- | ------------------------------------------------------ |
| T-MB-01 | 安装后首次启动        | menu bar 图标 + 默认 hover 提示 `Sign in to DueDateHQ` |
| T-MB-02 | 登录后 30s 内         | menu bar 显示 `$ at risk + overdue count`              |
| T-MB-03 | Dashboard 改变状态    | 30s 内 menu bar 数字同步                               |
| T-MB-04 | 点击 menu bar         | 下拉面板显示 top 3 urgent + `Open Dashboard`           |
| T-MB-05 | 点击 `Open Dashboard` | 唤起浏览器/PWA 到 Dashboard，已登录态                  |
| T-MB-06 | 退出账号              | menu bar 降级为 `DueDateHQ · Sign in`                  |
| T-MB-07 | 自动更新              | Sparkle 检查到新版 → 无感更新                          |

#### 7.8.3 明确不做的 Native 选项

| 选项                             | 不做原因                                                |
| -------------------------------- | ------------------------------------------------------- |
| ❌ 独立 Electron 桌面 App        | PWA 已覆盖 95% 体验，Electron 启动慢、内存大、双份维护  |
| ❌ 独立 iOS / Android Native App | PWA + Web Push 已够；native 复制功能违背 web-first 战略 |
| ❌ 独立 Windows exe              | File In Time 就是走这条路，**主动走它的弱点无意义**     |
| ❌ iPad 专用 App                 | 响应式 Web + PWA 已覆盖 95%                             |
| ❌ iOS / Android Share Extension | 产品决策排除（不进入 Phase 计划）                       |

#### 7.8.4 Landing Page `/get` 展示页

公开页说明三层交付形态（P1-36 / P1-37），配截图：

```
Get DueDateHQ on every device

🌐 Browser       Any modern browser        Sign in →

📱 Add to Home   iOS / Android             Instructions →
                 (PWA · offline + push)

💻 Add to Dock   macOS / Windows           Instructions →
                 (PWA · independent window + badge)

🎛 Menu Bar     macOS only (Phase 2)       Download →
                 ($ at risk glanceable 24/7)

All devices stay in sync. One account, one source of truth.
No app stores, no installers — DueDateHQ runs everywhere
the web does.
```

#### 7.8.5 对 File In Time 的 Native 差异化叙事

| 维度        | File In Time                   | DueDateHQ (Web + PWA + Menu Bar)                       |
| ----------- | ------------------------------ | ------------------------------------------------------ |
| 安装摩擦    | 下载 .exe → 安装 → 授权 → 重启 | Web 访问即用；Add to Dock 2 下完成                     |
| 平台覆盖    | Windows only                   | macOS / Windows / iOS / Android / Linux 全覆盖         |
| 跨设备      | ❌                             | ✓ Push / Badge / 同步状态                              |
| 更新方式    | 下发 CD / 年度维护包           | Web 秒级、PWA 自动更新、Menu Bar Sparkle 后台更新      |
| OS 集成信号 | 仅 Windows tray                | macOS Dock badge + menu bar + iOS Home + Android badge |
| 离线能力    | 本机数据库                     | Service Worker 缓存近 24h 数据                         |
| 通知        | 无（桌面软件靠弹窗）           | 系统级 push 跨设备到达                                 |

这条与 §6D.10 的 Rules-as-Asset 打击表合并，就是对 FIT 的**双面合围叙事**：

- **规则资产层**（§6D.10）：从"年度维护包"打到"持续 freshness 流水"
- **交付形态层**（本节）：从"Windows 独占"打到"无处不在"

---

## 8. 数据模型

### 8.1 核心实体

```
Firm (tenant)
  id, name, slug, timezone, plan (solo/firm/pro),
  seat_limit,                        -- derived from plan (1/5/10)
  owner_user_id,                     -- FK to User，转让时修改
  default_assignee_strategy,         -- owner | round_robin | none
  coordinator_can_see_dollars,       -- bool, default false
  created_at, deleted_at             -- soft delete with 30d grace

User (identity, email-unique)
  id, email, display_name,
  mfa_enabled, last_login_at,
  default_firm_id,                   -- last-used firm for login redirect
  created_at, deleted_at             -- GDPR 软删

UserFirmMembership (多对多 · P1 启用, P0 预留)
  id, user_id, firm_id,
  role (owner|manager|preparer|coordinator),
  status (active|invited|suspended|left),
  invited_by_user_id, invited_at, accepted_at, suspended_at, left_at,
  last_active_at,
  notification_prefs_json             -- per-membership 通知偏好

TeamInvitation
  id, firm_id, invited_email, role,
  invite_token (signed), expires_at,
  invited_by_user_id, accepted_at, revoked_at, created_at

Client
  id, firm_id, name,
  ein,                               -- NEW: "##-#######" format
  entity_type, state, county,
  tax_types[],                       -- nullable, fallback to Default Matrix
  importance (high/med/low),
  num_partners, num_shareholders,    -- for Penalty per-partner calc
  estimated_tax_liability,           -- optional, for Penalty Radar
  assignee_id, email, notes,
  migration_batch_id                 -- nullable, for Revert

ObligationRule (base rule · Rules-as-Asset 核心实体 · §6D)
  id, jurisdiction, entity_applicability[], tax_type, form_name,
  due_date_logic (DSL/json),
  extension_policy, is_payment, is_filing,
  penalty_formula,                   -- for Penalty Radar
  default_tip,                       -- fallback for Deadline Tip
  source_url, source_title,          -- NEW (§6D.8): 官方文档全名
  statutory_ref, verbatim_quote,
  verified_by, verified_at, next_review_at,
  version,
  coverage_status (full|skeleton|manual), active,
  -- Rules-as-Asset 新增字段 (§6D.8) ---
  status (candidate|verified|deprecated),         -- AI candidate vs human verified
  rule_tier (basic|annual_rolling|exception|applicability_review),
  applicable_year,                                -- 规则级年份（2026 edition 等）
  requires_applicability_review (bool),           -- Plan §2.4
  risk_level (low|med|high),                      -- 高风险要求双人 sign-off
  checklist_json                                  -- §6D.4 六项 Quality Badge:
                                                  -- { filing_payment_distinguished,
                                                  --   extension_handled,
                                                  --   calendar_fiscal_specified,
                                                  --   holiday_rollover_handled,
                                                  --   cross_verified,
                                                  --   exception_channel }

RuleSource (Source Registry · P1-31 · §6D.3)
  id, jurisdiction,
  name,                              -- e.g. "IRS Newsroom"
  url, source_type,                  -- newsroom|publication|due_dates|emergency_relief|fema
  cadence,                           -- 30m|60m|120m|daily|weekly|quarterly
  owner_user_id,                     -- 负责 ops 成员
  priority,                          -- critical|high|medium|low（低容错优先级）
  is_early_warning (bool),           -- FEMA 等只作预警不生规则
  last_checked_at, last_change_detected_at,
  health_status,                     -- healthy|degraded|failing|paused
  consecutive_failures, next_check_at,
  created_at, updated_at

ExceptionRule (overlay 独立实体 · P1-30 · §6D.2)
  id, source_pulse_id,               -- 来源 Pulse（可为空：手工录入 exception）
  jurisdiction, counties[],
  affected_forms[], affected_entity_types[],
  override_type,                     -- extend_due_date|waive_penalty|...
  override_value_json,               -- { new_due_date, reason, ... }
  effective_from, effective_until,
  status,                            -- candidate|verified|applied|retracted|superseded
  verified_by, verified_at,
  retracted_at, retracted_reason,
  superseded_by_exception_id,        -- 被哪条新 exception 覆盖
  source_url, verbatim_quote,
  needs_reevaluation (bool),         -- base rule 升级时自动置 true
  created_at

ObligationExceptionApplication (obligation × exception 多对多 · §6D.2)
  obligation_instance_id, exception_rule_id,
  applied_at, applied_by_user_id,
  reverted_at, reverted_by_user_id,
  PRIMARY KEY (obligation_instance_id, exception_rule_id)

RuleCrossVerification (双源交叉引用 · P1-33 · §6D.5)
  id, rule_id,
  primary_source_url, primary_source_title, primary_quote,
  cross_source_url, cross_source_title, cross_quote,
  agreement_status,                  -- agree|disagree|partial
  checked_at, checked_by_user_id,
  notes

OpsCadence (节奏表 · P1-35 · §6D.6)
  id, event_type,                    -- source_check|base_rule_recheck|quarterly_audit|pre_season_review|rhythm_report_email
  frequency,                         -- cron / iso interval
  owner_user_id,
  last_run_at, next_run_at,
  last_status (success|failed|skipped),
  last_report_s3_key,                -- 每次 run 的报告存档
  active

ObligationInstance
  id, firm_id, client_id, rule_id, rule_version,
  tax_year, period,
  original_due_date,                  -- rule 生成时的原始日期（固定不变）
  base_due_date,                      -- NEW (§6D.2): base rule 当前计算值（rule 升版会变）
  current_due_date,                   -- 派生字段 = base + apply(active overlays)
  filing_due_date, payment_due_date,
  status, readiness, extension_decision,
  estimated_tax_due, estimated_exposure_usd,
  assignee_id, notes,
  migration_batch_id,
  created_at, updated_at, last_changed_by
  -- overlays 通过 ObligationExceptionApplication 多对多获取

EvidenceLink (核心 provenance 表)
  id,
  obligation_instance_id | ai_output_id,
  source_type (rule | pulse | human_note | ai_migration_normalize |
               ai_migration_map | default_inference_by_entity_state |
               pulse_apply | penalty_override),
  source_id, source_url, verbatim_quote,
  raw_value, normalized_value,       -- for migration
  confidence, model,                 -- for AI decisions
  matrix_version,                    -- for default inference
  verified_at, verified_by,
  applied_at, applied_by

Pulse
  id, source, source_url, raw_content, published_at,
  ai_summary, verbatim_quote,
  parsed_jurisdiction, parsed_counties[],
  parsed_forms[], parsed_entity_types[],
  parsed_original_due_date, parsed_new_due_date,
  parsed_effective_from, confidence,
  status (pending_review | approved | applied | rejected),
  reviewed_by, reviewed_at,
  requires_human_review

PulseApplication
  id, pulse_id, obligation_instance_id, client_id, firm_id,
  applied_by, applied_at, reverted_at,
  before_due_date, after_due_date

AiOutput
  id, firm_id, user_id, kind (brief | tip | summary | ask_answer),
  prompt_version, model, input_context_ref,
  output_text, citations[], generated_at, tokens_in, tokens_out, cost_usd

AuditEvent
  id, firm_id, actor_id, entity_type, entity_id,
  action (status.change | pulse.apply | pulse.revert |
          migration.import | migration.revert | penalty.override |
          rule.updated),
  before_json, after_json, reason, created_at

Reminder
  id, obligation_instance_id, channel (email | in_app),
  offset_days, sent_at, clicked_at

MigrationBatch
  id, firm_id, user_id, source (paste | csv | preset_name),
  raw_input_ref,                     -- S3 key of original paste/csv
  mapping_json,                      -- final column → field mapping
  row_count, success_count, skipped_count,
  preset_used,                       -- nullable
  ai_global_confidence,
  status (draft | mapping | reviewing | applied | reverted | failed),
  created_at, applied_at, reverted_at, revert_expires_at

MigrationMapping
  id, batch_id, source_column, target_field,
  confidence, reasoning, sample_transformed,
  user_overridden (bool)

MigrationNormalization
  id, batch_id, field, raw_value, normalized_value,
  confidence, model, reasoning

MigrationError
  id, batch_id, row_index, raw_row_json,
  error_code, error_message

IcsToken  -- P1-11
  id, firm_id, token, created_at, revoked_at

PushSubscription (Web Push · P1-36 · §7.8.1)
  id, user_id, firm_id,
  endpoint,                           -- 浏览器 push service endpoint (VAPID)
  keys_p256dh, keys_auth,             -- 加密公钥 + auth secret
  device_label,                       -- "Sarah's MacBook" / "iPhone 15" (user-editable)
  platform,                           -- macos|windows|ios|android|linux|unknown
  user_agent_hash,                    -- 去重 + 识别设备但不存原始 UA
  created_at, last_used_at,
  last_delivery_success_at,
  consecutive_failures,               -- 410/404 累计时自动 revoke
  revoked_at, revoke_reason

LlmLog
  id, firm_id, user_id, prompt_version, input_tokens, output_tokens,
  latency_ms, cost_usd, success, error_msg, created_at

SavedView (P1-16)
  id, firm_id, owner_user_id,
  name, scope (personal|shared),      -- Personal 仅 owner_user_id 可见；Shared Firm 内共享
  filters_json, columns_json, sort_json,
  created_at, updated_at

ClientReadinessRequest (P1-26 · §6B)
  id, firm_id, obligation_instance_id, client_id,
  items_json,                         -- [{label, description, ai_explanation_url, status}]
  magic_link_token (signed, ≥32 bytes, rotatable),
  delivery_channel (email|sms_link|both),
  sent_to_email, sent_by_user_id,
  sent_at, expires_at (default +14d),
  first_opened_at, last_responded_at, response_count,
  status (pending|partially_responded|fully_responded|expired|revoked),
  revoked_at, revoked_by_user_id,
  auto_reminder_sent_at

ClientReadinessResponse (P1-26 · §6B)
  id, request_id,
  item_index, status (ready|not_yet|need_help),
  client_note, eta_date (nullable),
  submitted_at, ip_hash, user_agent_hash  -- anonymized for anti-abuse

AuditEvidencePackage (P1-28 · 合规 ZIP 导出)
  id, firm_id, exported_by_user_id, scope (firm|client|obligation),
  scope_entity_id,
  range_start, range_end,
  file_count, file_manifest_json, sha256_hash,
  s3_key, expires_at (default +7d),
  created_at

Event (analytics)
  id, firm_id, event_name, props_json, created_at
```

### 8.2 关键索引（S1-AC3 < 1s 响应保障）

```sql
-- Dashboard / Workboard 核心查询
CREATE INDEX idx_obligation_firm_due ON obligation_instance (firm_id, current_due_date);
CREATE INDEX idx_obligation_firm_status_due ON obligation_instance (firm_id, status, current_due_date);
CREATE INDEX idx_obligation_firm_tax_due ON obligation_instance (firm_id, tax_type, current_due_date);
CREATE INDEX idx_obligation_firm_assignee_due ON obligation_instance (firm_id, assignee_id, current_due_date);

-- Pulse 匹配
CREATE INDEX idx_client_firm_state ON client (firm_id, state);
CREATE INDEX idx_client_firm_state_county ON client (firm_id, state, county);
CREATE INDEX idx_client_firm_entity ON client (firm_id, entity_type);

-- Migration Revert
CREATE INDEX idx_client_batch ON client (migration_batch_id);
CREATE INDEX idx_obligation_batch ON obligation_instance (migration_batch_id);

-- Evidence Mode
CREATE INDEX idx_evidence_obligation ON evidence_link (obligation_instance_id);
CREATE INDEX idx_evidence_source ON evidence_link (source_type, source_id);

-- Pulse feed
CREATE INDEX idx_pulse_status_published ON pulse (status, published_at DESC);

-- Audit / history
CREATE INDEX idx_audit_firm_created ON audit_event (firm_id, created_at DESC);
CREATE INDEX idx_migration_firm_created ON migration_batch (firm_id, created_at DESC);

-- Vector search
-- D1 does not own vector indexes. rule_chunks / pulse_chunks are mirrored into Cloudflare Vectorize.
-- D1 keeps metadata only: chunk_id, source_type, source_id, jurisdiction, entity_type, tax_type, firm_id NULL.
CREATE INDEX idx_rule_chunks_meta ON rule_chunks (jurisdiction, tax_type, entity_type);

-- Team / Membership (P1)
CREATE UNIQUE INDEX idx_membership_user_firm ON user_firm_membership (user_id, firm_id);
CREATE INDEX idx_membership_firm_status ON user_firm_membership (firm_id, status);
CREATE UNIQUE INDEX idx_invitation_token ON team_invitation (invite_token) WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX idx_invitation_firm_email ON team_invitation (firm_id, invited_email) WHERE accepted_at IS NULL;

-- My work scope
CREATE INDEX idx_obligation_firm_assignee_scope ON obligation_instance (firm_id, assignee_id, current_due_date)
  WHERE status NOT IN ('filed','paid','not_applicable');

-- Firm-wide audit log page
CREATE INDEX idx_audit_firm_actor_created ON audit_event (firm_id, actor_id, created_at DESC);
CREATE INDEX idx_audit_firm_action_created ON audit_event (firm_id, action, created_at DESC);

-- Client Readiness Portal (P1-26)
CREATE UNIQUE INDEX idx_readiness_token ON client_readiness_request (magic_link_token)
  WHERE revoked_at IS NULL AND status NOT IN ('expired');
CREATE INDEX idx_readiness_obligation ON client_readiness_request (obligation_instance_id, sent_at DESC);
CREATE INDEX idx_readiness_firm_status ON client_readiness_request (firm_id, status, expires_at);

-- Audit-Ready Evidence Package (P1-28)
CREATE INDEX idx_audit_package_firm_created ON audit_evidence_package (firm_id, created_at DESC);
CREATE INDEX idx_audit_package_expires ON audit_evidence_package (expires_at) WHERE expires_at > NOW();

-- Penalty Scoreboard weekly aggregation (P0-18 + §7.5.6)
-- week_start_date is a stored/generated helper column maintained by the app for D1-compatible weekly grouping.
CREATE INDEX idx_obligation_firm_week_exposure ON obligation_instance
  (firm_id, week_start_date, estimated_exposure_usd)
  WHERE status NOT IN ('filed','paid','not_applicable');
-- 支持 "This week $X at risk" 聚合 + Sparkline 8 周趋势

-- Rules-as-Asset (P1-29 ~ P1-35 · §6D)
CREATE INDEX idx_rule_status_tier ON obligation_rule (status, rule_tier, jurisdiction);
CREATE INDEX idx_rule_next_review ON obligation_rule (next_review_at)
  WHERE status = 'verified';
CREATE INDEX idx_rule_source_juris_priority ON rule_source (jurisdiction, priority, health_status);
CREATE INDEX idx_rule_source_next_check ON rule_source (next_check_at)
  WHERE health_status IN ('healthy','degraded');

-- ExceptionRule overlay engine
CREATE INDEX idx_exception_status_effective ON exception_rule (status, effective_from, effective_until)
  WHERE status IN ('applied','verified');
CREATE INDEX idx_exception_jurisdiction ON exception_rule (jurisdiction, status, effective_from);
-- affected_forms / counties use JSON text in D1; matching uses json_each() or denormalized helper tables, not GIN.
CREATE INDEX idx_obligation_exception_oblig ON obligation_exception_application
  (obligation_instance_id) WHERE reverted_at IS NULL;
CREATE INDEX idx_obligation_exception_exc ON obligation_exception_application
  (exception_rule_id) WHERE reverted_at IS NULL;

-- Cross-verification
CREATE INDEX idx_cross_verification_rule ON rule_cross_verification (rule_id, agreement_status);

-- Ops cadence scheduler
CREATE INDEX idx_ops_cadence_next_run ON ops_cadence (next_run_at) WHERE active = true;

-- Web Push subscription (P1-36 · §7.8.1)
CREATE INDEX idx_push_user_active ON push_subscription (user_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX idx_push_endpoint ON push_subscription (endpoint) WHERE revoked_at IS NULL;
```

---

## 9. AI 架构（Clarity Engine 细节）

见 §6.2 完整描述。本节补充：

### 9.1 模型选型

| 任务                            | 首选模型                        | 备选              | 理由        |
| ------------------------------- | ------------------------------- | ----------------- | ----------- |
| Embedding                       | OpenAI `text-embedding-3-small` | Anthropic Voyage  | 成本 / 够用 |
| 快速任务（Tip / Mapper）        | GPT-4o-mini                     | Claude Haiku      | 延迟 + 成本 |
| 高质量（Brief / Pulse Extract） | GPT-4o                          | Claude Sonnet 4.5 | 准确度      |
| 模型网关                        | LiteLLM                         | —                 | 方便切换    |

### 9.2 Fallback 矩阵

| 失败场景              | 降级行为                                           |
| --------------------- | -------------------------------------------------- |
| LLM API 超时          | 显示上次缓存 + 警示条 `AI temporarily unavailable` |
| Citation 校验失败     | 重试 1 次；仍失败 → 显示 refusal template          |
| Retrieval 为空        | refusal：`I don't have a verified source for this` |
| 置信度 < 0.5（Pulse） | 保持 `pending_review`，不进 Feed                   |
| Mapping 置信度 < 0.5  | UI 强制用户手动选字段                              |

### 9.3 Zero Data Retention

- 采用 OpenAI ZDR endpoint 或 Azure OpenAI
- Prompt 明示 `"Do not retain any data seen for training"`
- PII 占位符替换后才进 LLM，post-processing 回填
- 所有 LLM 调用入 `llm_logs`（含 input hash 但不含 raw input）

---

## 10. UI / UX 规范

> **视觉系统单一事实源 = `[docs/Design/DueDateHQ-DESIGN.md](../Design/DueDateHQ-DESIGN.md)`**
> 本章仅描述**产品语义**（关键组件承担什么功能、交互原则）。所有颜色 / 字号 / 间距 / 圆角 / 阴影 token，以及每个组件的像素级规格、亮暗色变体、Agent Prompt Guide 等**全部在 DESIGN.md 中定义**，本 PRD 不重复复述。

### 10.1 视觉方向（摘要 · 详情见 DESIGN.md §1–§3）

- **风格定位**：**Ramp × Linear · Light Workbench** —— CPA 的专业工作台，非金融 App、非营销站、非编辑刊物
- **字体**：Inter（正文 + UI）+ Geist Mono / JetBrains Mono（数字 / 金额 / 日期 / EIN / 规则 ID / 官方 URL · `tabular-nums` 强制）
- **主色**：Navy `#0A2540`（主文字 · Stripe Dashboard 同源权威感）+ Indigo `#5B5BD6`（Linear accent · 仅用于 CTA / focus / selected nav）
- **风险色系（唯一允许"鲜艳"的地方）**：Critical red `#DC2626` / High orange `#EA580C` / Medium yellow `#CA8A04` / Neutral slate `#475569`（**灰色 = OK**，绿色仅用于 Filed / Applied 完成态）
- **暗色模式**：浅色的镜像反色（暖色近黑 `#0D0E11`，禁用纯黑 `#000`），一等公民；方向 B 的 Bloomberg 终端风**不采纳**为 MVP 范围
- **分层**：1px 发丝线 `#E5E7EB` 优先；zero shadow by default；只有 Drawer / Modal 才加极小阴影
- **密度三档**：Compact 32px / Comfortable 36px（默认） / Spacious 40px
- **圆角**：组件 ≤ 4px，卡片 ≤ 6px，禁止 > 8px 的"胶囊"
- **动效**：< 200ms；尊重 `prefers-reduced-motion`；Hero 数字 Odometer 滚动 + Pulse Banner 脉冲 1.5s

### 10.2 关键组件（语义 · 详细规格见 DESIGN.md §4）

| 组件                | 功能语义                                                                                               | 对应场景                             |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **Risk Row**        | 客户 + 义务 + 倒计时 + $ 敞口 + Status + 行内操作；Critical / High 行带 2px 左边框 + tint 背景         | Workboard / Dashboard 表格行         |
| **Hero Metric**     | Dashboard 顶部 `$142,300 · AT RISK · NEXT 7 DAYS`（Geist Mono Bold 56px），靠排版层级而非容器          | Dashboard Layer 1 · Penalty Radar    |
| **Pulse Banner**    | 暖黄 tint + 1px 琥珀边框，源标题 + 受影响客户数 + `[Review]` `[Dismiss]`                               | Dashboard Layer 2 · Story S3         |
| **Triage Tabs**     | This Week / This Month / Long-term 三段，每段带 `count + $` 数字，选中态下边 2px indigo 边框           | Dashboard Layer 3 · Story S1 AC1     |
| **Evidence Chip**   | 极小 mono 10px 徽章 `[IRS.GOV]`，hover 500ms 延迟弹 Verbatim Quote Popover；**DueDateHQ 独占设计资产** | 所有 AI 输出 / 规则字段 / Pulse 条目 |
| **Penalty Pill**    | `$28,400 at risk` 单元，hover 分解 late-file + late-pay + interest + state surcharge                   | Obligation Detail / Workboard 行     |
| **Command Palette** | `⌘K` 三合一（Search / Ask / Navigate），560px 居中浮层，每条结果标快捷键                               | 全局                                 |
| **Source Badge**    | `🔗 CA FTB · ✓ Human verified · 2d ago`，信任符号，比 Evidence Chip 信息量大                           | Obligation Detail 底部               |

### 10.3 交互原则

1. **一切可操作物体都应有键盘快捷键**（`?` 列出全部；`⌘K` 是全局入口）
2. **状态切换零 modal**：单击行内 dropdown 即改，500ms Undo toast
3. **Skeleton loader，不 spinner**
4. **Optimistic UI**：本地先更新，失败再回滚 + toast
5. **Dark mode 跟随系统 + 手动可切**（`⇧⌘D`）
6. **空状态有价值**：空 Radar 写 "We're watching IRS + 5 state authorities for you. Last check 3 min ago."
7. **Copy as citation block**：复制"内容 + 来源 + 验证时间戳"（CPA 杀手锏）
8. **No Provenance = No Render**：AI 输出无 `source_url + verified_at + verbatim_quote` 不得渲染

### 10.3 交互原则

1. **一切可操作物体都应有键盘快捷键**（`?` 列出全部）
2. **状态切换零 modal**：单击 pill 即改，500ms undo toast
3. **Skeleton loader**，不 spinner
4. **Optimistic UI**：本地先更新，失败再回滚 + toast
5. **Dark mode 跟随系统**
6. **空状态有价值**：空 Radar 写 "We're watching IRS + 5 state authorities for you. Last check 3 min ago."
7. **Copy as citation block**：复制"内容 + 来源 + 验证时间戳"（CPA 杀手锏）

### 10.4 无障碍（WCAG 2.2 AA）

- 色盲友好的风险色 + 双编码（颜色 + 图标）
- 键盘完整可达，焦点可见
- ARIA landmarks
- AI 输出 `lang="en"` 声明

### 10.5 响应式

- Desktop (≥ 1280px)：三栏
- Laptop (1024–1279)：两栏
- Tablet (768–1023)：单栏 + 可折叠侧栏
- Mobile (< 768)：只读优先 + Dashboard 顶三段 + Workboard 简化卡片

---

## 11. 信息架构

```
App (after login)
 ├─ Dashboard (Home)                         ← Story S1 主屏
 ├─ Workboard                                ← 高密度表格
 ├─ Clients
 │   ├─ List (table)
 │   ├─ + Add clients ▾
 │   │    ├─ Import file / Paste  ← Migration 入口
 │   │    └─ Add one
 │   └─ Client Detail (drawer)
 │       ├─ Profile  (with EIN)
 │       ├─ Obligations (timeline)
 │       ├─ AI Risk Summary
 │       ├─ Audit
 │       ├─ Documents (P1)
 │       └─ [Export PDF]                     ← Client PDF Report
 ├─ Alerts (Regulatory Pulse)                ← Story S3
 ├─ Rules (read-only + Quality Badge + Cross-verified)  ← §5.7 + §6D
 ├─ Team Workload (P1 · Owner/Manager only)  ← §3.6.7
 ├─ Audit Log (P1 · Firm-wide, Owner/Manager)← §3.6 + §13.2
 ├─ Reports (P1)
 ├─ Cmd-K
 │   ├─ Search
 │   ├─ Ask ✨
 │   └─ Navigate
 ├─ Firm Picker (top-right · 多 Firm membership 时显示)  ← §3.6.4
 └─ Settings
     ├─ Profile (per-user)
     ├─ Notifications (per-user, 含 Team 路由偏好 §7.1.4)
     ├─ Imports (history + Undo)             ← Migration 回溯
     ├─ Ask History
     ├─ ICS Calendar Feed                    ← P1 订阅链接
     ├─ Priority weights (Pro only, Owner)
     ├─ Team (P1 · Owner only)               ← 成员 / 邀请 / role / 转让 §3.6.4
     │   ├─ Members list
     │   ├─ Pending invitations
     │   ├─ Seat usage (3/5 seats used)
     │   └─ Transfer ownership
     ├─ Billing (P1 · Owner only)
     ├─ Security (WISP)
     └─ About
```

一级导航 P0（Solo）：Dashboard / Workboard / Clients / Alerts / Rules / Settings — 6 项。
一级导航 P1（Team）增加：**Team Workload**（Owner/Manager 可见）+ **Audit Log**（Owner/Manager 可见）= 最多 8 项。
不建 Intake / Review / Extension 独立导航——它们是 obligation 的状态层。

**公开页面（无需登录，SEO + 获客 + Rules-as-Asset 公开承诺）：**

```
/                           产品营销首页
/rules                      Rule Library 公开浏览（§5.7A + §6D.7）
/rules/federal              Federal 11 rules 细分页（SEO）
/rules/california           州级 rules（SEO 长尾，每州一页）
/rules/[state]              ...
/watch                      Source Registry 公开页（§5.7B + §6D.3）
/pulse                      Regulatory Pulse 实时 feed（SEO）
/security                   WISP 摘要 + 数据边界 + Verification Rhythm（§6D.6）+ E&O 声明
/pricing                    定价页
/evidence                   Glass-Box 纪律说明页
/get                        交付形态（Browser / Add-to-Home / Add-to-Dock / Menu Bar · §7.8.4）
/privacy                    隐私政策（含 Web Push 7 类事件声明 · §13.7A）
```

Public 页面相互 cross-link，形成 Rule Library → Source Registry → Verification Rhythm 的信任叙事闭环。

---

## 12. 指标与成败判据

### 12.1 North Star

> **Weekly Triage Completion** — 周一 8:00–11:00 内完成一次分诊 session 的 firm 数 / 活跃 firm 数。**目标 ≥ 50%。**

### 12.2 KPI（首 4 周）

**Activation（Migration）**

| 指标                                 | 目标             | 测量                                |
| ------------------------------------ | ---------------- | ----------------------------------- |
| Migration Time-to-First-Value        | **P50 ≤ 10 min** | signup → 首次看到 Penalty Radar $   |
| **Migration P95 完成时间（S2-AC5）** | **≤ 30 min**     | Signup → Import 完成（30 客户基准） |
| Migration Completion Rate            | ≥ 70%            | 进入 Step 1 → 完成 Step 4           |
| Migration Mapping Confidence         | ≥ 85%            | AI Mapper 平均 confidence           |
| Migration Revert Rate                | ≤ 10%            | 24h 内 Revert / 全部 batch          |
| Migration 激活率                     | ≥ 7/10           | 种子用户用 Migration（vs 手动录入） |

**Retention（Dashboard + Pulse）**

| 指标                            | 目标                        | 测量                              |
| ------------------------------- | --------------------------- | --------------------------------- |
| Setup 耗时                      | P50 ≤ 15 min                | signup → first calendar generated |
| Week-1 回访                     | ≥ 2 次 / 用户               | unique login days                 |
| Week-2 回访                     | 10 人中 ≥ 5 人              | 第 8–14 天 ≥ 1 次                 |
| **分诊 session 耗时（S1-AC5）** | **P50 ≤ 5 min**（第 2+ 次） | session 时长                      |
| Evidence 点击率                 | ≥ 30% 周活用户              | E 键 / chip 点击                  |
| Pulse Review 耗时（S3）         | ≤ 3 min                     | alert 打开 → apply                |
| AI Brief 有用率                 | ≥ 5/10                      | 退出访谈                          |
| Pulse Apply 次数                | ≥ 2 / firm                  | 真实 Apply                        |
| Smart sort 保留率               | ≥ 6/10 保持默认             | 未切换                            |

**Monetization**

| 指标           | 目标  | 测量                   |
| -------------- | ----- | ---------------------- |
| 付费意愿点击率 | ≥ 30% | $49 按钮               |
| 日历编辑率     | < 20% | 用户 override 系统日期 |

### 12.3 验收测试集（Traceability Matrix 延续）

| Test ID | AC     | 用例                                                             | 预期                                                     |
| ------- | ------ | ---------------------------------------------------------------- | -------------------------------------------------------- |
| T-S1-01 | S1-AC1 | 新用户登录后                                                     | 默认 Dashboard，选中 `This Week` tab                     |
| T-S1-02 | S1-AC2 | 本周 3 条 obligations                                            | TriageCard 左上显示 `[🔴 2d]` / `[🟠 5d]` 等             |
| T-S1-03 | S1-AC3 | 200 clients × 1000 obligations，应用 3 维筛选（CA + LLC + 1040） | 响应 < 1s，计时 DevTools                                 |
| T-S1-04 | S1-AC4 | 点击某行 status 下拉                                             | 500ms 内改完 + Undo toast                                |
| T-S1-05 | S1-AC5 | 模拟 85 客户场景，计时用户完成分诊                               | P50 ≤ 5 min                                              |
| T-S2-01 | S2-AC1 | 上传 TaxDome 官方导出 CSV                                        | Preset 命中 + 95% 字段映射                               |
| T-S2-02 | S2-AC2 | CSV 含 `Tax ID` 列                                               | EIN 自动识别，`##-#######` 格式化                        |
| T-S2-03 | S2-AC3 | CSV 有 5 行缺 state                                              | 非阻塞，其余 25 行正常导入                               |
| T-S2-04 | S2-AC4 | CSV 无 tax_types 列                                              | Default Matrix 生成全年 obligations                      |
| T-S2-05 | S2-AC5 | 30 客户从 signup 到 import                                       | P95 ≤ 30 min                                             |
| T-S3-01 | S3-AC1 | 模拟 IRS 发公告 T0                                               | T0 + 24h 内 Pulse 进 feed                                |
| T-S3-02 | S3-AC2 | Pulse: CA + LA + Individual + 1040；firm 有 12 客户符合          | Match 精确返回 12                                        |
| T-S3-03 | S3-AC3 | Approved Pulse 触发                                              | Dashboard Banner + Email Digest 双到达（同一事务）       |
| T-S3-04 | S3-AC4 | Banner 点 Review → Apply                                         | 12 条 obligation 批量更新 + Audit 12 条 + 24h Undo 可用  |
| T-S3-05 | S3-AC5 | 每条 Pulse 详情                                                  | `official_source_url` + `verbatim_quote` 可点击 + 可复制 |

### 12.4 Go / Gray / Rethink

- **Go**：Week-2 回访 ≥ 5 ∧ ≥ 3 位愿付费 ∧ ≥ 5 位觉 AI 有用 ∧ 编辑率 < 30% ∧ Pulse Apply ≥ 2 ∧ Migration 激活率 ≥ 7/10
- **Gray**：回访 5–7 ∧ 付费 < 3 → 重新审视 ICP / 定价
- **Rethink**：回访 < 4 ∨ > 50% 觉不如 Excel ∨ 编辑率 > 40% ∨ Migration 激活率 < 5/10

---

## 13. 安全与合规

### 13.1 最小必要数据

**MVP 不存：** SSN / 完整税表金额 / 银行账号 / W-2/1099 具体数字  
**MVP 存：** 客户名 / EIN / 州 / 县 / 实体类型 / tax_types / 预估年营收（粗档）+ obligation 元数据

让 DueDateHQ 在 IRC §7216 与 FTC Safeguards Rule 下尽可能轻。

### 13.2 必做

- HTTPS 全站（Cloudflare Workers / custom domain）
- TLS 1.2+ / encryption at rest（Cloudflare D1 / R2 / KV 平台能力；应用层敏感 secret 另行 AES-GCM）
- Auth：Email magic link + 会话 7 天
- MFA：7 天 Demo 不强制；真实试点 / 4 周 MVP 对 Owner 强制 TOTP；Team 版 Manager 在 P1 强制，Preparer/Coordinator 建议开启
- **RBAC 双层校验**（§3.6.3）：P0 强制 tenant isolation + Owner-only 写路径；P1 启用 oRPC procedure permission middleware + scoped repo 双层校验；前端按 role 渲染只是体验层
- Tenant 强隔离：所有 query 必须带 `firm_id` where
- 审计日志：所有写操作
- 备份：每日 + 保留 7 天
- **WISP**：7 天 Demo 可交 1-page draft；真实试点 / 4 周 MVP 交 WISP v1.0（5-page）
- 隐私声明：客户数据不训练任何外部 AI，仅用于 service delivery
- **LLM PII 防泄**：客户姓名 / EIN / 邮箱在 prompt 中用占位符 `{{client_1}}`，生成后回填

#### 13.2.1 Firm-wide Audit Log 页（Team 版合规核心 · P1-22）

**入口：** 侧栏 `Audit Log`（Owner / Manager 可见）

**目的：** 让事务所承担对客户的"职业责任"变得可证明。IRS 调查 / 客户投诉 / 内部争议时，Owner 可导出完整审计链路。

**字段列：**

```
Time (UTC + local)  |  Actor  |  Action  |  Entity  |  Before → After  |  IP / Device  |  [View detail]
```

**必须支持的 action 类型：**

| 类别       | Action                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Auth       | `auth.login.success` / `auth.login.failed` / `auth.mfa.enabled` / `auth.session.revoked`                          |
| Team       | `team.member.invited` / `.joined` / `.role_changed` / `.suspended` / `.left`；`firm.owner.transferred`            |
| Client     | `client.created` / `.updated` / `.deleted` / `.reassigned`                                                        |
| Obligation | `obligation.status_changed` / `.readiness_changed` / `.extension_decided` / `.reassigned` / `.penalty_overridden` |
| Migration  | `migration.imported` / `.reverted` / `.single_undo`                                                               |
| Pulse      | `pulse.applied` / `.reverted` / `.dismissed` / `.snoozed`                                                         |
| Rule       | `rule.report_issue` / `rule.updated`（系统）                                                                      |
| Export     | `export.csv` / `export.pdf` / `ics.feed_rotated`                                                                  |
| Ask        | `ask.query_run`（含 DSL，不含结果 PII）                                                                           |

**筛选：**

- Actor（成员多选）
- Action 类别（上述分组）
- 时间范围（预设 24h / 7d / 30d / 自定义）
- Entity（点击某客户 → 仅该客户相关）

**导出：**

- CSV 导出（Owner only）
- 触发时写 `export.audit` audit event（自递归记录）
- 导出文件通过邮件附件发送，不直接下载（防中间人）

**保留策略：**

- 活跃数据：**7 年**（IRS 推荐的客户记录保留期）
- `before_json` / `after_json` 对 PII 字段自动 hash 化（保留变更事实，不保留原始敏感数据）
- Firm 删除后，`actor_id` 匿名化为 `deleted_user_#`，但审计事件保留（合规诉讼证据）

### 13.3 红线（MVP 不碰）

- 不成为 IRS authorized e-file provider
- 不处理 IRS Publication 1345 范围的数据
- 不做 direct tax filing transmission
- 不申请 SOC 2 正式审计（路线图 Phase 3）
- 不承接 CCPA 阈值以上营销用数据

### 13.4 职业责任保障

- 购买专业责任险（E&O 保单），首年 $2M 保额
- 数据准确度 SLA：99.5% verified rules 准确（基于 ops QA）
- 错误赔偿条款：若因 DueDateHQ rule 错误导致客户罚款，最高赔偿当月订阅费 × 10 + 实际罚款（见 TOS）

### 13.5 Verification Rhythm 承诺（与 §6D.6 对齐）

对外公开的规则运营节奏承诺（`/security` 页公示）：

| 频率                    | 动作                            | 对象                              | 责任             |
| ----------------------- | ------------------------------- | --------------------------------- | ---------------- |
| **Every 30 min**        | IRS + CA FTB Newsroom scraping  | Source Registry 高优先级源        | 自动 worker      |
| **Every 60 min**        | NY / TX / FL / WA / MA tax news | 中优先级源                        | 自动 worker      |
| **Daily**               | FEMA declarations               | Early warning（不生规则）         | 自动 worker      |
| **Weekly (Fri 9am PT)** | Base rule re-check vs. source   | 所有 verified base rules          | ops 人工         |
| **Quarterly**           | Full rule pack audit            | 全 rule library                   | ops 团队全员     |
| **Before tax season**   | Comprehensive manual review     | 全 verified rules + 双人 sign-off | 高风险 rule 双人 |

所有 run 结果存档 `OpsCadence.last_report_s3_key`，可在 `/security` 页滚动显示最近 3 次 run 时间 + 结果。

### 13.6 明确不能承诺的事（Plan §7.5 对齐）

**DueDateHQ 不承诺：**

- ❌ 零遗漏
- ❌ 全自动实时更新
- ❌ 覆盖所有特殊适用条件
- ❌ AI 已确认税务结论
- ❌ 代替 CPA 做税务判断

**DueDateHQ 承诺：**

- ✅ 核心规则来自官方来源
- ✅ 每条 verified rule 经过人工验证（高风险双人）
- ✅ 高风险官方来源有持续健康监控
- ✅ 临时变更先进入复核，不静默发布为 verified rule
- ✅ 规则变更保留完整 audit（谁何时依据哪个来源）
- ✅ Verification Rhythm 可公开审阅

这套承诺写入 `/security` 页、TOS、Marketing FAQ 一致口径。

### 13.7A Web Push 与 PWA 隐私（P1-36 · §7.8.1）

- **订阅许可**：首次登录**不主动弹权限**；在用户首次创建 Pulse Banner 后、或主动访问 Settings → Notifications 时才请求
- **VAPID 密钥**：服务端私钥存 env var（不进仓库），定期轮换
- **endpoint 存储**：`PushSubscription.endpoint` 视同 PII，TLS + at-rest 加密（同客户 PII 级别）
- **去识别化**：`user_agent_hash` 使用 SHA-256 + salt，保留设备级识别但不可反推原始 UA
- **清理策略**：`consecutive_failures ≥ 3`（410/404 返回）自动 revoke，防止死链堆积
- **用户控制**：Settings → Notifications 页显示所有订阅设备（device_label / platform / last_used_at），支持单台注销
- **跨租户隔离**：同一 endpoint 可在多 Firm 订阅（`UserFirmMembership` 多对多），推送时按 `firm_id + user_id` 查订阅
- **Quiet Hours**：默认尊重设备本地 23:00–06:00 静默，push payload 带 `TTL` 和 `urgency=low`，关键事件（Pulse 法定级）用 `urgency=high` 覆盖
- **合规声明**：`/security` 页明确 "We do not send marketing push notifications"；`/privacy` 页列出可能推送的 7 类事件
- **Web Push 不训练任何 AI**：同全站 AI 策略一致

### 13.7B Menu Bar Widget 安全（P1-37 · §7.8.2）

- **Auth token**：menu bar 使用 Keychain 存储 OAuth refresh token；macOS Keychain ACL 限定本 app bundle
- **最小权限 API**：menu bar 只调 `/api/v1/me/radar-summary` 和 `/api/v1/me/top-urgent`；**不调任何写 API**
- **Auto-update**：Sparkle 框架 + HTTPS + EdDSA 签名验证（防中间人替换 app）
- **Notarization**：Apple notarization 发布（macOS Gatekeeper 兼容）
- **离线缓存**：最近一次 summary 最多缓存 24h + 标记"Offline · last sync 2h ago"，超时灰化显示

### 13.7 官方来源黑名单（Plan §3 对齐）

以下来源**不可作为 verified rule 的最终依据**：

- CPA 博客
- 新闻媒体转述
- Reddit / 论坛
- AI 直接回答（未经人工复核）
- 未注明官方出处的第三方 calendar

上述来源可**作为发现线索**（进入 Source Registry 的 `source_type=discovery_hint`，仅触发 ops review 入口），但不会自动产出 rule。

---

## 14. 路线图（不是工期承诺）

> 本 PRD 的产品范围不以 14 天裁剪；但作为 GTM 参考，给出阶段切片。

### 14.1 Phase 0 (MVP · ~4 weeks)

- P0 全部（§4.1）
- P1 的 Pulse + Ask + Client PDF + ICS（优先度由工程实际决定）
- **P1-36 PWA 壳**（manifest + service worker + Web Push · §7.8.1）— 低成本高 ROI，强烈建议提前到 Phase 0 尾部

### 14.2 Phase 1 (Weeks 5–12)

- Rules-as-Asset 全量落地（P1-29 ~ P1-35 · §6D）
- 50 州规则 full coverage（逐州签字 + 发布）
- 团队多席位 + assignee 完整 RBAC（P1-18 ~ P1-25 · §3.6）
- Stripe 计费
- Google / Outlook 日历**单向写入**（不做双向同步）
- Zapier App
- 公共 SEO tracker 扩到全 50 州
- Client Readiness Portal（P1-26 · §6B）
- Onboarding AI Agent（P1-27 · §6A.11）

### 14.3 Phase 2 (Q3 2026)

- **P1-37 macOS Menu Bar Widget**（§7.8.2）— 游戏化 Scoreboard 24/7 常驻，Tauri ≈ 2 人天
- Audit-Ready Evidence Package（P1-28 · §6C）
- QBO / TaxDome / Drake 深度集成
- 文档链接引用（不做存储）
- 电子签名对接
- Penalty recovery 报告
- Audit trail 合规版
- SOC 2 审计路线

### 14.4 Phase 3 (Q4 2026+)

- Compliance Calendar API（卖给 TaxDome / Karbon 做 intelligence 层）
- Windows Menu Bar / System Tray Widget（视 GTM 需求决定）
- AI Agent 可生成客户沟通全套（CPA 只审批）
- 成为"官方 deadline intelligence layer"事实标准

> **Native App 不在路线图**。如 GTM 数据出现真实需求（≥ 30% 用户请求独立原生 app），再评估。目前 PWA + Menu Bar Widget 覆盖 ≥ 95% native 体验（§7.8.3）。

---

## 15. Go-to-Market · 集训 14 天 Playbook

> 本章节是**集训可执行版**。不做空洞的"多渠道营销"，只写：具体渠道、具体帖子标题、具体漏斗数字、具体日程。
> 对标 LangGenius 集训加分项 **+2（GTM 方案）+ +3（早交付）**。

### 15.1 定价（保持 §1.1 锚点）

| Plan  | 价格                     | 目标       | 包含                                             |
| ----- | ------------------------ | ---------- | ------------------------------------------------ |
| Solo  | **$39 / mo**             | 独立 CPA   | 全 P0 能力，100 clients                          |
| Firm  | $99 / mo                 | 2–5 人小所 | + 5 席 + assignee + 共享视图                     |
| Pro   | $199 / mo                | 6–10 人    | + SSO + API + 优先支持 + 2000 clients + 权重调整 |
| Trial | **14 天免费 · 无信用卡** | 全部新用户 | 全功能                                           |

**锚点论证（Pitch 30 秒版）：**

- File In Time $199/user 首年 → DueDateHQ $39/mo = 年费相当，但产品价值翻 10 倍（AI + 云端 + Pulse）
- Karbon $59+/user/mo → 我们便宜 33% 且专注 deadline（他们求大）
- **$39 = 一位 CPA 一天的 billable hour 的 1/10。免费试用时他只需要节省 1 天就 ROI。**

### 15.2 第一批 10 位 CPA 的获客 Playbook（集训 14 天内可执行）

#### 渠道矩阵（按 ROI 排序）

| 渠道                                                | 预期 signup                           | 预期 conversion | 成本 | 周期      |
| --------------------------------------------------- | ------------------------------------- | --------------- | ---- | --------- |
| **r/taxpros 软植入帖**                              | 200 浏览 → 10 click → 3 signup        | 30%             | $0   | Day 1–3   |
| **LinkedIn 冷邮 + 1:1 Demo**                        | 30 邮件 → 10 回复 → 4 demo → 3 signup | 75%             | 时间 | Day 4–10  |
| **CPA Facebook 群（CPAExamClub / Tax Pros Unite）** | 500 浏览 → 15 click → 2 signup        | 13%             | $0   | Day 2–5   |
| **华人 CPA 微信群（美国华人执业 CPA 协会）**        | 100 浏览 → 8 click → 2 signup         | 25%             | $0   | Day 3–7   |
| **IndieHackers / ProductHunt 预热**                 | 50 signup → 1 paying                  | 2%              | 时间 | Day 12–14 |

**目标：14 天内 10 位真实 CPA signup + 3 位 pay-intent 点击 + 2 位录屏访谈。**

#### 15.2.1 Reddit r/taxpros · 精准埋伏帖（Day 1–3）

**帖子 1 · 用户故事切入型**

> Title: `My sister missed a CA Franchise Tax deadline and I (engineer) built something to help her`
>
> Body: `She's a solo CPA with ~80 clients across CA and NV. Every Monday she spent 45 min building a triage list in Excel, cross-checking Outlook and TaxDome exports. Last March she missed a Form 3522 by 2 days and the client got slapped with $800 penalty.`
>
> `So I built DueDateHQ. Paste your TaxDome/Drake/Karbon CSV, it AI-maps the fields (including Tax ID → EIN), generates the full year calendar with dollar exposure per deadline, and pulls IRS + 5 state regulatory bulletins into your inbox within 24 hours. Free 14-day trial, no CC.`
>
> `Does this solve a real problem for you, or is it solving a problem I imagined? Brutally honest feedback wanted.`

**关键技巧：**

- 不卖产品、卖故事（Reddit 最吃这一套）
- 故意自谦（`a problem I imagined`），引诱 CPA 反驳 + 评论
- 只留站外 link 一次，不要刷屏

**帖子 2 · 技术展示型（3 天后发）**

> Title: `Built a tool that turns every IRS deadline into a dollar-amount penalty estimate — CPAs, is this useful?`
>
> Body: `IRS §6651 is public: 5%/mo FTF + 0.5%/mo FTP + interest. So why do deadline tools still show "5 days left" instead of "$4,200 at risk if missed 90 days"?`
>
> `I built this for small CPA firms. It shows dollars, not days. Every number is source-linked to IRS pub 509 / state statutes — you can click and verify.`
>
> `Would love feedback from anyone who's ever had a client hit with a surprise penalty.`

**帖子 3 · Pulse 差异化型（6 天后发）**

> Title: `IRS just extended CA filing to Oct 15 for LA County — how many of your clients did you notify today?`
>
> `[Screenshot of Pulse Banner showing 12 affected clients]`
>
> `Built a tool that catches IRS/state bulletins within 24h, auto-matches to your clients by state + county + entity + form, and batch-updates deadlines in one click. Beta.`

#### 15.2.2 LinkedIn 冷邮 + 1:1 Demo（Day 4–10）

**搜索条件：**

- Title: `Certified Public Accountant` / `CPA` / `Enrolled Agent`
- 地区：California / New York / Texas / Florida / Washington
- Company size：`1-10 employees` / `Self-employed`
- Keywords: `tax preparation` / `tax compliance`

**冷邮模板（12 句以内 · 每封个性化 2 行）：**

```
Subject: 30-sec demo — for a CA CPA

Hi [First Name],

Saw you've been doing tax prep for [Company Name] for [X] years.
Quick question: how do you track multi-state deadlines today?

I built DueDateHQ — think of it as "File In Time + AI". Paste your
client list once, get the full year calendar with dollar-risk per
deadline. IRS + CA/NY/TX alerts pushed into your inbox within 24h.

If you have 15 min this week, I'd show you a 5-min demo using your
real client list (or a dummy one). I'll take your honest feedback
even if you never use it.

Free 14-day trial either way: app.duedatehq.com

— [Your Name]
```

**转化漏斗：**

- 发 30 封 → 10 回复 → 4 Zoom demo → 3 signup → 1 录屏访谈
- 录屏访谈是**最高优先级交付物**（Demo Day 开场 30 秒放录屏）

#### 15.2.3 CPA Facebook 群（Day 2–5）

**目标群：**

- `CPAExamClub`（~50k members）
- `Tax Pros Unite`（~12k members）
- `AICPA Small Firm Section`
- `Accountants & Bookkeepers Network`

**发帖策略：** **不直接推产品**，发"**公共福利内容**"钓鱼：

> Title: `Free: 2026 Complete California Franchise Tax Calendar (PDF, no signup)`
>
> Body: `Built this for my own firm but figured others might use it. Covers all 2026 dates for CA Franchise Tax Board — LLC, S-Corp, PTET, Estimated Tax. Each date has the statute reference and official link for your files.`
>
> `[PDF link]`
>
> `Built using my DueDateHQ beta — we're also watching IRS + 5 state bulletins 24/7, DM me if curious.`

PDF 本身由 §7.6 Client PDF Report 引擎生成，含 DueDateHQ 水印 + footer 带 signup link。

#### 15.2.4 华人 CPA 微信群（Day 3–7）

美国华人 CPA 是被严重忽视的 beachhead：

- 他们服务的华人中小企业主**更痛 PTE / Franchise Tax**（在加州尤其）
- 他们**强烈信任口碑推荐**（不靠 SEO）
- 独立 CPA 占比高

**渠道：**

- 美国华人执业 CPA 协会（微信群）
- 硅谷华人 CPA 聚集地（Saratoga / Fremont / Irvine）的 LinkedIn
- Rednote（小红书）搜 `在美CPA` 标签

**切入点（中文）：**

> "我做了一个工具给美国独立 CPA，专治多州截止日期。特别是 CA Franchise Tax、NY PTET、TX Franchise 这几个容易漏的。粘贴 TaxDome 导出的 Excel，30 分钟生成全年日程表。想找 2 位华人 CPA 朋友试用一下提意见，免费用 14 天，我送一杯咖啡。有兴趣的 DM 我。"

#### 15.2.5 14 天日历（Playbook 具体到天）

| Day | 行动                                                  | 量化目标          |
| --- | ----------------------------------------------------- | ----------------- |
| D1  | Reddit 帖 1（故事型）+ 打磨 Landing page              | 200 浏览          |
| D2  | Facebook 群发 CA Franchise PDF 钓鱼                   | 50 PDF 下载       |
| D3  | Reddit 帖 2（Penalty 美元型）                         | +200 浏览         |
| D4  | LinkedIn 冷邮第一批 10 封                             | 3 回复            |
| D5  | LinkedIn 冷邮第二批 10 封 + 微信群                    | 3 回复 + 1 signup |
| D6  | 约第一位 CPA 1:1 demo（Zoom）                         | 录屏              |
| D7  | Reddit 帖 3（Pulse CA 延期型）+ LinkedIn 第三批 10 封 | +3 signup         |
| D8  | 约第二位 CPA 1:1 demo + 优化 onboarding               | 录屏              |
| D9  | Pilot CPA 真实导入 30 客户，跟进 3 天                 | 获取使用反馈      |
| D10 | Pilot CPA 用 Pulse + Readiness Portal                 | 跨场景验证        |
| D11 | IndieHackers 预热帖                                   | 50 signup         |
| D12 | Pilot CPA 录 90 秒访谈视频                            | 开场素材          |
| D13 | Demo Day 排练 + 数据冻结                              | —                 |
| D14 | Demo Day + ProductHunt launch                         | —                 |

### 15.3 Demo Script（6 分钟 · 集训优化版）

> 关键原则：**前 30 秒决定现场观众是否记住你。** 其他组会从"产品介绍"开场；你要从"真实用户口证"开场。

#### 15.3.1 开场 · 0–30s · 真实 CPA 口证（致命武器）

**切掉传统 Pitch 句，换成 30 秒录屏：**

```
[Video on, no slides]

Sarah Mitchell, CPA · San Francisco · camera-on Zoom recording:

"I've been a CPA for 12 years and I've tried 4 deadline tools.
They either cost $200/month or they're stuck in 2005.

Last Thursday I imported my 62 clients into DueDateHQ. It took
me 23 minutes. The next morning I opened it, and it had already
flagged 4 of my clients that would be affected by the IRS
California storm relief bulletin — I hadn't even heard about
that yet.

This is the first tool where I feel like someone actually
understands how a small CPA practice works."

[Cut. Presenter on screen.]
Presenter: "That's Sarah. Here's what she used."
```

**为什么这 30 秒击败 59 组竞品：** 所有其他组开场都是"我做了一个产品"。你开场是"一个真实用户说'这是第一个真正懂我的工具'"。现场观众前 30 秒就在心里给你打了 top 5。

##### 15.3.1b 录屏后 5 秒 · PWA "Add to Dock" 收尾（Native 体验第一击）

```
[Cut 回到现场演示屏幕 · macOS Safari 打开 app.duedatehq.com]
[地址栏右侧 Install 图标闪烁]

Presenter: "Sarah uses this from her Mac. She added it to her Dock
like this —"

[Click Install 图标 → 1 秒对话框 → 点 'Install']
[Dock 上瞬间出现 DueDateHQ 图标 + Dock badge 显示 🔴 3 overdue]

Presenter: "— and now it lives in her Dock like any other app.
Independent window, system notifications, red badge when things
go overdue. No app stores, no installers."

[Switch to 主屏幕 · 手机 (另一设备) 也显示 Home Screen 图标]

Presenter: "Same app, same account, on her phone. When an IRS
bulletin comes in —"

[触发一条 push · 手机屏幕弹出 iOS 通知 "IRS: CA storm relief
affects 12 of your clients"]

Presenter: "— she knows in 2 seconds, not 2 days."
```

**为什么加这 5 秒：** 现场观众前 30 秒听了真实用户口证建立**信任**，这 5 秒给他们看到"这不是一个 Chrome tab 里的原型 — 它住在你的 Dock 里"——瞬间建立**产品真实感**，让后续所有功能演示更"像一个真 app"。

#### 15.3.2 30–90s · Onboarding AI Agent + Live Genesis（现场观众亲手互动）

**把现场观众拉进来：**

```
Presenter: "Before I demo, can I get a number from you? How many
clients does a typical small CPA firm handle?"

(wait for audience to respond, e.g., "around 50")

Presenter: "Perfect. Watch this."

[Switch to DueDateHQ empty state · Onboarding AI Agent full-screen]

Agent: "Hi! Are you solo or in a small firm?"
Presenter types: "solo"

Agent: "Roughly how many active clients?"
Presenter types: "around 50"  ← 现场观众报的数字

Agent: "Got it. Most of them US-based?"
Presenter types: "all in CA, mostly LLCs"

Agent: "Perfect — I've pre-loaded CA Franchise Tax + federal rules.
Now paste your client list in any format."

[Presenter Cmd+V a pre-prepared 50-row messy TaxDome Excel]

Agent: "Reading... Found 52 clients, detected 7 columns including
Tax ID (EIN), 3 entity types need cleanup. Before I commit:
I'll generate 247 deadlines with $31,400 exposure this quarter.
OK to proceed?"

Presenter: "go"

[LIVE GENESIS 4 秒动画 · 顶栏 $ 从 $0 一路滚到 $31,400]
[粒子动画 +$4,200 +$2,800 +$1,650 飞入顶栏]
```

**记忆钩子：**

- 现场观众报的"50"数字真的变成了 Agent 对话内容 → **"这不是演过 100 遍的脚本"**
- Live Genesis 粒子动画是整场 Demo 唯一的视觉高潮

#### 15.3.3 90–180s · Monday Triage（游戏化 Penalty 顶栏）

```
Presenter: "Imagine it's Monday 8am. You open DueDateHQ."

[Dashboard 载入 · 顶栏 $31,400 at risk this week 76px 粗体 JetBrains Mono]

Presenter: "This is Sarah's Monday. The top bar is her 'casino
scoreboard' — $31,400 at risk this week. Every click can make
this number go down."

[Click Acme LLC row → status change to Filed]

Presenter: "One click — $4,200 disappears."

[顶栏数字滚动 $31,400 → $27,200，绿色闪光]

Presenter: "Smart Priority ranks by dollar exposure, not due date.
Hover this sparkle badge..."

[Hover Smart Priority badge → 展开因子分解]

Presenter: "... you see why this is rank 1: $4,200 at risk, 3 days
left, client waiting. Every number clicks back to the IRS or
state source. Let me show you."

[Click E key → Evidence Mode drawer]

Presenter: "This is why CPAs bet their license on us — every
rule has a verbatim quote and human-verified timestamp."
```

**记忆钩子：** 顶栏数字滚动 + 绿色闪光是**唯二的视觉高潮**。

#### 15.3.4 180–240s · Client Readiness Portal（跨设备实时演示 · 杀手锏）

```
Presenter: "Now the part File In Time can never do."

[Open Obligation Detail for "Bright Studio S-Corp" → Readiness 区块]

Presenter: "Sarah needs 3 things from this client. Normally she
spends 20 minutes calling. Instead, watch."

[Click 'Send readiness check to client' → QR code 弹出]

Presenter: "Can anyone in the room pull out your phone?"

(audience member scans QR)

[Audience member's phone shows the Client Portal page — 免登录]

Presenter: "They can tap 'I have it' / 'Not yet' / 'I don't
understand' — all without logging in, no app install."

(Audience taps "I have it" on 2 items)

[Dashboard 实时更新：readiness badge Waiting → Ready 绿色闪光]

Presenter: "Look at the Dashboard. Sarah just saved 20 minutes
without saying a word to her client. And every response is
in the audit log."

[Scroll Audit Log → 新行 "Client responded from mobile 2s ago"]
```

**记忆钩子：** 跨设备实时同步是**全场最震撼的 5 秒**。现场观众会把这个画面带回去说给同事听。

#### 15.3.5 240–300s · Regulatory Pulse（主动性叙事）

```
Presenter: "And it's not just that we answer when you ask.
We interrupt you when something changes."

[Fast-forward：Dashboard 顶部 Pulse Banner 红色脉冲出现]
[Banner: "IRS CA storm relief → 12 of your clients affected"]

Presenter: "Sarah didn't ask for this. 8 minutes ago, IRS
published a relief bulletin. Our worker caught it, the LLM
extracted the affected counties and forms, and the match
engine found the 12 of her clients in LA County with
1040 or 1120-S due on March 15."

[Click Review & Batch Adjust → 抽屉展开 12 客户清单]
[点 Apply → 事务执行 + Toast]

Presenter: "One click. 12 deadlines moved. 12 emails going out
to the assignees. Every change in audit log with source URL."

[手机叮一声，收到邮件 · 现场放音效或真实邮件]
```

#### 15.3.6 300–360s · Evidence + Pay-intent 收束

```
Presenter: "Last thing. Watch the whole story come together."

[Open Client Detail → Audit Tab]

Presenter: "Acme LLC was imported from Sarah's TaxDome Excel.
The entity was originally 'L.L.C.' — our AI normalized it to
'LLC' with 97% confidence. The CA Franchise Tax obligation
was generated by our default matrix for LLC×CA. Last Thursday
the IRS bulletin shifted the due date. Every step is clickable
back to the source."

[Press E key → Evidence Mode → 完整 provenance chain]

Presenter: "If the IRS ever audits Sarah, she exports this
whole evidence package as a signed ZIP. 90 seconds. Done."

[Click Settings → Export Audit Package → SHA-256 hash 一键生成]

Presenter: "Every tax AI today is a confident stranger.
DueDateHQ is a tax AI that shows its work — from the first
paste to the IRS-auditable weekly brief."

[Click "I'd pay $49/mo" button → toast]

Presenter: "Thank you."
```

#### 15.3.7 Plan B 预案

| 故障              | 降级                                                |
| ----------------- | --------------------------------------------------- |
| 现场 Wi-Fi 挂     | 4K 录屏版 + 解说音轨准备好，无缝切换                |
| LLM API 超时      | Onboarding Agent 所有回复预录缓存，本地 sw fallback |
| Live Genesis 卡顿 | CSS 动画独立运行，不依赖 API                        |
| 现场观众不愿扫码  | 预准备一部备用手机，自己扫                          |
| Pulse 现场抓不到  | 1 条 approved Demo Pulse 预置，脚本化触发           |
| 邮件到达延迟      | 现场放提前录好的邮件通知音效 + 手机屏录             |

### 15.4 Pitch 文档要点（交付加分 +2）

6 页精简版（PDF，Keynote 也出一份）：

1. **Page 1 · 问题**：Sarah 的周一 45 分钟（访谈原话 + 数字）
2. **Page 2 · 解决方案**：三条铁律（30s / 30min / 24h）+ 产品截图 3 张
3. **Page 3 · 差异化**：对比表 vs File In Time / TaxDome，突出 Glass-Box + Readiness Portal
4. **Page 4 · 市场**：美国 65 万 CPA + 独立/小所占比 + SAM 估算
5. **Page 5 · GTM 14 天漏斗**：本节 §15.2 图表化
6. **Page 6 · Ask**：$39/mo × 1% 渗透 = ARR $3M 规模 + 集训 Ask（不确定 ask 什么，可写"希望与真实 CPA 用户继续深聊"）

### 15.5 落地页（SEO + 信任锚点）

- `/` — Hero + Demo video loop（15.3 录屏剪辑版）
- `/pulse` — 实时 Pulse feed（SEO 爆款，Google 会常驻收录）
- `/state/california`（及其他州）— Public State Tracker 长尾 SEO
- `/security` — WISP 摘要 + 数据边界 + E&O 保险声明
- `/pricing` — 三 tier + ROI 计算器 `你有 N 客户 → 每月节省 X 小时 → 值 Y 美元`
- `/evidence` — Glass-Box 纪律说明页（对标 Dify 审美 · 展现产品原则）

### 15.6 发布内容日历（SEO 长尾 · 每周 2 篇）

| 周  | 标题                                                             | 目标                 |
| --- | ---------------------------------------------------------------- | -------------------- |
| W1  | 2026 Federal Tax Deadlines for Small CPA Firms                   | TOFU 流量            |
| W1  | California Franchise Tax: What Every LLC CPA Needs to Know       | 州 SEO               |
| W2  | NY PTET Election: The Deadline Every Partner Forgets             | 州 SEO               |
| W2  | Why Your Tax AI Needs a "Source" Button                          | 差异化叙事           |
| W3  | Texas Franchise Tax in Under 5 Minutes                           | 州 SEO               |
| W3  | IRC §7216 and Why Your AI Notes Must Be Auditable                | 合规叙事             |
| W4  | A CPA's Guide to Disaster Relief Deadlines                       | Pulse 叙事           |
| W4  | Penalty Math: How Much a Missed 1120-S Actually Costs            | Penalty 叙事         |
| W5  | From Excel to Workboard: 30-min CPA Migration Guide              | Migration 叙事       |
| W5  | Building a WISP in a Day                                         | 合规叙事             |
| W6  | How a Client Self-Service Portal Cut My Monday Calls by 80%      | Readiness 差异化叙事 |
| W6  | I Let an AI Agent Onboard My CPA Practice — Here's What Happened | Agent 差异化叙事     |

### 15.7 集训加分三项对齐

| 加分项          | 对应本章节                                  | 关键交付                                       |
| --------------- | ------------------------------------------- | ---------------------------------------------- |
| **+1 部署**     | §11 技术架构 + 实际 Cloudflare Workers 部署 | 公开 URL：`app.duedatehq.com`                  |
| **+2 GTM 方案** | §15.2–15.6                                  | 6 页 Pitch PDF + Landing page 上线 + 14 天日历 |
| **+3 提前交付** | §15.2.5 Day 12 目标                         | D13 前 commit frozen，D14 留给 Demo 排练       |

加上 §15.3 的真实 CPA 开场与现场互动记忆钩子，这就是**稳定脱颖而出的组合拳**。

---

## 16. 风险与对策

| 风险                         | 概率 | 影响 | 对策                                                                    |
| ---------------------------- | ---- | ---- | ----------------------------------------------------------------------- |
| AI 幻觉导致错误税务内容      | 中   | 高   | 强 RAG + citation 校验 + 黑白名单 + 显著 "Not tax advice" 声明          |
| Pulse RSS 抓取不稳           | 高   | 中   | 6 源冗余 + 失败降级 mock + 1 条预置 + "Last checked X min ago" 诚实显示 |
| 规则录入错误                 | 中   | 高   | 双人复核签字 + `verified_by` 留痕 + Report issue 回路                   |
| Migration AI Mapper 置信度低 | 中   | 高   | 5 个 Preset + 低置信度 UI 强制确认 + 所有映射可后悔                     |
| Migration 原子事务失败       | 低   | 高   | 单行失败不阻塞 + 失败行导 CSV + 24h Revert                              |
| 粘贴含 SSN                   | 中   | 中   | 前端正则拦截 + 该列强制 IGNORE + 红色警示                               |
| 数据泄露                     | 低   | 高   | 最小必要数据 + TLS + 加密 + WISP + E&O 保险                             |
| IRC §7216 违规               | 低   | 高   | PII 占位符化 + 只发 schema + ZDR endpoint                               |
| 现场观众 Demo 60s 内记不住   | 中   | 致命 | Clarity Engine 叙事 + Live Genesis 戏剧性 + Penalty $ 数字              |
| 同期竞品同质                 | 高   | 中   | Glass-Box 纪律（others won't）+ Migration Copilot 端到端 + 50 州骨架    |
| Pulse Apply 把不该改的改了   | 低   | 高   | 默认 `requires_human_review` + Ops Approve + 24h Undo + Audit           |

---

## 17. 交付物清单

| 交付                   | 形态          | 验收                                                     |
| ---------------------- | ------------- | -------------------------------------------------------- |
| Production build       | URL           | §12.3 全部 Test ID 通过                                  |
| 源码仓库               | GitHub        | README + setup < 10 min                                  |
| 种子数据               | SQL dump      | 一键 restore（30 规则 + 30 demo 客户 + 2 Pulse）         |
| Demo 视频              | MP4 4K        | 6 分钟，字幕                                             |
| Pitch deck             | PDF + Keynote | 10 页                                                    |
| **WISP v1.0**          | PDF           | 真实试点 / 4 周 MVP：5 页；7 天 Demo 可提交 1-page draft |
| Public Pulse page      | URL           | 首批 ≥ 5 条真实 alert                                    |
| 试点反馈               | Notion        | ≥ 3 位 CPA                                               |
| 付费意愿数据           | CSV           | 点击率报表                                               |
| PRD（本文档）          | Markdown      | Frozen commit                                            |
| AC Traceability Report | HTML          | §12.3 测试全通过截图                                     |
| 5 套 Preset Sample CSV | CSV           | TaxDome / Drake / Karbon / QB / FIT                      |

---

## 18. 附录

### 18.1 竞品价格锚点（2026-04 公开）

- File In Time: ~$199/user 首年 + $100/user/年维护
- Jetpack Workflow: $49/user/mo
- Financial Cents: $19 / $49 / $69
- Karbon: $59–$99/user/mo
- TaxDome: $800–$1,200/user/year
- Canopy: $74 / $109 / $149

### 18.2 官方数据源（MVP 硬编码）

- IRS Publication 509: Tax Calendars
- IRS Form 7004 Instructions（extension 不延 payment）
- IRS IRC §6651（penalty formulas）
- CA FTB Publication 3556（LLC franchise）
- CA R&TC §17941
- NY Tax Law §860 及 PTET 指南
- TX Tax Code §171（franchise tax）
- FL DOR 年度日历
- WA DOR B&O tax
- MA DOR Form 1 / Form 2 / Corporate Excise

### 18.3 术语表

- **Obligation Instance**: 客户 × 规则 × 税年 的一条可执行任务
- **Evidence Chain**: obligation / AI output / migration decision 到原始官方来源的可追溯链路
- **Pulse**: Regulatory Pulse 单条公告事件
- **Pulse Application**: Pulse 应用到某个客户的单次记录
- **Glass-Box**: 所有 AI 输出强制 provenance 的产品纪律
- **Migration Batch**: 一次外部数据源导入的事务单元，原子提交 + 24h 可 Revert
- **Live Genesis**: 导入完成瞬间 deadline 卡片涌出 + Penalty Radar 滚动的动画
- **Default Tax Types Matrix**: `entity × state` 查表兜底的合规组合表（§6A.5）
- **Smart Priority**: 纯函数打分的跨页面统一排序（§6.4）
- **WISP**: Written Information Security Plan（IRS Pub 5708 要求）
- **ICS 单向订阅**: Firm 级 token URL 供 Outlook / Google / Apple 订阅（P1-11）

### 18.4 与前两份 PRD 的集成映射（工程交接用）

| 组件                                 | 来源                             | v2.0 位置       |
| ------------------------------------ | -------------------------------- | --------------- |
| Clarity Engine 叙事                  | v1.0 §0.1                        | §1.2 / §6       |
| Migration Copilot 4 步               | v1.0 §5.8 / §6A                  | §6A.6           |
| Evidence Mode 完整设计               | v1.0 §5.5                        | §5.5            |
| Penalty Radar 计算                   | v1.0 §6.3 + Competitor F-18      | §7.5            |
| Default Tax Types Matrix             | v1.0 §6A.3A                      | §6A.5           |
| Smart Priority 纯函数                | v1.0 §6.4                        | §6.4            |
| LLM-mode tie-breaking                | Competitor F-5b 思路 + v1.0 约束 | §6.4.5          |
| Ask Assistant DSL 双保险             | v1.0 §6.5 + Competitor F-19      | §6.6            |
| Client PDF Report                    | v1.0 §6.6                        | §7.4            |
| ICS 单向订阅                         | v1.0 §4.2 脚注                   | §4.2 P1-11      |
| Pulse 数据模型                       | Competitor §5.2.1                | §6.3 + §8.1     |
| Pulse 邮件耦合                       | **新增**（两份均弱）             | §6.3.4          |
| EIN 字段识别                         | **新增**（两份均缺）             | §6A.2 + §8.1    |
| County 筛选维度                      | **新增**（v1.0 只 Pulse 用）     | §5.2.3 + §8.2   |
| AC Traceability Matrix               | **新增**（两份均缺完整版）       | §3 + §12.3      |
| 50 州骨架策略                        | **新增**                         | §6.1.6          |
| 双档 Revert（24h batch / 7d client） | 融合两者                         | §6A.7           |
| Last-checked 可信度信号              | Competitor §5.1                  | §5.1.4 + §6.3.5 |

### 18.5 何时打破 PRD

只有两种情况可推翻 §4.1 P0：

1. 真实 CPA 在 ≥ 3 次试用中均反馈 "没 X 就不能用"（需录屏证据）
2. §16 任一 Critical 风险实现，且无 degraded mode

否则：**任何新需求，一律下个迭代。**

---

## 19. 产品一句话定位

> **Most tax tools make CPAs earn their value. DueDateHQ earns it back in the first 10 minutes.**
>
> Paste a spreadsheet. Watch 152 deadlines appear. See $19,200 at risk. Click any number — it shows its work.
>
> When an IRS bulletin drops, your Dashboard and inbox update within 24 hours, with the 12 affected clients and the official source link already there.
>
> **Every tax AI today is a confident stranger. DueDateHQ is a tax AI that shows its work** — from the very first paste to the IRS-auditable weekly brief.

**Build it. Ship it. Show the work.**
