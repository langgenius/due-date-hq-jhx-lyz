import { Trans } from '@lingui/react/macro'

import type { PulseDetail } from '@duedatehq/contracts'
import { Badge } from '@duedatehq/ui/components/ui/badge'

import { formatDate } from '@/lib/utils'

interface PulseStructuredFieldsProps {
  detail: PulseDetail
}

// Glass-Box block: every parsed field with a stable label, monospaced values,
// and the verbatim source excerpt below.
export function PulseStructuredFields({ detail }: PulseStructuredFieldsProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-divider-subtle bg-background-section p-4">
      <FieldRow label={<Trans>Jurisdiction</Trans>}>
        <Badge variant="outline" className="font-mono tabular-nums">
          {detail.jurisdiction}
        </Badge>
      </FieldRow>
      {detail.counties.length > 0 ? (
        <FieldRow label={<Trans>Counties</Trans>}>
          <div className="flex flex-wrap gap-1">
            {detail.counties.map((county) => (
              <Badge key={county} variant="secondary" className="font-mono">
                {county}
              </Badge>
            ))}
          </div>
        </FieldRow>
      ) : null}
      <FieldRow label={<Trans>Forms</Trans>}>
        <div className="flex flex-wrap gap-1">
          {detail.forms.map((form) => (
            <Badge key={form} variant="outline" className="font-mono tabular-nums">
              {form}
            </Badge>
          ))}
        </div>
      </FieldRow>
      <FieldRow label={<Trans>Entity types</Trans>}>
        <div className="flex flex-wrap gap-1">
          {detail.entityTypes.map((entity) => (
            <Badge key={entity} variant="secondary" className="font-mono uppercase">
              {entity}
            </Badge>
          ))}
        </div>
      </FieldRow>
      <FieldRow label={<Trans>Due date</Trans>}>
        <span className="font-mono tabular-nums text-text-primary">
          {formatDate(detail.originalDueDate)}
          {' → '}
          <span className="font-semibold">{formatDate(detail.newDueDate)}</span>
        </span>
      </FieldRow>
      {detail.effectiveFrom ? (
        <FieldRow label={<Trans>Effective from</Trans>}>
          <span className="font-mono tabular-nums text-text-secondary">
            {formatDate(detail.effectiveFrom)}
          </span>
        </FieldRow>
      ) : null}

      <div className="mt-1 grid gap-1 rounded-md bg-background-default p-3">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-text-tertiary">
          <Trans>Source excerpt</Trans>
        </span>
        <blockquote className="text-md italic text-text-secondary">
          “{detail.sourceExcerpt}”
        </blockquote>
      </div>
    </div>
  )
}

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm font-medium text-text-tertiary">{label}</span>
      <div className="flex min-w-0 max-w-[60%] flex-wrap justify-end gap-1 text-right">
        {children}
      </div>
    </div>
  )
}
