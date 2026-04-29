---
title: 'Members vertical route split'
date: 2026-04-29
author: 'Codex'
---

# Members vertical route split

## 背景

`/settings/members` 已经承担成员列表、邀请、角色切换、暂停/恢复、移除确认、seat limit
提示和快捷键注册等完整业务界面。旧实现把这些内容都放在
`apps/app/src/routes/settings.members.tsx`，route 文件超过 900 行，不符合 frontend vertical
colocation 约束。

## 做了什么

- 将成员管理页面移动到 `apps/app/src/features/members/members-page.tsx`。
- 保留 `apps/app/src/routes/settings.members.tsx` 作为 5 行 route wrapper，只负责挂载 feature
  页面，React Router lazy import 路径不变。
- 新增 `apps/app/src/features/members/member-model.ts`，承接成员角色、邀请状态文案、inviter
  名称解析和日期展示 helper。
- 新增 `member-model.test.ts` 覆盖 managed role 判断、role label、邀请文案、inviter fallback
  和成员页日期格式。
- 更新 `docs/dev-file/05-Frontend-Architecture.md` 与
  `docs/dev-file/08-Project-Structure.md`，把 `features/members` 纳入 frontend vertical 文档。

## 设计取舍

本次不重写成员表格、邀请弹窗或 mutation flow，避免在架构归位时混入行为变更。`members-page.tsx`
仍然偏大，但 route 层已经变薄，纯派生逻辑也从页面文件中剥离。后续如果成员管理继续扩展，可再按
`member-tables.tsx`、`invite-member-dialog.tsx`、`member-actions.tsx` 做第二轮 feature 内部拆分。

## 验证

- `pnpm --filter @duedatehq/app test -- src/features/members/member-model.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check`
- `pnpm test`
- `pnpm check:deps`
- `pnpm build`
