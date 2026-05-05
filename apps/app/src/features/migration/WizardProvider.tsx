import { useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { Wizard } from './Wizard'
import { MigrationWizardContext, type MigrationWizardContextValue } from './WizardContext'

interface MigrationWizardProviderProps {
  children: ReactNode
}

export function MigrationWizardProvider({ children }: MigrationWizardProviderProps) {
  const [open, setOpen] = useState(false)
  const openWizard = useCallback(() => setOpen(true), [])
  const closeWizard = useCallback(() => setOpen(false), [])

  const value = useMemo<MigrationWizardContextValue>(
    () => ({ open, openWizard, closeWizard }),
    [open, openWizard, closeWizard],
  )

  return (
    <MigrationWizardContext.Provider value={value}>
      {children}
      <Wizard open={open} onClose={closeWizard} />
    </MigrationWizardContext.Provider>
  )
}

export function useMigrationWizard(): MigrationWizardContextValue {
  const ctx = useContext(MigrationWizardContext)
  if (!ctx) {
    throw new Error('useMigrationWizard must be used within MigrationWizardProvider')
  }
  return ctx
}
