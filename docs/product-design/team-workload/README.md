# Team Workload

## Product Intent

Team Workload is the paid shared-operations surface for Pro, Team, and Enterprise plans. It is not
a task-management module. It summarizes the existing obligation queue so a CPA practice can answer
the weekly manager questions quickly:

- who owns the most open deadline work;
- who has due-soon or overdue obligations this week;
- which waiting-on-client or review items need manager attention;
- which obligations are unassigned and should not be missed;
- where to jump in Workboard to triage the underlying rows.

Solo remains the personal deadline workbench. Pro, Team, and Enterprise add shared deadline
operations. Team and Enterprise add manager operations on top: capacity pressure, unassigned risk,
review pressure, and team-level triage signals.
The sidebar entry stays visible for all plans because it communicates the paid expansion path, but
Solo users see a locked paid hint and a route-level upgrade panel instead of an active workload
table.

## Scope

V1 is intentionally read-only:

- aggregate open obligations by owner label;
- include `open`, `dueSoon`, `overdue`, `waiting`, `review`, and `loadScore`;
- always show the `Unassigned` row when matching obligations exist;
- deep-link every metric back to Workboard with matching filters;
- enforce plan access on the server and avoid fetching workload data for Solo in the UI.

V1 does not add reassignment, scheduling, time tracking, performance reporting, document collection,
client portal workflows, or a separate task table.

## Data Boundary

Current schema has no formal `obligation_instance.assignee_user_id`. Client records can now bind
new manual assignments to an active team member through `client.assignee_id` (`user.id`), while
`client.assignee_name` remains the denormalized owner label for display, Workboard filters, and
imported/free-text historical rows. V1 uses the label as the workload owner source:

- `client.assignee_id` present: assignment is member-backed, with `client.assignee_name` storing the
  active member display name at write time;
- `client.assignee_name` non-empty without `client.assignee_id`: grouped as that imported or legacy
  owner label;
- both assignment fields missing or blank: grouped into `Unassigned`;
- obligation status and due-date math come from `obligation_instance`;
- open obligations are `pending`, `in_progress`, `waiting_on_client`, and `review`;
- due soon means `0 <= current_due_date - as_of_date <= windowDays`;
- overdue means `current_due_date < as_of_date`.

This keeps Team Workload a read model over Workboard data. A later assignment slice should add
`obligation_instance.assignee_user_id`, `obligation.reassigned` audit events, and bulk reassignment
without changing this page's user-facing purpose.

## Access Model

Plan access:

- `solo`: sidebar item is visible but disabled with a `Pro` paid tag; direct `/workload` route shows
  an upgrade panel;
- `pro` / `team` / `firm` (Enterprise): route is enabled and calls `workload.load`;
- `team` / `firm` (Enterprise): response includes `managerInsights`; Pro gets the same core
  workload table without the manager operations panel;
- server returns `FORBIDDEN` for `solo` even if a client calls the API directly.

Role access for V1 is broad within paid firms: all active members can view the read-only workload
summary. Reassignment and member-sensitive controls remain future Owner/Manager capabilities.

## UI Design

The route uses the existing workbench style: full-width content, hairline cards, dense metrics, and
tables. The first screen should show work, not explanatory marketing copy.

Top summary strip:

- Open;
- Due soon;
- Overdue;
- Waiting;
- Review;
- Unassigned.

Main table:

| Column   | Meaning                                                    |
| -------- | ---------------------------------------------------------- |
| Owner    | `client.assignee_name` or `Unassigned`                     |
| Open     | Open obligations owned by that label                       |
| Due soon | Open obligations due in the selected window                |
| Overdue  | Open obligations already past due                          |
| Waiting  | Open obligations in `waiting_on_client`                    |
| Review   | Open obligations in `review`                               |
| Load     | Percent normalized against the largest assigned open count |
| Action   | Opens Workboard with matching filters                      |

Deep links use Workboard URL state so the workload page stays an overview, and Workboard remains
the execution surface.

## API Shape

`workload.load` input:

```ts
{
  asOfDate?: string
  windowDays?: number
}
```

`workload.load` output:

```ts
{
  asOfDate: string
  windowDays: number
  summary: {
    open: number
    dueSoon: number
    overdue: number
    waiting: number
    review: number
    unassigned: number
  }
  rows: Array<{
    id: string
    ownerLabel: string
    assigneeName: string | null
    kind: 'assignee' | 'unassigned'
    open: number
    dueSoon: number
    overdue: number
    waiting: number
    review: number
    loadScore: number
  }>
  managerInsights: null | {
    capacityOwnerLabel: string | null
    capacityLoadScore: number
    capacityOpen: number
    unassignedOpen: number
    waitingOpen: number
    reviewOpen: number
  }
}
```

Workboard gains the filters needed for deep links:

- `assigneeName`;
- `owner=unassigned`;
- `due=overdue`;
- `dueWithinDays`.

## Acceptance Criteria

- Solo users see `Team workload` in the sidebar with a paid hint but cannot click it.
- Direct `/workload` navigation on Solo shows an upgrade panel linked to Billing.
- Pro/Enterprise users can open `/workload` and see server-computed metrics.
- `Unassigned` is visible when any open obligation has no owner label.
- Clicking a workload row opens Workboard filtered to the same owner/unassigned set.
- Clicking due/overdue-oriented controls opens Workboard with due filters.
- No new task tables, time-tracking fields, or reassignment workflow are introduced in V1.

## E2E Coverage

`e2e/tests/workload.spec.ts` locks the V1 product loop:

- Solo sees the paid Team Workload sidebar signal and direct-route upgrade panel.
- Enterprise-tier sessions load server-computed owner metrics from seeded Workboard obligations.
- `Unassigned` appears when an open obligation lacks an owner label.
- Owner and due-risk links land on Workboard with matching URL filters.
