import { useCallback, useMemo, useTransition } from 'react'
import { NavLink, Outlet, useNavigate, useNavigation } from 'react-router'
import { toast } from 'sonner'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  BellIcon,
  CalendarClockIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  GlobeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PanelLeftIcon,
  PlusIcon,
  ScaleIcon,
  SettingsIcon,
  SunIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@duedatehq/ui/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@duedatehq/ui/components/ui/sidebar'
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

/**
 * AppShell — layout-level shell shared by every protected layout.
 *
 * Composes self-built sidebar primitives from `@duedatehq/ui` (intentionally
 * NOT shadcn `Sidebar`; see `docs/dev-log/2026-04-27-app-shell-sidebar.md`)
 * plus the existing dropdown / sheet / theme primitives.
 *
 * Performance contract (vercel-react-best-practices):
 *  - rerender-no-inline-components: every helper component is module-level.
 *  - rerender-derived-state-no-effect: active-nav state is derived from URL
 *    via react-router `<NavLink>` — no React state, no effect.
 *  - rerender-functional-setstate: mobile sheet uses `setOpen(o => !o)`.
 *  - rerender-memo-with-default-value: `useNavItems` memoises the array so
 *    AppShell re-renders don't break referential equality of children.
 *  - bundle-analyzable-paths: no barrel; primitives imported by exact path.
 *  - advanced-init-once: `SidebarProvider` value/toggle are memoised inside.
 */

type FirmSummary = {
  /** Display name shown in the sidebar header (e.g. "Caldwell & Co."). */
  name: string
  /** Short role + seat hint shown under the name (e.g. "Owner · 7 members"). */
  meta: string
  /** Two-letter monogram rendered inside the navy avatar tile. */
  monogram: string
}

type RouteSummary = {
  eyebrow: string
  title: string
}

export type AppShellProps = {
  user: AuthUser
  firm: FirmSummary
  route: RouteSummary
  themePreference: ThemePreference
  switchThemePreference: (next: ThemePreference) => void
  onImportClients: () => void
  unreadNotificationCount?: number
}

export function AppShell(props: AppShellProps) {
  return (
    <SidebarProvider>
      {/*
        Layout invariant: the outer flex row is exactly viewport-height and
        clips overflow, so the sidebar stays pinned while only `<main>` (the
        route's content) scrolls. Setting `h-svh` on the row + `overflow-hidden`
        is the simplest path that doesn't require `position: sticky` games on
        the sidebar — and it keeps the bottom CTA / user row always visible.
      */}
      <div className="relative isolate flex h-svh w-full overflow-hidden bg-background-body text-text-primary">
        <PendingBar />
        <Sidebar>
          <FirmSwitcherTrigger firm={props.firm} />
          {/*
            Sibling 1px rib — identical technique to the rib below the route
            header (see SidebarInset), so both ribs sit at exactly y =
            header_h. No `border-b` mixing.
          */}
          <SidebarSeparator />
          <SidebarContent>
            <NavGroups />
          </SidebarContent>
          <SidebarFooter>
            <ImportClientsCTA onClick={props.onImportClients} />
            <SidebarSeparator />
            <UserMenuTrigger
              user={props.user}
              themePreference={props.themePreference}
              switchThemePreference={props.switchThemePreference}
            />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <RouteHeader
            eyebrow={props.route.eyebrow}
            title={props.route.title}
            unreadNotificationCount={props.unreadNotificationCount ?? 0}
          />
          {/*
            The sibling 1px hairline (instead of `border-b` on `<header>`)
            puts the route-header rib at the same Y as the sidebar's
            FirmSwitcher hairline (both at `h_header + 0`), avoiding the
            1px collinearity drift caused by mixing `strokeAlign:'INSIDE'`
            with sibling rectangles.
          */}
          <div className="h-px shrink-0 bg-divider-regular" aria-hidden />
          <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// -----------------------------------------------------------------------------
// PendingBar — 2px route-loading indicator (reads navigation.state)
// -----------------------------------------------------------------------------

function PendingBar() {
  const navigation = useNavigation()
  const isPending = navigation.state !== 'idle'

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-x-0 top-0 z-50 h-0.5 bg-divider-subtle')}
    >
      <div
        className={cn(
          // Animate transform only (compositor-friendly) and disable the
          // animation under prefers-reduced-motion.
          'h-full origin-left bg-state-accent-solid transition-transform duration-300 ease-out motion-reduce:transition-none',
          isPending ? 'scale-x-100' : 'scale-x-0',
        )}
      />
    </div>
  )
}

// -----------------------------------------------------------------------------
// Firm switcher (sidebar header) — Slack/Linear-style trigger.
//
// PRD §3.2.6 originally specified a top-right dropdown; we deviate per the
// dev-log decision: the visible trigger lives at the sidebar top, ⌘⇧O is
// preserved as the global shortcut. v0 wires keyboard + popover later — for
// now this is a static visual trigger with the firm summary.
// -----------------------------------------------------------------------------

function FirmSwitcherTrigger({ firm }: { firm: FirmSummary }) {
  const { t } = useLingui()
  return (
    <SidebarHeader>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={t`Switch firm — current ${firm.name}`}
              // TODO(P1): bind ⌘⇧O global hotkey + populate `Workspaces`
              // group via `authClient.organization.list()`. v0 always renders
              // the current-firm row so single-firm users still get an
              // affordance that proves the switcher is the right gesture.
              className="flex h-14 w-full cursor-pointer touch-manipulation items-center gap-2.5 px-3 text-left outline-none transition-colors hover:bg-background-default-hover focus-visible:bg-background-default-hover focus-visible:ring-2 focus-visible:ring-state-accent-active-alt"
            />
          }
        >
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-primary text-xs font-semibold text-text-inverted"
            translate="no"
          >
            {firm.monogram}
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-text-primary" translate="no">
              {firm.name}
            </span>
            <span className="truncate text-xs text-text-muted">{firm.meta}</span>
          </span>
          <ChevronsUpDownIcon className="size-3 shrink-0 text-text-muted" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" sideOffset={6} className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-left">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-text-tertiary">
                <Trans>Workspaces</Trans>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuItem aria-checked={true} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="grid size-5 shrink-0 place-items-center rounded-sm bg-brand-primary text-[10px] font-semibold text-text-inverted"
                  translate="no"
                >
                  {firm.monogram}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-text-primary" translate="no">
                    {firm.name}
                  </span>
                  <span className="text-xs text-text-tertiary">{firm.meta}</span>
                </span>
              </span>
              <CheckIcon className="size-4 shrink-0 text-text-accent" aria-hidden />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {/* Future: organization.list() rows + "+ Create firm" entry. P1. */}
            <DropdownMenuItem disabled>
              <PlusIcon />
              <span>
                <Trans>Add firm</Trans>
              </span>
              <span className="ml-auto text-xs text-text-tertiary">
                <Trans>P1</Trans>
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarHeader>
  )
}

