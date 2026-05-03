import { useCallback, useTransition } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trans, useLingui } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import type { I18n } from '@lingui/core'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  GlobeIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'

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
import { isThemePreference, type ThemePreference } from '@duedatehq/ui/theme'
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@duedatehq/i18n'
import { useLocaleSwitch } from '@/i18n/provider'
import { initialsFromName, signOut, type AuthUser } from '@/lib/auth'
import { cn } from '@duedatehq/ui/lib/utils'

type DemoRole = 'owner' | 'manager' | 'preparer' | 'coordinator'

type DemoAccount = {
  userId: string
  name: string
  email: string
  role: DemoRole
}

type DemoAccountsResponse = {
  accounts: DemoAccount[]
}

const DEMO_ACCOUNTS_QUERY_KEY = ['e2e', 'demo-accounts'] as const

function isDemoRole(value: unknown): value is DemoRole {
  return value === 'owner' || value === 'manager' || value === 'preparer' || value === 'coordinator'
}

function isDemoAccount(value: unknown): value is DemoAccount {
  if (!value || typeof value !== 'object') return false
  const input = value as Partial<Record<keyof DemoAccount, unknown>>
  return (
    typeof input.userId === 'string' &&
    typeof input.name === 'string' &&
    typeof input.email === 'string' &&
    isDemoRole(input.role)
  )
}

function parseDemoAccountsResponse(value: unknown): DemoAccountsResponse {
  if (!value || typeof value !== 'object' || !('accounts' in value)) {
    return { accounts: [] }
  }
  const accounts = Reflect.get(value, 'accounts')
  return {
    accounts: Array.isArray(accounts) ? accounts.filter(isDemoAccount) : [],
  }
}

async function fetchDemoAccounts(): Promise<DemoAccountsResponse> {
  const response = await fetch('/api/e2e/demo-accounts', { credentials: 'include' })
  if (!response.ok) return { accounts: [] }
  return parseDemoAccountsResponse(await response.json())
}

export function isDemoUser(user: Pick<AuthUser, 'id'> | null | undefined): boolean {
  return typeof user?.id === 'string' && user.id.startsWith('mock_user_')
}

export function currentPathForDemoSwitch(input: {
  pathname: string
  search: string
  hash: string
}): string {
  return `${input.pathname || '/'}${input.search}${input.hash}`
}

export function demoAccountSwitchHref(role: DemoRole, redirectTo: string): string {
  const params = new URLSearchParams({
    role,
    redirectTo: redirectTo || '/',
  })
  return `/api/e2e/demo-login?${params.toString()}`
}

const DEMO_ROLE_LABELS = {
  owner: msg`Owner`,
  manager: msg`Manager`,
  preparer: msg`Preparer`,
  coordinator: msg`Coordinator`,
} as const

function demoRoleLabel(role: DemoRole, i18n: I18n): string {
  return i18n._(DEMO_ROLE_LABELS[role])
}

