import { Trans } from '@lingui/react/macro'

import type { PulseStatus } from '@duedatehq/contracts'
import { Badge, BadgeStatusDot } from '@duedatehq/ui/components/ui/badge'

export function PulseSourceStatusBadge({ status }: { status: PulseStatus }) {
  if (status !== 'source_revoked') return null

  return (
    <Badge variant="outline" className="text-text-secondary">
      <BadgeStatusDot tone="error" />
      <Trans>Source revoked</Trans>
    </Badge>
  )
}
