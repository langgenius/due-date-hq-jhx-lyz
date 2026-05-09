---
title: 'Agent Skills Cleanup'
date: 2026-04-28
---

# Agent Skills Cleanup

## Context

The project-level `.agents/skills` bundle had several generic skills that
matched package names but not DueDateHQ's actual implementation constraints.
Keeping those skills active made future agent work more likely to follow the
wrong stack: Postgres/Node Drizzle examples instead of Cloudflare D1, Better
Auth CLI schema generation instead of the hand-maintained auth schema, SWC
Lingui plugin guidance instead of the Vite/Rolldown Babel macro pipeline, and
full organization/team flows instead of the P0 single-firm setup.

## Removed

- `better-auth-best-practices` — env names and CLI migration guidance conflict
  with `AUTH_SECRET` / `AUTH_URL` and the manually owned D1 auth schema.
- `drizzle-orm` — generic Postgres/Node examples conflict with the D1-specific
  Drizzle schema rules kept in `d1-drizzle-schema`.
- `organization-best-practices` — promotes invitations, teams, and dynamic RBAC
  while P0 intentionally keeps one firm owner and disables invitations.
- `react-email` — future migration report email docs mention React Email, but
  runtime implementation has not adopted it yet.
- `react-hook-form-zod` — retired by ADR 0020; app forms use TanStack Form with
  Zod Standard Schema instead of a resolver package.
- `swc-plugin-compatibility` — targets Next/Rspack SWC plugin failures; Lingui
  currently runs through Vite + Rolldown Babel macros.

Matching `.claude/skills/*` symlinks were removed with the project skill
directories, and `skills-lock.json` was updated to match the installed set.

## Kept

`ai-sdk` remains installed by request, even though DueDateHQ currently routes
model execution through `packages/ai` using Vercel AI SDK Core plus Cloudflare
AI Gateway. Future work should continue checking local `node_modules/ai` docs
before changing that package.
