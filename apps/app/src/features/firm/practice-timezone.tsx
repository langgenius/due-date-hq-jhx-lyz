import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { resolveUSFirmTimezone } from '@/features/firm/timezone-model'

const PracticeTimezoneContext = createContext(resolveUSFirmTimezone(null))

export function PracticeTimezoneProvider({
  timezone,
  children,
}: {
  timezone: string | null | undefined
  children: ReactNode
}) {
  const resolvedTimezone = useMemo(() => resolveUSFirmTimezone(timezone), [timezone])

  return (
    <PracticeTimezoneContext.Provider value={resolvedTimezone}>
      {children}
    </PracticeTimezoneContext.Provider>
  )
}

export function usePracticeTimezone(): string {
  return useContext(PracticeTimezoneContext)
}
