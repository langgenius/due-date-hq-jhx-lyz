import { Trans } from '@lingui/react/macro'
import {
  BriefcaseBusinessIcon,
  HandshakeIcon,
  MessageSquareTextIcon,
  type LucideIcon,
} from 'lucide-react'
import type { OpportunityKind, OpportunityPublic } from '@duedatehq/contracts'
import { Badge } from '@duedatehq/ui/components/ui/badge'

export function OpportunityKindBadge({ kind }: { kind: OpportunityKind }) {
  if (kind === 'scope_review') {
    return (
      <Badge variant="outline">
        <Trans>Scope review</Trans>
      </Badge>
    )
  }
  if (kind === 'retention_check_in') {
    return (
      <Badge variant="outline">
        <Trans>Check-in</Trans>
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <Trans>Advisory</Trans>
    </Badge>
  )
}

export function OpportunitySeverityBadge({
  severity,
}: {
  severity: OpportunityPublic['severity']
}) {
  if (severity === 'high') {
    return (
      <Badge variant="warning">
        <Trans>High</Trans>
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      {severity === 'medium' ? <Trans>Medium</Trans> : <Trans>Low</Trans>}
    </Badge>
  )
}

export function OpportunityTimingBadge({ timing }: { timing: OpportunityPublic['timing'] }) {
  if (timing === 'now') {
    return (
      <Badge variant="outline">
        <Trans>Now</Trans>
      </Badge>
    )
  }
  if (timing === 'next_30_days') {
    return (
      <Badge variant="outline">
        <Trans>Next 30 days</Trans>
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <Trans>Next quarter</Trans>
    </Badge>
  )
}

export function opportunityIcon(kind: OpportunityKind): LucideIcon {
  if (kind === 'retention_check_in') return HandshakeIcon
  if (kind === 'scope_review') return BriefcaseBusinessIcon
  return MessageSquareTextIcon
}
