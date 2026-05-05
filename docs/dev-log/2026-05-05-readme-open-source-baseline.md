---
title: 'README product baseline'
date: 2026-05-05
author: 'Codex'
---

# README product baseline

## 背景

根 README 只有仓库名，无法向新读者说明 DueDateHQ 的产品闭环、当前能力、运行方式或边界。与此同时，项目文档里同时存在 5-state public coverage、50-state candidate registry、Phase roadmap 和已实现功能，如果 README 直接抽取营销文案，容易把候选或规划能力写成已交付能力。

后续复核发现第一版 README 仍然偏仓库状态说明，一些仓库元信息对当前读者价值低且分散注意力，因此改成更产品化的入口：先说明 DueDateHQ 为谁解决什么问题，再说明当前产品覆盖、技术栈和开发入口。

## 做了什么

- 将根 `README.md` 重写为英文入口，覆盖产品定位、产品闭环、当前已实现能力、明确边界、技术栈、仓库结构、开发入口和数据处理。
- 新增并持续对齐 `README.zh-CN.md`，方便中文读者进入项目。
- 更新 `docs/project-modules/README.md`，把模块文档索引对齐到根 README，并明确公开州覆盖、候选规则、外部集成和 README 信息层级的表达边界。
- 更新 `docs/project-modules/00-overview.md` 的后续关注点，移除已经过时的 Smart Priority TODO，改为文档/coverage 一致性风险。
- 移除根 README 中低价值仓库状态段落，不再把仓库元信息放在主要阅读空间。

## 为什么这样做

README 面向第一读者，应优先说明项目是什么、为谁解决什么问题、当前产品覆盖到哪里、技术栈如何支撑，以及哪些事情不能被误解为生产承诺。本文档只写代码和文档能支撑的事实：当前公开覆盖按 Federal + CA/NY/TX/FL/WA 表达，50 州/DC registry 作为 source/candidate 基础存在，但不被包装成全量 verified coverage；真实第三方 API、公开 OpenAPI、PWA/native、认证类合规状态也不写成已完成。

## 验证

- `pnpm format`

## 后续 / 未闭环

- 若产品覆盖、集成接入状态或技术栈发生变化，需要同步更新根 README 和 `docs/project-modules/README.md`。
