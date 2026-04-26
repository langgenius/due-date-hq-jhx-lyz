import { useCallback, useEffect, useState, useTransition } from 'react'
import { NavLink, Outlet, useLoaderData, useNavigate, useNavigation } from 'react-router'
import { toast } from 'sonner'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  BellIcon,
  CalendarClockIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  GlobeIcon,
  LayoutDashboardIcon,
  MonitorIcon,
  MoonIcon,
  LogOutIcon,
  SettingsIcon,
  SunIcon,
  UploadCloudIcon,
} from 'lucide-react'

import { Button } from '@duedatehq/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@duedatehq/ui/components/ui/dropdown-menu'
import { Separator } from '@duedatehq/ui/components/ui/separator'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import {
  applyResolvedTheme,
  readStoredThemePreference,
  resolveThemePreference,
  THEME_STORAGE_KEY,
  updateThemeColor,
  isThemePreference,
  disableThemeTransitions,
  type ThemePreference,
} from '@duedatehq/ui/theme'
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@duedatehq/i18n'
import { useLocaleSwitch } from '@/i18n/provider'
import { MigrationWizardProvider, useMigrationWizard } from '@/features/migration/WizardProvider'
import { initialsFromName, signOut, type AuthUser } from '@/lib/auth'
import { cn } from '@duedatehq/ui/lib/utils'

function useNavItems() {
  const { t } = useLingui()
  return [
    { href: '/', label: t`Dashboard`, icon: LayoutDashboardIcon, end: true },
    { href: '/workboard', label: t`Workboard`, icon: CalendarClockIcon, end: false },
    { href: '/settings', label: t`Settings`, icon: SettingsIcon, end: false },
  ]
}

function useShellMeta(): Array<[string, string]> {
  const { t } = useLingui()
  return [
    [t`Queue SLA`, '04h 12m'],
    [t`Local Time`, 'America/New_York'],
  ]
}

type ProtectedLoaderData = { user: AuthUser }

function getStoredThemePreference(): ThemePreference {
  try {
    return readStoredThemePreference(window.localStorage)
  } catch {
    return 'system'
  }
}

function getPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyThemePreference(preference: ThemePreference): void {
  const resolvedTheme = resolveThemePreference(preference, getPrefersDark())
  const enableTransitions = disableThemeTransitions()

  applyResolvedTheme(document.documentElement, resolvedTheme)
  updateThemeColor(document, resolvedTheme)
  enableTransitions()
}

function useThemeSwitch(): {
  themePreference: ThemePreference
  switchThemePreference: (next: ThemePreference) => void
} {
  const [themePreference, setThemePreference] = useState(getStoredThemePreference)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function syncThemePreference() {
      const next = getStoredThemePreference()

      setThemePreference(next)
      applyThemePreference(next)
    }

    media.addEventListener('change', syncThemePreference)
    window.addEventListener('storage', syncThemePreference)

    return () => {
      media.removeEventListener('change', syncThemePreference)
      window.removeEventListener('storage', syncThemePreference)
    }
  }, [])

  const switchThemePreference = useCallback((next: ThemePreference) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {}

    setThemePreference(next)
    applyThemePreference(next)
  }, [])

  return { themePreference, switchThemePreference }
}

function PendingBar() {
  const navigation = useNavigation()
  const isPending = navigation.state !== 'idle'

  return (
    <div className="h-1 w-full bg-bg-subtle">
      {isPending ? <div className="h-full w-1/3 bg-accent-default" /> : null}
    </div>
  )
}

function SideNav() {
  const { t } = useLingui()
  const navItems = useNavItems()
  return (
    <nav aria-label={t`Primary navigation`} className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon

        return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex h-9 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
              )
            }
          >
            <Icon data-icon="inline-start" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

