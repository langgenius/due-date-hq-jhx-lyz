# 2026-04-26 · Ready 质量门修复

日期：2026-04-26

## 背景

JHX 的 Day 3 Migration Copilot 与 Astro marketing landing 合入后，本地执行
`pnpm ready` 先被 `vp check` 阻断。阻断点主要来自新增代码的类型与 lint 门禁：

- marketing 的 Astro env 类型缺少 `import.meta.env.DEV`。
- `Step1Intake` 内部事件处理函数没有捕获闭包变量，触发 `consistent-function-scoping`。
- `Wizard` 的矩阵预览 helper 中局部变量与外层 `state` 命名冲突。
- `MigrationService` 测试使用大量 `as never` 构造 test double，触发 unsafe type assertion。
- `astro.config.mjs` 中用 `any` 规避 Astro 6 与 workspace Vite alias 的插件类型递归，触发 unsafe assertion warning。

## 处理

- 为 `apps/marketing/src/env.d.ts` 补充 `DEV` 类型，使 CTA URL resolver 的 dev/prod 分支可被类型系统识别。
- 将 Step 1 drag-over handler 移到组件外，避免每次 render 重建不依赖闭包的函数。
- 将 `buildMatrixPreview` 参数改名为 `wizardState`，并把循环中的 `state` 局部变量改为 `normalizedState`。
- 重写 `MigrationService` 测试中的 in-memory scoped repo：
  - 用 `MigrationDeps['scoped']` 派生 test double 类型。
  - 给未使用的 clients / obligations repo 方法提供显式 stub。
  - 用 schema-driven fake AI 代替 `vi.fn(...) as never`。
- Astro config 保持 Tailwind 4 Vite plugin 接入；对 Astro 6 + workspace Vite alias 的类型递归保留单点 `@ts-expect-error`，避免 `any` 扩散。

## 偏离 plan 的地方

（无）本次不改变产品行为，只恢复质量门。

## 验证

- `pnpm check`
- `pnpm ready`
- `pnpm --filter @duedatehq/marketing check`
- `pnpm --filter @duedatehq/marketing build`

备注：marketing build 仍会输出 Vite 9 相关 deprecation warning（`resolve.alias.customResolver`
与 `transformWithEsbuild`），但 Astro diagnostics 结果为 0 errors / 0 warnings / 0 hints，构建成功。
