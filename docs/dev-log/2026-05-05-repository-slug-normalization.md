---
title: 'Repository slug normalization'
date: 2026-05-05
author: 'Codex'
---

# Repository slug normalization

## 背景

GitHub 仓库和本地项目目录原先使用 `DueDateHQ-JHX-LYZ`，与代码生态里更常见的全小写短横线 slug 不一致。项目的产品名仍然是 `DueDateHQ`，本次只统一仓库和目录命名。

## 做了什么

- GitHub repository 从 `langgenius/DueDateHQ-JHX-LYZ` 改名为 `langgenius/due-date-hq-jhx-lyz`。
- 本地目录从 `/Users/liuyizhou/projects/DueDateHQ-JHX-LYZ` 改为 `/Users/liuyizhou/projects/due-date-hq-jhx-lyz`。
- Git remote 更新为 `https://github.com/langgenius/due-date-hq-jhx-lyz.git`。
- README 标题更新为 `due-date-hq-jhx-lyz`。

## 为什么这样做

全小写短横线 slug 更适合 GitHub URL、CI、部署产物和脚本引用。`DueDateHQ` 作为产品名继续保留在设计文档、包名和 UI 语义中，避免把品牌名误改成仓库 slug。

## 验证

- `rg` 检查旧仓库名和 GitHub URL 引用。
- `git remote -v` 检查 HTTPS remote 已指向新仓库。
- `git status --short --branch` 检查提交范围。
