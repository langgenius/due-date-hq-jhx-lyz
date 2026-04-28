import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { AlertCircleIcon, ArrowRightIcon, CreditCardIcon, ExternalLinkIcon } from 'lucide-react'

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
import { useBillingSubscriptions, useCurrentFirm } from '@/features/billing/use-billing-data'
import { billingPlanHref, isFirmOwner, paidPlanActive, type BillingPlan } from '@/lib/billing'

type PlanCard = {
  id: 'solo' | BillingPlan
  name: string
  price: string
  seats: string
  description: string
  cta: string
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
      seats: t`1 seat`,
      description: t`For evaluating the deadline workbench with one owner.`,
      cta: t`Current baseline`,
      disabled: true,
    },
    {
      id: 'firm',
      name: t`Firm`,
      price: t`$99 / mo`,
      seats: t`5 seats`,
      description: t`Shared deadline operations for a growing CPA practice.`,
      cta: t`Upgrade to Firm`,
      href: billingPlanHref('firm', 'monthly'),
    },
    {
      id: 'pro',
      name: t`Pro`,
      price: t`Contact sales`,
      seats: t`10 seats`,
      description: t`Priority onboarding, audit exports, and higher coverage needs.`,
      cta: t`Talk to founders`,
      disabled: true,
    },
  ]
}

export function SettingsBillingRoute() {
  const planCards = usePlanCards()
  const { firmsQuery, currentFirm } = useCurrentFirm()
  const subscriptionsQuery = useBillingSubscriptions(currentFirm)
  const activeSubscription = subscriptionsQuery.data?.find((subscription) =>
    ['active', 'trialing', 'past_due'].includes(subscription.status),
  )
  const owner = isFirmOwner(currentFirm)
  const portalMutation = useMutation({
    mutationFn: async () => {
      if (!currentFirm) throw new Error('No active firm is selected.')
      return createBillingPortal({
        referenceId: currentFirm.id,
        returnUrl: new URL('/settings/billing', window.location.origin).toString(),
      })
    },
    onSuccess: (url) => {
      window.location.assign(url)
    },
  })

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            <Trans>Settings</Trans>
          </span>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-text-primary">
            <Trans>Billing</Trans>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            <Trans>Manage the subscription attached to the active firm.</Trans>
          </p>
        </div>
        {currentFirm ? (
          <Badge variant={paidPlanActive(currentFirm) ? 'success' : 'outline'}>
            {currentFirm.plan}
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

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Current subscription</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Stripe is the payment source of truth; this app caches the active plan.</Trans>
            </CardDescription>
            <CardAction>
              {activeSubscription ? (
                <Badge variant="info">{activeSubscription.status}</Badge>
              ) : (
                <Badge variant="outline">
                  <Trans>No paid subscription</Trans>
                </Badge>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {firmsQuery.isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : (
              <>
                <Metric
                  label={<Trans>Firm</Trans>}
                  value={currentFirm?.name ?? '—'}
                  name={`Firm: ${currentFirm?.name ?? 'none'}`}
                />
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
              </>
            )}
          </CardContent>
          <CardFooter className="gap-2 border-t border-divider-regular">
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
              {portalMutation.isPending ? <Trans>Opening…</Trans> : <Trans>Manage in Stripe</Trans>}
            </Button>
            {!owner ? (
              <span className="text-sm text-text-tertiary">
                <Trans>Only owners can manage billing.</Trans>
              </span>
            ) : null}
          </CardFooter>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>
              <Trans>Payment model</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Checkout and portal sessions are hosted by Stripe.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-text-secondary">
            <p>
              <Trans>Firm subscriptions bill the organization, not an individual user.</Trans>
            </p>
            <p>
              <Trans>Success pages wait for webhook confirmation before showing activation.</Trans>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {planCards.map((plan) => (
          <PlanOption key={plan.id} plan={plan} currentPlan={currentFirm?.plan} owner={owner} />
        ))}
      </section>
    </div>
  )
}

function Metric({ label, value, name }: { label: ReactNode; value: string; name: string }) {
  return (
    <div
      role="group"
      aria-label={name}
      className="rounded-lg border border-divider-regular bg-background-subtle p-4"
    >
      <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      <p className="mt-2 truncate text-md font-semibold text-text-primary">{value}</p>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <CardAction>
          {current ? (
            <Badge variant="success">
              <Trans>Current</Trans>
            </Badge>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2">
        <span className="font-mono text-2xl font-semibold tabular-nums text-text-primary">
          {plan.price}
        </span>
        <span className="text-sm text-text-secondary">{plan.seats}</span>
      </CardContent>
      <CardFooter className="border-t border-divider-regular">
        {plan.href && !disabled ? (
          <Link to={plan.href} className={cn(buttonVariants(), 'w-full')}>
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
