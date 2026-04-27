import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  BotIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  UploadCloudIcon,
  WavesIcon,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@duedatehq/ui/components/ui/dialog'
import { Input } from '@duedatehq/ui/components/ui/input'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import { cn } from '@duedatehq/ui/lib/utils'

import { useMigrationWizard } from '@/features/migration/WizardProvider'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CommandEntry = {
  id: string
  label: string
  description: string
  section: string
  disabled?: boolean
  onSelect: () => void
  icon: typeof LayoutDashboardIcon
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { openWizard } = useMigrationWizard()
  const [query, setQuery] = useState('')

  const entries = useMemo<CommandEntry[]>(
    () => [
      {
        id: 'dashboard',
        label: t`Dashboard`,
        description: t`Review risk and operating pressure.`,
        section: t`Navigate`,
        icon: LayoutDashboardIcon,
        onSelect: () => navigate('/'),
      },
      {
        id: 'workboard',
        label: t`Workboard`,
        description: t`Open the obligation queue.`,
        section: t`Navigate`,
        icon: GaugeIcon,
        onSelect: () => navigate('/workboard'),
      },
      {
        id: 'settings',
        label: t`Settings`,
        description: t`Open practice settings.`,
        section: t`Navigate`,
        icon: SettingsIcon,
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'migration',
        label: t`Import clients`,
        description: t`Open the Migration Copilot wizard.`,
        section: t`Actions`,
        icon: UploadCloudIcon,
        onSelect: openWizard,
      },
      {
        id: 'pulse',
        label: t`Pulse`,
        description: t`Pulse detail is wired in Day 6.`,
        section: t`Navigate`,
        icon: WavesIcon,
        disabled: true,
        onSelect: () => undefined,
      },
      {
        id: 'ask',
        label: t`Ask DueDateHQ`,
        description: t`Coming soon`,
        section: t`Ask`,
        icon: BotIcon,
        disabled: true,
        onSelect: () => undefined,
      },
    ],
    [navigate, openWizard, t],
  )

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return entries
    return entries.filter((entry) =>
      `${entry.label} ${entry.description} ${entry.section}`.toLowerCase().includes(normalized),
    )
  }, [entries, query])

  function selectEntry(entry: CommandEntry) {
    if (entry.disabled) return
    entry.onSelect()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(640px,calc(100vh-2rem))] w-170 overflow-hidden rounded-xl p-0">
        <DialogTitle className="sr-only">
          <Trans>Command palette</Trans>
        </DialogTitle>
        <DialogDescription className="sr-only">
          <Trans>Search, ask, or navigate.</Trans>
        </DialogDescription>
        <div className="border-b border-divider-regular p-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
              placeholder={t`Search, ask, or navigate...`}
            />
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto p-2">
          {filteredEntries.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-text-tertiary">
              <Trans>No commands found.</Trans>
            </p>
          ) : (
            <div className="grid gap-1">
              {filteredEntries.map((entry) => {
                const Icon = entry.icon
                return (
                  <button
                    key={entry.id}
                    type="button"
                    disabled={entry.disabled}
                    className={cn(
                      'grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-md p-2 text-left outline-none transition-colors hover:bg-state-base-hover focus-visible:bg-state-base-hover',
                      entry.disabled && 'cursor-not-allowed opacity-60 hover:bg-transparent',
                    )}
                    onClick={() => selectEntry(entry)}
                  >
                    <span className="grid size-8 place-items-center rounded-md bg-background-subtle text-text-secondary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="grid gap-0.5">
                      <span className="text-sm font-medium text-text-primary">{entry.label}</span>
                      <span className="text-xs text-text-tertiary">{entry.description}</span>
                    </span>
                    <Badge variant={entry.disabled ? 'outline' : 'secondary'}>
                      {entry.disabled ? <Trans>Coming soon</Trans> : entry.section}
                    </Badge>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-divider-subtle px-4 py-2 text-xs text-text-tertiary">
          <span>
            <Trans>Enter execute · Esc close · Mod+K toggle</Trans>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
