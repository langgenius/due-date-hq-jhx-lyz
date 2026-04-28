import { cn } from '@duedatehq/ui/lib/utils'

export type PulsingDotTone = 'success' | 'warning' | 'error' | 'normal' | 'disabled'

interface PulsingDotProps {
  tone?: PulsingDotTone
  /** When true, the outer ring expands rhythmically — the actual "pulse". */
  active?: boolean
  className?: string
}

const FILL_BY_TONE: Record<PulsingDotTone, string> = {
  success: 'bg-components-badge-status-light-success-bg',
  warning: 'bg-components-badge-status-light-warning-bg',
  error: 'bg-components-badge-status-light-error-bg',
  normal: 'bg-components-badge-status-light-normal-bg',
  disabled: 'bg-components-badge-status-light-disabled-bg',
}

const HALO_BY_TONE: Record<PulsingDotTone, string> = {
  success: 'shadow-status-indicator-green',
  warning: 'shadow-status-indicator-warning',
  error: 'shadow-status-indicator-red',
  normal: 'shadow-status-indicator-blue',
  disabled: 'shadow-status-indicator-gray',
}

const RING_BY_TONE: Record<PulsingDotTone, string> = {
  success: 'bg-text-success/40',
  warning: 'bg-text-warning/40',
  error: 'bg-text-destructive/40',
  normal: 'bg-text-accent/40',
  disabled: 'bg-text-tertiary/30',
}

// A 4px status dot with the existing halo shadow plus an optional expanding
// ring on top. The expansion uses Tailwind's built-in `animate-ping` so the
// rhythm is global and matches `prefers-reduced-motion` automatically.
//
// The dot itself never moves — only the ring fades / expands — so it reads as
// a heartbeat, not a flashing alarm. Disabled tone is rendered without ring
// (the watcher is in a quiet state, no need to attract attention).
export function PulsingDot({ tone = 'success', active = true, className }: PulsingDotProps) {
  const showRing = active && tone !== 'disabled'
  return (
    <span
      aria-hidden
      className={cn('relative inline-flex size-2 shrink-0', className)}
      data-slot="pulsing-dot"
      data-tone={tone}
      data-active={active || undefined}
    >
      {showRing ? (
        <span
          className={cn(
            'absolute inset-0 inline-flex animate-ping rounded-full opacity-75 motion-reduce:hidden',
            RING_BY_TONE[tone],
          )}
        />
      ) : null}
      <span
        className={cn(
          'relative inline-flex size-2 rounded-full',
          FILL_BY_TONE[tone],
          HALO_BY_TONE[tone],
        )}
      />
    </span>
  )
}
