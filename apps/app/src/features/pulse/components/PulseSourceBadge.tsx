import { ExternalLinkIcon } from 'lucide-react'

import { Badge } from '@duedatehq/ui/components/ui/badge'

interface PulseSourceBadgeProps {
  source: string
  sourceUrl: string
}

// Compact "source · open ↗" chip used inside the banner card and detail header.
export function PulseSourceBadge({ source, sourceUrl }: PulseSourceBadgeProps) {
  return (
    <Badge variant="outline" className="font-mono tabular-nums">
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary"
      >
        {source}
        <ExternalLinkIcon className="size-3" aria-hidden />
      </a>
    </Badge>
  )
}
