import { Link } from 'react-router'
import type { ComponentProps, ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import { Button, buttonVariants } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import { cn } from '@duedatehq/ui/lib/utils'

import { createBillingPortal } from '@/features/billing/api'
import {
  activeFirmEntitlementLimit,
  billingPlanHref,
  isFirmOwner,
  ownedActiveFirms,
  paidPlanActive,
  type BillingPlan,
} from '@/features/billing/model'
import { useBillingSubscriptions, useCurrentFirm } from '@/features/billing/use-billing-data'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

type PlanCard = {
  id: 'solo' | BillingPlan
  name: string
  price: string
  priceSuffix?: string
  priceKind?: 'numeric' | 'text'
  cadence: string
  seats: string
  firms: string
  description: string
  features: string[]
  cta: string
  badge?: string
  href?: string
  disabled?: boolean
}

function usePlanCards(): PlanCard[] {
  const { t } = useLingui()
  return [
    {
      id: 'solo',
      name: t`Solo`,
      price: t`$0`,
      cadence: t`Free baseline`,
      seats: t`1 owner seat`,
      firms: t`1 firm workspace`,
      description: t`For evaluating the deadline workbench with one owner.`,
      features: [t`1 firm workspace`, t`Migration and rules preview`, t`Source-backed evidence`],
      cta: t`Current baseline`,
      disabled: true,
    },
    {
      id: 'pro',
      name: t`Pro`,
      price: t`$99`,
      priceSuffix: t`/ mo`,
      cadence: t`Monthly billing`,
      seats: t`5 seats included`,
      firms: t`1 production firm`,
      description: t`Shared deadline operations for a growing CPA practice.`,
      features: [
        t`1 production firm`,
        t`Shared deadline operations`,
        t`Pulse and workboard access`,
      ],
      cta: t`Upgrade to Pro`,
      badge: t`Recommended`,
      href: billingPlanHref('pro', 'monthly'),
    },
    {
      id: 'firm',
      name: t`Firm`,
      price: t`Contact sales`,
      priceKind: 'text',
      cadence: t`Annual agreement`,
      seats: t`10+ seats`,
      firms: t`Multiple firms/offices`,
      description: t`Priority onboarding, audit exports, and higher coverage needs.`,
      features: [
        t`Multiple firms/offices`,
        t`Priority onboarding`,
        t`Audit exports and coverage planning`,
      ],
      cta: t`Contact sales`,
      disabled: true,
    },
  ]
}

export function BillingRoute() {
  const { t } = useLingui()
  const planCards = usePlanCards()
  const { firmsQuery, currentFirm } = useCurrentFirm()
  const firms = firmsQuery.data ?? (currentFirm ? [currentFirm] : [])
  const activeFirmCount = ownedActiveFirms(firms).length
  const activeFirmLimit = activeFirmEntitlementLimit(firms)
  const activeFirmLimitLabel = activeFirmLimit === null ? t`contract` : String(activeFirmLimit)
  const activeFirmUsage = currentFirm
    ? t`${activeFirmCount} of ${activeFirmLimitLabel} active firms`
    : '—'
  const subscriptionsQuery = useBillingSubscriptions(currentFirm)
  const activeSubscription = subscriptionsQuery.data?.find((subscription) =>
    ['active', 'trialing', 'past_due', 'paused'].includes(subscription.status),
  )
  const owner = isFirmOwner(currentFirm)
  const currentPlanName = currentFirm
    ? currentFirm.plan === 'firm'
      ? t`Firm`
      : currentFirm.plan === 'pro'
        ? t`Pro`
        : t`Solo`
    : '—'
  const seatLimit = currentFirm ? t`${currentFirm.seatLimit} seat limit` : '—'
  const subscriptionStatus = activeSubscription?.status ?? t`No paid subscription`
  const portalMutation = useMutation({
    mutationFn: async () => {
      if (!currentFirm) throw new Error(t`No active firm is selected.`)
      return createBillingPortal({
        referenceId: currentFirm.id,
        returnUrl: new URL('/billing', window.location.origin).toString(),
      })
    },
    onSuccess: (url) => {
      window.location.assign(url)
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium uppercase text-text-tertiary">
              <Trans>Organization</Trans>
            </span>
            <h1 className="mt-1 text-2xl font-semibold text-text-primary">
              <Trans>Billing</Trans>
            </h1>
            <p className="mt-1 max-w-[680px] text-sm leading-6 text-text-secondary">
              <Trans>
                Review the active firm plan, open billing controls, and choose the right workspace
                tier.
              </Trans>
            </p>
          </div>
        </div>
        {currentFirm ? (
          <Badge
            variant={paidPlanActive(currentFirm) ? 'success' : 'outline'}
            className="font-mono tabular-nums"
          >
            {currentPlanName}
          </Badge>
        ) : null}
      </header>

      {portalMutation.isError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Billing portal could not open</Trans>
          </AlertTitle>
          <AlertDescription>{portalMutation.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {firmsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Firm context could not load</Trans>
          </AlertTitle>
          <AlertDescription>{firmsQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {subscriptionsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Billing status could not load</Trans>
          </AlertTitle>
          <AlertDescription>{subscriptionsQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Subscription overview</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>
                The payment provider is the source of truth; DueDateHQ caches the active plan.
              </Trans>
            </CardDescription>
            <CardAction>
              <Badge variant={billingStatusVariant(activeSubscription?.status)}>
                {subscriptionStatus}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-5">
            {firmsQuery.isLoading ? (
              <div className="grid gap-3 md:grid-cols-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                <div className="flex flex-col justify-between gap-4 rounded-lg border border-divider-regular bg-background-subtle p-5 md:flex-row md:items-end">
                  <div className="min-w-0">
                    <p className="text-sm text-text-tertiary">
                      <Trans>Active firm</Trans>
                    </p>
                    <p className="mt-1 truncate text-xl font-semibold text-text-primary">
                      {currentFirm?.name ?? '—'}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-mono text-3xl font-semibold tabular-nums text-text-primary">
                      {currentPlanName}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {seatLimit} · {activeFirmUsage}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  <Metric
                    label={<Trans>Plan</Trans>}
                    value={currentFirm?.plan ?? '—'}
                    name={`Plan: ${currentFirm?.plan ?? 'none'}`}
                  />
                  <Metric
                    label={<Trans>Seat limit</Trans>}
                    value={String(currentFirm?.seatLimit ?? '—')}
                    name={`Seat limit: ${currentFirm?.seatLimit ?? 'none'}`}
                  />
                  <Metric
                    label={<Trans>Firm workspaces</Trans>}
                    value={activeFirmUsage}
                    name={`Firm workspaces: ${activeFirmCount} of ${activeFirmLimitLabel}`}
                  />
                  <Metric
                    label={<Trans>Subscription status</Trans>}
                    value={subscriptionStatus}
                    name={`Subscription status: ${subscriptionStatus}`}
                  />
                  <Metric
                    label={<Trans>Billing role</Trans>}
                    value={owner ? t`Owner` : t`Member`}
                    name={`Billing role: ${owner ? 'owner' : 'member'}`}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex-wrap gap-2 border-t border-divider-regular">
            <Button
              disabled={
                !owner ||
                !activeSubscription ||
                subscriptionsQuery.isPending ||
                subscriptionsQuery.isError ||
                portalMutation.isPending
              }
              onClick={() => portalMutation.mutate()}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              {portalMutation.isPending ? <Trans>Opening…</Trans> : <Trans>Manage billing</Trans>}
            </Button>
            {!owner ? (
              <span className="text-sm text-text-tertiary">
                <Trans>Only owners can manage billing.</Trans>
              </span>
            ) : !activeSubscription ? (
              <span className="text-sm text-text-tertiary">
                <Trans>Choose Pro to start the hosted checkout flow.</Trans>
              </span>
            ) : (
              <span className="text-sm text-text-tertiary">
                <Trans>
                  The billing portal opens with the payment provider for invoices, payment methods,
                  and cancellation.
                </Trans>
              </span>
            )}
          </CardFooter>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>
              <Trans>Billing controls</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Organization billing stays scoped to the selected firm.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <ControlRow
              icon={<ShieldCheckIcon className="size-4" aria-hidden />}
              title={<Trans>Owner approved</Trans>}
              description={<Trans>Only firm owners can change plans or open the portal.</Trans>}
            />
            <ControlRow
              icon={<CreditCardIcon className="size-4" aria-hidden />}
              title={<Trans>Provider hosted</Trans>}
              description={
                <Trans>
                  Checkout, cards, invoices, and portal sessions stay with the processor.
                </Trans>
              }
            />
            <ControlRow
              icon={<CheckIcon className="size-4" aria-hidden />}
              title={<Trans>Webhook confirmed</Trans>}
              description={
                <Trans>Plan activation appears after the provider confirms the subscription.</Trans>
              }
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-xs font-medium uppercase text-text-tertiary">
              <Trans>Plan options</Trans>
            </span>
            <h2 className="mt-1 text-lg font-semibold text-text-primary">
              <Trans>Choose a workspace tier</Trans>
            </h2>
          </div>
          <p className="max-w-[520px] text-sm text-text-secondary">
            <Trans>
              Self-serve Pro changes use secure checkout and include one production firm.
            </Trans>
          </p>
        </header>

        <div className="grid items-stretch gap-4 xl:grid-cols-3">
          {planCards.map((plan) => (
            <PlanOption key={plan.id} plan={plan} currentPlan={currentFirm?.plan} owner={owner} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <Trans>Payment model</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Checkout and portal sessions are hosted by the payment provider.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6 text-text-secondary md:grid-cols-2">
            <p>
              <Trans>Paid subscriptions bill the organization, not an individual user.</Trans>
            </p>
            <p>
              <Trans>Success pages wait for webhook confirmation before showing activation.</Trans>
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>
              <Trans>What stays in DueDateHQ</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>We cache the plan and seat limit for app permissions.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-text-secondary">
            <p>
              <Trans>Card numbers and invoice payment details never enter the app database.</Trans>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function billingStatusVariant(status: string | undefined): BadgeVariant {
  if (!status) return 'outline'
  if (status === 'past_due') return 'warning'
  if (status === 'paused') return 'secondary'
  return 'info'
}

function Metric({ label, value, name }: { label: ReactNode; value: string; name: string }) {
  return (
    <div
      role="group"
      aria-label={name}
      className="rounded-lg border border-divider-regular bg-background-default p-4"
    >
      <span className="text-xs font-medium uppercase text-text-tertiary">{label}</span>
      <p className="mt-2 truncate text-md font-semibold text-text-primary">{value}</p>
    </div>
  )
}

function ControlRow({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: ReactNode
  description: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-background-subtle text-text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-medium text-text-primary">{title}</p>
        <p className="mt-1 leading-5 text-text-secondary">{description}</p>
      </div>
    </div>
  )
}

function PlanOption({
  plan,
  currentPlan,
  owner,
}: {
  plan: PlanCard
  currentPlan: string | undefined
  owner: boolean
}) {
  const current = plan.id === currentPlan
  const disabled = plan.disabled || current || !owner
  const highlighted = plan.id === 'pro'
  const priceKind = plan.priceKind ?? 'numeric'

  return (
    <Card
      className={cn(
        'h-full min-h-[420px]',
        highlighted ? 'border-state-accent-active bg-background-default shadow-sm' : undefined,
      )}
    >
      <CardHeader className="min-h-[112px] content-start">
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-10 leading-5">
          {plan.description}
        </CardDescription>
        <CardAction>
          {current ? (
            <Badge variant="success">
              <Trans>Current</Trans>
            </Badge>
          ) : plan.badge ? (
            <Badge variant="info">{plan.badge}</Badge>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="grid min-h-[92px] content-start gap-2">
          <div className="flex min-h-10 flex-wrap items-baseline gap-2">
            <span
              className={cn(
                'text-3xl font-semibold text-text-primary',
                priceKind === 'numeric' ? 'font-mono tabular-nums' : 'font-sans tracking-normal',
              )}
            >
              {plan.price}
            </span>
            {plan.priceSuffix ? (
              <span className="font-mono text-lg font-semibold tabular-nums text-text-primary">
                {plan.priceSuffix}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
            <span>{plan.cadence}</span>
            <span aria-hidden>·</span>
            <span>{plan.firms}</span>
            <span aria-hidden>·</span>
            <span>{plan.seats}</span>
          </div>
        </div>
        <div className="h-px w-full bg-divider-regular" aria-hidden />
        <ul className="grid gap-3 text-sm leading-5 text-text-secondary">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-background-subtle text-text-accent">
                <CheckIcon className="size-3.5" aria-hidden />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="border-t border-divider-regular">
        {plan.href && !disabled ? (
          <Link
            to={plan.href}
            className={cn(
              buttonVariants({ variant: highlighted ? 'accent' : 'default' }),
              'w-full',
            )}
          >
            <CreditCardIcon data-icon="inline-start" />
            {plan.cta}
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        ) : (
          <Button disabled className="w-full" variant="outline">
            {current ? <Trans>Current plan</Trans> : plan.cta}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
