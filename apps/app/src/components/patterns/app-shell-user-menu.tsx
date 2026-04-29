import { useCallback, useTransition } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  GlobeIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  UserRoundIcon,
  SunIcon,
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
  const { t } = useLingui()
  const { locale, switchLocale } = useLocaleSwitch()
  const [isSigningOut, startSignOut] = useTransition()

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
        <DropdownMenuItem onClick={() => void navigate('/settings/profile')}>
          <UserRoundIcon />
          <span>
            <Trans>Profile</Trans>
          </span>
        </DropdownMenuItem>
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
