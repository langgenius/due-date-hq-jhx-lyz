import { useState, useTransition } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate, useNavigation } from 'react-router'
import { toast } from 'sonner'
import {
  BellIcon,
  CalendarClockIcon,
  ChevronsUpDownIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { initialsFromName, signOut, useSession, type AuthUser } from '@/lib/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
  { href: '/workboard', label: 'Workboard', icon: CalendarClockIcon, end: false },
  { href: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
]

const shellMeta = [
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

function UserMenu({ user, variant = 'panel' }: { user: AuthUser; variant?: 'panel' | 'compact' }) {
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [, startTransition] = useTransition()

  async function handleSignOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await signOut()
      startTransition(() => navigate('/login', { replace: true }))
    } catch (err) {
      setIsSigningOut(false)
      toast.error('Sign out failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    }
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={`Account menu for ${user.name || user.email}`}
              className="inline-flex size-9 items-center justify-center rounded-full outline-none ring-1 ring-border-default transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            />
          }
        >
          <UserAvatar user={user} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5 text-left">
              <span className="text-sm font-medium text-text-primary">
                {user.name || 'Signed in'}
              </span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut} disabled={isSigningOut}>
            <LogOutIcon />
            <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
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
          <span className="truncate text-sm font-medium text-text-primary">
            {user.name || 'Signed in'}
          </span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </div>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 text-left">
            <span className="text-sm font-medium text-text-primary">
              {user.name || 'Signed in'}
            </span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut} disabled={isSigningOut}>
          <LogOutIcon />
          <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ShellSkeleton() {
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

export function RootLayout() {
  const { data, isPending } = useSession()
  const location = useLocation()

  if (isPending) return <ShellSkeleton />

  if (!data) {
    const redirectTo = `${location.pathname}${location.search}`
    const param =
      redirectTo && redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''
    return <Navigate to={`/login${param}`} replace />
  }

  const user = data.user

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
              <UserMenu user={user} />
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
              <UserMenu user={user} variant="compact" />
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
