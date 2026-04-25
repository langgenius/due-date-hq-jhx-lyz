import type { ReactNode } from 'react'

import { cn } from '@duedatehq/ui/lib/utils'

export interface PulseBannerProps {
  title: ReactNode
  detail?: ReactNode
  source?: ReactNode
  action?: ReactNode
  className?: string
}

// Pulse banner shell per DESIGN.md `pulse-banner` token: yellow tint
// (severity-medium-tint) + matching border + 6px radius. Layout slots are
// kept open so callers can compose existing primitives (Badge, Button, etc.).
export function PulseBanner({ title, detail, source, action, className }: PulseBannerProps) {
  return (
    <div
      className={cn(
        'grid gap-1 rounded-md border border-severity-medium-border bg-severity-medium-tint p-3 text-text-primary',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{title}</span>
        {source ? <span className="shrink-0">{source}</span> : null}
      </div>
      {detail ? <span className="text-sm text-text-secondary">{detail}</span> : null}
      {action ? <div className="flex justify-end">{action}</div> : null}
    </div>
  )
}
