import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  CalendarClockIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  PlusIcon,
  ScaleIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import type { FirmPublic } from '@duedatehq/contracts'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@duedatehq/ui/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Input } from '@duedatehq/ui/components/ui/input'
import { Label } from '@duedatehq/ui/components/ui/label'
import { cn } from '@duedatehq/ui/lib/utils'
import { initialsFromName } from '@/lib/auth'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: string
  tag?: string
  subItems?: NavSubItem[]
}

type NavSubItem = {
  href?: string
  label: string
  end?: boolean
  tag?: string
}

type NavConfig = {
  main: NavItem[]
  manage: NavItem[]
  admin: NavItem[]
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
  if (plan === 'firm') return t`Firm`
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
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const switchMutation = useMutation(
    orpc.firms.switchActive.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries()
      },
      onError: (err) => {
        toast.error(t`Could not switch firm.`, {
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

  return (
    <SidebarHeader>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={t`Switch firm — current ${firm.name}`}
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
                <Trans>Workspaces</Trans>
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
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setAddOpen(true)}>
              <PlusIcon />
              <span>
                <Trans>Add firm</Trans>
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AddFirmDialog open={addOpen} onOpenChange={setAddOpen} />
    </SidebarHeader>
  )
}

function AddFirmDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const [error, setError] = useState<string | null>(null)
  const createMutation = useMutation(
    orpc.firms.create.mutationOptions({
      onSuccess: () => {
        setName('')
        setTimezone('America/New_York')
        setError(null)
        onOpenChange(false)
        void queryClient.invalidateQueries()
      },
      onError: (err) => {
        setError(err.message || t`Could not create firm.`)
      },
    }),
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError(t`Please enter at least 2 characters.`)
      return
    }
    setError(null)
    createMutation.mutate({ name: trimmed, timezone: timezone.trim() || 'America/New_York' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans>Add firm</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Create a separate tenant with its own clients, deadlines, audit trail, and settings.
            </Trans>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="add-firm-name">
              <Trans>Firm name</Trans>
            </Label>
            <Input
              id="add-firm-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="organization"
              aria-invalid={error ? true : undefined}
              placeholder={t`e.g. Bright CPA Practice`}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="add-firm-timezone">
              <Trans>Timezone</Trans>
            </Label>
            <Input
              id="add-firm-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              autoComplete="off"
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <Trans>Cancel</Trans>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Trans>Creating…</Trans> : <Trans>Create firm</Trans>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
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
      manage: [
        {
          href: '/settings',
          label: t`Settings`,
          icon: SettingsIcon,
          end: false,
          subItems: [
            { href: '/settings/profile', label: t`Profile`, end: true },
            { href: '/settings/rules', label: t`Rules`, end: true },
            { href: '/settings/billing', label: t`Billing`, end: true },
            { label: t`Members`, tag: 'P1' },
          ],
        },
      ],
      admin: [
        { href: '/clients', label: t`Clients`, icon: UsersIcon, end: false },
        { href: '/audit', label: t`Audit log`, icon: ScaleIcon, end: false },
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
      <NavGroupSection label={t`Admin`}>
        {items.admin.map((item) => (
          <NavMenuItem key={item.href} item={item} disabled={Boolean(item.tag)} />
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
  if (item.subItems?.length) {
    return <SectionGroupNavItem item={item} />
  }

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

function SectionGroupNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <>
      <SidebarMenuItem>
        <div className="flex h-8 w-full items-center gap-2.5 rounded-md px-3 text-base font-medium text-text-secondary">
          <Icon aria-hidden className="size-4 shrink-0 text-text-tertiary" />
          <span className="flex-1 truncate">{item.label}</span>
          <ChevronDownIcon aria-hidden className="size-3.5 shrink-0 text-text-tertiary" />
        </div>
      </SidebarMenuItem>
      {item.subItems?.map((subItem) => (
        <SidebarSubMenuItem key={subItem.href ?? subItem.label} item={subItem} />
      ))}
    </>
  )
}

function SidebarSubMenuItem({ item }: { item: NavSubItem }) {
  return (
    <SidebarMenuItem>
      {item.href ? (
        <NavLink
          to={item.href}
          end={item.end ?? false}
          className={cn(
            'group/sub-menu ml-5 flex h-7 w-[calc(100%-1.25rem)] items-center gap-2.5 rounded-md pr-3 pl-[18px] text-base text-text-secondary outline-none transition-colors',
            'hover:bg-background-default-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-accent-active-alt',
            'aria-[current=page]:bg-state-base-hover-alt aria-[current=page]:font-semibold aria-[current=page]:text-text-primary',
          )}
        >
          <span
            aria-hidden
            className="size-1 shrink-0 rounded-full bg-text-tertiary group-aria-[current=page]/sub-menu:bg-text-primary"
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.tag ? (
            <span className="font-mono text-xs tabular-nums text-text-muted">{item.tag}</span>
          ) : null}
        </NavLink>
      ) : (
        <span
          aria-disabled="true"
          className="ml-5 flex h-7 w-[calc(100%-1.25rem)] items-center gap-2.5 rounded-md pr-3 pl-[18px] text-base text-text-secondary opacity-55"
        >
          <span aria-hidden className="size-1 shrink-0 rounded-full bg-text-tertiary" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.tag ? (
            <span className="font-mono text-xs tabular-nums text-text-muted">{item.tag}</span>
          ) : null}
        </span>
      )}
    </SidebarMenuItem>
  )
}

export { FirmSwitcherTrigger, NavGroups }
