import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CreditCardIcon,
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

import { createCheckout } from '@/features/billing/api'
import { useBillingSubscriptions, useCurrentFirm } from '@/features/billing/use-billing-data'
import {
  isFirmOwner,
  parseBillingInterval,
  parseBillingPlan,
  type BillingInterval,
  type BillingPlan,
} from '@/lib/billing'

type PlanView = {
  label: string
  price: string
  seatLimit: number
  summary: string
  bullets: string[]
}

function planView(
  plan: BillingPlan,
  interval: BillingInterval,
  t: ReturnType<typeof useLingui>['t'],
): PlanView {
  if (plan === 'pro') {
    return {
      label: t`Pro`,
      price: interval === 'yearly' ? t`$399 / mo, billed yearly` : t`$499 / mo`,
      seatLimit: 10,
      summary: t`For multi-office practices that need audit exports and higher rule coverage.`,
      bullets: [t`10 seats included`, t`Audit export surface`, t`Priority onboarding`],
    }
  }
  return {
    label: t`Firm`,
    price: interval === 'yearly' ? t`$79 / mo, billed yearly` : t`$99 / mo`,
    seatLimit: 5,
    summary: t`For growing CPA practices that need shared deadline operations.`,
    bullets: [t`5 seats included`, t`14-day trial`, t`Pulse and migration workbench included`],
  }
}

function checkoutUrl(path: string, plan: BillingPlan, interval: BillingInterval): string {
  const url = new URL(path, window.location.origin)
  url.searchParams.set('plan', plan)
  url.searchParams.set('interval', interval)
  return url.toString()
}

export function BillingCheckoutRoute() {
  const { t } = useLingui()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const plan = parseBillingPlan(searchParams.get('plan'))
  const interval = parseBillingInterval(searchParams.get('interval'))
  const view = planView(plan, interval, t)
  const { firmsQuery, currentFirm } = useCurrentFirm()
  const subscriptionsQuery = useBillingSubscriptions(currentFirm)
  const activeSubscription = subscriptionsQuery.data?.find((subscription) =>
    ['active', 'trialing', 'past_due', 'paused'].includes(subscription.status),
  )
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!currentFirm) throw new Error(t`No active firm is selected.`)
      return createCheckout({
        plan,
        annual: interval === 'yearly',
        referenceId: currentFirm.id,
        seats: view.seatLimit,
        subscriptionId: activeSubscription?.stripeSubscriptionId ?? undefined,
        successUrl: checkoutUrl('/billing/success', plan, interval),
        cancelUrl: checkoutUrl('/billing/cancel', plan, interval),
        returnUrl: new URL('/settings/billing', window.location.origin).toString(),
      })
    },
    onSuccess: (url) => {
      window.location.assign(url)
    },
  })

  if (firmsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (!currentFirm) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>No firm selected</Trans>
          </AlertTitle>
          <AlertDescription>
            <Trans>Create or select a firm before starting checkout.</Trans>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const owner = isFirmOwner(currentFirm)
  const alreadyOnPlan = activeSubscription?.plan === plan && currentFirm.plan === plan

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <Link
          to="/settings/billing"
          className="inline-flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden />
          <Trans>Back to billing</Trans>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-text-primary">
              <Trans>Confirm checkout</Trans>
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              <Trans>Review the subscription before continuing to Stripe Checkout.</Trans>
            </p>
          </div>
          <Badge variant="info" className="font-mono tabular-nums">
            <Trans>Stripe-hosted payment</Trans>
          </Badge>
        </div>
      </header>

      {!owner ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Owner permission required</Trans>
          </AlertTitle>
          <AlertDescription>
            <Trans>Only the firm owner can start or change a subscription.</Trans>
          </AlertDescription>
        </Alert>
      ) : null}

      {checkoutMutation.isError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Checkout could not start</Trans>
          </AlertTitle>
          <AlertDescription>{checkoutMutation.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{view.label}</CardTitle>
            <CardDescription>{view.summary}</CardDescription>
            <CardAction>
              <Badge variant="outline">
                {interval === 'yearly' ? <Trans>Yearly</Trans> : <Trans>Monthly</Trans>}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div>
              <span className="font-mono text-3xl font-semibold tabular-nums text-text-primary">
                {view.price}
              </span>
              <p className="mt-2 text-sm text-text-secondary">
                <Trans>
                  Card details are collected by Stripe. DueDateHQ never handles card numbers.
                </Trans>
              </p>
            </div>
            <div className="grid gap-2">
              {view.bullets.map((bullet) => (
                <div key={bullet} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckIcon className="size-4 text-text-success" aria-hidden />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="gap-2 border-t border-divider-regular">
            <Button
              disabled={!owner || checkoutMutation.isPending || alreadyOnPlan}
              onClick={() => checkoutMutation.mutate()}
            >
              <CreditCardIcon data-icon="inline-start" />
              {checkoutMutation.isPending ? (
                <Trans>Opening Stripe…</Trans>
              ) : (
                <Trans>Continue to Stripe</Trans>
              )}
            </Button>
            <Button variant="outline" onClick={() => void navigate('/settings/billing')}>
              <Trans>Choose another plan</Trans>
            </Button>
          </CardFooter>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>
              <Trans>Firm context</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>The subscription applies to the active firm.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div>
              <span className="text-text-tertiary">
                <Trans>Firm</Trans>
              </span>
              <p className="font-medium text-text-primary">{currentFirm.name}</p>
            </div>
            <div>
              <span className="text-text-tertiary">
                <Trans>Current plan</Trans>
              </span>
              <p className="font-medium text-text-primary">{currentFirm.plan}</p>
            </div>
            <div>
              <span className="text-text-tertiary">
                <Trans>New seat limit</Trans>
              </span>
              <p className="font-medium text-text-primary">{view.seatLimit}</p>
            </div>
            {alreadyOnPlan ? (
              <Alert>
                <AlertCircleIcon />
                <AlertTitle>
                  <Trans>Already active</Trans>
                </AlertTitle>
                <AlertDescription>
                  <Trans>This firm already has the selected plan.</Trans>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter>
            <Link
              to="/settings/billing"
              className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'px-0')}
            >
              <Trans>View billing settings</Trans>
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}