// -----------------------------------------------------------------------------
// Nav groups — MAIN / MANAGE / ADMIN · P1
// -----------------------------------------------------------------------------

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: string
  tag?: string
}

type NavConfig = {
  main: NavItem[]
  manage: NavItem[]
  admin: NavItem[]
}

function useNavItems(): NavConfig {
  const { t } = useLingui()
  return useMemo<NavConfig>(
    () => ({
      main: [
        { href: '/', label: t`Dashboard`, icon: LayoutDashboardIcon, end: true, badge: '12' },
        {
          href: '/workboard',
          label: t`Workboard`,
          icon: CalendarClockIcon,
          end: false,
          badge: '34',
        },
      ],
      manage: [{ href: '/settings', label: t`Settings`, icon: SettingsIcon, end: false }],
      admin: [
        { href: '/clients', label: t`Clients`, icon: UsersIcon, end: false, tag: 'P1' },
        { href: '/audit', label: t`Audit log`, icon: ScaleIcon, end: false, tag: 'P1' },
        {
          href: '/workload',
          label: t`Team workload`,
          icon: ClipboardListIcon,
          end: false,
          tag: 'P1',
        },
      ],
    }),
    [t],
  )
}

function NavGroups() {
  const { t } = useLingui()
  const items = useNavItems()
  return (
    <nav aria-label={t`Primary navigation`} className="contents">
      <NavGroupSection label={t`Main`}>
        {items.main.map((item) => (
          <NavMenuItem key={item.href} item={item} />
        ))}
      </NavGroupSection>
      <NavGroupSection label={t`Manage`}>
        {items.manage.map((item) => (
          <NavMenuItem key={item.href} item={item} />
        ))}
      </NavGroupSection>
      <NavGroupSection label={t`Admin · P1`} muted>
        {items.admin.map((item) => (
          <NavMenuItem key={item.href} item={item} disabled />
        ))}
      </NavGroupSection>
    </nav>
  )
}

