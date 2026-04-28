import { useCallback, useSyncExternalStore } from 'react'
import { useLoaderData, useLocation } from 'react-router'
import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'

import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import {
  isThemePreference,
  readStoredThemePreference,
  switchThemePreference as applyAndPersistTheme,
  type ThemePreference,
} from '@duedatehq/ui/theme'

import { AppShell } from '@/components/patterns/app-shell'
import { KeyboardProvider } from '@/components/patterns/keyboard-shell'
import { MigrationWizardProvider, useMigrationWizard } from '@/features/migration/WizardProvider'
import { initialsFromName, type AuthUser } from '@/lib/auth'

type ProtectedLoaderData = { user: AuthUser }
type RouteSummaryMessages = {
  eyebrow: MessageDescriptor
  title: MessageDescriptor
}
const THEME_PREFERENCE_CHANGE_EVENT = 'duedatehq-theme-preference-change'

function getStoredThemePreference(): ThemePreference {
  try {
    return readStoredThemePreference(window.localStorage)
  } catch {
    return 'system'
  }
}

function getServerThemePreference(): ThemePreference {
  return 'system'
}

function subscribeToThemePreference(onStoreChange: () => void): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  function syncFromExternalChange() {
    const next = getStoredThemePreference()
    applyAndPersistTheme(next)
    onStoreChange()
  }

  media.addEventListener('change', syncFromExternalChange)
  window.addEventListener('storage', syncFromExternalChange)
  window.addEventListener(THEME_PREFERENCE_CHANGE_EVENT, syncFromExternalChange)

  return () => {
    media.removeEventListener('change', syncFromExternalChange)
    window.removeEventListener('storage', syncFromExternalChange)
    window.removeEventListener(THEME_PREFERENCE_CHANGE_EVENT, syncFromExternalChange)
  }
}

function useThemeSwitch(): {
  themePreference: ThemePreference
  switchThemePreference: (next: ThemePreference) => void
} {
  const themePreference = useSyncExternalStore(
    subscribeToThemePreference,
    getStoredThemePreference,
    getServerThemePreference,
  )

  const switchThemePreference = useCallback((next: ThemePreference) => {
    if (!isThemePreference(next)) return
    applyAndPersistTheme(next)
    window.dispatchEvent(new Event(THEME_PREFERENCE_CHANGE_EVENT))
  }, [])

  return { themePreference, switchThemePreference }
}

/**
 * `RootLayout` — protected route shell. Owns session + theme + migration
 * wizard state and hands them to the layout-level `<AppShell>` pattern.
 *
 * Performance contract:
 *  - rerender-derived-state-no-effect: `useLoaderData` is the single source
 *    of truth for `user`; we never copy it to React state.
 *  - rerender-functional-setstate: `useThemeSwitch` setters are stable.
 *  - bundle-analyzable-paths: AppShell is imported by exact path, not via a
 *    barrel module.
 */
export function RootLayout() {
  const { user } = useLoaderData<ProtectedLoaderData>()
  const { themePreference, switchThemePreference } = useThemeSwitch()

  return (
    <MigrationWizardProvider>
      {/*
        KeyboardProvider must live inside MigrationWizardProvider — it reads
        the wizard `open` state to suppress global hotkeys while the wizard
        is open. AppShell sits inside KeyboardProvider so the command-palette
        / shortcut-help dialogs the keyboard shell mounts can portal over the
        whole shell.
      */}
      <KeyboardProvider
        themePreference={themePreference}
        switchThemePreference={switchThemePreference}
      >
        <RootLayoutShell
          user={user}
          themePreference={themePreference}
          switchThemePreference={switchThemePreference}
        />
      </KeyboardProvider>
    </MigrationWizardProvider>
  )
}

function RootLayoutShell({
  user,
  themePreference,
  switchThemePreference,
}: {
  user: AuthUser
  themePreference: ThemePreference
  switchThemePreference: (next: ThemePreference) => void
}) {
  const { i18n } = useLingui()
  const location = useLocation()
  const { openWizard } = useMigrationWizard()
  const firm = useFirmSummary(user)
  const routeMessages = getRouteSummaryMessages(location.pathname)
  const route = {
    eyebrow: i18n._(routeMessages.eyebrow),
    title: i18n._(routeMessages.title),
  }

  return (
    <AppShell
      user={user}
      firm={firm}
      route={route}
      themePreference={themePreference}
      switchThemePreference={switchThemePreference}
      onImportClients={openWizard}
    />
  )
}

function getRouteSummaryMessages(pathname: string): RouteSummaryMessages {
  // `/settings` is intentionally absent — the router-level `settingsLoader`
  // redirects bare `/settings` straight to `/settings/rules`, so this layout
  // never sees that pathname.
  if (pathname === '/settings/rules') {
    return { eyebrow: msg`Settings`, title: msg`Rules` }
  }
  if (pathname.startsWith('/workboard')) {
    return { eyebrow: msg`Workbench`, title: msg`Workboard` }
  }
  return { eyebrow: msg`Operations`, title: msg`Dashboard` }
}

/**
 * v0 firm summary — Better Auth gives us `session.activeOrganizationId` but
 * not the org name without an extra fetch. Until the Settings → Firm page
 * wires the `authClient.organization.getFullOrganization()` query through
 * TanStack Query, we synthesise a humane label from the user identity so
 * the AppShell sidebar still shows something meaningful in dev / demo.
 *
 * TODO(P1): replace with `useQuery(orpc.firm.getCurrent.queryOptions())`
 * once the firm-profile contract is exposed through oRPC.
 */
function useFirmSummary(user: AuthUser): {
  name: string
  meta: string
  monogram: string
} {
  const { t } = useLingui()
  const fallbackName = user.name || t`Demo workspace`
  const monogram = initialsFromName(fallbackName).slice(0, 2).toUpperCase() || 'DD'
  return {
    name: fallbackName,
    meta: t`Owner · demo seat`,
    monogram,
  }
}

/**
 * Exported so the protected route can use it as `HydrateFallback` during the
 * initial session fetch. See `apps/app/src/router.tsx` —
 * `HydrateFallback: ShellSkeleton`.
 */
export function ShellSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-body p-6">
      <div className="flex w-full max-w-[480px] flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  )
}
