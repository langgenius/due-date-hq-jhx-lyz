# 2026-05-02 · CI deploy artifact and i18n strict compile

## Context

The Lingui catalog drift workflow ran `vp run @duedatehq/app#i18n:extract` and then
`vp run @duedatehq/app#i18n:compile`. Extraction itself succeeded, but it introduced 8 empty
`zh-CN` translations from recent account security and audit label changes. `compile --strict`
correctly failed on those missing translations.

Staging deploy was also doing more work than necessary. The `deploy-staging` job already depends on
the main `ci` job, and `ci` runs check, tests, build, and secret scan. Calling
`vp run workspace-deploy` inside deploy repeated the Vite+ task dependencies for check/test/build.

## Changes

- Filled the 8 missing `zh-CN` messages and recompiled Lingui catalogs.
- Split the Vite+ deploy graph into:
  - `workspace-publish`: Queue preflight, remote D1 migration, app Worker deploy, marketing Worker
    deploy.
  - `workspace-deploy`: local full deploy entry that still depends on build/test/check before
    publishing.
- Added root `deploy:ci` for GitHub Actions to run only `workspace-publish` after CI has passed.
- Made CI upload `apps/app/dist` and `apps/marketing/dist` as a short-lived staging build artifact,
  then made `deploy-staging` download that artifact before publishing.
- Switched GitHub Actions installs to `vp install --frozen-lockfile`, matching the DevOps spec.

The deploy job still performs a dependency install because GitHub Actions jobs run on isolated
runners and Wrangler/scripts need workspace dependencies. The removed duplication is the second
check/test/build pass, not the job-local dependency setup.

## References

- Vite+ official docs: `vp run package#task` targets workspace tasks, and task `dependsOn` runs
  prerequisites before the target task.
- Vite+ official CI docs: `voidzero-dev/setup-vp` is followed by `vp install`.
- GitHub Actions official artifact docs: use artifacts to share build outputs between jobs.
- Lingui official CLI docs: `extract --clean` removes obsolete messages; `compile --strict` fails
  on missing translations.

## Validation

- `vp run @duedatehq/app#i18n:extract`
- `vp run @duedatehq/app#i18n:compile`
- `vp check`
- `vp run -r test`
- `vp run build` (passes; Astro/Vite emit existing deprecation warnings for alias customResolver and
  transformWithEsbuild)
