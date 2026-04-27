import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { Wizard } from './Wizard'
import { MigrationWizardContext, type MigrationWizardContextValue } from './WizardContext'

interface MigrationWizardProviderProps {
  children: ReactNode
}

/**
 * Mounts the Migration Copilot wizard once at the app shell and exposes
 * imperative open / close hooks. Listens to `location.state.autoOpenMigration`
 * so the onboarding flow can hand the user straight into "Import clients"
 * without exposing a dedicated URL.
 *
 * Note: the actual `MigrationWizardContext` instance lives in `WizardContext.ts`
 * — keeping it in a non-component module guarantees stable identity across
 * Fast Refresh cycles.
 */
export function MigrationWizardProvider({ children }: MigrationWizardProviderProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const openWizard = useCallback(() => setOpen(true), [])
  const closeWizard = useCallback(() => setOpen(false), [])

  // Onboarding hand-off: open once, then strip the flag so a refresh / back
  // navigation doesn't re-open the wizard unexpectedly.
  useEffect(() => {
    if (!isAutoOpenState(location.state)) return
    setOpen(true)
    void navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location.pathname, location.search, location.state, navigate])

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

function isAutoOpenState(value: unknown): value is { autoOpenMigration: true } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'autoOpenMigration' in value &&
    (value as { autoOpenMigration?: unknown }).autoOpenMigration === true
  )
}
