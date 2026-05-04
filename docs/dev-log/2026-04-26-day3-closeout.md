# 2026-04-26 · Day 3 收口（JHX Migration 坏行可见 + LYZ Obligations 状态流接通）

日期：2026-04-26

## 背景

`docs/dev-file/10-Demo-Sprint-7Day-Rhythm.md` Day 3 检查表里两条核心验收一直
未勾：

- JHX：CSV 上传后能看到 AI 字段映射结果，坏行单独列出。
- LYZ：Obligations 能改一条 status 并看到 audit 记录。

服务端基础设施（确定性校验、`migration_error` 落库、`scoped.obligations.updateStatus`、
`scoped.audit.write`、tenant middleware）早已就位，但缺少：

1. 把 `migration_error` 暴露给前端 wizard 的 RPC。
2. `obligations.updateStatus` 与 `obligations.list` 的契约 + handler。
3. Obligations 路由的真实数据接入（之前是静态 mock，状态枚举与 DB 不一致）。

## 处理

### 1. 契约层（`packages/contracts`）

- `migration.ts` 增加 `listErrors`：输入 `{batchId, stage}`，输出 `{errors: MigrationError[]}`。
  `MigrationErrorStageSchema = ['mapping','normalize','matrix','all']`，按 `errorCode`
  前缀粗分阶段（`EIN_INVALID`/`EMPTY_NAME` → mapping，`STATE_*`/`ENTITY_*` → normalize），
  待每个 deterministic check 显式 tag origin 后再细化。
- `obligations.ts` 增加 `updateStatus`：输入 `{id, status, reason?}`，输出
  `{obligation, auditId}` —— 把 audit row id 回传，UI 可立即把审计引用 toast 出来。
- `obligation-queue.ts` 从空 `oc.router({})` 改为正式 `list` 契约：
  - 输入：`status[]` × `search` × `sort=due_asc|due_desc|updated_desc` × `cursor` × `limit`。
  - 输出：`rows: ObligationQueueRow[]`（在 `ObligationInstancePublic` 上扩展了
    `clientName`）+ `nextCursor`。
- `index.ts` re-export 新类型；`contracts.test.ts` 锁住 `ObligationStatus`
  枚举顺序、`updateStatus` 输入输出 shape、`obligations.list` 入参 keys、
  `migration.listErrors` stage 选项。

### 2. DB 层（`packages/db`）

- `repo/obligations.ts` 新增 `findById(id)` —— `updateStatus` 处理器读 before/after 用。
- 新建 `repo/obligations.ts` `makeObligationQueueRepo(db, firmId)`：
  - `list(input)` 用 `obligation_instance` `innerJoin client` 取 `clientName`，
    按 `firmId + 可选 status[] + 可选 search`（`client.name LIKE %x%`）筛选。
  - cursor 是 base64url(`${currentDueDate ISO}|${id}`)；keyset
    `(due, id) > / <` 比较，避免 D1 大 offset 的 cost。
  - `limit + 1` sentinel 探测 `nextCursor`，无需额外 count 查询。
  - D1 100-bound-param 预算：status 数组上限 6，search 1，cursor 拆 2，安全。
- `scoped.ts` 把 `obligations` 挂到 `ScopedRepo`；`types.ts` 同步类型。
- `repo/obligations.test.ts` 用 fake-Drizzle chain 覆盖：limit 边界、cursor sentinel、
  `updated_desc` 不分页、cursor 解码失败时优雅降级。

### 3. 服务端 procedures（`apps/server`）

- `procedures/migration/_service.ts` 新增 `MigrationService.listErrors(batchId, stage)`：
  先 `requireBatch` 守 firm 边界，再 `scoped.migration.listErrors` 拉全量，按 stage
  过滤。新增 `toMigrationError` + `classifyErrorStage` helpers。
- `procedures/migration/index.ts` 注册 `listErrors` handler。
- 拆出 `procedures/obligations/_service.ts` `updateObligationStatus(scoped, userId, input)`：
  read-before → 等值 no-op 短路 → updateStatus → re-read → audit.write
  with `before/after` —— 顺序固定，避免 audit 与 row 漂移。
- `procedures/obligations/index.ts`：薄 handler，仅做 Date → ISO 字符串映射，
  把 `ObligationQueueListResult` 转成契约 shape。
- `procedures/index.ts`：把 `obligations: {}` 替换为真实 handlers，注册
  `obligations.updateStatus`、`migration.listErrors`。

### 4. 单测覆盖