function MobileNav() {
  const { t } = useLingui()
  const navItems = useNavItems()
  return (
    <nav aria-label={t`Mobile navigation`} className="flex gap-1 overflow-x-auto md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex h-8 shrink-0 items-center rounded-md px-2.5 text-sm font-medium text-text-secondary hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-accent text-accent-foreground',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function LocaleMenuItems({
  currentLocale,
  onSelect,
}: {
  currentLocale: Locale
  onSelect: (next: Locale) => void
}) {
  return (
    <>
      {SUPPORTED_LOCALES.map((code) => (
        <DropdownMenuItem
          key={code}
          onClick={() => onSelect(code)}
          aria-checked={currentLocale === code}
          className="flex items-center justify-between"
        >
          <span>{LOCALE_LABELS[code]}</span>
          {currentLocale === code ? <CheckIcon className="size-4" aria-hidden /> : null}
        </DropdownMenuItem>
      ))}
    </>
  )
}

function ThemeMenuItems({
  currentTheme,
  onSelect,
}: {
  currentTheme: ThemePreference
  onSelect: (next: ThemePreference) => void
}) {
  const { t } = useLingui()
  const items = [
    { value: 'system', label: t`System`, icon: MonitorIcon },
    { value: 'light', label: t`Light`, icon: SunIcon },
    { value: 'dark', label: t`Dark`, icon: MoonIcon },
  ] satisfies Array<{ value: ThemePreference; label: string; icon: typeof MonitorIcon }>

  return (
    <DropdownMenuRadioGroup
      value={currentTheme}
      onValueChange={(next) => {
        if (isThemePreference(next)) {
          onSelect(next)
        }
      }}
    >
      {items.map((item) => {
        const Icon = item.icon

        return (
          <DropdownMenuRadioItem key={item.value} value={item.value}>
            <Icon />
            <span>{item.label}</span>
          </DropdownMenuRadioItem>
        )
      })}
    </DropdownMenuRadioGroup>
  )
}

function UserAvatar({ user, className }: { user: AuthUser; className?: string }) {
  if (user.image) {
    return (
      <img
        src={user.image}
        alt=""
        className={cn('size-8 shrink-0 rounded-full object-cover', className)}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary',
        className,
      )}
    >
      {initialsFromName(user.name || user.email)}
    </span>
  )
}

function UserMenu({
  user,
  themePreference,
  switchThemePreference,
  variant = 'panel',
}: {
  user: AuthUser
  themePreference: ThemePreference
  switchThemePreference: (next: ThemePreference) => void
  variant?: 'panel' | 'compact'
}) {
  const navigate = useNavigate()
  const { t } = useLingui()
  const { locale, switchLocale } = useLocaleSwitch()
  // React 19 async transition: isPending stays true until the async body settles,
  // so we don't need a separate useState flag.
  const [isSigningOut, startSignOut] = useTransition()

  function handleSignOut() {
    if (isSigningOut) return
    startSignOut(async () => {
      try {
        await signOut()
        // After signOut the protected layout's loader won't re-run (we're
        // navigating away), and nothing in the protected tree subscribes to
        // the session store anymore — so no flicker mid-navigation.
        await navigate('/login', { replace: true })
      } catch (err) {
        toast.error(t`Sign out failed`, {
          description: err instanceof Error ? err.message : t`Please try again.`,
        })
      }
    })
  }

  const displayName = user.name || t`Signed in`
  const accountLabel = t`Account menu for ${user.name || user.email}`
  const signOutLabel = isSigningOut ? t`Signing out…` : t`Sign out`

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={accountLabel}
              className="inline-flex size-9 items-center justify-center rounded-full outline-none ring-1 ring-border-default transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            />
          }
        >
          <UserAvatar user={user} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5 text-left">
              <span className="text-sm font-medium text-text-primary">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <GlobeIcon />
              <span>
                <Trans>Language</Trans>
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              <LocaleMenuItems currentLocale={locale} onSelect={switchLocale} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <MonitorIcon />
              <span>
                <Trans>Theme</Trans>
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              <ThemeMenuItems currentTheme={themePreference} onSelect={switchThemePreference} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut} disabled={isSigningOut}>
            <LogOutIcon />
            <span>{signOutLabel}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="group/user-menu flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-background p-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <UserAvatar user={user} />
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-sm font-medium text-text-primary">{displayName}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </div>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 text-left">
            <span className="text-sm font-medium text-text-primary">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <GlobeIcon />
            <span>
              <Trans>Language</Trans>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <LocaleMenuItems currentLocale={locale} onSelect={switchLocale} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MonitorIcon />
            <span>
              <Trans>Theme</Trans>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <ThemeMenuItems currentTheme={themePreference} onSelect={switchThemePreference} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut} disabled={isSigningOut}>
          <LogOutIcon />
          <span>{signOutLabel}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Exported so the protected route can use it as HydrateFallback during the
