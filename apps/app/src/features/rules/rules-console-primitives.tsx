import type { ReactNode } from 'react'
import { AlertCircleIcon } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'

import type { RuleSource } from '@duedatehq/contracts'
import { Badge, BadgeStatusDot } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import { cn } from '@duedatehq/ui/lib/utils'

import type { CoverageCellState } from './rules-console-model'

type FilterOption<T extends string> = {
  value: T
  label: string
  count: number
}

export function RulesPageHeader({ description }: { description: string }) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl leading-7 font-semibold text-text-primary">
          <Trans>Rules</Trans>
        </h1>
        <Badge className="h-[22px] rounded-sm bg-accent-tint px-2 py-0 text-[11px] font-medium tracking-[0.08em] text-text-accent uppercase">
          <Trans>READ-ONLY</Trans>
        </Badge>
      </div>
      <p className="max-w-[1080px] text-[13px] leading-5 text-text-secondary">{description}</p>
    </header>
  )
}

export function SectionFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border border-divider-regular bg-background-default',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium tracking-[0.08em] whitespace-pre text-text-tertiary uppercase">
      {children}
    </p>
  )
}

export function FilterChips<T extends string>({
  options,
  value,
  onValueChange,
}: {
  options: Array<FilterOption<T>>
  value: T
  onValueChange: (value: T) => void
}) {
  // Active chip is neutral (`bg-text-primary` + `text-text-inverted`), NOT the
  // Dify UI blue — Figma 219:254 uses `text/primary` to keep the
  // wayfinding accent reserved for tab underline + sub-route
  // highlights only. Inactive chips are flat white pills with a 1 px hairline.
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <Button
            key={option.value}
            type="button"
            size="xs"
            variant="secondary"
            className={cn(
              'h-[26px] rounded px-2.5 text-xs shadow-none',
              active
                ? 'border-text-primary bg-text-primary text-text-inverted hover:border-text-primary hover:bg-text-primary'
                : 'bg-background-default text-text-secondary',
            )}
            onClick={() => onValueChange(option.value)}
          >
            <span>{option.label}</span>
            <span className="font-mono tabular-nums">{option.count}</span>
          </Button>
        )
      })}
    </div>
  )
}

export function QueryPanelState({
  state,
  message,
}: {
  state: 'loading' | 'error'
  message: string
}) {
  if (state === 'loading') {
    return (
      <SectionFrame className="p-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-3/5" />
        </div>
      </SectionFrame>
    )
  }

  return (
    <SectionFrame className="flex items-center gap-2 p-4 text-sm text-text-secondary">
      <AlertCircleIcon className="size-4 text-text-warning" aria-hidden />
      <span>{message}</span>
    </SectionFrame>
  )
}

export function JurisdictionCode({ code }: { code: string }) {
  return (
    <span className="inline-flex h-[18px] min-w-9 items-center justify-center rounded-sm bg-background-subtle px-2 font-mono text-xs font-medium tabular-nums text-text-secondary">
      {code}
    </span>
  )
}

export function ToneDot({ tone }: { tone: 'success' | 'warning' | 'review' | 'disabled' }) {
  const className = {
    success: 'bg-status-done',
    warning: 'bg-severity-medium',
    review: 'bg-status-review',
    disabled: 'bg-text-disabled',
  }[tone]
  return (
    <span aria-hidden className={cn('inline-block size-1.5 shrink-0 rounded-full', className)} />
  )
}

export function CoverageCell({ state }: { state: CoverageCellState }) {
  const { t } = useLingui()
  const tone = state === 'verified' ? 'success' : state === 'review' ? 'warning' : 'disabled'
  const label = state === 'verified' ? t`verified` : state === 'review' ? t`review` : t`no rule`
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-sm',
        state === 'verified' && 'text-text-primary',
        state === 'review' && 'text-severity-medium',
        state === 'none' && 'text-text-disabled',
      )}
    >
      <ToneDot tone={tone} />
      {label}
    </span>
  )
}

export function CoverageLegend() {
  return (
    <div className="flex h-4 flex-wrap items-center gap-x-7 gap-y-1 text-xs text-text-tertiary">
      <span className="inline-flex items-center gap-2">
        <ToneDot tone="success" />
        <Trans>verified — reminder will fire</Trans>
      </span>
      <span className="inline-flex items-center gap-2">
        <ToneDot tone="warning" />
        <Trans>review — needs CPA confirmation</Trans>
      </span>
      <span className="inline-flex items-center gap-2">
        <ToneDot tone="disabled" />
        <Trans>no rule — not in MVP scope</Trans>
      </span>
    </div>
  )
}

export function HealthBadge({ health }: { health: RuleSource['healthStatus'] }) {
  const { t } = useLingui()
  const tones: Record<typeof health, 'success' | 'warning' | 'error' | 'disabled'> = {
    healthy: 'success',
    degraded: 'warning',
    failing: 'error',
    paused: 'disabled',
  }
  const labels: Record<typeof health, string> = {
    healthy: t`Healthy`,
    degraded: t`Degraded`,
    failing: t`Failing`,
    paused: t`Paused`,
  }
  const tone = tones[health]
  return (
    <Badge variant="outline" className="h-[22px] rounded-full px-2 text-xs">
      <BadgeStatusDot tone={tone} className="size-1.5" />
      {labels[health]}
    </Badge>
  )
}

export function TableFooterBar({
  note,
  action,
  onAction,
}: {
  note: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex h-9 items-center justify-between bg-background-subtle px-3 text-xs text-text-tertiary">
      <span>{note}</span>
      {action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="font-medium text-text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-state-accent-active-alt"
        >
          {action}
        </button>
      ) : null}
    </div>
  )
}
