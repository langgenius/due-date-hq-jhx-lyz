import { useMemo } from 'react'
import { useHotkeyRegistrations } from '@tanstack/react-hotkeys'
import { Trans } from '@lingui/react/macro'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@duedatehq/ui/components/ui/dialog'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import { cn } from '@duedatehq/ui/lib/utils'

import {
  RESERVED_SHORTCUTS,
  type AppHotkeyMeta,
  type ShortcutCategory,
  type ShortcutScope,
} from './types'
import { formatShortcutForDisplay, formatShortcutSequenceForDisplay } from './display'

interface ShortcutHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShortcutHelpItem {
  id: string
  keys: string
  name: string
  description: string
  category: ShortcutCategory
  scope: ShortcutScope
  disabledReason?: string | undefined
}

const CATEGORY_ORDER: ShortcutCategory[] = [
  'global',
  'navigate',
  'organization',
  'workboard',
  'wizard',
  'reserved',
]

const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  global: 'Global',
  navigate: 'Navigate',
  organization: 'Organization',
  workboard: 'Workboard',
  wizard: 'Wizard',
  reserved: 'Reserved',
}

export function ShortcutHelpDialog({ open, onOpenChange }: ShortcutHelpDialogProps) {
  const { hotkeys, sequences } = useHotkeyRegistrations()

  const items = useMemo<ShortcutHelpItem[]>(() => {
    const registeredHotkeys = hotkeys
      .map((registration): ShortcutHelpItem | null => {
        const meta = registration.options.meta as AppHotkeyMeta | undefined
        if (!meta?.name) return null
        return {
          id: meta.id ?? registration.id,
          keys: meta.displayKeys ?? formatShortcutForDisplay(registration.hotkey),
          name: meta.name,
          description: meta.description ?? '',
          category: meta.category ?? 'global',
          scope: meta.scope ?? 'global',
          disabledReason: meta.disabledReason,
        }
      })
      .filter((item): item is ShortcutHelpItem => item !== null)

    const registeredSequences = sequences
      .map((registration): ShortcutHelpItem | null => {
        const meta = registration.options.meta as AppHotkeyMeta | undefined
        if (!meta?.name) return null
        return {
          id: meta.id ?? registration.id,
          keys: meta.displayKeys ?? registration.sequence.join(' then '),
          name: meta.name,
          description: meta.description ?? '',
          category: meta.category ?? 'navigate',
          scope: meta.scope ?? 'global',
          disabledReason: meta.disabledReason,
        }
      })
      .filter((item): item is ShortcutHelpItem => item !== null)

    const reserved = RESERVED_SHORTCUTS.map((shortcut) => ({
      id: shortcut.id,
      keys: formatShortcutSequenceForDisplay(shortcut.keys),
      name: shortcut.name,
      description: shortcut.description,
      category: shortcut.category,
      scope: shortcut.scope,
      disabledReason: shortcut.disabledReason,
    }))

    const seen = new Set<string>()
    return [...registeredHotkeys, ...registeredSequences, ...reserved].filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  }, [hotkeys, sequences])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(720px,calc(100vh-2rem))] w-[760px] overflow-hidden rounded-xl">
        <DialogTitle>
          <Trans>Keyboard shortcuts</Trans>
        </DialogTitle>
        <DialogDescription>
          <Trans>Currently available shortcuts and reserved keyboard slots.</Trans>
        </DialogDescription>
        <div className="min-h-0 overflow-y-auto">
          <div className="grid gap-5">
            {CATEGORY_ORDER.map((category) => {
              const categoryItems = items.filter((item) => item.category === category)
              if (categoryItems.length === 0) return null
              return (
                <section key={category} className="grid gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-divider-regular">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'grid grid-cols-[minmax(120px,160px)_1fr] gap-3 border-b border-divider-subtle p-3 last:border-b-0',
                          item.disabledReason && 'bg-background-subtle',
                        )}
                      >
                        <div className="flex flex-wrap items-start gap-1">
                          {shortcutSegments(item.keys).map((segment) => (
                            <span key={`${item.id}-${segment.id}`} className="contents">
                              {!segment.first ? (
                                <span className="pt-1 text-xs text-text-tertiary">then</span>
                              ) : null}
                              <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-divider-regular bg-components-panel-bg px-1.5 font-mono text-xs text-text-primary">
                                {segment.key}
                              </kbd>
                            </span>
                          ))}
                        </div>
                        <div className="grid gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">
                              {item.name}
                            </span>
                            {item.disabledReason ? (
                              <Badge variant="outline">
                                <Trans>Reserved</Trans>
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-text-secondary">
                            {item.disabledReason ?? item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function shortcutSegments(keys: string): Array<{ id: string; key: string; first: boolean }> {
  const counts = new Map<string, number>()
  const out: Array<{ id: string; key: string; first: boolean }> = []
  for (const key of keys.split(' then ')) {
    const count = (counts.get(key) ?? 0) + 1
    counts.set(key, count)
    out.push({ id: `${key}-${count}`, key, first: out.length === 0 })
  }
  return out
}