function NavGroupSection({
  label,
  muted = false,
  children,
}: {
  label: string
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <SidebarGroup className={muted ? 'opacity-55' : undefined}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function NavMenuItem({ item, disabled = false }: { item: NavItem; disabled?: boolean }) {
  const Icon = item.icon
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        // <NavLink> writes `aria-current="page"` automatically when its `to`
        // matches the current URL. The cva for `SidebarMenuButton` already
        // keys active styling off `aria-[current=page]:`, so we don't need to
        // manage `isActive` in React state (rerender-derived-state-no-effect).
        render={
          <NavLink
            to={item.href}
            end={item.end ?? false}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
          />
        }
        className={cn(disabled && 'pointer-events-none')}
      >
        <Icon aria-hidden />
        <span>{item.label}</span>
        {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
        {item.tag ? (
          <span className="ml-auto font-mono text-xs tabular-nums text-text-muted">{item.tag}</span>
        ) : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// -----------------------------------------------------------------------------
// + Import clients ghost CTA — DESIGN §4.9 + PRD §1213 (sidebar bottom)
// -----------------------------------------------------------------------------

function ImportClientsCTA({ onClick }: { onClick: () => void }) {
  return (
    <div className="px-2 py-2">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          // Geometry mirrors Figma 158:3 exactly: gap-2 (8px), 14px icon,
          // px-3, h-8 — leaves enough horizontal space inside 220px sidebar
          // for both the "Import clients" label and the right-aligned
          // "Migration" route hint without wrapping.
          'flex h-8 w-full cursor-pointer touch-manipulation items-center gap-2 rounded-md bg-background-section px-3 text-base font-medium whitespace-nowrap text-text-primary outline-none transition-colors',
          'hover:bg-background-default-hover focus-visible:ring-2 focus-visible:ring-state-accent-active-alt',
        )}
      >
        <PlusIcon className="size-3.5 shrink-0 text-text-secondary" aria-hidden />
        <span>
          <Trans>Import clients</Trans>
        </span>
        <span className="ml-auto font-mono text-xs tabular-nums text-text-muted">
          <Trans>Migration</Trans>
        </span>
      </button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// User menu — sidebar footer trigger + dropdown
// -----------------------------------------------------------------------------

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
  // React 19 async transition — `isPending` stays true until the async body
  // settles, so we don't need a separate useState flag.
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

// -----------------------------------------------------------------------------
// Route header — eyebrow + title (left) + AppShell-owned utility (right)
// -----------------------------------------------------------------------------

// `\u2318` (⌘) + narrow no-break space + `K`. Hoisted to module scope so it
// is allocated once and stays referentially stable across renders
// (`rerender-memo-with-default-value`).
const KBD_CMDK = '\u2318\u202fK'

function RouteHeader({
  eyebrow,
  title,
  unreadNotificationCount,
}: {
  eyebrow: string
  title: string
  unreadNotificationCount: number
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 bg-background-default px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger>
          <PanelLeftIcon className="size-4" aria-hidden />
        </SidebarTrigger>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-mono text-xs tabular-nums text-text-muted">{eyebrow}</span>
          <span className="truncate text-sm font-semibold text-text-primary">{title}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {/*
          Mirrors Figma 159:2 exactly: 28×22 frame, no border, fill
          `surface/subtle`, text style `Numeric / Small` (Geist Mono Medium
          11/16) at `text/muted`. The narrow-no-break-space (`\u202f`) keeps
          modifier+key glued without a visible spacing gap.
        */}
        <kbd className="hidden h-[22px] items-center rounded-sm bg-background-subtle px-1.5 font-mono text-xs font-medium tabular-nums text-text-muted md:inline-flex">
          {KBD_CMDK}
        </kbd>
        <NotificationsBell unreadCount={unreadNotificationCount} />
      </div>
    </header>
  )
}

function NotificationsBell({ unreadCount }: { unreadCount: number }) {
  const { t } = useLingui()
  const hasUnread = unreadCount > 0
  return (
    <button
      type="button"
      // TODO(P1): wire to inbox query; for v0 this is a static utility chrome.
      aria-label={hasUnread ? t`Notifications, ${unreadCount} unread` : t`Notifications`}
      className={cn(
        'relative inline-flex size-7 cursor-pointer touch-manipulation items-center justify-center rounded-md border border-divider-regular bg-background-default text-text-secondary outline-none transition-colors',
        'hover:bg-background-default-hover hover:text-text-primary',
        'focus-visible:ring-2 focus-visible:ring-state-accent-active-alt',
      )}
    >
      <BellIcon className="size-4" aria-hidden />
      {hasUnread ? (
        <span
          aria-hidden
          className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-state-destructive-solid"
        />
      ) : null}
    </button>
  )
}
