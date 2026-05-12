# 2026-05-12 · Alerts to Pulse Changes impact triage

## Change

- Audited the separate `https://github.com/helloigig/DueDateHQ` Alerts prototype against this
  repository's current Pulse implementation.
- Kept the canonical destination as `Rules > Pulse Changes`; did not restore a standalone `/alerts`
  route or rename the Pulse contract/schema.
- Added an impact-first filter to Pulse Changes: all impact, needs action, needs review, no matches,
  and closed.
- Upgraded the detail drawer into a source-backed action workbench: source context, parsed scope,
  official-source link, selected-obligation suggested actions, and reviewable client draft copy.
- Tightened the drawer primary CTA so it describes the actual write path: applying a deadline
  exception to selected obligations.
- Added a focused model test for the impact mapping so the product lanes stay independent from
  Select/browser interaction details.
- Documented the Alerts -> Pulse Changes mapping and aligned README / architecture docs.

## Product Boundary

The reference Alerts surface is a broad announcement workbench. In this repository, the actionable
product row is the firm-scoped `pulse_firm_alert`: global `pulse` is the source fact, and
`pulse_application` is the actual applied change. This change only brings over the triage strength
of Alerts, not its route or data model.

## Product Design Gain

The Alerts prototype's useful core is not the standalone page; it is the progression from source
signal to client impact to next action. Pulse Changes now carries that progression inside the
current Rules surface:

- List triage starts with business impact instead of raw status.
- Drawer evidence starts with authority, issued/effective dates, due-date shift, and parsed scope.
- Affected-client rows stay obligation-scoped so the write path is precise.
- Suggested actions make the next step explicit: apply the deadline exception or prepare a
  source-linked client draft from the same selected obligations.

## Verification

- `pnpm --filter @duedatehq/app test -- src/features/pulse/lib/impact-filter.test.ts src/features/pulse/AlertsListPage.test.tsx src/features/pulse/PulseDetailDrawer.test.ts`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm exec vp check apps/app/src/features/pulse/AlertsListPage.tsx apps/app/src/features/pulse/PulseDetailDrawer.tsx apps/app/src/features/pulse/lib/impact-filter.ts apps/app/src/features/pulse/lib/impact-filter.test.ts apps/app/src/i18n/locales/zh-CN/messages.po apps/app/src/i18n/locales/en/messages.po docs/product-design/rules/03-alerts-to-pulse-changes-mapping.md docs/product-design/rules/README.md docs/dev-file/05-Frontend-Architecture.md docs/project-modules/01-app-spa.md README.md README.zh-CN.md docs/dev-log/2026-05-12-alerts-to-pulse-changes-impact-triage.md`
