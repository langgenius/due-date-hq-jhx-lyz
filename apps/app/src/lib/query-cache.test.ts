import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { resetPracticeScopedQueryCache } from './query-cache'

describe('resetPracticeScopedQueryCache', () => {
  it('resets tenant-scoped query data instead of leaving stale data visible', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const queryKey = ['dashboard', 'load']

    queryClient.setQueryData(queryKey, { firmId: 'old_firm' })

    await resetPracticeScopedQueryCache(queryClient)

    expect(queryClient.getQueryData(queryKey)).toBeUndefined()
  })
})
