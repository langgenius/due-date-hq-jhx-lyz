# 2026-04-29 Clients Facts Readiness Workbench

## Context

The enabled sidebar `Clients` entry was already backed by the real tenant-scoped
`clients.listByFirm` and `clients.create` oRPC paths, but the page read like a
generic admin directory. Product docs position Clients as the firm-level fact
directory that powers Migration, Rules preview, Workboard obligations,
Dashboard risk, and Pulse matching.

## Changes

- Reframed `/clients` as a Client facts workbench:
  - header now names the surface `Client facts`
  - KPI strip now derives `Ready for rules`, `Needs facts`, `Imported`, and
    `States covered` from real `clients.listByFirm` rows
  - table adds a readiness column and keeps entity/state/source/owner/update
    scanning dense
  - fact profile now opens in a right-side Sheet so the table can keep the
    full workspace width while preserving identity, source, notes, and the
    rule/Pulse readiness checklist
- Split frontend architecture:
  - `client-readiness.ts` owns pure derived data, source classification, search,
    filters, and readiness summary
  - `CreateClientDialog.tsx` owns the manual-create form and shared contract
    validation
  - `ClientFactsWorkspace.tsx` owns the presentational workbench, TanStack Table,
    KPI strip, empty states, and fact profile
  - `routes/clients.tsx` now only owns oRPC/TanStack Query, URL state, mutation
    glue, and route header actions
- Kept the backend contract unchanged. Search, entity filter, state filter, and
  active selection remain client-side derived from the current `limit: 500`
  list response.
- Added unit coverage for readiness derivation and filter behavior.
- Updated the Clients e2e page object to target the new accessible heading.
- Follow-up UI correction: removed the permanent right-side profile column,
  gave the table stable min-width/column widths, and kept jurisdiction/source
  cells from colliding at desktop widths.
- Follow-up e2e closure: expanded `e2e/tests/clients.spec.ts` beyond navigation
  and create to cover seeded readiness KPI, entity/state/search URL filters,
  filtered empty state, and Fact Profile Sheet inspection against the local
  `workboard` seed.

## Notes

- This intentionally does not add edit/delete or server-side search. Those would
  require `packages/contracts/src/clients.ts` changes and a broader repo/index
  design pass.
- The current browser seed path covers all-ready manual clients. Imported-client
  convergence and missing-required-fact warning rows should use a dedicated
  follow-up seed so the Workboard seed remains stable.
- The workbench follows the existing React constraints: module-level components,
  derived state via render/useMemo, no `useEffect`, no raw oRPC client imports,
  and URL state through `nuqs`.
