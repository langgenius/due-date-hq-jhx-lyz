import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  Building2Icon,
  CalendarClockIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  CreditCardIcon,
  FileCheck2Icon,
  LayoutDashboardIcon,
  RadioTowerIcon,
  ScaleIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import type { FirmPublic } from '@duedatehq/contracts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@duedatehq/ui/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@duedatehq/ui/components/ui/sidebar'
import { cn } from '@duedatehq/ui/lib/utils'
import { initialsFromName } from '@/lib/auth'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'
import { usePulseListAlertsQueryOptions } from '@/features/pulse/api'
import { FIRM_SWITCHER_HOTKEY } from '@/components/patterns/keyboard-shell/display'
import {
  useAppHotkey,
  useKeyboardShortcutsBlocked,
} from '@/components/patterns/keyboard-shell/hooks'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: string
  tag?: string
  disabledReason?: string
}

type NavConfig = {
  operations: NavItem[]
  clients: NavItem[]
  organization: NavItem[]
}

function firmMonogram(name: string): string {
  return initialsFromName(name).slice(0, 2).toUpperCase() || 'DD'
}

function roleLabel(role: FirmPublic['role'], t: ReturnType<typeof useLingui>['t']): string {
  if (role === 'owner') return t`Owner`
  if (role === 'manager') return t`Manager`
  if (role === 'preparer') return t`Preparer`
  return t`Coordinator`
}

function planLabel(plan: FirmPublic['plan'], t: ReturnType<typeof useLingui>['t']): string {
  if (plan === 'firm') return t`Scale`
  if (plan === 'pro') return t`Pro`
  return t`Solo`
}

function firmMeta(firm: FirmPublic, t: ReturnType<typeof useLingui>['t']): string {
  const role = roleLabel(firm.role, t)
  const plan = planLabel(firm.plan, t)
  return firm.seatLimit === 1
    ? t`${role} · ${plan} · ${firm.seatLimit} seat`
    : t`${role} · ${plan} · ${firm.seatLimit} seats`
}

function FirmSwitcherTrigger({ firm, firms }: { firm: FirmPublic; firms: FirmPublic[] }) {
  if (firms.length <= 1) return <StaticPracticeIdentity firm={firm} />
  return <PracticeSwitcher firm={firm} firms={firms} />
}

function StaticPracticeIdentity({ firm }: { firm: FirmPublic }) {
  const { t } = useLingui()
  const currentMonogram = firmMonogram(firm.name)
  const currentMeta = firmMeta(firm, t)

  return (
    <SidebarHeader>
      <div className="flex h-14 w-full items-center gap-2.5 px-3 text-left">
        <span
          aria-hidden
          className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-primary text-xs font-semibold text-text-inverted"
          translate="no"
        >
          {currentMonogram}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-sm font-medium text-text-primary" translate="no">
            {firm.name}
          </span>
          <span className="truncate text-xs text-text-muted">{currentMeta}</span>
        </span>
      </div>
    </SidebarHeader>
  )
}

