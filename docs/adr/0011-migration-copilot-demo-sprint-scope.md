# 0011 · Migration Copilot Demo Sprint 产品形态锁定

## 背景（Context）

Demo Sprint 是 DueDateHQ 的 7 天集训周期（`../dev-file/10-Demo-Sprint-7Day-Rhythm.md` §1），集训前 Migration Copilot 的**产品形态、UX、AI Prompt、Default Matrix、Fixture、设计系统增量**必须被一次性锁定，才能让 Day 2 / Day 3 的实现并行冻结 4 条共享契约：

- AI Execution Contract（`../dev-file/09-Demo-Sprint-Module-Playbook.md` §6 · Provider = Alice / AI Orchestrator）
- Audit + Evidence Contract（同 §6 · Provider = Bob / Evidence + Audit Trail）
- Client Domain Contract（同 §6 · Provider = Bob / Client + Workboard）
- Obligation Domain Contract（同 §6 · Provider = Bob / Client + Workboard）

PRD v2.0 §6A 覆盖的是**完整 4 周 Phase 0 MVP 口径**（`docs/PRD/DueDateHQ-PRD-v2.0-Part1A.md` §4.1 P0-2 ~ P0-6 · Part1B §6A.1 ~ §6A.11），其 6 处与 Demo Sprint 7 天子集存在产品裁定分歧：辖区 seed 数量、Revert 权限、5 Preset 清单、T-S2-01 双指标口径、KPI 起止点、Placeholder 策略、audit action 命名。长篇理由与逐条 PRD 引用位置存放在 [`../product-design/migration-copilot/10-conflict-resolutions.md`](../product-design/migration-copilot/10-conflict-resolutions.md)（本册的 authoritative source），本 ADR 仅做**决策索引 + 设计系统增量 + Follow-ups**。

此外，`DESIGN.md`（YAML front-matter）缺 `stepper` / `confidence-badge` / `toast` / `risk-row-high` / `risk-row-upcoming` / `genesis-odometer` / `genesis-particle` / `email-shell` 等组件 token，导致 Migration Copilot 本册 02 ~ 08 的视觉规格引用悬空——必须一次性补齐并同步回灌到 `docs/Design/DueDateHQ-DESIGN.md` 的使用说明章节。

## 决策（Decision）

分四块。

### I. MVP 边界（Demo Sprint 口径）

Demo Sprint Migration Copilot 以下述边界交付（权威来源：[`../product-design/migration-copilot/01-mvp-and-journeys.md`](../product-design/migration-copilot/01-mvp-and-journeys.md) §1）：

- **辖区 seed**：Federal（虚拟辖区） + CA + NY 三辖区，共 24 格 Default Matrix（对齐 [`../product-design/migration-copilot/05-default-matrix.md`](../product-design/migration-copilot/05-default-matrix.md) §2 · [`../product-design/migration-copilot/05-default-matrix.v1.0.yaml`](../product-design/migration-copilot/05-default-matrix.v1.0.yaml)）
- **权限**：Owner-only 单账号；Manager / Preparer / Coordinator 不在本 Sprint 渲染（对齐 PRD §3.6.3 + 01 §6.1）
- **Pulse 产生的 obligations**：Demo Sprint 直接 UPDATE 走 base rule，不走 Overlay Engine（P1 才启用 Overlay Engine，见 `../dev-file/00-Overview.md` §3 第 3 条）
- **主路径**：传统 4 步向导（`Intake / Mapping / Normalize / Dry-Run + Live Genesis`）承载全部 S2 AC 验收（[`../product-design/migration-copilot/02-ux-4step-wizard.md`](../product-design/migration-copilot/02-ux-4step-wizard.md)）
- **Onboarding AI Agent（PRD §6A.11）**：仅**设计锁定**（对话脚本 / state machine / fallback / Demo 钩子），**不实现**；空态首页以 `[Try AI Setup Copilot (preview)]` disabled 卡片占位，点击降级为传统向导 Step 1（[`../product-design/migration-copilot/03-onboarding-agent.md`](../product-design/migration-copilot/03-onboarding-agent.md) §1.3）

