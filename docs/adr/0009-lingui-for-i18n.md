# 0009 · Lingui as the i18n library (supersedes react-i18next in `05 §11`)

## Context

`docs/dev-file/05-Frontend-Architecture.md §11` pre-committed `i18next + react-i18next` as the Phase 2
i18n stack. Nothing has shipped yet — zero deps, zero catalog, zero wiring — so re-evaluating costs
nothing. The decision needs to reconcile with constraints that were not fully weighted when §11 was
written:

- **Bundle budget** (§05 §12): single chunk ≤ 150 KB gz, total ≤ 500 KB gz. `i18next` alone is
  ~40 KB gz (~8% of total).
- **Contract-first Zod** (ADR 0002): `packages/contracts` schemas stay locale-free; errors travel as
  structured codes (`{ code, path }`) and are rendered by UI layers. i18n does **not** need to
  translate Zod messages.
- **AI-assisted two-engineer team** (ADR 0000): string-key i18n APIs (`t('feature.section.key')`)
  encourage AI agents to invent keys that drift from the catalog. Hard to catch in review.
- **ICU formatting needed**: Penalty Radar / Overdue / Email notifications require plurals and number
  formatting (e.g. `{count, plural, one {# day} other {# days}}`).
- **Vite 8 + SWC** (ADR 0006): build-time transforms are cheap and already part of the toolchain.
- **React Email templates** render inside the Worker; catalog must load server-side too.

## Decision

Adopt **Lingui v5** (`@lingui/core` + `@lingui/react` + `@lingui/macro`, with `@lingui/swc-plugin`
and `@lingui/cli` in dev) as the sole i18n library for both `apps/web` and email templates. All
versions pinned in the root `pnpm-workspace.yaml` catalog.

Hard rules:

1. **Zod stays locale-free.** Schemas use stable error codes only; UI owns all user-facing text via
   Lingui macros.
2. **All user-facing text goes through `<Trans>` / ``t`…` `` macros.** No runtime `i18n._()` calls
   with dynamic strings; violations caught by `eslint-plugin-lingui`.
3. **Catalog source lives in `apps/web/src/locales/{locale}/messages.po`**; compiled output is a
   JS module and loaded per-route via dynamic `import()` so Vite code-splits it.
4. **Phase 2 scope**: extract + compile pipeline wired in CI; MVP remains `en`-only. No catalog work
   blocks Phase 0.
5. **Server-side usage** (Hono middleware + React Email): one `i18n.activate(locale)` call per
   request from `Accept-Language`; reuses the same compiled catalog as the SPA.

Supersedes the `i18next + react-i18next` line in `docs/dev-file/05-Frontend-Architecture.md §11`.

## Consequences

**Good**

- Runtime footprint drops ~40 KB gz → ~4 KB gz (freeing ~8% of total bundle budget).
- Source code reads as natural language (`<Trans>Client {name} has {count} overdue tasks</Trans>`);
  no string keys to mistype or drift.
- Variable / parameter types are plain TS expressions — checked by the compiler without a separate
  codegen step. `lingui extract` marks deleted strings obsolete automatically.
- `lingui compile` validates ICU syntax and placeholder consistency at build time; errors surface in
  `vp build` rather than at runtime in the browser.
- Compiled catalog is a JS module; Vite code-splits it per route with zero extra config.
- AI agents write prose, not keys — eliminates an entire class of mis-generated `t('foo.bar')` bugs.

**Bad**

- Smaller ecosystem and fewer Stack Overflow samples than i18next; onboarding new contributors costs
  slightly more.
- Adds one SWC plugin to the Vite pipeline (swc transform overhead is effectively zero, but it is
  one more moving part to keep pinned with Vite+).
- Migrating away later requires replacing JSX macros everywhere (same cost as migrating away from
  i18next string keys; this is a wash, not a new risk).

**Uncertain**

- Whether future translator-agency partners will insist on flat JSON deliverables. Lingui can emit
  JSON, but PO/XLIFF is its happy path. Re-evaluate when we sign a vendor.
- Whether React Email + Lingui macros work cleanly inside the Worker build (`apps/server` bundle
  size, tree-shaking of compiled catalogs). Validate during Phase 2 spike; fall back to shipping
  only the active locale's catalog per request if bundle bloats.

## Status

accepted
