---
title: 'README open-source baseline'
date: 2026-05-05
author: 'Codex'
---

# README open-source baseline

## 背景

根 README 只有仓库名，无法向新读者说明 DueDateHQ 的产品闭环、当前能力、运行方式或开源边界。与此同时，项目文档里同时存在 5-state public coverage、50-state candidate registry、Phase roadmap 和已实现功能，如果 README 直接抽取营销文案，容易把候选或规划能力写成已交付能力。

## 做了什么

- 将根 `README.md` 重写为英文入口，覆盖产品闭环、当前已实现能力、明确边界、仓库结构、贡献者入口、安全和 license 状态。
- 新增 `README.zh-CN.md`，与英文 README 保持同一口径，方便中文读者进入项目。
- 更新 `docs/project-modules/README.md`，把模块文档索引对齐到根 README，并明确公开州覆盖、候选规则、外部集成、license 的表达边界。
- 更新 `docs/project-modules/00-overview.md` 的后续关注点，移除已经过时的 Smart Priority TODO，改为文档/coverage 一致性风险。

## 为什么这样做

README 面向公开仓库的第一读者，应说明项目是什么、如何运行、如何贡献，以及哪些事情还没有完成。本文档只写代码和文档能支撑的事实：当前公开覆盖按 Federal + CA/NY/TX/FL/WA 表达，50 州/DC registry 作为 source/candidate 基础存在，但不被包装成全量 verified coverage；真实第三方 API、公开 OpenAPI、PWA/native、认证类合规状态也不写成已完成。

## 验证

- 待运行 `pnpm format` 和文档 review。

## 后续 / 未闭环

- 若仓库要正式开源，需要补充明确 `LICENSE`、贡献治理文档和安全披露入口。
