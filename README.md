# DueDateHQ

[中文 README](./README.zh-CN.md)

DueDateHQ is a source-backed deadline operations workbench for US CPA practices. It
turns client facts, filing obligations, deadline changes, penalty exposure, team
ownership, and audit evidence into one operating loop:

1. Import or create clients.
2. Generate and review obligations from verified rules and client facts.
3. Triage deadline risk by due date, readiness, ownership, evidence, and projected
   penalty exposure.
4. Review government-source changes in Pulse before applying them to affected work.
5. Keep an audit trail for important status, import, rule, billing, and team events.

This repository is an alpha product codebase. It is useful for studying and
developing the product, but it is not tax advice, a filing system, or a replacement
for professional review.

## What Works Today

- Authenticated practice workbench with login, first-practice onboarding, MFA setup,
  invitations, role-aware surfaces, practice switching, and account security.
- Client management with filing jurisdictions, owners, contact details, import
  history, readiness signals, and fact review.
- Migration Copilot for CSV, TSV, XLSX, paste, and provider-export-shaped data. It
  maps fields, flags risky inputs, previews generated clients and obligations, and
  writes audit evidence when applied.
- Obligation queue and Dashboard for risk triage, saved views, bulk status updates,
  readiness, evidence drawers, projected penalty exposure, and weekly/monthly views.
- Rules console with source registry, coverage, rule library, generation preview,
  candidate review, and firm-scoped verification decisions.
- Pulse pipeline for official-source monitoring, candidate extraction, review,
  firm alerts, apply/dismiss/snooze/revert flows, and source health operations.
- Audit, notifications, readiness portal, calendar subscription, billing checkout
  handoff, and team workload surfaces.
- Bilingual app and marketing site copy in English and Chinese.

## Current Boundaries

- DueDateHQ supports operational triage and evidence review. A CPA, EA, attorney,
  or other qualified professional must verify filing, payment, extension, and client
  communication decisions.
- Public state coverage is currently scoped to Federal plus CA, NY, TX, FL, and WA.
  The rule source registry contains broader state/DC scaffolding and candidates, but
  candidate rules are not the same as verified reminder-ready coverage.
- AI is used for mapping, summarizing, extraction, and drafting. Server-side guards,
  structured schemas, source fields, and audit records constrain how AI output enters
  the workflow, but human review remains required.
- Billing, email, SSO, and AI-assisted flows are deployment-enabled integrations.
  They should be described as available only when a deployment has those services
  connected.
- The repository packages are currently marked `UNLICENSED`. Add an explicit
  `LICENSE` before publishing this as an open-source project or accepting outside
  contributions under open-source terms.

## Repository Map

```text
apps/
  app        Vite React SPA for the authenticated workbench
  server     Cloudflare Worker API, auth, oRPC, queues, cron, webhooks
  marketing  Astro static marketing site

packages/
  ai          AI Gateway calls, prompts, guards, traces
  auth        Better Auth setup, organization roles, billing plugin
  contracts   Zod and oRPC contracts shared by app and server
  core        Pure domain logic for dates, rules, imports, risk, priority
  db          Drizzle schema, migrations, D1 repositories
  i18n        Shared locale helpers
  ingest      Pulse source adapters and fetch/parse utilities
  ports       Boundary interfaces
  ui          Design tokens and reusable UI primitives
```

Important docs:

- [Project modules](./docs/project-modules/README.md) for product and module-level
  implementation notes.
- [User and module manual](./docs/project-modules/14-user-manual.md) for what each
  product surface does.
- [Technical overview](./docs/dev-file/00-Overview.md) for architecture and phase
  context.
- [Architecture decisions](./docs/adr/README.md) for major decisions and tradeoffs.
- [Dev log](./docs/dev-log/README.md) for implementation history.
- [Design system](./DESIGN.md) for current visual tokens.

## For Contributors

DueDateHQ is a pnpm monorepo. The most common contributor commands are:

```bash
pnpm dev       # run workspace development tasks
pnpm check     # type-aware checks
pnpm test      # unit tests
pnpm build     # production builds
pnpm ready     # default pre-handoff gate
```

The codebase follows a conservative product-module workflow:

- Keep business UI inside `apps/app/src/features/<vertical>/`.
- Keep app runtime helpers in `apps/app/src/lib`.
- Keep pure domain logic in `packages/core`.
- Keep shared contract/schema work in `packages/contracts`.
- Keep tenant-aware persistence behind `packages/db` repositories.
- Do not use React `useEffect` in app or package code.
- Use Conventional Commits for commit messages and PR titles.

For PRs, include a concise summary, validation commands, user-facing screenshots
for UI changes, and call out migrations, dependency-direction changes, or
security-sensitive behavior.

## Security

This project handles client and practice data in product flows. Treat sample data,
exports, screenshots, and logs as sensitive unless proven otherwise.

## License

No open-source license is currently declared. The workspace packages are marked
`UNLICENSED`; all rights remain reserved until a license file is added.
