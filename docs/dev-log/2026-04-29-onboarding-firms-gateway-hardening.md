# 2026-04-29 · Onboarding firms gateway hardening

## 背景

`/firm` 的 Delete firm 已经是真实 soft-delete：后端把 `firm_profile.status` 置为
`deleted`，并在没有其它可用 firm 时清空 `session.activeOrganizationId`。问题在
onboarding：它仍直接调用 Better Auth `organization.list()` / `setActive()` /
`organization.create()`。Better Auth 不知道 `firm_profile.status`，所以最后一个 firm
soft-delete 后，onboarding 可能把残留的 Better Auth organization 重新设为 active。

## 变更

- `apps/app/src/routes/onboarding.tsx` 不再直接调用 Better Auth organization lifecycle
  API。
- 新增 `activateOrCreateOnboardingFirm`，onboarding 提交只依赖 DueDateHQ `firms`
  gateway：
  - `firms.listMine` 返回 active、非 deleted 的业务 firm。
  - 有可用 firm 时调用 `firms.switchActive`。
  - 没有可用 firm 时调用 `firms.create`。
- 更新 `apps/app/src/lib/auth.ts` 注释：`organizationClient()` 只保留 typed
  session shape / plugin mirror 作用，firm lifecycle 写入归 `firms` gateway。
- 更新 `docs/dev-file/03-Data-Model.md`、`05-Frontend-Architecture.md`、
  `06-Security-Compliance.md`，明确前端 firm lifecycle 入口只能是 `firms.*`。

## 测试

- 新增 `apps/app/src/routes/onboarding-firm-flow.test.ts`：
  - 有可用业务 firm 时只 `switchActive`，不 create。
  - 无可用业务 firm 时通过 `firms.create` 创建，并带默认 timezone。
  - `listMine` 失败时不创建重复 firm。

## Validation

- `pnpm --filter @duedatehq/app test -- onboarding-firm-flow.test.ts`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app build`
- `pnpm check`
- `pnpm test`

`build` 仍有既有 Vite chunk size warning；本次未引入新的 build failure。
