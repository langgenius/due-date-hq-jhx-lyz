# Architecture Decision Records

Any non-trivial architectural decision lives here (docs/dev-file/08 §9).

## Template

```
## Context
<Why the decision is needed>

## Decision
<What we decided>

## Consequences
<Good / bad / uncertain consequences>

## Status
proposed | accepted | deprecated | superseded by #NNN
```

## Backlog (Phase 0)

1. 0001-cloudflare-single-worker-fullstack.md
2. 0002-orpc-contract-first.md
3. 0003-better-auth-organization.md
4. 0004-d1-as-mvp-database.md
5. 0005-shadcn-base-ui-vega.md
6. 0006-vite-plus-oxlint-oxfmt.md
7. 0007-pnpm-catalog-version-lock.md
8. 0008-route-prefix-rpc-vs-api.md

## Accepted

- 0009-lingui-for-i18n.md — Lingui v6 for i18n (supersedes `05 §11` react-i18next line)
- 0010-firm-profile-vs-organization.md — Firm profile as first-class business tenant table, PK reuses organization.id (closes the `organization.metadata` antipattern)
- 0011-migration-copilot-demo-sprint-scope.md — Migration Copilot Demo Sprint 产品形态锁定（6 条冲突裁定 + 9 条设计系统增量 + Onboarding Agent 设计锁定不实现）
- 0012-marketing-astro-landing.md — Marketing landing 接入 Astro 公开站（`apps/marketing` Astro 6 静态站 + Cloudflare Workers Static Assets + 设计 token 三方对齐 Figma + 8 条 follow-ups）
