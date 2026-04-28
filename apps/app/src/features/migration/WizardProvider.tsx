import { useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

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
  const location = useLocation()
  const [{ open, autoOpenLocationKey }, setWizardState] = useState<{
    open: boolean
    autoOpenLocationKey: string | null
  }>({ open: false, autoOpenLocationKey: null })
  const shouldConsumeAutoOpen =
    isAutoOpenState(location.state) && autoOpenLocationKey !== location.key
  const shouldStripAutoOpen =
    isAutoOpenState(location.state) && autoOpenLocationKey === location.key

  if (shouldConsumeAutoOpen) {
    setWizardState({ open: true, autoOpenLocationKey: location.key })
  }

  const openWizard = useCallback(() => setWizardState((prev) => ({ ...prev, open: true })), [])
  const closeWizard = useCallback(() => setWizardState((prev) => ({ ...prev, open: false })), [])

  const value = useMemo<MigrationWizardContextValue>(
    () => ({ open, openWizard, closeWizard }),
    [open, openWizard, closeWizard],
  )

  return (
    <MigrationWizardContext.Provider value={value}>
      {children}
      {shouldStripAutoOpen ? (
        <Navigate to={`${location.pathname}${location.search}`} replace state={null} />
      ) : null}
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
