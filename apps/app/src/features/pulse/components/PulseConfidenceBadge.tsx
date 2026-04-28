import { Trans } from '@lingui/react/macro'

import { Badge } from '@duedatehq/ui/components/ui/badge'

interface PulseConfidenceBadgeProps {
  confidence: number
}

// Mirrors the AI confidence badge semantics from Migration Step 2.
// >= 0.9 high · 0.7-0.9 medium · < 0.7 low. Server-side seed defaults to 0.94.
export function PulseConfidenceBadge({ confidence }: PulseConfidenceBadgeProps) {
  const percent = Math.round(confidence * 100)
  const variant = confidence >= 0.9 ? 'success' : confidence >= 0.7 ? 'info' : 'warning'
  return (
    <Badge variant={variant} className="font-mono tabular-nums">
      <Trans>AI {percent}%</Trans>
    </Badge>
  )
}
