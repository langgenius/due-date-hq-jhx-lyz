import type { ReactNode } from 'react'

import { cn } from '@duedatehq/ui/lib/utils'

export interface PulseBannerProps {
  title: ReactNode
  detail?: ReactNode
  source?: ReactNode
  action?: ReactNode
  className?: string
}

// Pulse banner shell. Aligns with the new Dify soft-chip palette: warning soft
// background + regular divider, primary/secondary text. Layout slots stay open
// so callers can compose existing primitives (Badge, Button, etc.).
export function PulseBanner({ title, detail, source, action, className }: PulseBannerProps) {
  return (
    <div
      className={cn(
        'grid gap-1 rounded-lg border border-divider-regular bg-components-badge-bg-warning-soft p-4 text-text-primary',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-md font-medium">{title}</span>
        {source ? <span className="shrink-0">{source}</span> : null}
      </div>
      {detail ? <span className="text-md text-text-secondary">{detail}</span> : null}
      {action ? <div className="flex justify-end">{action}</div> : null}
    </div>
  )
}
