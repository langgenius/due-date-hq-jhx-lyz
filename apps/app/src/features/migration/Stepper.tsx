import type { ReactNode } from 'react'
import { CheckIcon } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import { cn } from '@duedatehq/ui/lib/utils'
import type { StepIndex } from './state'

/**
 * 4-step horizontal Stepper per [02-ux §2.2].
 * Display-only — clicking does NOT jump steps (avoids data pollution).
 */
const STEP_LABELS: ReadonlyArray<{ index: StepIndex; key: string; label: ReactNode }> = [
  { index: 1, key: 'intake', label: <Trans>Intake</Trans> },
  { index: 2, key: 'mapping', label: <Trans>Mapping</Trans> },
  { index: 3, key: 'normalize', label: <Trans>Normalize</Trans> },
  { index: 4, key: 'dry_run', label: <Trans>Dry-Run</Trans> },
]

export function Stepper({ current }: { current: StepIndex }) {
  return (
    <ol
      role="list"
      aria-label="Wizard steps"
      className="flex items-center gap-3 px-5 py-2 text-[11px] font-medium tracking-[0.08em] uppercase"
    >
      {STEP_LABELS.map((step, idx) => {
        const isDone = step.index < current
        const isActive = step.index === current
        const tone = isActive
          ? 'bg-accent-tint text-accent-default border-accent-default'
          : isDone
            ? 'bg-bg-subtle text-status-done border-border-default'
            : 'bg-transparent text-text-muted border-border-default'

        return (
          <li
            key={step.key}
            className="flex items-center gap-3"
            aria-current={isActive ? 'step' : undefined}
          >
            <div
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-md border px-2.5 transition-colors',
                tone,
              )}
            >
              <span className="font-mono tabular-nums">{step.index}</span>
              {isDone ? <CheckIcon className="size-3" aria-hidden /> : null}
              <span>{step.label}</span>
            </div>
            {idx < STEP_LABELS.length - 1 ? (
              <span aria-hidden className="h-px w-6 bg-border-default" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
