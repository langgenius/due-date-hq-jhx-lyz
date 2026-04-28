import { useQuery } from '@tanstack/react-query'
import type { FirmPublic } from '@duedatehq/contracts'

import { orpc } from '@/lib/rpc'
import { listOrganizationSubscriptions } from './api'

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
    queryKey: ['billing', 'subscriptions', firm?.id],
    enabled: Boolean(firm?.id),
    queryFn: () => listOrganizationSubscriptions(firm?.id ?? ''),
    refetchInterval: poll ? 2500 : false,
  })
}
