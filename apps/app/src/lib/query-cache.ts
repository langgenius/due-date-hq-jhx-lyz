import type { QueryClient } from '@tanstack/react-query'

export function resetPracticeScopedQueryCache(queryClient: QueryClient): Promise<void> {
  return queryClient.resetQueries()
}