function UserMenuTrigger({
  user,
  themePreference,
  switchThemePreference,
}: {
  user: AuthUser
  themePreference: ThemePreference
  switchThemePreference: (next: ThemePreference) => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLingui()
  const { locale, switchLocale } = useLocaleSwitch()
  const [isSigningOut, startSignOut] = useTransition()
  const demoEnabled = isDemoUser(user)
  const demoAccountsQuery = useQuery({
    queryKey: DEMO_ACCOUNTS_QUERY_KEY,
    queryFn: fetchDemoAccounts,
    enabled: demoEnabled,
    staleTime: 60_000,
    retry: false,
  })

  const handleSignOut = useCallback(() => {
    if (isSigningOut) return
    startSignOut(async () => {
      try {
        await signOut()
        await navigate('/login', { replace: true })
      } catch (err) {
        toast.error(t`Sign out failed`, {
          description: err instanceof Error ? err.message : t`Please try again.`,
        })
      }
    })
  }, [isSigningOut, navigate, t])

  const displayName = user.name || t`Signed in`
  const accountLabel = t`Account menu for ${user.name || user.email}`
  const signOutLabel = isSigningOut ? t`Signing out…` : t`Sign out`
  const demoAccounts = demoAccountsQuery.data?.accounts ?? []
  const showDemoSwitcher = demoEnabled && demoAccounts.length > 0
  const currentPath = currentPathForDemoSwitch(location)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={accountLabel}
            className={cn(
              'group/user flex h-14 w-full cursor-pointer touch-manipulation items-center gap-2.5 px-3 text-left outline-none transition-colors',
              'hover:bg-background-default-hover focus-visible:bg-background-default-hover focus-visible:ring-2 focus-visible:ring-state-accent-active-alt',
            )}
          />
        }
      >
        <UserAvatarWithStatus user={user} />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-sm font-medium text-text-primary">{displayName}</span>
          <span className="truncate font-mono text-xs tabular-nums text-text-muted">
            {user.email}
          </span>
        </span>
        <ChevronsUpDownIcon className="size-3 shrink-0 text-text-muted" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 text-left">
            <span className="text-sm font-medium text-text-primary">{displayName}</span>
            <span className="truncate text-xs text-text-tertiary">{user.email}</span>
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
        {showDemoSwitcher ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UsersIcon />
              <span>
                <Trans>Demo account</Trans>
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              <DemoAccountMenuItems
                accounts={demoAccounts}
                currentUserId={user.id}
                currentPath={currentPath}
              />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
        <DropdownMenuItem onClick={() => void navigate('/account/security')}>
          <ShieldCheckIcon />
          <span>
            <Trans>Security</Trans>
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut} disabled={isSigningOut}>
          <LogOutIcon />
          <span>{signOutLabel}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DemoAccountMenuItems({
  accounts,
  currentUserId,
  currentPath,
}: {
  accounts: DemoAccount[]
  currentUserId: string
  currentPath: string
}) {
  const { i18n, t } = useLingui()

  return (
    <>
      {accounts.map((account) => {
        const selected = account.userId === currentUserId
        return (
          <DropdownMenuItem
            key={account.userId}
            aria-checked={selected}
            className="flex items-center justify-between gap-3"
            render={
              <a
                href={demoAccountSwitchHref(account.role, currentPath)}
                aria-label={t`Switch demo account to ${account.name}`}
              />
            }
          >
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-text-primary">{account.name}</span>
              <span className="truncate text-xs text-text-tertiary">
                {demoRoleLabel(account.role, i18n)} · {account.email}
              </span>
            </span>
            {selected ? (
              <CheckIcon className="size-4 shrink-0 text-text-accent" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        )
      })}
    </>
  )
}

function UserAvatarWithStatus({ user }: { user: AuthUser }) {
  const initials = initialsFromName(user.name || user.email)

  return (
    <span aria-hidden className="relative inline-block size-7 shrink-0">
      {user.image ? (
        <img
          src={user.image}
          alt=""
          referrerPolicy="no-referrer"
          className="size-7 rounded-full object-cover"
        />
      ) : (
        <span className="grid size-7 place-items-center rounded-full bg-state-accent-hover-alt text-sm font-semibold text-text-accent">
          {initials}
        </span>
      )}
      <span className="absolute -right-0.5 -bottom-0.5 grid size-2.5 place-items-center rounded-full bg-components-panel-bg">
        <span className="size-1.5 rounded-full bg-state-success-solid" />
      </span>
    </span>
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
  const items: Array<{ value: ThemePreference; label: string; icon: LucideIcon }> = [
    { value: 'system', label: t`System`, icon: MonitorIcon },
    { value: 'light', label: t`Light`, icon: SunIcon },
    { value: 'dark', label: t`Dark`, icon: MoonIcon },
  ]

  return (
    <DropdownMenuRadioGroup
      value={currentTheme}
      onValueChange={(next) => {
        if (isThemePreference(next)) onSelect(next)
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

export { UserMenuTrigger }
