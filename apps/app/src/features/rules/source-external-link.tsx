import type { ReactNode } from 'react'
import { ExternalLinkIcon } from 'lucide-react'

import type { RuleSource } from '@duedatehq/contracts'
import { cn } from '@duedatehq/ui/lib/utils'

/**
 * Outbound link to an official rule source. Forces `target=_blank` and
 * `rel=noopener noreferrer` so the Rules Console never silently navigates
 * away from the read-only console, and so the official page can never
 * window-handle our app.
 *
 * Falls back to plain text when `source` is missing — used by Generation
 * Preview rows whose evidence may briefly be undefined while the source
 * registry is still loading.
 *
 * `stopPropagation` prevents row-level click handlers (e.g. drawer open)
 * from also firing when the user clicks the icon directly.
 */
export function SourceExternalLink({
  source,
  children,
  className,
  showIcon = true,
  ariaLabel,
  onClick,
}: {
  source: RuleSource | undefined
  children: ReactNode
  className?: string | undefined
  showIcon?: boolean | undefined
  ariaLabel?: string | undefined
  onClick?: ((event: React.MouseEvent<HTMLAnchorElement>) => void) | undefined
}) {
  if (!source?.url) {
    return <span className={className}>{children}</span>
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel ?? source.title}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event)
      }}
      className={cn(
        'inline-flex items-center gap-1 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-state-accent-active-alt',
        className,
      )}
    >
      {children}
      {showIcon ? <ExternalLinkIcon className="size-3 shrink-0" aria-hidden /> : null}
    </a>
  )
}
