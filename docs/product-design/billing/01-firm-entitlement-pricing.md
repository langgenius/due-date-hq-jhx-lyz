# Firm Entitlement and Pricing Closure

Date: 2026-05-02
Owner: Product
Status: accepted product direction; implementation pending

## Product Thesis

DueDateHQ sells a firm workspace, not an unlimited collection of free tenants. A `firm`
is the billable workspace boundary: it owns clients, obligations, evidence, audit logs,
members, timezone, billing state, and tenant isolation. A user account can belong to
multiple firms, but plan entitlement decides how many active firms that account or
contract may operate.

This follows the common SaaS workspace model used by products such as Notion, Slack,
and Linear: the workspace is the collaboration and billing container; members are seats
inside that container; advanced multi-workspace needs belong to the higher tier or
enterprise contract.

## Pricing Shape

| Plan | Included active firms             | Included seats        | Primary buyer                                  | Product promise                                                                           |
| ---- | --------------------------------- | --------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Solo | 1 active firm                     | 1 owner seat          | Solo CPA or evaluator                          | Evaluate the workbench with one real or sample firm workspace.                            |
| Pro  | 1 active firm                     | 5 seats               | Growing CPA practice                           | Run one production firm with shared deadline operations.                                  |
| Firm | Multiple active firms by contract | 10+ seats by contract | Multi-office or operationally complex practice | Manage multiple firms/offices, audit exports, coverage planning, and priority onboarding. |

`active firm` means `firm_profile.status = 'active'` and `deleted_at IS NULL`. Soft-deleted firms
do not count toward the entitlement. Suspended firms are inaccessible and should not be marketed as
usable entitlement.

## Non-Goals

- Do not make client count the first pricing limiter in this closure. Clients are managed objects
  inside a firm; firm count is the tenant/workspace limiter.
- Do not sell "unlimited Solo firms." That lets a free user simulate many independent workspaces
  and breaks the meaning of Solo.
- Do not turn Pro into a multi-firm plan by default. A second production firm usually represents
  another office, brand, legal entity, or demo/production split; that is Firm-plan territory.
- Do not expose internal nouns like Better Auth organization or `organizationLimit` in customer copy.

## Entitlement Rules

1. Solo users may create or keep one active firm.
2. Pro subscriptions apply to one active firm and unlock 5 seats plus paid operations surfaces for
   that firm.
3. Firm subscriptions are sales-assisted and may include multiple active firms. The allowed count is
   part of the contract, not a public self-serve slider in v1.
4. Owners can always view existing firms they belong to, but creating a new firm past entitlement
   opens an upgrade/contact-sales gate instead of creating a free Solo tenant.
5. Members cannot create firms on behalf of a paid firm unless they are creating a separate firm they
   will own. That separate firm still counts against their own entitlement state.
6. Invitations and member management remain seat-limited per active firm.

## Product Surfaces

### Public Pricing

Pricing cards must show both seats and firm/workspace limits:

- Solo: `1 firm workspace · 1 owner seat`
- Pro: `1 production firm · 5 seats included`
- Firm: `Multiple firms/offices · 10+ seats · custom agreement`

FAQ must include "Can I create multiple firms?" with the answer:

> Solo and Pro include one active firm workspace. Additional firms, offices, or demo/production
> separation are available on the Firm plan.

### App Billing

The Billing page must show current entitlement usage:

- Plan: Solo / Pro / Firm
- Seats: `used / limit`
- Firms: `active / included` for Solo and Pro; `active / contract` for Firm
- Subscription status remains payment-provider backed, but quota display is app-owned.

Plan cards in the app must mirror public pricing. They should not only list seats.

### Firm Switcher

The firm switcher remains the place where users see and switch active firms. `Add firm` stays
visible because the action is discoverable, but it has two outcomes:

- Within entitlement: open the create-firm dialog.
- Past entitlement: open a plan gate explaining the firm limit and linking to Billing or Contact
  sales.

Suggested gate copy:

> Your current plan includes one active firm. Additional firms are available on the Firm plan.

## Current Implementation Gap

The current implementation already has per-firm plan, seat, billing, audit, and tenant isolation
closure. It does not yet enforce active firm count. Today a user can create many Solo firms because
`organizationLimit` was intentionally opened for the multi-firm foundation. That is now a known
product gap, not the intended pricing shape.

Engineering follow-up should add a hard server-side entitlement check before `firms.create`, then
align the firm switcher, Billing page, marketing pricing copy, app pricing cards, i18n catalogs, and
E2E coverage.

## Options Considered

| Option                        | Decision        | Reason                                                                                                            |
| ----------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Unlimited Solo firms          | Rejected        | It weakens the free plan boundary and lets users bypass paid workspace value.                                     |
| Pro includes multiple firms   | Rejected for v1 | It makes Firm plan harder to justify and blurs the line between one growing practice and multi-office operations. |
| Firm plan owns multiple firms | Accepted        | It matches SaaS workspace pricing patterns and keeps Solo/Pro easy to understand.                                 |

## Success Criteria

- A customer can understand from pricing alone how many firms and seats each plan includes.
- A Solo or Pro owner cannot accidentally create unpaid extra active firms.
- Billing and firm switcher explain the same entitlement in customer language.
- Technical docs distinguish current implementation from target product closure until enforcement lands.
