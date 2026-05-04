# Migration Copilot · Default Tax Types Inference Matrix v1.0

> 版本：v1.0（Demo Sprint · 2026-04-24）
> 上游：PRD Part1B §6A.5 · Part1A §3.2 S2-AC4 · Part1A §4.1 P0-5 · `dev-file/03-Data-Model.md` §2.2 / §2.5
> 入册位置：[`./README.md`](./README.md) §2 第 05 份

---

## 1. 定位

**一句话**：Default Tax Types Inference Matrix **v1.0 Demo Sprint 子集** = 3 辖区（federal 虚拟辖区 + CA + NY）× 8 实体类型 = **24 格**。

- **兑现 S2-AC4**：导入后立即生成全年日历，**无需额外配置**（PRD Part1A §3.2 / Part1B §6A.10）
- **不是 AI**：这是 ops 人工签字的**静态查表**（`./05-default-matrix.v1.0.yaml`），**纯函数**，**零幻觉**（PRD Part1B §6A.5）
- **触发时机**：AI Mapper 未识别 `client.tax_types` 列（常见于 QuickBooks / Karbon 的元数据导出），Rule Engine 以 `(entity_type, state)` 为键查本矩阵，写 `evidence_link(source_type='default_inference_by_entity_state', matrix_version='v1.0')`
- **增强约束**：对外体验必须展示 coverage 状态，不能把 `ops_verified_by=pending` 的 Demo seed 包装成正式 verified。状态模型见 [`./11-agentic-enhancements.md#3-增强点-b--6-辖区信任路线coverage-transparency`](./11-agentic-enhancements.md#3-增强点-b--6-辖区信任路线coverage-transparency)。

---

## 2. 矩阵 v1.0（24 格）

查表键 = `(entity_type, state)`；结果 = `tax_types[]` + `evidence` + `confidence`。Federal 项由 `federal_overlay` 统一追加（见 [`./05-default-matrix.v1.0.yaml`](./05-default-matrix.v1.0.yaml) `federal_overlay` 段），Rule Engine 合并时去重。

| #   | entity_type × state | 推断 tax_types[]                                                                | 证据 source_type                    | ops 签字 | matrix_version |
| --- | ------------------- | ------------------------------------------------------------------------------- | ----------------------------------- | -------- | -------------- |
| 1   | `llc × CA`          | `federal_1065_or_1040`, `ca_llc_franchise_min_800`, `ca_llc_fee_gross_receipts` | `default_inference_by_entity_state` | pending  | v1.0           |
| 2   | `llc × NY`          | `federal_1065_or_1040`, `ny_llc_filing_fee`, `ny_ptet_optional`                 | `default_inference_by_entity_state` | pending  | v1.0           |
| 3   | `s_corp × CA`       | `federal_1120s`, `ca_100s_franchise`, `ca_ptet_optional`                        | `default_inference_by_entity_state` | pending  | v1.0           |
| 4   | `s_corp × NY`       | `federal_1120s`, `ny_ct3s`, `ny_ptet_optional`                                  | `default_inference_by_entity_state` | pending  | v1.0           |
| 5   | `partnership × CA`  | `federal_1065`, `ca_565_partnership`, `ca_ptet_optional`                        | `default_inference_by_entity_state` | pending  | v1.0           |
| 6   | `partnership × NY`  | `federal_1065`, `ny_it204`, `ny_ptet_optional`                                  | `default_inference_by_entity_state` | pending  | v1.0           |
| 7   | `c_corp × CA`       | `federal_1120`, `ca_100_franchise`                                              | `default_inference_by_entity_state` | pending  | v1.0           |
| 8   | `c_corp × NY`       | `federal_1120`, `ny_ct3`                                                        | `default_inference_by_entity_state` | pending  | v1.0           |
| 9   | `sole_prop × CA`    | `federal_1040_sch_c`, `ca_540`                                                  | `default_inference_by_entity_state` | pending  | v1.0           |
| 10  | `sole_prop × NY`    | `federal_1040_sch_c`, `ny_it201`                                                | `default_inference_by_entity_state` | pending  | v1.0           |
| 11  | `trust × CA`        | `federal_1041`, `ca_541`                                                        | `default_inference_by_entity_state` | pending  | v1.0           |
| 12  | `trust × NY`        | `federal_1041`, `ny_it205`                                                      | `default_inference_by_entity_state` | pending  | v1.0           |
| 13  | `individual × CA`   | `federal_1040`, `ca_540`                                                        | `default_inference_by_entity_state` | pending  | v1.0           |
| 14  | `individual × NY`   | `federal_1040`, `ny_it201`                                                      | `default_inference_by_entity_state` | pending  | v1.0           |
| 15  | `other × CA`        | `federal` + `needs_review`                                                      | `default_inference_by_entity_state` | pending  | v1.0           |
| 16  | `other × NY`        | `federal` + `needs_review`                                                      | `default_inference_by_entity_state` | pending  | v1.0           |

> 以上 16 条 `(entity, state)` 查表 + 8 条 federal-only overlay（每种 entity 一条 federal 兜底）= 24 个语义单元。YAML seed（见 [`./05-default-matrix.v1.0.yaml`](./05-default-matrix.v1.0.yaml)）把 federal overlay 独立成 `federal_overlay.by_entity_type`，避免 federal 项在 16 个 (entity, state) cell 之间重复书写。

**运行期合并逻辑**：

```text
function infer(entity_type, state):
  cell   = yaml.rules.find(r -> r.key == {entity_type, state})
  fedset = yaml.federal_overlay.by_entity_type[entity_type]
  if cell is null:
    state_review_types = generated_review_only_state_tax_types(entity_type, state)
    return { tax_types: dedup(fedset ++ state_review_types), needs_review: true, reason: 'state_rules_require_review' }
  return { tax_types: dedup(cell.tax_types ++ fedset), needs_review: cell.needs_review ?? false }
```

2026-05-04 update: runtime matrix now accepts 50 states + DC. CA/NY retain verified explicit
cells; other jurisdictions add source-backed review-only tax types from the full rules registry
instead of falling back to federal-only.

### 2.1 每条 tax_type ID 的形式化定义

全部 snake_case；**权威形式化定义在 YAML seed**（`./05-default-matrix.v1.0.yaml`），本文件列出 Demo Sprint 范围内使用的 ID 清单：

- **Federal**：`federal_1040`, `federal_1040_sch_c`, `federal_1041`, `federal_1065`, `federal_1065_or_1040`, `federal_1120`, `federal_1120s`, `federal`（兜底）
- **California**：`ca_540`, `ca_541`, `ca_100_franchise`, `ca_100s_franchise`, `ca_565_partnership`, `ca_llc_franchise_min_800`, `ca_llc_fee_gross_receipts`, `ca_ptet_optional`
- **New York**：`ny_it201`, `ny_it204`, `ny_it205`, `ny_ct3`, `ny_ct3s`, `ny_llc_filing_fee`, `ny_ptet_optional`

---

## 3. 未覆盖格回退

| 情况                                    | 回退                                                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `state ∈ {TX, FL, WA, 其他非 CA/NY 州}` | Federal-only（按 entity_type 在 `federal_overlay.by_entity_type` 查）+ `needs_review` 徽章；TX/FL/WA 已有 Rules MVP coverage，但不在 Default Matrix v1.0 demo seed |
| `entity_type = other`                   | `federal`（通用兜底）+ `needs_review` 徽章                                                                                                                         |
| `(entity, state)` 都缺                  | `federal` + `needs_review`；UI 提示"请补全 entity_type / state 后重新推断"                                                                                         |

**Phase 0 扩容路径**：

- Phase 0 MVP（4 周全量）：补 TX / FL / WA，使 Default Matrix 与当前 Rules MVP coverage（Federal + CA/NY/TX/FL/WA）对齐
- Phase 1：扩 **50 州骨架 × 8 实体 = 400 格**，`coverage_status=skeleton` 的格未经 ops 签字前标 `needs_review`

### 3.1 Coverage 状态裁定

| 状态          | 使用时机                                                                              | UI 行为                                    | `confidence` 口径      |
| ------------- | ------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------- |
| `verified`    | ops 已签字，source_urls / verified_by / verified_at 完整                              | 可显示 `Verified coverage`                 | 查表项可为 1.0         |
| `demo_seed`   | Demo Sprint CA / NY 种子，有来源但 `ops_verified_by=pending`                          | 显示 `Demo coverage · verify before pilot` | UI 不宣称正式 verified |
| `skeleton`    | TX / FL / WA 等当前 MVP 州在 Default Matrix v1.0 尚未展开，或未来扩州结构就位但未签字 | federal-only + `State review needed`       | 不生成州级 obligations |
| `unsupported` | 未计划或无足够规则来源                                                                | 不生成州级 obligations                     | 不适用                 |

Demo Sprint 的 CA / NY 允许在演示路径作为 `demo_seed` 默认生效；真实 pilot 前必须升为 `verified` 或降为 `skeleton`。TX / FL / WA 已进入当前 Rules MVP coverage，但本 Default Matrix v1.0 仍未自动推断对应 state tax types，页面必须显示 `State review needed`，不能把 matrix fallback 说成州级 obligation 已自动生成。

---

## 4. YAML Seed 结构

**单一事实源**：[`./05-default-matrix.v1.0.yaml`](./05-default-matrix.v1.0.yaml)

将来 drop-in 消费位置：`packages/core/default-matrix/v1.0.yaml`（由 Rule Engine 在启动时 `yaml.load`）。

结构约定：

```yaml
matrix_version: v1.0
generated_at: 2026-04-24
scope: demo_sprint

rules:
  - key:
      entity_type: llc
      state: CA
    tax_types:
      - federal_1065_or_1040
      - ca_llc_franchise_min_800
      - ca_llc_fee_gross_receipts
    evidence:
      source_type: default_inference_by_entity_state
      matrix_version: v1.0
      ops_verified_by: pending
      ops_verified_at: pending
      source_urls:
        - https://www.ftb.ca.gov/file/business/types/limited-liability-company.html
    confidence: 1.0

federal_overlay:
  by_entity_type:
    llc: [federal_1065_or_1040]
    s_corp: [federal_1120s]
    # ... 其余 entity_type

fallback:
  strategy: federal_only_with_needs_review
  # ...
```

- 2 空格缩进；key 用 snake_case；不使用 YAML `!!` 类型注解（对齐本册写作约束）
- 每条 rule 四要素：`key / tax_types / evidence / confidence`
- `evidence.source_urls` 用真实 IRS / FTB / NYS DTF 官方页路径；**Demo Sprint 期间 `ops_verified_by = ops_verified_at = "pending"`**，Phase 0 起必须 ops 人工签字

---

## 5. Glass-Box Evidence 写法

对齐 PRD Part1B §6A.5。每次矩阵命中（即 Rule Engine 为某客户生成了 obligation），写一条 `evidence_link`：

```json
{
  "source_type": "default_inference_by_entity_state",
  "raw_entity_type": "LLC",
  "raw_state": "CA",
  "inferred_tax_type": "ca_llc_franchise_min_800",
  "matrix_version": "v1.0",
  "applied_at": "2026-04-24T09:00:00Z",
  "applied_by": "system"
}
```

- `source_type` = 固定字面量 `'default_inference_by_entity_state'`（对齐 `dev-file/03` §2.5 evidence_link 枚举）
- `matrix_version` = `'v1.0'`（随 YAML 文件名同步升版）
- `applied_by = 'system'`（矩阵是纯函数，不需用户动作触发）
- `confidence = 1.0`（查表 + ops 签字 = 零幻觉；`other × *` 两格 confidence = 0.5 并标 `needs_review`）

---

## 6. UI 联动（Step 3 Normalize · 引用 02）

Step 3 Normalize 的 **"Suggested tax types"** 区块消费本矩阵；DDL cut 中该区块默认应用 Default Matrix 来补全缺失的 `client.tax_types`（兑现 PRD Part1B §6A.5 "无需额外配置"），并允许按 `(entity_type, state)` cell 取消自动补全。详细 UX 规格见 [`./02-ux-4step-wizard.md#step-3-normalize`](./02-ux-4step-wizard.md#step-3-normalize)。

语义摘要（非像素规格）：

```text
Suggested tax types (inferred from entity × state)
  Acme LLC (TEST) (LLC · CA)          → CA Franchise Tax, CA LLC Fee, Federal 1065
  Bright Inc (TEST) (S-Corp · NY)     → NY CT-3-S, NY PTET, Federal 1120-S
  Zen Holdings (TEST) (LLC · TX) ⚠️    → Federal 1065 (needs review — TX not in demo seed)
  [✓ Apply to all] applies only where imported rows do not already include tax types.
```

- ⚠️ 徽章 = `needs_review`，客户仍可导入，但 Workboard 上该客户带黄色标记（对齐 PRD §6A.3 "非阻塞"原则）
- `Apply to all` 取消后，后端将该 cell 写入 `mapping_json.matrixApplied[].enabled=false`；`dryRun` 和 `apply` 都不得为该 cell 缺 `tax_types` 的客户 fallback 自动推断
- Phase 0 可追加完整逐行 tax type override；DDL cut 先提供逐 cell 取消，避免对每个 client 暴露过重表格编辑面

---

## 7. Phase 0 扩展位

| 扩展项                       | 阶段        | 备注                                                                                                |
| ---------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| TX / FL / WA 辖区扩容        | Phase 0 MVP | 补 24 格（3 州 × 8 entity）；矩阵升到 v1.1；ops 必须逐格签字                                        |
| 50 州骨架                    | Phase 1     | `coverage_status=skeleton`，未签字前不推断、仅回退 federal_only                                     |
| PTET optional 的 entity 适配 | Phase 0 MVP | 目前仅 `s_corp / partnership` 有 PTET；Phase 0 增加 `llc (treated as partnership)` 的自动 PTET 分支 |
| Matrix v1.x 的 semver 约定   | Phase 0 起  | 新增格 → minor（v1.0 → v1.1）；已有格改变 tax_type 推断 → major（v1.x → v2.0）+ ADR                 |
| Pulse 影响 matrix 的 expire  | Phase 1     | 联邦 / 州 relief 的 Pulse 接管 → evidence_link 改走 `pulse_apply`，不再由 matrix 产生               |

---

## 变更记录

| 版本 | 日期       | 作者       | 摘要                                                                                                           |
| ---- | ---------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| v1.0 | 2026-04-24 | Subagent D | 初稿：Federal + CA + NY × 8 实体 = 16 rules + federal_overlay + fallback；24 格语义口径 · YAML seed 对齐       |
| v1.1 | 2026-04-24 | Codex      | 增补 coverage 状态裁定：verified / demo_seed / skeleton / unsupported，避免 pending seed 被包装成正式 verified |
