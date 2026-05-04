---
title: 'TX Pulse Source Stability'
date: 2026-05-05
author: 'Codex'
---

# TX Pulse Source Stability

## 背景

Dashboard Pulse banner 显示 `Source needs attention · TX · RSS returned 304 after one retry`。
TX adapter 已经走 GovDelivery RSS，但运行时 topic discovery 和 conditional validators 会让源健康
依赖 GovDelivery 对 304 的具体处理。官方 Texas Comptroller RSS 页面列出的稳定英文 feed 是
`https://public.govdelivery.com/topics/TXCOMPT_1/feed.rss`。随后重试显示
`Pulse source robots.txt disallows /topics/TXCOMPT_1/feed.rss`，因为
`public.govdelivery.com/robots.txt` 只允许 `/accounts/` 和 `/system/images/`，其余路径
`Disallow: /`。

## 做了什么

- 将 `tx.cpa.rss` 的实际抓取目标改为 Texas Comptroller 官方 News Releases HTML 页面：
  `https://comptroller.texas.gov/about/media-center/news/`。
- 保留 `tx.cpa.rss` source id，以便已有 `pulse_source_state` 能在下一次 retry/cron 成功后清掉
  TX 的旧错误。
- 不再把 GovDelivery topic feed 作为 crawler endpoint；GovDelivery 只作为邮件订阅 /
  inbound email 信号。
- TX News HTML parser 只从列表页产出 signal，不在 banner retry 请求内同步逐个抓取详情页；
  详情 URL 仍作为 `officialSourceUrl` 保留，避免一次手动刷新因为同 host polite delay 被拖到数分钟。
- server polite fetch 不再把 `/robots.txt` 检查计入同 host 的 30s crawl delay；robots 仍会先检查，
  但不会让后续正式源页面无意义等待。
- 更新 ingest 单测，覆盖 TX adapter 不再抓取 `public.govdelivery.com/topics/.../feed.rss`。
- 更新 Pulse source catalog 和 `packages/ingest` 模块文档，记录 TX 源的官方新闻页与
  GovDelivery robots 限制。

## 验证

- `pnpm exec vp check --fix packages/ingest/src/http.ts packages/ingest/src/adapters/index.ts packages/ingest/src/ingest.test.ts packages/ingest/src/fixtures.ts apps/server/src/jobs/pulse/ingest.ts apps/server/src/jobs/pulse/ingest.test.ts apps/server/src/procedures/pulse/index.ts docs/dev-file/11-Pulse-Ingest-Source-Catalog.md docs/project-modules/10-ingest-pulse-sources.md docs/dev-log/2026-05-05-tx-pulse-rss-source-stability.md`
- `pnpm --filter @duedatehq/ingest test`
- `pnpm --filter @duedatehq/server test -- ingest.test.ts`
