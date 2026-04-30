import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { ArrowRightIcon } from 'lucide-react'

import type { PulseAlertPublic } from '@duedatehq/contracts'
import { Button } from '@duedatehq/ui/components/ui/button'
import { cn } from '@duedatehq/ui/lib/utils'

import { PulseConfidenceBadge } from './PulseConfidenceBadge'
import { PulseSourceBadge } from './PulseSourceBadge'
import { PulseSourceStatusBadge } from './PulseSourceStatusBadge'
import { PulsingDot } from './PulsingDot'

interface PulseAlertCardProps {
  alert: PulseAlertPublic
  onReview: () => void
  onDismiss?: (() => void) | undefined
  /** Background breathing is reserved for the top actionable row in dense lists. */
  breathing?: boolean
  /** Inline actions are hidden when the card is rendered as a folded "more" entry. */
  compact?: boolean
}

// Single Pulse alert row used by the /alerts history page. Keeps the same
// hairline / monospace metadata language as the dashboard strip — flat row
// with a pulsing dot, mono source label, body title, mono impact count, and
// a thin action set on the right.
export function PulseAlertCard({
  alert,
  onReview,
  onDismiss,
  breathing = false,
  compact = false,
}: PulseAlertCardProps) {
  const { t } = useLingui()
  const impacted = alert.matchedCount + alert.needsReviewCount
  const tone = impacted === 0 ? 'normal' : 'warning'

  return (
    <article
      role="region"
      aria-label={t`Pulse alert: ${alert.title}`}
      className={cn(
        'flex flex-col gap-2 rounded-md border border-divider-subtle bg-background-default p-3 transition-colors hover:border-divider-regular',
        breathing && 'pulse-strip-breathing',
        compact && 'p-2.5',
      )}
      data-tone={tone}
      data-breathing={breathing || undefined}
    >
      <header className="flex items-center gap-2">
        <PulsingDot tone={tone} active />
        <span className="font-mono text-sm tabular-nums text-text-secondary">{alert.source}</span>
        <span aria-hidden className="text-text-tertiary">
          ·
        </span>
        <h3
          className="min-w-0 flex-1 truncate text-md font-medium text-text-primary"
          title={alert.title}
        >
          {alert.title}
        </h3>
        <PulseConfidenceBadge confidence={alert.confidence} />
        <PulseSourceStatusBadge status={alert.sourceStatus} />
      </header>

      <p className="pl-4 text-sm text-text-secondary">
        {impacted === 0 ? (
          <Trans>No matching clients in this firm.</Trans>
        ) : (
          <>
            <span className="font-mono tabular-nums text-text-primary">
              <Plural value={impacted} one="# client" other="# clients" />
            </span>{' '}
            <Trans>may be affected.</Trans>
            {alert.needsReviewCount > 0 ? (
              <>
                {' · '}
                <span className="font-mono tabular-nums text-text-warning">
                  <Trans>{alert.needsReviewCount} need review</Trans>
                </span>
              </>
            ) : null}
          </>
        )}
      </p>

      {compact ? null : (
        <footer className="flex items-center justify-between gap-2 pl-4">
          <PulseSourceBadge source={alert.source} sourceUrl={alert.sourceUrl} />
          <span className="flex items-center gap-1">
            {onDismiss ? (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <Trans>Dismiss</Trans>
              </Button>
            ) : null}
            <Button size="sm" onClick={onReview}>
              <Trans>Review</Trans>
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </span>
        </footer>
      )}
    </article>
  )
}
