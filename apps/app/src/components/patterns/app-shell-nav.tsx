import { useMemo, type ReactNode } from 'react'
import { NavLink } from 'react-router'
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
import { cn } from '@duedatehq/ui/lib/utils'

type FirmSummary = {
  name: string
  meta: string
  monogram: string
}

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
            { href: '/settings/rules', label: t`Rules`, end: true },
            { label: t`Members`, tag: 'P1' },
            { label: t`Profile`, tag: 'P1' },
          ],
        },
      ],
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
            'aria-[current=page]:bg-accent-tint aria-[current=page]:font-semibold aria-[current=page]:text-text-primary',
          )}
        >
          <span
            aria-hidden
            className="size-1 shrink-0 rounded-full bg-text-tertiary group-aria-[current=page]/sub-menu:bg-text-accent"
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

export { FirmSwitcherTrigger, NavGroups, type FirmSummary }
