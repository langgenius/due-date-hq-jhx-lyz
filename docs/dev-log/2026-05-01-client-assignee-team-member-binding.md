# Client Assignee Team Member Binding

## Change

- Replaced the manual client creation dialog's free-text Owner field with a team member-backed
  selector.
- Added `members.listAssignable`, a read-only RPC for active team members that is available to
  client write roles instead of reusing the Owner-only team management endpoint.
- Added `client.assignee_id` for member-backed assignments while preserving `client.assignee_name`
  as the display/import compatibility label used by Workboard and Team Workload.

## Notes

- Manual client creation submits `assigneeId` (`user.id`). The server validates it against active
  members in the current firm and derives `assigneeName` from the member record.
- CSV/migration paths may continue writing `assigneeName` without `assigneeId` so historical
  free-text owners and imported staff labels remain filterable.
- Team Workload remains a read model over `assigneeName`; member-backed rows now provide a stronger
  future bridge to obligation-level reassignment.

## Validation

- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/db test`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/server test`
- `pnpm check`
