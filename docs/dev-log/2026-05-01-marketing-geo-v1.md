---
title: 'Marketing GEO v1 public content foundation'
date: 2026-05-01
author: 'Codex'
updates:
  - note: 'Unified marketing app CTA copy to "Open the workbench" / "打开工作台" across nav, pricing, 404, and docs.'
---

# Marketing GEO v1 public content foundation

## 背景

Marketing 站已经是 Astro 静态 HTML，具备 title、description、canonical、hreflang、OG、
robots 和 sitemap 基础，但公开可索引内容只有首页和 pricing。GEO 需要更多可回答、可引用、
可追溯的公开页面，并且要明确与登录后 SaaS app、客户数据和税务建议边界分离。

## 做了什么

- 为 `BaseLayout` 增加 JSON-LD 渲染入口，并新增结构化数据 builder，覆盖首页、pricing、
  rules、state coverage、state detail 和 guides。
- 新增 `llms.txt`，并在 `robots.txt` 显式允许主要搜索/AI crawler 访问公开站。
- 新增英文和中文公开内容页：规则库、州覆盖、五个州详情页、两篇指南页。
- 更新 nav/footer 资源链接，去掉关键资源占位 `#`，并保持 app CTA 继续走 `PUBLIC_APP_URL`。
- 将 GEO 内容纳入 typed marketing dictionary，继续避免 CMS 和运行时 API 依赖。

## 为什么这样做

公开 GEO 内容属于 `apps/marketing` 的职责；登录后 app 仍是 Vite SPA + Worker assets fallback，
不适合作为可索引内容面。规则和州覆盖页面只描述产品覆盖、官方来源处理、证据复核和人工判断边界，
避免把页面写成税务建议或客户特定适用性判断。

## 验证

- `pnpm --filter @duedatehq/marketing check`
- `pnpm --filter @duedatehq/marketing build`
- `pnpm format`
- 产物级 smoke：抽样页面唯一 H1、metadata、canonical、hreflang、OG、JSON-LD 可解析；
  sitemap 包含新增公开页面且不含 app/rpc/api；robots 和 `llms.txt` 存在；CTA 不包含 localhost。

## 后续 / 未闭环

- 当前只是静态内容和 technical GEO foundation；后续可以把公开规则页接入构建期 source snapshot，
  但仍不能直接读取内部 `/rpc` 或客户数据。
- Privacy / Terms 目前走 mailto 联系入口；若进入正式公开法律页，需要补独立 Astro 页面和对应
  JSON-LD / sitemap smoke。
