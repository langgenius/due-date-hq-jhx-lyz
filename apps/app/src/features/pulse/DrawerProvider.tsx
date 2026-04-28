import { useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { PulseDrawerContext, type PulseDrawerContextValue } from './DrawerContext'
import { PulseDetailDrawer } from './PulseDetailDrawer'

interface PulseDrawerProviderProps {
  children: ReactNode
}

// Mounts the Pulse Detail drawer once at the app shell so any descendant can
// imperatively open it. Mirrors `MigrationWizardProvider` for shape/consistency.
export function PulseDrawerProvider({ children }: PulseDrawerProviderProps) {
  const [alertId, setAlertId] = useState<string | null>(null)

  const openDrawer = useCallback((id: string) => setAlertId(id), [])
  const closeDrawer = useCallback(() => setAlertId(null), [])

  const value = useMemo<PulseDrawerContextValue>(
    () => ({ open: alertId !== null, alertId, openDrawer, closeDrawer }),
    [alertId, openDrawer, closeDrawer],
  )

  return (
    <PulseDrawerContext.Provider value={value}>
      {children}
      <PulseDetailDrawer alertId={alertId} onClose={closeDrawer} />
    </PulseDrawerContext.Provider>
  )
}

export function usePulseDrawer(): PulseDrawerContextValue {
  const ctx = useContext(PulseDrawerContext)
  if (!ctx) {
    throw new Error('usePulseDrawer must be used within PulseDrawerProvider')
  }
  return ctx
}
