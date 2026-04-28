# 2026-04-28 · Rules Console — Fullwidth Layout + Coverage Tab Rebuild

## Context

`/settings/rules` 上线后视觉反馈：内容（页头 + 表格）以 `mx-auto max-w-[928px]` 居中，
而 tab nav 用 `px-6` 锚在 SidebarInset 内边缘 `left=24`。两套锚定标准并存导致内容
在视觉上像"贴在页面里的弹窗"，与 tab nav 失去结构性连接。

进一步分析（见对话上下文）：

- `docs/product-design/rules/02-rules-console-product-design.md` §1 明确 Rules Console
  是**内部 ops workbench**，不是 CPA settings form。四个 tab 的实际载体都是 6/26/28
  行的数据表 + drawer。
- `docs/design/DueDateHQ-DESIGN.md` §5.2 旧规则把 "Settings / Rules" 一并锁定为
  880px，把 IA 路径错当成内容形态。
- 副作用物证：`docs/dev-log/2026-04-27-rules-console-shell.md` 里的 Sources tab
  `Show all` 横向滚动 bug，根因就是 880px 容不下 7 列内容，被迫上 `table-fixed`
  - `compactAcquisitionMethod` / `compactSourceType` 字典强行压宽。

## Decision

**布局判定从 URL 段切换到内容形态。** Rules Console 走 Workboard 同源的全宽
ops workbench 布局；Profile / Members 等真正的 settings form 仍保留 880px 列。

## Implementation

### Layout shell — `apps/app/src/features/rules/rules-console.tsx`

```diff
   <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
-    <div className="mx-auto flex w-full max-w-[928px] flex-col gap-6 px-6 py-6">
+    <div className="flex w-full flex-col gap-6 px-6 py-6">
       <RulesPageHeader description={description} />
       <RulesTabPanel activeTab={activeTab} />
     </div>
   </div>
```

去掉外层 `mx-auto max-w-[928px]`，内容与 tab nav 共用 `px-6`（24px）锚线。
模块顶部 JSDoc 注释一并改写，把"Layout invariants" 从 Figma 静态帧坐标更新为
"全宽 + 同锚 + 内容形态决定宽度"。

### Page header — `apps/app/src/features/rules/rules-console-primitives.tsx`

```diff
-  <p className="max-w-[720px] text-[13px] leading-5 text-text-secondary">{description}</p>
+  <p className="max-w-[1080px] text-[13px] leading-5 text-text-secondary">{description}</p>
```

1512 视口下 720px 的描述被压成 3 行，与标题挤在一团。1080px ≈ 135 个英文
字符／行，是短段落（< 400 chars）的健康可读区间，把当前 290-char 描述压到
~2 行。这条改动同时受益于 Sources / Rule Library / Generation Preview 三个
tab，因为它们共用同一 header。

### Coverage tab — `apps/app/src/features/rules/coverage-tab.tsx`

旧版：纵向叠两表（top: 6 行 jurisdiction summary；bottom: 6×4 矩阵），
均收在 880px 内。

新版（自上而下）：

1. **KPI 条**（`SectionFrame` + 4 格 `sm:grid-cols-4 sm:divide-x`）

   | 格              | 数字来源                 | 强调                                                     |
   | --------------- | ------------------------ | -------------------------------------------------------- |
   | Verified rules  | `sum(verifiedRuleCount)` | —                                                        |
   | Candidates      | `sum(candidateCount)`    | `>0` 时 `text-status-review`                             |
   | Sources watched | `sum(sourceCount)`       | —                                                        |
   | Jurisdictions   | `rows.length`            | caption 派生：`N fully covered · M with open candidates` |

   数字走 `font-mono text-2xl tabular-nums`，符合 DESIGN.md §1.2 "金融级
   数字表达"。