function PracticeSwitcher({ firm, firms }: { firm: FirmPublic; firms: FirmPublic[] }) {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const shortcutsBlocked = useKeyboardShortcutsBlocked()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switchMutation = useMutation(
    orpc.firms.switchActive.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries()
      },
      onError: (err) => {
        toast.error(t`Could not switch practice.`, {
          description: rpcErrorMessage(err) ?? t`Please try again.`,
        })
      },
    }),
  )
  const currentMonogram = firmMonogram(firm.name)
  const currentMeta = firmMeta(firm, t)

  const handleSwitch = useCallback(
    (firmId: string) => {
      if (firmId === firm.id || switchMutation.isPending) return
      switchMutation.mutate({ firmId })
    },
    [firm.id, switchMutation],
  )

  useAppHotkey(FIRM_SWITCHER_HOTKEY, () => setSwitcherOpen(true), {
    enabled: !shortcutsBlocked,
    requireReset: true,
    meta: {
      id: 'firm.switch',
      name: 'Switch practice',
      description: 'Open the practice switcher.',
      category: 'global',
      scope: 'global',
    },
  })

  return (
    <SidebarHeader>
      <DropdownMenu open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={t`Switch practice, current ${firm.name}`}
              aria-keyshortcuts="Meta+Shift+O Control+Shift+O"
              className="flex h-14 w-full cursor-pointer touch-manipulation items-center gap-2.5 px-3 text-left outline-none transition-colors hover:bg-background-default-hover focus-visible:bg-background-default-hover focus-visible:ring-2 focus-visible:ring-state-accent-active-alt"
            />
          }
        >
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-primary text-xs font-semibold text-text-inverted"
            translate="no"
          >
            {currentMonogram}
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-text-primary" translate="no">
              {firm.name}
            </span>
            <span className="truncate text-xs text-text-muted">{currentMeta}</span>
          </span>
          <ChevronsUpDownIcon className="size-3 shrink-0 text-text-muted" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" sideOffset={6} className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-left">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-text-tertiary">
                <Trans>Practices</Trans>
              </span>
            </DropdownMenuLabel>
            {firms.map((item) => {
              const selected = item.id === firm.id
              return (
                <DropdownMenuItem
                  key={item.id}
                  aria-checked={selected}
                  className="flex items-center justify-between"
                  onClick={() => handleSwitch(item.id)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="grid size-5 shrink-0 place-items-center rounded-sm bg-brand-primary text-[10px] font-semibold text-text-inverted"
                      translate="no"
                    >
                      {firmMonogram(item.name)}
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span
                        className="truncate text-sm font-medium text-text-primary"
                        translate="no"
                      >
                        {item.name}
                      </span>
                      <span className="truncate text-xs text-text-tertiary">
                        {firmMeta(item, t)}
                      </span>
                    </span>
                  </span>
                  {selected ? (
                    <CheckIcon className="size-4 shrink-0 text-text-accent" aria-hidden />
                  ) : null}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarHeader>
  )
}

function usePulseAlertCount(): number {
  // Surface the real Pulse alert count next to the nav entry. Uses the
  // shared cache primed by the dashboard banner so we don't double-fetch.
  const query = useQuery(usePulseListAlertsQueryOptions(5))
  return query.data?.alerts.length ?? 0
}

function useNavItems(firm: FirmPublic): NavConfig {
  const { t } = useLingui()
  const pulseCount = usePulseAlertCount()
  const pulseBadge = pulseCount > 0 ? String(pulseCount) : undefined
  const workloadPaid = firm.plan === 'firm' || firm.plan === 'pro'
  return useMemo<NavConfig>(
    () => ({
      operations: [
        { href: '/', label: t`Dashboard`, icon: LayoutDashboardIcon, end: true },
        {
          href: '/workboard',
          label: t`Workboard`,
          icon: CalendarClockIcon,
          end: false,
        },
        {
          href: '/alerts',
          label: t`Alerts`,
          icon: RadioTowerIcon,
          end: false,
          ...(pulseBadge !== undefined ? { badge: pulseBadge } : {}),
        },
        {
          href: '/workload',
          label: t`Team workload`,
          icon: ClipboardListIcon,
          end: false,
          ...(workloadPaid
            ? {}
            : {
                tag: t`Pro`,
                disabledReason: t`Team workload is available on Pro and Scale plans.`,
              }),
        },
      ],
      clients: [{ href: '/clients', label: t`Clients`, icon: UsersIcon, end: false }],
      organization: [
        { href: '/firm', label: t`Practice profile`, icon: Building2Icon, end: false },
        { href: '/rules', label: t`Rules`, icon: FileCheck2Icon, end: false },
        { href: '/members', label: t`Members`, icon: UsersIcon, end: false },
        { href: '/billing', label: t`Billing`, icon: CreditCardIcon, end: false },
        { href: '/audit', label: t`Audit log`, icon: ScaleIcon, end: false },
      ],
    }),
    [t, pulseBadge, workloadPaid],
  )
}

function NavGroups({ firm }: { firm: FirmPublic }) {
  const { t } = useLingui()
  const items = useNavItems(firm)
  return (
    <nav aria-label={t`Primary navigation`} className="contents">
      <NavGroupSection label={t`Operations`}>
        {items.operations.map((item) => (
          <NavMenuItem key={item.href} item={item} disabled={Boolean(item.tag)} />
        ))}
      </NavGroupSection>
      <NavGroupSection label={t`Clients`}>
        {items.clients.map((item) => (
          <NavMenuItem key={item.href} item={item} />
        ))}
      </NavGroupSection>
      <NavGroupSection label={t`Practice`}>
        {items.organization.map((item) => (
          <NavMenuItem key={item.href} item={item} />
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
  children: ReactNode
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
        render={
          <NavLink
            to={item.href}
            end={item.end ?? false}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
            title={disabled ? item.disabledReason : undefined}
          />
        }
        className={cn(disabled && 'pointer-events-none')}
        title={disabled ? item.disabledReason : undefined}
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

export { FirmSwitcherTrigger, NavGroups }
