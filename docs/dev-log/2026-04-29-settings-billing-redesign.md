# Settings Billing Redesign

Date: 2026-04-29
Owner: Codex

## Context

`/settings/billing` 已经完成 checkout / billing portal 闭环，但页面仍是最小功能排版：
当前订阅卡片 + payment model + 三张很薄的 plan card。它和 `settings.profile` 的收敛式
设置页宽度不一致，也没有复用 marketing pricing 里已经确定的套餐对比层级。

后续检查发现 `/billing/checkout?plan=pro&interval=monthly` 的计划摘要卡片出现空白：
原因是 Lingui `t` 宏被作为函数参数传入普通 helper 后再以 tagged template 使用，运行时
没有得到正确 message descriptor，导致 plan label / price / features 渲染为空。

## Changes

- 重排 `apps/app/src/routes/settings.billing.tsx`：页面改为 1180px max-width，顶部使用
  settings 风格 icon header，主区分为 subscription overview、billing controls、plan
  options、payment model / data boundary 四段。
- Plan options 借鉴 marketing pricing 的结构：推荐 Firm badge、价格 / cadence / seat
  分层、feature list、accent CTA；仍然只有 Firm 走自助 checkout，Solo / Pro 保持 disabled。
- 保留现有工程边界：`useCurrentFirm`、`useBillingSubscriptions`、`createBillingPortal`、
  owner-only gating、subscription error alerts 和 `/billing/checkout` deep link 都不改。
- 更新 app Lingui catalog，并补齐 zh-CN 新增文案。
- 写回 `docs/dev-file/05-Frontend-Architecture.md` 和 `docs/Design/DueDateHQ-DESIGN.md`，
  明确 billing 是 settings 下的 commerce / status surface，宽度为 1180px。
- Follow-up 调整 marketing `/pricing` 和 app billing / checkout 文案：公开套餐卡只讲
  workspace、Pulse、workboard、evidence 等产品能力，不把 test-mode、Stripe-hosted、
  sandbox 或 founder 邮箱当作卖点；Firm / Pro 的 CTA 和 features 在两边保持一致。
- Follow-up 重排 `/billing/checkout`：左侧主卡改为明确的 plan summary（套餐、价格、
  计费周期、包含能力、支付边界），右侧 firm context 改为核对清单；CTA 统一为 secure
  checkout 口径，并同步 Playwright page object。
- Follow-up 修复 checkout 计划摘要空白：把 plan view 生成逻辑从普通 helper 改为
  `usePlanView`，让 `t` 宏在 React/Lingui hook 作用域内展开；重新 extract + compile
  catalog，补齐 `$79` / `$399` / `$499`、计划摘要、provider-hosted、安全支付等 zh-CN
  文案。
- Follow-up 清理公开 UI 支付措辞：billing settings、checkout success 和 marketing
  pricing 统一使用 payment provider / processor / secure checkout 语言；实现细节只留在
  工程文档和 server/runtime 配置边界中。
- Follow-up 同步 E2E page object：测试 locator 从旧的 processor-specific 文案改为
  `Continue to secure checkout`、`Manage billing`、`Still waiting on confirmation`，避免测试
  继续锁定不应外露的 UI 文案。
- Follow-up 明确 SaaS IA：pricing / subscription 不进入 protected route header，也不升为
  main nav；AppShell sidebar footer 增加轻量 plan status 入口，统一指向 `/settings/billing`。

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec vp check apps/app/src/routes/settings.billing.tsx`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/marketing build`
- `pnpm exec vp check apps/app/src/routes/billing.checkout.tsx e2e/pages/billing-page.ts`
- `pnpm exec vp check e2e/pages/billing-page.ts e2e/tests/billing-checkout.spec.ts e2e/tests/billing-success.spec.ts`
- `pnpm test:e2e e2e/tests/billing-checkout.spec.ts --project=chromium`
- `pnpm test:e2e e2e/tests/billing-success.spec.ts --project=chromium`
- `awk 'BEGIN{RS="\\n\\n"} /msgstr ""/ && $0 !~ /^msgid ""/ {print}' apps/app/src/i18n/locales/zh-CN/messages.po`

## Follow-ups

- 设计确认后可再补一张 billing settings 的桌面截图到 PR 描述，帮助 reviewer 快速对比
  marketing pricing 迁移后的信息层级。