2. **左右双栏**（`xl:grid-cols-12`，< xl 自动 stack）
   - **Left, `col-span-7`** — Jurisdiction summary 表
     - 列宽：JUR 64 · NAME flex · VERIFIED 88 · CANDIDATE 96 · SOURCES 88 · STATUS 260
     - 三个数字列改 `text-right`（金融报表惯例，便于纵向比较）
     - STATUS pill 配色规则维持不变（FED candidate watch → accent，
       TX/FL/WA review → severity-medium，CA/NY → background-subtle）
   - **Right, `col-span-5`** — Jurisdiction × Entity 矩阵
     - 6 jurisdictions × 4 entity（LLC / PARTNERSHIP / S-CORP / C-CORP）
     - 每格 `text-center`，CoverageCell 渲染 dot + label
     - 下方挂 `CoverageLegend`（verified / review / no rule）

3. **Section header pattern**

   每节顶部用 `<SectionLabel>` + 右侧 `text-xs text-text-tertiary` caption，
   告诉读者这一节是干嘛的。例：

   ```
   JURISDICTION SUMMARY                    verified · candidate · sources · current state
   ```

新增的内联组件：

- `StatCell({ label, value, caption, emphasis? })` — 模块私有，仅 KPI 条
  使用。`emphasis` 走 `exactOptionalPropertyTypes` 兼容写法
  `{...(cond ? { emphasis: 'accent' as const } : {})}`，避免 `undefined`
  传入可选字段。
- `aggregateCoverage(rows)` — 纯函数，从 `RuleCoverageRow[]` 派生 KPI
  数字 + fullyCovered 计数。

## Docs

- `docs/design/DueDateHQ-DESIGN.md` §5.2 增订三条新规则：
  - Settings **forms**（Profile / Members / Org general）：880px
  - Settings **data surfaces / ops workbench**（Rules Console、未来的
    Audit log / Team workload）：全宽，与 Workboard 同源
  - Content body 段落：max-w `1080px`
  - 判定原则：**按内容形态而不是 URL 段决定宽度**

- `docs/product-design/rules/02-rules-console-product-design.md`
  - §4.2 重写为 v0.5 全宽布局规格（KPI 条 + 7/12 表 + 5/12 矩阵）
  - 旧 v0.1 ASCII 表格降级为 §4.2.1 历史保留
  - 顶部"下游"链接增加本 dev-log
  - 变更记录新增 v0.5 行

- `docs/dev-log/2026-04-27-rules-console-shell.md` 顶部加 superseded 提示，
  指向本 dev-log。

## i18n

新增 12 条英文 message（`Verified rules` / `Candidates` / `Sources watched` /
`Jurisdictions` / `JURISDICTION SUMMARY` / `JURISDICTION × ENTITY` /
`reminder-ready across MVP scope` / `pending ops review` /
`official channels under monitor` /
`{0} fully covered · {1} with open candidates` /
`verified · candidate · sources · current state` /
`verifiable per (jurisdiction, entity) pair`），全部翻译为 zh-CN，
`pnpm --filter @duedatehq/app i18n:compile --strict` 通过。

## Validation

- `pnpm --filter @duedatehq/app exec tsc --noEmit` — 0 new errors
  （只剩与本次改动无关的两条 `packages/ui/src/components/ui/sidebar.tsx`
  历史报错）
- `pnpm --filter @duedatehq/app test -- --run src/features/rules/` — 5/5 passing
- `pnpm check:fix apps/app/src/features/rules/coverage-tab.tsx
apps/app/src/features/rules/rules-console.tsx` — clean (formatting + lint
  - types)
- `pnpm --filter @duedatehq/app i18n:extract` → 353 / 353，0 missing
- `pnpm --filter @duedatehq/app i18n:compile --strict` — clean

## Out of Scope (next)

- Sources / Rule Library / Generation Preview 三个 tab 也按全宽基准重做
  （Sources 的 `table-fixed` + compact 字典可以一并撤回）。
- `Figma 234:3` Settings · Rules section 4 帧的 1:1 重做（独立 PR / 设计协作）。
- Members / Profile（仍走 880px form 列）的实际页面，等 P1 落地时再确认布局走向。

## References

- `apps/app/src/features/rules/rules-console.tsx`
- `apps/app/src/features/rules/coverage-tab.tsx`
- `apps/app/src/features/rules/rules-console-primitives.tsx`
- `docs/design/DueDateHQ-DESIGN.md` §5.2
- `docs/product-design/rules/02-rules-console-product-design.md` §4.2 / §12
- `docs/dev-log/2026-04-27-rules-console-shell.md`
