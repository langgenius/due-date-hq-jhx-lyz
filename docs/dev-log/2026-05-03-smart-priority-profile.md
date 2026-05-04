---
title: 'Smart Priority profile'
date: 2026-05-03
author: 'Codex'
---

# Smart Priority profile

## 背景

Smart Priority 原本固定使用 exposure / urgency / importance / history / readiness 五个权重。用户希望
事务所能按自己的运营偏好调节公式，但仍要保持排序可解释、可审计、非 AI 决策。

## 做了什么

- 新增 `smart-priority-profile-v1`：五个整数权重、exposure cap、urgency window、history cap。
- `firm_profile.smart_priority_profile_json` 持久化 practice 级配置，NULL 解析为默认 profile。
- Dashboard、Obligations、Weekly Brief snapshot 继续走 `packages/core/src/priority`，但读取当前 firm profile。
- Practice profile 新增 Owner 可编辑的 Smart Priority 配置卡片，支持 preview 和 reset。

## 为什么这样做

没有开放任意公式编辑器，避免支持、审计和解释成本失控。V1 只暴露确定性权重和阈值；AI 仍只能引用已计算好的分数与来源标签。

## 验证

- `pnpm --filter @duedatehq/core test`
- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/app test`

## 后续 / 未闭环

- 完整 `pnpm ready` 需要在 i18n catalog 更新后跑。
