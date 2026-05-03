import { Link, useNavigate } from 'react-router'
import type { ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { useQueryStates } from 'nuqs'
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  CheckIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UsersIcon,
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
import {
  billingSearchParamsParsers,
  isSelfServeBillingPlan,
  isFirmOwner,
  serializeBillingQuery,
  type BillingInterval,
  type BillingPlan,
} from '@/features/billing/model'
import { useBillingSubscriptions, useCurrentFirm } from '@/features/billing/use-billing-data'

type PlanView = {
  label: string
  price: string
  priceSuffix: string
  priceNote: string
  seatLimit: number
  firmLimit: string
  summary: string
  bullets: string[]
  selfServe: boolean
}

function usePlanView(plan: BillingPlan, interval: BillingInterval): PlanView {
  const { t } = useLingui()

  if (plan === 'pro') {
    return {
      label: t`Pro`,
      price: interval === 'yearly' ? t`$79` : t`$99`,
      priceSuffix: t`/ mo`,
      priceNote: interval === 'yearly' ? t`Billed yearly` : t`Monthly billing`,
      seatLimit: 5,
      firmLimit: t`1 production practice`,
      summary: t`For growing CPA practices that need shared deadline operations.`,
      bullets: [t`1 production practice`, t`5 seats included`, t`Shared deadline operations`],
      selfServe: true,
    }
  }
  return {
    label: t`Enterprise`,
    price: t`Contact sales`,
    priceSuffix: '',
    priceNote: t`Annual agreement`,
    seatLimit: 10,
    firmLimit: t`Multiple practices/offices`,
    summary: t`For practices that need audit exports, coverage expansion, and priority onboarding.`,
    bullets: [t`Multiple practices/offices`, t`10+ seats`, t`Priority onboarding`],
    selfServe: false,
  }
}

function checkoutUrl(path: string, plan: BillingPlan, interval: BillingInterval): string {
  return new URL(serializeBillingQuery(path, { plan, interval }), window.location.origin).toString()
}

export function BillingCheckoutRoute() {
  const { t } = useLingui()
  const navigate = useNavigate()
  const [{ plan, interval }] = useQueryStates(billingSearchParamsParsers)
  const view = usePlanView(plan, interval)
  const { firmsQuery, currentFirm } = useCurrentFirm()
  const subscriptionsQuery = useBillingSubscriptions(currentFirm)
  const activeSubscription = subscriptionsQuery.data?.find((subscription) =>
    ['active', 'trialing', 'past_due', 'paused'].includes(subscription.status),
  )
  const subscriptionsReady = !subscriptionsQuery.isPending && !subscriptionsQuery.isError
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!currentFirm) throw new Error(t`No active practice is selected.`)
      if (!subscriptionsReady) throw new Error(t`Billing status is not ready yet.`)
      if (!isSelfServeBillingPlan(plan))
        throw new Error(t`Enterprise plan changes require sales support.`)
      return createCheckout({
        plan,
        annual: interval === 'yearly',
        referenceId: currentFirm.id,
        seats: view.seatLimit,
        subscriptionId: activeSubscription?.stripeSubscriptionId ?? undefined,
        successUrl: checkoutUrl('/billing/success', plan, interval),
        cancelUrl: checkoutUrl('/billing/cancel', plan, interval),
        returnUrl: new URL('/billing', window.location.origin).toString(),
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
            <Trans>No practice selected</Trans>
          </AlertTitle>
          <AlertDescription>
            <Trans>Create or select a practice before starting checkout.</Trans>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const owner = isFirmOwner(currentFirm)
  const alreadyOnPlan = activeSubscription?.plan === plan && currentFirm.plan === plan
  const selfServe = view.selfServe && isSelfServeBillingPlan(plan)
  const currentPlanLabel =
    currentFirm.plan === 'firm' ? t`Enterprise` : currentFirm.plan === 'pro' ? t`Pro` : t`Solo`

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-3">
        <Link
          to="/billing"
          className="inline-flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden />
          <Trans>Back to billing</Trans>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-primary text-text-inverted">
              <CreditCardIcon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-normal text-text-primary">
                <Trans>Confirm checkout</Trans>
              </h1>
              <p className="mt-1 max-w-[680px] text-sm leading-6 text-text-secondary">
                <Trans>Review the practice subscription before opening secure checkout.</Trans>
              </p>
            </div>
          </div>
          <Badge variant="info" className="font-mono tabular-nums">
            <Trans>Secure checkout</Trans>
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
            <Trans>Only the practice owner can start or change a subscription.</Trans>
          </AlertDescription>
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

      {checkoutMutation.isError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Checkout could not start</Trans>
          </AlertTitle>
          <AlertDescription>{checkoutMutation.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Plan summary</Trans>
            </CardTitle>
            <CardDescription>{view.summary}</CardDescription>
            <CardAction>
              <Badge variant="outline">
                {interval === 'yearly' ? <Trans>Yearly</Trans> : <Trans>Monthly</Trans>}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="rounded-lg border border-divider-regular bg-background-subtle p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-text-tertiary">
                    <Trans>Selected plan</Trans>
                  </p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">{view.label}</p>
                </div>
                <div className="text-left md:text-right">
                  <div className="flex items-baseline gap-2 md:justify-end">
                    <span className="font-mono text-4xl font-semibold tabular-nums text-text-primary">
                      {view.price}
                    </span>
                    <span className="font-mono text-lg font-semibold tabular-nums text-text-primary">
                      {view.priceSuffix}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{view.priceNote}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {view.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="flex min-h-16 items-start gap-2.5 rounded-lg border border-divider-regular bg-background-default p-3 text-sm text-text-secondary"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm bg-background-subtle text-text-accent">
                    <CheckIcon className="size-3.5" aria-hidden />
                  </span>
                  <span className="leading-5">{bullet}</span>
                </div>
              ))}
            </div>

            <div className="grid gap-3 rounded-lg border border-divider-regular bg-background-default p-4 text-sm text-text-secondary">
              <CheckoutNote
                icon={<ShieldCheckIcon className="size-4" aria-hidden />}
                title={<Trans>Owner approval required</Trans>}
                description={
                  <Trans>Only practice owners can start or change a subscription.</Trans>
                }
              />
              <CheckoutNote
                icon={<CreditCardIcon className="size-4" aria-hidden />}
                title={<Trans>Payment details stay with the processor</Trans>}
                description={
                  <Trans>DueDateHQ does not store card numbers or invoice payment data.</Trans>
                }
              />
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2 border-t border-divider-regular">
            <Button
              disabled={
                !owner ||
                !subscriptionsReady ||
                checkoutMutation.isPending ||
                subscriptionsQuery.isFetching ||
                alreadyOnPlan ||
                !selfServe
              }
              onClick={() => checkoutMutation.mutate()}
            >
              <CreditCardIcon data-icon="inline-start" />
              {checkoutMutation.isPending ? (
                <Trans>Opening checkout…</Trans>
              ) : (
                <Trans>Continue to secure checkout</Trans>
              )}
            </Button>
            <Button variant="outline" onClick={() => void navigate('/billing')}>
              <Trans>Choose another plan</Trans>
            </Button>
            {!selfServe ? (
              <span className="text-sm text-text-tertiary">
                <Trans>
                  Enterprise is a sales-assisted plan for multiple practices or offices. Contact
                  sales from Billing.
                </Trans>
              </span>
            ) : null}
          </CardFooter>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>
              <Trans>Practice context</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>
                Pro applies to one production practice. Enterprise plan covers multiple practices by
                contract.
              </Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <CheckoutFact
              icon={<Building2Icon className="size-4" aria-hidden />}
              label={<Trans>Practice</Trans>}
              value={currentFirm.name}
            />
            <CheckoutFact
              icon={<CreditCardIcon className="size-4" aria-hidden />}
              label={<Trans>Current plan</Trans>}
              value={currentPlanLabel}
            />
            <CheckoutFact
              icon={<UsersIcon className="size-4" aria-hidden />}
              label={<Trans>New seat limit</Trans>}
              value={String(view.seatLimit)}
            />
            <CheckoutFact
              icon={<Building2Icon className="size-4" aria-hidden />}
              label={<Trans>Practice limit</Trans>}
              value={view.firmLimit}
            />
            {alreadyOnPlan ? (
              <Alert>
                <AlertCircleIcon />
                <AlertTitle>
                  <Trans>Already active</Trans>
                </AlertTitle>
                <AlertDescription>
                  <Trans>This practice already has the selected plan.</Trans>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter>
            <Link
              to="/billing"
              className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'px-0')}
            >
              <Trans>View billing</Trans>
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}

function CheckoutFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: ReactNode
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-divider-regular bg-background-default p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-background-subtle text-text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-text-tertiary">{label}</p>
        <p className="mt-1 truncate font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  )
}

function CheckoutNote({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: ReactNode
  description: ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-background-subtle text-text-accent">
        {icon}
      </span>
      <div>
        <p className="font-medium text-text-primary">{title}</p>
        <p className="mt-1 leading-5">{description}</p>
      </div>
    </div>
  )
}
