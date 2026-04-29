# 2026-04-30 · Staging deploy path filter

## Context

The CI workflow deployed staging on every `main` push once repository checks passed. That kept
staging fresh, but it also meant documentation-only and process-only changes could enter the
Cloudflare deployment job, request the staging environment, and run the workspace deploy command.

## Decision

Keep the main CI checks broad, but gate the staging deployment job behind an explicit changed-file
filter. The filter treats these paths as deployment-relevant:

- `apps/app/**`, `apps/server/**`, and `apps/marketing/**`
- `packages/**`
- `scripts/**`
- `.github/workflows/ci.yml`
- root workspace and toolchain files: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`,
  `tsconfig.json`, and `vite.config.ts`

This avoids using workflow-level `on.push.paths`, because skipping the whole workflow would also
skip the main-branch CI and secret scan for docs-only merges. The deploy job now depends on the
filter output, so non-runtime changes still get checked but never enter the staging environment.
If the `before` commit cannot be diffed, the filter fails open and deploys staging rather than
risking a missed runtime publish.

## Validation

- Reviewed GitHub Actions path-filter behavior in the official workflow syntax documentation.
- Checked the workflow syntax locally after the YAML edit.
