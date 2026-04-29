import { useDebouncedValue } from 'foxact/use-debounced-value'
import { debounce } from 'nuqs'

const QUERY_INPUT_DEBOUNCE_MS = 350
const queryInputUrlUpdateRateLimit = debounce(QUERY_INPUT_DEBOUNCE_MS)

function useDebouncedQueryInput(value: string, options: { maxLength: number }): string {
  const trimmedValue = value.trim().slice(0, options.maxLength)
  const debouncedValue = useDebouncedValue(trimmedValue, QUERY_INPUT_DEBOUNCE_MS)
  return trimmedValue.length === 0 ? '' : debouncedValue
}

export { QUERY_INPUT_DEBOUNCE_MS, queryInputUrlUpdateRateLimit, useDebouncedQueryInput }
