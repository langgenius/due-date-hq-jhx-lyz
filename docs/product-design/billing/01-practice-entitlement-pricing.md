# Practice Workspace Entitlement and Pricing Closure

Date: 2026-05-02
Owner: Product
Status: accepted and implemented in app/server entitlement paths

## Product Thesis

DueDateHQ sells a practice workspace, not an unlimited collection of free tenants. A `firm`
is the internal billable workspace boundary: it owns clients, obligations, evidence, audit logs,
members, timezone, billing state, and tenant isolation. Customer-facing pricing calls this a
practice workspace, while the implementation continues to count active firms internally.

This follows the common SaaS workspace model used by products such as Notion, Slack,
and Linear: the workspace is the collaboration and billing container; members are seats
inside that container; advanced multi-workspace needs belong to the higher tier or
enterprise contract.

## Pricing Shape

| Plan | Customer-facing practice limit        | Included seats        | Primary buyer                                  | Product promise                                                                               |
| ---- | ------------------------------------- | --------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Solo | 1 active practice                     | 1 owner seat          | Solo CPA or evaluator                          | Evaluate the workbench with one real or sample practice workspace.                            |
| Pro  | 1 active practice                     | 5 seats               | Growing CPA practice                           | Run one production practice with shared deadline operations.                                  |
| Firm | Multiple active practices by contract | 10+ seats by contract | Multi-office or operationally complex practice | Manage multiple practices/offices, audit exports, coverage planning, and priority onboarding. |

`active firm` means `firm_profile.status = 'active'` and `deleted_at IS NULL`. Soft-deleted firms
do not count toward the entitlement. Suspended firms are inaccessible and should not be marketed as
usable entitlement.

## Non-Goals

- Do not make client count the first pricing limiter in this closure. Clients are managed objects
  inside a practice workspace; practice count is the customer-facing tenant/workspace limiter.
- Do not sell "unlimited Solo practices." That lets a free user simulate many independent workspaces
  and breaks the meaning of Solo.
- Do not turn Pro into a multi-practice plan by default. A second production practice usually represents
  another office, brand, legal entity, or demo/production split; that is Firm-plan territory.
- Do not expose internal nouns like Better Auth organization or `organizationLimit` in customer copy.

## Entitlement Rules

1. Solo users may create or keep one active practice.
2. Pro subscriptions apply to one active practice and unlock 5 seats plus paid operations surfaces for
   that practice.
3. Firm subscriptions are sales-assisted and may include multiple active practices. The allowed count is
   part of the contract, not a public self-serve slider in v1.
4. Owners can always view existing practices they belong to, but creating a new practice past entitlement
   opens an upgrade/contact-sales gate instead of creating a free Solo tenant.
5. Members cannot create practices on behalf of a paid practice unless they are creating a separate
   practice they will own. That separate practice still counts against their own entitlement state.
6. Invitations and member management remain seat-limited per active practice.

## Product Surfaces

### Public Pricing

Pricing cards must show both seats and practice/workspace limits:

- Solo: `1 practice workspace · 1 owner seat`
- Pro: `1 production practice · 5 seats included`
- Firm: `Multiple practices/offices · 10+ seats · custom agreement`

FAQ must include "Can I create multiple practices?" with the answer:

> Solo and Pro include one active practice workspace. Additional practices, offices, or demo/production
> separation are available on the Firm plan.

### App Billing

The Billing page must show current entitlement usage:

- Plan: Solo / Pro / Firm
- Seats: `used / limit`
- Practices: `active / included` for Solo and Pro; `active / contract` for Firm
- Subscription status remains payment-provider backed, but quota display is app-owned.

Plan cards in the app must mirror public pricing. They should not only list seats.

### Practice Switcher

The practice switcher remains the place where users see and switch active practices. `Add practice` stays
visible because the action is discoverable, but it has two outcomes:

- Within entitlement: open the create-practice dialog.
- Past entitlement: open a plan gate explaining the practice limit and linking to Billing or Contact
  sales.

Suggested gate copy:

> Your current plan includes one active practice. Additional practices are available on the Firm plan.

## Implementation State

The current implementation has per-firm plan, seat, billing, audit, tenant isolation, and active
firm count enforcement. In product language, that enforcement is the active practice workspace
limit. `organizationLimit` remains open for the multi-firm identity foundation, but `firms.create`
and Better Auth `allowUserToCreateOrganization` enforce owned active firm entitlement before a new
practice workspace can be created.

The visible app copy uses Practice for customer-facing tenant identity while keeping Firm as the
sales-assisted plan name and `firm` as the internal persistence/RPC noun.

## Options Considered

| Option                            | Decision        | Reason                                                                                                            |
| --------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Unlimited Solo practices          | Rejected        | It weakens the free plan boundary and lets users bypass paid workspace value.                                     |
| Pro includes multiple practices   | Rejected for v1 | It makes Firm plan harder to justify and blurs the line between one growing practice and multi-office operations. |
| Firm plan owns multiple practices | Accepted        | It matches SaaS workspace pricing patterns and keeps Solo/Pro easy to understand.                                 |

## Success Criteria

- A customer can understand from pricing alone how many practices and seats each plan includes.
- A Solo or Pro owner cannot accidentally create unpaid extra active practices.
- Billing and practice switcher explain the same entitlement in customer language.
- Technical docs distinguish current implementation from target product closure until enforcement lands.
