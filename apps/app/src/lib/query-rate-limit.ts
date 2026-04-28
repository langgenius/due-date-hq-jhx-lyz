import { useDebouncedValue } from 'foxact/use-debounced-value'
import { debounce } from 'nuqs'

import { WORKBOARD_SEARCH_MAX_LENGTH } from '@duedatehq/contracts'

const SEARCH_QUERY_DEBOUNCE_MS = 350
const searchQueryUrlUpdateRateLimit = debounce(SEARCH_QUERY_DEBOUNCE_MS)

function useDebouncedSearchQuery(value: string): string {
  const trimmedValue = value.trim().slice(0, WORKBOARD_SEARCH_MAX_LENGTH)
  const debouncedValue = useDebouncedValue(trimmedValue, SEARCH_QUERY_DEBOUNCE_MS)
  return trimmedValue.length === 0 ? '' : debouncedValue
}

export { SEARCH_QUERY_DEBOUNCE_MS, searchQueryUrlUpdateRateLimit, useDebouncedSearchQuery }
