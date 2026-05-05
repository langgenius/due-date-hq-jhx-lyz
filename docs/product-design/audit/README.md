# Audit Product Design

Audit Log is the firm-wide read surface for append-only audit events.

## Documents

| Document                                                                       | Purpose                                                     |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| [`01-audit-log-management-page.md`](./01-audit-log-management-page.md)         | Product design for the read-only Audit Log management page. |
| [`02-audit-log-implementation-plan.md`](./02-audit-log-implementation-plan.md) | Implementation sequence and validation checklist.           |

## Status

Implemented as of 2026-04-29 for the Audit Log page, contract, server procedure,
and protected `/audit` front-end route. Audit evidence package export is available
to owners on Team and Enterprise plans; lower plans show a disabled export action
with the plan requirement before opening the export dialog.