**本册 10 份子文档索引**（全部路径相对于 `docs/product-design/migration-copilot/`，对齐 [`../product-design/migration-copilot/README.md`](../product-design/migration-copilot/README.md) §2）：

1. [`./README.md`](../product-design/migration-copilot/README.md)（入口、前置阻塞门、裁定速查）
2. [`./01-mvp-and-journeys.md`](../product-design/migration-copilot/01-mvp-and-journeys.md)（Demo Sprint MVP 范围 · AC × Test × P0 映射 · KPI 埋点 · S2 用户旅程）
3. [`./02-ux-4step-wizard.md`](../product-design/migration-copilot/02-ux-4step-wizard.md)（4 步向导像素级 UX）
4. [`./03-onboarding-agent.md`](../product-design/migration-copilot/03-onboarding-agent.md)（PRD §6A.11 Onboarding AI Agent 产品形态锁定）
5. [`./04-ai-prompts.md`](../product-design/migration-copilot/04-ai-prompts.md)（Field Mapper / Normalizer Prompt 定稿）
6. [`./05-default-matrix.md`](../product-design/migration-copilot/05-default-matrix.md) + [`./05-default-matrix.v1.0.yaml`](../product-design/migration-copilot/05-default-matrix.v1.0.yaml)（Default Matrix Demo 子集）
7. [`./06-fixtures/README.md`](../product-design/migration-copilot/06-fixtures/README.md)（5 Preset fixture + Agent demo fixture）
8. [`./07-live-genesis.md`](../product-design/migration-copilot/07-live-genesis.md)（Live Genesis 动效规格）
9. [`./08-migration-report-email.md`](../product-design/migration-copilot/08-migration-report-email.md)（Import 完成邮件模板）
10. [`./09-design-system-deltas.md`](../product-design/migration-copilot/09-design-system-deltas.md)（本 ADR 的设计系统增量来源）
11. [`./10-conflict-resolutions.md`](../product-design/migration-copilot/10-conflict-resolutions.md)（本 ADR 的裁定理由来源）

### II. 6 条冲突裁定（决策索引 · 详细理由见 10-conflict-resolutions.md）

逐条一句话裁定 + PRD 来源 + 10-conflict-resolutions 锚点。