// initial session fetch (see router.tsx).
export function ShellSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas p-6">
      <div className="flex w-full max-w-[480px] flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-40 w-full rounded-md" />
      </div>
    </div>
  )
}

function HeaderActions({
  user,
  themePreference,
  switchThemePreference,
}: {
  user: AuthUser
  themePreference: ThemePreference
  switchThemePreference: (next: ThemePreference) => void
}) {
  const { openWizard } = useMigrationWizard()

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <BellIcon data-icon="inline-start" />
        <Trans>Pulse</Trans>
      </Button>
      <Button size="sm" onClick={openWizard}>
        <UploadCloudIcon data-icon="inline-start" />
        <Trans>Import clients</Trans>
      </Button>
      <UserMenu
        user={user}
        themePreference={themePreference}
        switchThemePreference={switchThemePreference}
        variant="compact"
      />
    </div>
  )
}

export function RootLayout() {
  // User is guaranteed to exist here — the protected loader already redirected
  // to /login otherwise, so there's no isPending / null branch to render.
  const { user } = useLoaderData<ProtectedLoaderData>()
  const shellMeta = useShellMeta()
  const { themePreference, switchThemePreference } = useThemeSwitch()

  return (
    <MigrationWizardProvider>
      <RootLayoutShell
        user={user}
        shellMeta={shellMeta}
        themePreference={themePreference}
        switchThemePreference={switchThemePreference}
      />
    </MigrationWizardProvider>
  )
}

function RootLayoutShell({
  user,
  shellMeta,
  themePreference,
  switchThemePreference,
}: {
  user: AuthUser
  shellMeta: Array<[string, string]>
  themePreference: ThemePreference
  switchThemePreference: (next: ThemePreference) => void
}) {
  return (
    <div className="isolate min-h-screen bg-bg-canvas text-text-primary">
      <PendingBar />
      <div className="flex min-h-[calc(100vh-4px)]">
        <aside className="hidden w-[220px] shrink-0 border-r border-border-default bg-sidebar md:flex md:flex-col">
          <div className="flex h-14 items-center px-4">
            <div className="flex flex-col">
              <span className="text-base font-medium text-sidebar-accent-foreground">
                DueDateHQ
              </span>
              <span className="text-xs text-muted-foreground">
                <Trans>CPA deadline console</Trans>
              </span>
            </div>
          </div>
          <Separator />
          <div className="flex flex-1 flex-col gap-6 p-3">
            <SideNav />
            <div className="mt-auto flex flex-col gap-3">
              <div className="flex flex-col gap-3 rounded-md border border-sidebar-border bg-background p-3">
                {shellMeta.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="font-mono text-xs tabular-nums text-text-primary">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <UserMenu
                user={user}
                themePreference={themePreference}
                switchThemePreference={switchThemePreference}
              />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-14 flex-col gap-3 border-b border-border-default bg-background px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                <Trans>Phase 0 demo practice</Trans>
              </span>
              <span className="truncate text-base font-medium">
                <Trans>Compliance risk operations</Trans>
              </span>
            </div>
            <HeaderActions
              user={user}
              themePreference={themePreference}
              switchThemePreference={switchThemePreference}
            />
            <MobileNav />
          </header>
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
