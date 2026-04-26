---
title: '2026-04-24 · i18n Contract Extraction'
date: 2026-04-24
commit: '9292d5c'
---

# 2026-04-24 · i18n Contract Extraction

## Context

Marketing architecture introduced a third frontend surface: `apps/marketing`. Before this change, locale contract data lived in app/server implementation files:

- `apps/app/src/i18n/locales.ts` owned `SUPPORTED_LOCALES`, `Locale`, `DEFAULT_LOCALE`, `LOCALE_LABELS`, and `INTL_LOCALE`.
- `apps/app/src/i18n/i18n.ts` owned `LOCALE_HEADER`.
- `apps/server/src/i18n/resolve.ts` duplicated `SUPPORTED_LOCALES`, `Locale`, `DEFAULT_LOCALE`, and inlined `x-locale`.

That worked for app + server, but it created the wrong boundary once marketing needs the same locale list, `Intl` mapping, `html lang`, `hreflang`, and CTA locale handoff.

## What Changed

- Added `packages/i18n` as a JIT internal package.
- Moved shared locale contract into `@duedatehq/i18n`:
  - `Locale`
  - `SUPPORTED_LOCALES`
  - `DEFAULT_LOCALE`
  - `LOCALE_LABELS`
  - `INTL_LOCALE`
  - `LOCALE_HEADER`
  - `isLocale()`
  - `localeFromLanguageSignal()`
- Kept browser-only preference handling in `apps/app/src/i18n/locales.ts`:
  - `detectLocale()`
  - `persistLocale()`
  - `localStorage` key handling
- Updated app and server imports to consume `@duedatehq/i18n`.
- Updated `apps/app/lingui.config.ts` to read source/default locale and locale list from the shared package.
- Updated dependency-direction checks so `packages/i18n` is a zero-dependency internal package and app/server can consume it.

## Boundary

`packages/i18n` is a locale contract package, not a translation package.

It must not depend on:

- Lingui
- Astro
- React
- Hono
- Cloudflare Workers runtime
- app/server-specific modules

Catalog ownership remains split:

- SaaS UI: `apps/app/src/i18n/locales/{locale}/messages.po`
- Worker transactional copy: `apps/server/src/i18n/messages.ts`
- Future marketing copy: `apps/marketing/src/i18n/*`

## Why

The shared package gives all surfaces one source of truth for locale identity and protocol behavior while keeping copy lifecycles separate. That prevents two opposite problems:

- app/server/marketing drifting on which locales exist or which header carries locale
- marketing copy being forced into the SaaS app Lingui catalog

## Validation Target

Run after implementation:

```bash
pnpm install
pnpm --filter @duedatehq/app test
pnpm --filter @duedatehq/server test
pnpm check:deps
pnpm check
```

`pnpm install` is required because app/server now declare `@duedatehq/i18n` as a workspace dependency.
