import { createContext } from 'react'

export interface PulseDrawerContextValue {
  open: boolean
  alertId: string | null
  openDrawer: (alertId: string) => void
  closeDrawer: () => void
}

// Stable identity across Fast Refresh — see migration/WizardContext.ts pattern.
export const PulseDrawerContext = createContext<PulseDrawerContextValue | null>(null)
