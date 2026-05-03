import { useQuery } from '@tanstack/react-query'
import type { FirmPublic } from '@duedatehq/contracts'

import { orpc } from '@/lib/rpc'

export function useCurrentFirm(options: { poll?: boolean } = {}) {
  const firmsQuery = useQuery({
    ...orpc.firms.listMine.queryOptions({ input: undefined }),
    refetchInterval: options.poll ? 2500 : false,
  })
  const currentFirm =
    firmsQuery.data?.find((firm) => firm.isCurrent) ?? firmsQuery.data?.[0] ?? null
  return { firmsQuery, currentFirm }
}

export function useBillingSubscriptions(firm: FirmPublic | null, poll = false) {
  return useQuery({
    ...orpc.firms.listSubscriptions.queryOptions({ input: undefined }),
    queryKey: ['billing', 'subscriptions', firm?.id],
    enabled: Boolean(firm?.id),
    refetchInterval: poll ? 2500 : false,
  })
}

export function useBillingCheckoutConfig(enabled = true) {
  return useQuery({
    ...orpc.firms.billingCheckoutConfig.queryOptions({ input: undefined }),
    enabled,
  })
}