| #   | 冲突摘要                     | PRD 来源                                                      | 裁定（一句话）                                                                                                                                  | 详细理由锚点                                                                                              |
| --- | ---------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Revert 24h 全量权限          | Part1A §3.6.3 RBAC + Part1B §6A.7 Revert 双档                 | **Owner + Manager**；Revert 是补救能力，Owner-only 保留给所有权 / billing / role / export                                                       | [10 §1](../product-design/migration-copilot/10-conflict-resolutions.md#1-revert-24h-全量撤销权限)         |
| 2   | 5 Preset 是否含 File In Time | Part1A S2-AC1 + §4.1 P0-2 + Part1B §6A.4 + Part2B §17         | **含**；渲染顺序固定为第 5 位 + 附彩蛋 tip "Coming from File In Time? We'll migrate your full-year calendar in one shot."                       | [10 §2](../product-design/migration-copilot/10-conflict-resolutions.md#2-5-preset-含-file-in-time)        |
| 3   | T-S2-01 指标口径             | Part2B §12.3 T-S2-01 + Part1B §6A.10 S2-AC1 + §6A.2 EIN       | **双指标同时满足**：`Mapping Confidence 平均 ≥ 95%` **且** `EIN 识别率 = 100%`（EIN 列正则 `^\d{2}-\d{7}$` 命中率 ≥ 80% 才算"识别"）            | [10 §3](../product-design/migration-copilot/10-conflict-resolutions.md#3-t-s2-01-双指标口径)              |
| 4   | KPI 起点 / 终点口径          | Part2B §12.2 Activation + Part1B §6A.10 S2-AC5 + Part1A §0.3  | **两个指标两条独立 funnel**：TTFV `signup.completed → dashboard.penalty_radar.first_rendered`；P95 完成 `signup.completed → migration.imported` | [10 §4](../product-design/migration-copilot/10-conflict-resolutions.md#4-kpi-起点与终点口径)              |
| 5   | Placeholder 策略             | Part2B §9.3 数据保留与调用记录 + §13.2 + Part1B §6A.9 + §6A.2 | **分场景两档**：Mapper / Normalizer 只发字段名 + 5 行样本（不走 `{{client_N}}`）；Onboarding Agent / Pulse / Brief 走占位符 + 后端回填          | [10 §5](../product-design/migration-copilot/10-conflict-resolutions.md#5-placeholder-策略)                |
| 6   | Audit action 命名 vs UI 文案 | Part2B §13.2.1 + Part1B §6A.6 / §6A.8 + Part2B §13.2          | **分两层**：`migration.*` 工程 log + PostHog 事件名（不进 Lingui）；UI / 邮件 / Toast 文案走 Lingui catalog（两套字符串，同源不混用）           | [10 §6](../product-design/migration-copilot/10-conflict-resolutions.md#6-audit-action-命名与-ui-文案分层) |

### III. 设计系统增量（9 条 delta：8 个 YAML token + 1 条 Keyboard 裁定 · 双文件回灌）

完整规格见 [`../product-design/migration-copilot/09-design-system-deltas.md`](../product-design/migration-copilot/09-design-system-deltas.md)；本 ADR 仅列决策项。

1. **`stepper`**：4 步水平步骤条；5 种状态色（current / completed / upcoming / error / disabled）；`Enter` 不跳步 / 数字键 1-4 不跳步（仅 `[Continue]` / `[Back]` 推进）
2. **`confidence-badge`**：3 档（high ≥ 0.95 / med 0.80 – 0.94 / low < 0.80）；色系与 severity / status 解耦新 semantic 位
3. **`toast`**：3 tone（info / success / warning）× 2 variant（default 3s + 500ms undo / persistent 至 `revertible_until` 过期）；**Persistent 时钟源 = 服务端返回的 `revertible_until` 字段**（解决 Subagent B NEEDS REVIEW 4；前端只渲染，不本地倒计时）
4. **`risk-row-high`**：补漏 severity-high 行（补齐 Subagent B NEEDS REVIEW 3）
5. **`risk-row-upcoming`**：补漏 severity-medium 行（同上）
6. **`genesis-odometer`**：`{typography.hero-metric}` + tabular-nums + `cubic-bezier(0.4, 0, 0.2, 1)`；`prefers-reduced-motion` 降级 = 200ms fade-in
7. **`genesis-particle`**：6px canvas 粒子 + 10% glow + 4 点三次贝塞尔 + 同屏上限 30 颗
8. **`email-shell`**：640px table 布局 + Geist Mono tabular num for 金额 / 日期
9. **键盘裁定**：`A` 键仅在 Step 3 Suggested tax types 的 `Apply to all` cell 内生效，用于切换当前聚焦 cell；不注册全局 `A`，`Enter` = Continue 仅在焦点不在 textarea / contenteditable / select 时生效（解决 Subagent B NEEDS REVIEW 1 / 2；非 YAML token）

**权威裁定（needs_review 用色）**：

- **数据质量类 needs_review**（Mapper 低置信 / Normalizer 冲突 / Default Matrix 非种子辖区）→ `{colors.severity-medium}`（黄）
- **工作流态 Review**（Workboard Needs review / Client Detail review 抽屉）→ `{colors.status-review}`（紫）
- 两者绝不混用；此裁定同步写入 [`../product-design/migration-copilot/09-design-system-deltas.md`](../product-design/migration-copilot/09-design-system-deltas.md) §3.4 + `../Design/DueDateHQ-DESIGN.md` §14.7。

**双文件回灌**：8 个组件 token 落 `DESIGN.md` YAML；9 条 delta 的使用说明 / 可达性 / 降级规格落 `docs/Design/DueDateHQ-DESIGN.md` §14 Migration Copilot 向导（原 §9 已被 Do's and Don'ts 占用）。回灌清单见 09-design-system-deltas §10。

### IV. Onboarding AI Agent（PRD §6A.11）设计锁定不实现

- **形态完整锁定**：对话脚本（§6A.11.2 原文照录） / state machine（7 状态） / fallback / Demo 钩子、`onboardingDraft` 对象契约、Setup History 位全部写入 [`../product-design/migration-copilot/03-onboarding-agent.md`](../product-design/migration-copilot/03-onboarding-agent.md)
- **Demo Sprint 首页**：disabled preview 卡片 + "Coming soon" 占位 + 自动降级跳传统向导 Step 1；空态入口矩阵"首登强制 + 三处非强制"语义不变
- **埋点**：`onboarding.agent.preview_card.clicked`（工程 log 口径，不进 Lingui）
- **真实实现**：Phase 0（4 周 MVP）增量上线，冻结契约 = AI Execution Contract + Audit/Evidence Contract + Obligation Domain Contract（03 §1.4 扩展路线）

## 备选方案（Alternatives）

- **(a) Demo Sprint 直接做完整 Phase 0 四周 MVP** —— 拒绝。7 天集训不可能同时完成 Federal + 5 MVP states matrix seed + Team RBAC 四角色 + Overlay Engine + Onboarding Agent 真实实现；硬压 timebox 必然崩表（对齐 `../dev-file/10-Demo-Sprint-7Day-Rhythm.md` §6 已标 "stretch" 的项目清单）。
- **(b) Demo Sprint 不做 Migration Copilot，只做 Dashboard / Workboard** —— 拒绝。Migration 是 Demo 叙事的 jaw-drop moment（Part2B §15.3.2 Live Genesis）；没有 Migration 就没有"30 分钟完成 30 客户"的北极星兑现，Pitch 失去主线。
- **(c) 把 6 条冲突裁定直接写进 PRD 正文** —— 拒绝。PRD 是产品语义最终权威（4 周 Phase 0 MVP 口径）；Demo Sprint 子集是工程落地口径，语义层面两者必须可分可合。冲突裁定放在本册 10-conflict-resolutions 并通过 ADR 固化是正确分层（对齐 [`../product-design/migration-copilot/README.md`](../product-design/migration-copilot/README.md) §6 "冲突优先级"三级规则）。
- **(d) 设计系统增量只回灌 `DESIGN.md`，不动 DueDateHQ-DESIGN** —— 拒绝。`DESIGN.md` YAML 只承载 token 原子，没有使用说明 / 可达性 / 降级规格；DueDateHQ-DESIGN §9 是实现层必读资产，否则 Frontend 每次都要在 09-design-system-deltas 里再翻一次。

## 后果（Consequences）

### 好处（Good）

- Day 2 AI Orchestrator + Audit + Evidence 契约、Day 3 Client + Obligation 契约**可以直接基于本册设计冻结**——Prompt 字段集、evidence source_type 清单、obligation schema 都有 drop-in 输入
- Prompt / Matrix / Fixture 是 drop-in 资产：无需再做 UX 确认，直接进单测 / E2E（对齐 [`../product-design/migration-copilot/06-fixtures/README.md`](../product-design/migration-copilot/06-fixtures/README.md)）
- 设计系统增量一次性补齐，`DESIGN.md` + DueDateHQ-DESIGN + 子文档三方**不再悬空引用**
- Phase 0 4 周 MVP 扩容时，本册的 Phase 0 扩展位（辖区扩 seed / Team RBAC / Overlay Engine / Agent 真实化）给出明确 hook，避免 Phase 0 启动时再做一轮考古

### 代价 / 不确定（Bad / 不确定）

- `clients.entity_type` enum 当前 7 项（`../dev-file/03-Data-Model.md` §2.2）缺 `individual`；本册 Mapper 目标 schema 要求 8 项（含 `individual`）。需在 Day 3 Client Domain 契约冻结前通过 `[contract]` PR 补齐（**Follow-up FU-1**）
- Migration 专属 AI SDK 配额默认 20 次/day 是本册估算值；`../dev-file/04-AI-Architecture.md` §8 只写"每 batch 固定开销"，真实上线前需调参（**FU-2**）
- `federal` 作为虚拟辖区 tax_type 兜底 ID 需 Rules Ops 正式签字进词表（**FU-3**）
- Revert endpoint `/api/migration/{batch_id}/revert` 与 `/rpc` 路由分层需 Backend owner 最终确认（**FU-4**）
- Dashboard 跳转 URL 参数 `?tab=this-week&focus=top-1` 需 Dashboard owner 对齐（**FU-5**）
- Onboarding Agent 的 `onboardingDraft` 与 wizard 的 `wizardDraft` 契约合并要在 P1 做（**FU-6**）
- 本册与 PRD 的任何产品语义冲突必须先改 PRD 或本册裁定表；**禁止**在代码里沉淀第 3 份真理来源（**FU-7**）
- Agent-shaped setup 增强已写入 `../product-design/migration-copilot/11-agentic-enhancements.md`；它不改变 Demo Sprint hard commitment，但定义 Phase 0 的近最终 Agent 形态、allowed tools 与 coverage transparency（**FU-8 ~ FU-11**）

### Follow-ups

> 这些是本期为了维持 Demo Sprint 范围而**有意识推迟**的决策点。下次接相关功能时直接读这一段。

| ID    | 触发时点                                          | 内容                                                                                                                                                                             | Owner（角色占位）                                |
| ----- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| FU-1  | Day 3 Client Domain 契约冻结前（`[contract]` PR） | 把 `clients.entity_type` enum 从 7 项扩到 8 项（追加 `individual`），更新 `../dev-file/03-Data-Model.md` §2.2 + 写 Drizzle migration                                             | Client + Workboard owner（Bob）                  |
| FU-2  | Day 6 Demo Dry-run 前 / Phase 0 真实上线前        | 调参 Migration 专属 AI SDK 配额；更新 `../dev-file/04-AI-Architecture.md` §8 Budget 段，落 PostHog alert threshold                                                               | AI Orchestrator owner（Alice）                   |
| FU-3  | Phase 0 MVP 正式启动前                            | Rules Ops 签字把 `federal` 虚拟辖区 tax_type 兜底 ID 写入词表（对齐 05-default-matrix `fallback.strategy`）                                                                      | Rules Ops lead                                   |
| FU-4  | Day 3 Audit/Evidence 契约冻结前                   | 决定 `/api/migration/{batch_id}/revert` vs `/rpc/migration.revert` 路由归属；不会同时存在两条路径                                                                                | Backend owner / Audit + Evidence owner           |
| FU-5  | Day 4 Migration → Dashboard 联调前                | Dashboard 跳转 URL 参数 `?tab=this-week&focus=top-1` schema 对齐；确认 focus key 用 obligation id 还是 row index                                                                 | Dashboard + Pulse + Brief owner（Alice）         |
| FU-6  | Phase 0 Week 3 Onboarding Agent 实装前            | `onboardingDraft`（[`./03-onboarding-agent.md`](../product-design/migration-copilot/03-onboarding-agent.md) §4.3）与 `wizardDraft` 契约合并；避免双写                            | Client + Workboard owner + AI Orchestrator owner |
| FU-7  | 本册或 PRD 任一处产品语义被改动时                 | 先改 PRD 或本册 `10-conflict-resolutions.md` 裁定表 + 同步 ADR 0011 Status；**禁止**在代码 / SQL / Prompt 里沉淀第 3 份真理来源                                                  | 修改方（自担同步责任）                           |
| FU-8  | Phase 0 Agent shell 接入前                        | 定义 `MigrationOrchestrationEnvelope` contract DTO；Agent / Wizard / Dashboard 共用 `batch_id` 事务边界                                                                          | Migration owner + AI Orchestrator owner          |
| FU-9  | Phase 0 Default Matrix 扩容前                     | 为 Default Matrix 增加 `coverage_status` 字段；CA / NY 从 `demo_seed` 升级到 `verified`，TX / FL / WA 至少进入 `skeleton`；当前 Rules MVP coverage 已是 Federal + CA/NY/TX/FL/WA | Rules Ops lead                                   |
| FU-10 | Day 5 Dashboard Slot / Phase 0 Pulse 联调前       | 落 `dashboard.first_week_operating_loop.ready` slot；Demo Sprint fixture Pulse 必须标 demo/sample，Phase 0 改真实 Pulse match                                                    | Dashboard + Pulse owner                          |
| FU-11 | Step 4 Dry-Run 强化前                             | 增加 evidence preview 抽屉；明确 dry-run preview 不是正式 audit record，commit 成功后才写正式 audit                                                                              | Migration owner + Audit/Evidence owner           |

## 状态（Status）

accepted · 2026-04-24