- `procedures/migration/_service.test.ts` 加 `listErrors`：`mapping` stage 只返回
  `EIN_INVALID`/`EMPTY_NAME`，跨 firm 直接 `NOT_FOUND`。
- `procedures/obligations/_service.test.ts`（新建）：
  - 正常路径：状态变更 + audit row 包含 `before/after` + `actorId`。
  - 等值短路：no-op，不写 audit，返回稳定 audit id。
  - 跨 firm：`findById` 返回 undefined → `NOT_FOUND`，零 audit 写入。
  - `reason` 缺省时不挂在 audit 上。
- `db/db.test.ts` 加 `obligations.findById` + `obligations.list` smoke。

### 5. 前端 wizard（`apps/app/src/features/migration`）

- `state.ts` 之前预留的 `errors` 字段 + `ERRORS_SET` 真正落地使用。
- `Wizard.tsx` 新增 `listErrorsMutation`，在 `runMapper.onSuccess`
  之后调 `stage='mapping'`，在 `applyDefaultMatrix.onSuccess` 之后调
  `stage='all'`。失败静默 —— `dryRun.summary.errors` 仍然是兜底来源。
- `Step2Mapping.tsx` 增加 `BadRowsPanel`：默认折叠的 `<details>`，列「行号 / 错误码 / 原因」，
  让「坏行不阻塞好行」在 mapping 阶段就可见。
- `Step4Preview.tsx` 去掉 `slice(0, 5)`，改成 `max-h-[320px] overflow-y-auto`
  的可滚动列表 —— 1000 行解析上限内不需要虚拟滚动。

### 6. 前端 obligations（`apps/app/src/routes/obligations.tsx`）

完整重写：

- 删除静态数组与 `'blocked' | 'in review' | …` 假枚举，全部改用 DB 权威的
  6 状态枚举（`pending` / `in_progress` / `review` / `waiting_on_client` /
  `done` / `not_applicable`）。
- 顶栏：`useQuery(orpc.obligations.list.queryOptions)` 拉数据；多选状态 chips、
  搜索框（`useDebounced` 300ms）、排序下拉。
- 行内：`Select` 触发 `useMutation(orpc.obligations.updateStatus.mutationOptions)`，
  成功后 `invalidateQueries(orpc.obligations.list.key())` + `toast.success` 把
  `auditId.slice(0, 8)` 显示在 description 里 —— 这就是「Obligations 改一条 status
  并看到 audit 记录」的肉眼可验证路径。
- 空态：链接到 `useMigrationWizard().openWizard`，提示先跑迁移。
- 「Load more」按钮基于 `nextCursor` 推进 cursor 栈；filter / sort / search 任一
  变化都会清空栈回到第 1 页。

## 偏离 plan 的地方

- 前端 obligations 没有 `useQuery` 桩测 —— 项目里没有现成的 oRPC + RTL 测试
  setup，临时搭建超出 Day 3 的工时预算。改为重点把服务层逻辑测厚（contract
  shape + repo cursor + service.updateObligationStatus 完整路径），UI 一旦
  触发 mutation，audit 端到端的正确性已经在 `_service.test.ts` 锁住。
- `Step4Preview` 没有引入虚拟滚动 —— CSV 解析层就有 1000 行硬上限，DOM
  列表性能不会成为问题。

## 影响

- `pnpm test`：43 (server, +4) · 19 (db, +5) · 7 (contracts, +5) · 37 (app, 不变)
  全绿。
- `pnpm check` / `pnpm format` / `pnpm check:deps` / `pnpm build` 全绿；只有
  packages/ui 一个老的 `placement.ts` 类型断言 warning 与本次无关。
- `pnpm --filter @duedatehq/app i18n:extract` 后新增条目均补齐 zh-CN
  翻译；剩余 31 条 missing 是历史 tech debt，不在本次 scope。
- Day 3 验收两条 `[ ]` 全部勾上；Day 4 起 LYZ 可以基于真实的 Obligations list
  做 Dashboard server-side aggregation 设计。

## 下一步

- Day 4 JHX：`migration.apply` / `revert` / `singleUndo` 用同一条 audit 写入
  约束（read-before-write + before/after），可以直接复用
  `obligations/_service.ts` 的写法。
- Day 4 LYZ：Dashboard 上叠加 server-side aggregation 时复用 `obligations`
  repo 的 join；状态分布统计可以基于同一 query shape 拓展 `groupBy(status)`。
- 后续把 deterministic checks 的 `errorCode` 显式带上 stage tag（比如
  `mapping.EIN_INVALID`），把 `classifyErrorStage` 替换成 schema 校验，从前缀
  启发式升级到 source-of-truth。
