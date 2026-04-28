import { Link } from 'react-router'
import { Trans } from '@lingui/react/macro'
import { ArrowLeftIcon, CreditCardIcon } from 'lucide-react'
import { useQueryStates } from 'nuqs'

import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'

import { billingSearchParamsParsers, serializeBillingQuery } from '@/lib/billing'

export function BillingCancelRoute() {
  const [{ plan, interval }] = useQueryStates(billingSearchParamsParsers)
  const checkoutHref = serializeBillingQuery('/billing/checkout', { plan, interval })

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            <Trans>Checkout canceled</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>No subscription changes were made. You can restart checkout when ready.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">
            <Trans>The selected plan is still available from Billing settings.</Trans>
          </p>
        </CardContent>
        <CardFooter className="gap-2 border-t border-divider-regular">
          <Button render={<Link to={checkoutHref} />}>
            <CreditCardIcon data-icon="inline-start" />
            <Trans>Restart checkout</Trans>
          </Button>
          <Button variant="outline" render={<Link to="/settings/billing" />}>
            <ArrowLeftIcon data-icon="inline-start" />
            <Trans>Back to Billing</Trans>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
