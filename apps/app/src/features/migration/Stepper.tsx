import type { ReactNode } from 'react'
import { CheckIcon } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import { cn } from '@duedatehq/ui/lib/utils'
import type { StepIndex } from './state'

/**
 * 4-step horizontal Stepper per [02-ux §2.2] + DESIGN.md `stepper-*` tokens.
 *
 * Display-only — clicking does NOT jump steps (avoids data pollution). Mono
 * step numbers + uppercase labels mirror the workbench aesthetic established
 * by the marketing HeroSurface.
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
      className="flex h-12 items-center gap-2 border-b border-border-subtle bg-bg-canvas px-4"
    >
      {STEP_LABELS.map((step, idx) => {
        const isDone = step.index < current
        const isActive = step.index === current
        const tone = isActive
          ? 'border-accent-default/30 bg-accent-tint text-accent-text'
          : isDone
            ? 'border-transparent bg-transparent text-status-done'
            : 'border-transparent bg-transparent text-text-muted'

        return (
          <li
            key={step.key}
            className="flex items-center gap-2"
            aria-current={isActive ? 'step' : undefined}
          >
            <div
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-sm border px-2.5 font-mono text-base tracking-[0.12em] uppercase transition-colors',
                tone,
              )}
            >
              <span className="tabular-nums">{step.index}</span>
              {isDone ? <CheckIcon className="size-3.5" aria-hidden /> : null}
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
