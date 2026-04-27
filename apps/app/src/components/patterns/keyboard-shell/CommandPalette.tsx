import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  BotIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UploadCloudIcon,
  WavesIcon,
} from 'lucide-react'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@duedatehq/ui/components/ui/command'
import { Badge } from '@duedatehq/ui/components/ui/badge'

import { useMigrationWizard } from '@/features/migration/WizardProvider'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CommandEntry = {
  id: string
  label: string
  description: string
  group: 'navigate' | 'actions' | 'ask'
  disabled?: boolean
  onSelect: () => void
  icon: typeof LayoutDashboardIcon
}

type CommandGroupId = CommandEntry['group']

function getCommandShortcutLabel(): string {
  if (typeof navigator === 'undefined') return 'Cmd/Ctrl+K'
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘K' : 'Ctrl+K'
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { openWizard } = useMigrationWizard()
  const commandShortcut = getCommandShortcutLabel()

  const entries = useMemo<CommandEntry[]>(
    () => [
      {
        id: 'dashboard',
        label: t`Dashboard`,
        description: t`Review risk and operating pressure.`,
        group: 'navigate',
        icon: LayoutDashboardIcon,
        onSelect: () => navigate('/'),
      },
      {
        id: 'workboard',
        label: t`Workboard`,
        description: t`Open the obligation queue.`,
        group: 'navigate',
        icon: GaugeIcon,
        onSelect: () => navigate('/workboard'),
      },
      {
        id: 'settings',
        label: t`Settings`,
        description: t`Open practice settings.`,
        group: 'navigate',
        icon: SettingsIcon,
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'migration',
        label: t`Import clients`,
        description: t`Open the Migration Copilot wizard.`,
        group: 'actions',
        icon: UploadCloudIcon,
        onSelect: openWizard,
      },
      {
        id: 'pulse',
        label: t`Pulse`,
        description: t`Open the dashboard Pulse banner.`,
        group: 'navigate',
        icon: WavesIcon,
        onSelect: () => navigate('/#pulse'),
      },
      {
        id: 'ask',
        label: t`Ask DueDateHQ`,
        description: t`Coming soon`,
        group: 'ask',
        icon: BotIcon,
        disabled: true,
        onSelect: () => undefined,
      },
    ],
    [navigate, openWizard, t],
  )

  const groups = useMemo(
    () =>
      [
        { id: 'navigate', heading: t`Navigate` },
        { id: 'actions', heading: t`Actions` },
        { id: 'ask', heading: t`Ask` },
      ] satisfies Array<{ id: CommandGroupId; heading: string }>,
    [t],
  )

  function selectEntry(entry: CommandEntry) {
    if (entry.disabled) return
    entry.onSelect()
    onOpenChange(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t`Command palette`}
      description={t`Search, ask, or navigate.`}
    >
      <Command loop disablePointerSelection>
        <CommandInput autoFocus placeholder={t`Search, ask, or navigate...`} />
        <CommandList>
          <CommandEmpty>
            <Trans>No commands found.</Trans>
          </CommandEmpty>
          {groups.map((group, index) => {
            const groupEntries = entries.filter((entry) => entry.group === group.id)
            if (groupEntries.length === 0) return null
            return (
              <CommandGroup key={group.id} heading={group.heading}>
                {groupEntries.map((entry) => {
                  const Icon = entry.icon
                  return (
                    <CommandItem
                      key={entry.id}
                      value={`${entry.label} ${entry.description} ${group.heading}`}
                      onSelect={() => selectEntry(entry)}
                      {...(entry.disabled ? { disabled: true } : {})}
                    >
                      <span className="grid size-8 place-items-center rounded-md bg-background-subtle text-text-secondary group-data-[selected=true]/command-item:text-text-primary">
                        <Icon aria-hidden />
                      </span>
                      <span className="grid gap-0.5">
                        <span className="text-sm font-medium text-text-primary">{entry.label}</span>
                        <span className="text-xs text-text-tertiary">{entry.description}</span>
                      </span>
                      {entry.disabled ? (
                        <Badge variant="outline">
                          <Trans>Coming soon</Trans>
                        </Badge>
                      ) : (
                        <CommandShortcut>{group.heading}</CommandShortcut>
                      )}
                    </CommandItem>
                  )
                })}
                {index < groups.length - 1 ? <CommandSeparator /> : null}
              </CommandGroup>
            )
          })}
        </CommandList>
        <div className="flex items-center justify-between border-t border-divider-subtle px-4 py-2 text-xs text-text-tertiary">
          <span>
            <Trans>Enter execute · Esc close · {commandShortcut} toggle</Trans>
          </span>
        </div>
      </Command>
    </CommandDialog>
  )
}
