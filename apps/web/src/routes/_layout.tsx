import { NavLink, Outlet, useNavigation } from 'react-router'
import { BellIcon, CalendarClockIcon, LayoutDashboardIcon, SettingsIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
  { href: '/workboard', label: 'Workboard', icon: CalendarClockIcon, end: false },
  { href: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
]

const shellMeta = [
  ['Workspace', 'FileInTime Demo'],
  ['Queue SLA', '04h 12m'],
  ['Local Time', 'America/New_York'],
]

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
  return (
    <nav aria-label="Primary navigation" className="flex flex-col gap-1">
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
  return (
    <nav aria-label="Mobile navigation" className="flex gap-1 overflow-x-auto md:hidden">
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

export function RootLayout() {
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
              <span className="text-xs text-muted-foreground">CPA deadline console</span>
            </div>
          </div>
          <Separator />
          <div className="flex flex-1 flex-col gap-6 p-3">
            <SideNav />
            <div className="mt-auto flex flex-col gap-3 rounded-md border border-sidebar-border bg-background p-3">
              {shellMeta.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <span className="font-mono text-xs tabular-nums text-text-primary">{value}</span>
                </div>
              ))}
              <Skeleton className="h-1.5 w-full" />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-14 flex-col gap-3 border-b border-border-default bg-background px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Phase 0 demo workspace
              </span>
              <span className="truncate text-base font-medium">Compliance risk operations</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <BellIcon data-icon="inline-start" />
                Pulse
              </Button>
              <Button size="sm">New obligation</Button>
            </div>
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
