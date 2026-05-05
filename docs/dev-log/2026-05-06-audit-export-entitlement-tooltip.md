---
title: 'Audit export entitlement tooltip'
date: 2026-05-06
area: audit
---

## Context

Audit evidence package export already had a server-side Team/Enterprise plan gate, but the Audit
Log header button only checked owner permission. Owners on Solo or Pro could open the dialog and
reach the request action before seeing the plan requirement from the API error.

## Changes

- Added a shared Audit export availability helper that combines owner permission with the
  `auditExport` plan entitlement.
- Disabled the Audit Log `Export` button when the active practice plan does not include audit
  export.
- Wrapped the disabled button in the existing Tooltip primitive so hover explains that audit
  exports require Team or Enterprise before the dialog opens.
- Kept the existing owner-only permission message for non-owner roles.
- Updated Audit product/security docs to match the implemented owner + Team/Enterprise export
  behavior.

## Design alignment

- No DESIGN.md or token changes were needed.
- The interaction reuses the existing Button and Tooltip primitives; no new component pattern was
  introduced.

## Validation

- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec vp check --fix apps/app/src/features/audit/audit-log-page.tsx apps/app/src/features/audit/audit-log-model.ts apps/app/src/features/audit/audit-log-model.test.ts apps/app/src/i18n/locales/en/messages.po apps/app/src/i18n/locales/en/messages.ts apps/app/src/i18n/locales/zh-CN/messages.po apps/app/src/i18n/locales/zh-CN/messages.ts docs/product-design/audit/README.md docs/product-design/audit/01-audit-log-management-page.md docs/dev-file/06-Security-Compliance.md docs/dev-log/2026-05-06-audit-export-entitlement-tooltip.md`
- `pnpm --filter @duedatehq/app test -- audit-log-model.test.ts`
- `pnpm --filter @duedatehq/app test`
- `git diff --check`
