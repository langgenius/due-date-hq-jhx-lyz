import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { orpc } from '@/lib/rpc'

const PULSE_ACTIVE_ALERTS_REFETCH_INTERVAL_MS = 60_000

// All Pulse-related cache invalidation flows through this hook so every
// mutation (apply, dismiss, revert) refreshes the same surfaces:
//   - pulse.* queries (banner / detail / history)
//   - dashboard.load (open obligations + risk summary)
//   - workboard.list (the underlying obligations may have moved due dates)
//   - audit.* (newly written audit events)
export function usePulseInvalidation(): () => void {
  const queryClient = useQueryClient()
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: orpc.pulse.key() })
    void queryClient.invalidateQueries({ queryKey: orpc.dashboard.load.key() })
    void queryClient.invalidateQueries({ queryKey: orpc.workboard.list.key() })
    void queryClient.invalidateQueries({ queryKey: orpc.audit.key() })
  }, [queryClient])
}

export function usePulseListAlertsQueryOptions(limit?: number) {
  return {
    ...orpc.pulse.listAlerts.queryOptions({
      input: limit === undefined ? undefined : { limit },
    }),
    refetchInterval: PULSE_ACTIVE_ALERTS_REFETCH_INTERVAL_MS,
  }
}

export function usePulseListHistoryQueryOptions(limit?: number) {
  return orpc.pulse.listHistory.queryOptions({
    input: limit === undefined ? undefined : { limit },
  })
}

export function usePulseSourceHealthQueryOptions() {
  return orpc.pulse.listSourceHealth.queryOptions({
    input: undefined,
  })
}

export function usePulseDetailQueryOptions(alertId: string | null) {
  return orpc.pulse.getDetail.queryOptions({
    input: { alertId: alertId ?? '' },
    enabled: alertId !== null,
  })
}
