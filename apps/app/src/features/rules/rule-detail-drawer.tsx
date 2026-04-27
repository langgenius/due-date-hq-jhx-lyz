import { useMemo } from 'react'
import { Trans } from '@lingui/react/macro'
import { TriangleAlertIcon } from 'lucide-react'

import type {
  ObligationRule,
  RuleEvidence,
  RuleEvidenceAuthorityRole,
  RuleSource,
} from '@duedatehq/contracts'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@duedatehq/ui/components/ui/sheet'
import { cn } from '@duedatehq/ui/lib/utils'

import {
  formatEnumLabel,
  humanizeDueDateLogic,
  RULE_AUTHORITY_ROLE_LABEL,
} from './rules-console-model'
import { JurisdictionCode, ToneDot } from './rules-console-primitives'
import { useSourceLookup } from './use-source-lookup'

/**
 * Right-side drawer that surfaces the full audit footprint behind a single
 * `ObligationRule` row. Pure presentation: parents pass the already-fetched
 * rule from the `rules.listRules` cache; the drawer never re-issues a query
 * for the rule itself, only for the shared source registry through
 * `useSourceLookup`.
 *
 * Section order is fixed: Applicability → Due-date logic → Extension →
 * Review reasons (conditional) → Evidence → Verification footer. Quality
 * checklist + version compare are intentionally omitted for the read-only
 * MVP (P1 publish flow surface).
 */
export function RuleDetailDrawer({
  rule,
  open,
  onOpenChange,
}: {
  rule: ObligationRule | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-[440px]">
        {rule ? <RuleDetailContent rule={rule} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function RuleDetailContent({ rule }: { rule: ObligationRule }) {
  const sourceLookup = useSourceLookup()

  return (
    <>
      <RuleDrawerHeader rule={rule} />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-5">
          <ApplicabilitySection rule={rule} />
          <DueDateLogicSection rule={rule} />
          <ExtensionSection rule={rule} />
          <ReviewReasonsSection rule={rule} />
          <EvidenceSection rule={rule} sourceLookup={sourceLookup} />
          <VerificationSection rule={rule} />
        </div>
      </div>
    </>
  )
}

function RuleDrawerHeader({ rule }: { rule: ObligationRule }) {
  return (
    <SheetHeader className="gap-2 border-b border-divider-regular px-5 py-4">
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <span className="font-mono text-text-secondary">{rule.id}</span>
        <span aria-hidden>·</span>
        <span className="font-mono">v{rule.version}</span>
        <span aria-hidden>·</span>
        <RuleStatusInline status={rule.status} />
      </div>
      <SheetTitle className="text-md text-text-primary">{rule.title}</SheetTitle>
      <SheetDescription className="sr-only">
        <Trans>Rule detail and evidence</Trans>
      </SheetDescription>
    </SheetHeader>
  )
}

function RuleStatusInline({ status }: { status: ObligationRule['status'] }) {
  if (status === 'candidate') {
    return (
      <span className="inline-flex items-center gap-1.5 text-status-review">
        <ToneDot tone="review" />
        <Trans>Candidate</Trans>
      </span>
    )
  }
  if (status === 'deprecated') {
    return (
      <span className="inline-flex items-center gap-1.5 text-text-tertiary">
        <ToneDot tone="disabled" />
        <Trans>Deprecated</Trans>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-text-secondary">
      <ToneDot tone="success" />
      <Trans>Verified</Trans>
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
      {children}
    </p>
  )
}

function ApplicabilitySection({ rule }: { rule: ObligationRule }) {
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>
        <Trans>Applicability</Trans>
      </SectionLabel>
      <div className="flex flex-wrap items-center gap-2 text-base">
        <JurisdictionCode code={rule.jurisdiction} />
        <span className="text-text-secondary">{rule.entityApplicability.join(', ')}</span>
      </div>
      <div className="grid grid-cols-[88px_1fr] gap-y-1.5 text-base">
        <span className="text-text-tertiary">
          <Trans>Tax type</Trans>
        </span>
        <span className="font-mono text-sm text-text-secondary">{rule.taxType}</span>
        <span className="text-text-tertiary">
          <Trans>Form</Trans>
        </span>
        <span className="text-text-secondary">{rule.formName}</span>
        <span className="text-text-tertiary">
          <Trans>Event</Trans>
        </span>
        <EventRow rule={rule} />
        <span className="text-text-tertiary">
          <Trans>Tax year</Trans>
        </span>
        <span className="font-mono text-sm text-text-secondary">
          {rule.taxYear} → {rule.applicableYear}
        </span>
      </div>
    </section>
  )
}

function EventRow({ rule }: { rule: ObligationRule }) {
  // Surface the eventType as the canonical label and only append "+ filing /
  // + payment" when it adds non-redundant information. eventType is already
  // one of filing/payment/extension/election/information_report; rendering
  // `filing · filing` (the previous version) was a faithful but ugly mirror
  // of the contract's two flag fields.
  const extras: ('filing' | 'payment')[] = []
  if (rule.isFiling && rule.eventType !== 'filing') extras.push('filing')
  if (rule.isPayment && rule.eventType !== 'payment') extras.push('payment')
  return (
    <span className="text-text-secondary">
      {formatEnumLabel(rule.eventType)}
      {extras.length > 0 ? (
        <span className="ml-2 text-text-tertiary">· also {extras.join(' + ')}</span>
      ) : null}
    </span>
  )
}

function DueDateLogicSection({ rule }: { rule: ObligationRule }) {
  const summary = useMemo(() => humanizeDueDateLogic(rule.dueDateLogic), [rule.dueDateLogic])
  const rawJson = useMemo(() => JSON.stringify(rule.dueDateLogic, null, 2), [rule.dueDateLogic])
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>
        <Trans>Due date logic</Trans>
      </SectionLabel>
      <p className="text-base text-text-primary">{summary}</p>
      <details className="group">
        <summary className="cursor-pointer text-xs text-text-tertiary hover:text-text-secondary">
          <Trans>Show raw value</Trans>
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-md bg-background-subtle px-3 py-2 font-mono text-[11px] leading-relaxed text-text-secondary">
          {rawJson}
        </pre>
      </details>
    </section>
  )
}

function ExtensionSection({ rule }: { rule: ObligationRule }) {
  const { extensionPolicy } = rule
  const durationMonths = extensionPolicy.durationMonths
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>
        <Trans>Extension</Trans>
      </SectionLabel>
      {extensionPolicy.available ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2 text-base text-text-primary">
            {extensionPolicy.formName ? (
              <span className="font-medium">{extensionPolicy.formName}</span>
            ) : null}
            {durationMonths !== undefined ? (
              <span className="text-text-secondary">
                <Trans>{durationMonths} months</Trans>
              </span>
            ) : null}
          </div>
          <div className="text-sm">
            {extensionPolicy.paymentExtended ? (
              <span className="inline-flex items-center gap-1.5 text-text-secondary">
                <Trans>Payment is extended along with filing.</Trans>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-severity-medium">
                <TriangleAlertIcon className="size-3.5 shrink-0" aria-hidden />
                <Trans>Filing only — payment NOT extended.</Trans>
              </span>
            )}
          </div>
          <p className="text-xs text-text-tertiary">{extensionPolicy.notes}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 text-base">
          <span className="text-text-secondary">
            <Trans>No extension available.</Trans>
          </span>
          <p className="text-xs text-text-tertiary">{extensionPolicy.notes}</p>
        </div>
      )}
    </section>
  )
}

function ReviewReasonsSection({ rule }: { rule: ObligationRule }) {
  if (rule.status !== 'candidate' && !rule.requiresApplicabilityReview) return null

  if (rule.status === 'candidate') {
    return (
      <section className="rounded-md border border-state-accent-active-alt bg-accent-tint px-3 py-2 text-xs">
        <p className="font-medium text-status-review">
          <Trans>Candidate · never generates user reminders.</Trans>
        </p>
        <p className="mt-1 text-text-secondary">{rule.defaultTip}</p>
      </section>
    )
  }

  return (
    <section className="rounded-md border border-divider-regular bg-severity-medium-tint px-3 py-2 text-xs">
      <p className="font-medium text-severity-medium">
        <Trans>Applicability review · needs CPA confirmation at generation time.</Trans>
      </p>
      <p className="mt-1 text-text-secondary">{rule.defaultTip}</p>
    </section>
  )
}

function EvidenceSection({
  rule,
  sourceLookup,
}: {
  rule: ObligationRule
  sourceLookup: ReadonlyMap<string, RuleSource>
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <SectionLabel>
          <Trans>Evidence</Trans>
        </SectionLabel>
        <span className="font-mono text-xs tabular-nums text-text-tertiary">
          {rule.evidence.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {rule.evidence.map((evidence) => (
          <EvidenceCard
            key={evidenceKey(evidence)}
            evidence={evidence}
            source={sourceLookup.get(evidence.sourceId)}
          />
        ))}
      </div>
    </section>
  )
}

function EvidenceCard({
  evidence,
  source,
}: {
  evidence: RuleEvidence
  source: RuleSource | undefined
}) {
  // Block-level card: render directly as <a> when source.url exists, plain
  // <div> otherwise. Avoids inheriting `inline-flex items-center` from the
  // shared SourceExternalLink (which is intended for inline link usage and
  // would force every column child to horizontally center, plus break the
  // truncate chain when the source title is long).
  const sharedClassName =
    'flex flex-col items-stretch gap-1.5 rounded-md border border-divider-regular bg-background-default px-3 py-2.5 text-left no-underline outline-none'
  const interactiveClassName =
    'hover:border-state-accent-active-alt hover:bg-state-base-hover focus-visible:ring-2 focus-visible:ring-state-accent-active-alt'

  const inner = (
    <>
      <div className="flex w-full min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <AuthorityRoleBadge role={evidence.authorityRole} />
          <span className="min-w-0 flex-1 truncate text-base font-medium text-text-primary">
            {source?.title ?? evidence.sourceId}
          </span>
        </div>
        {source?.url ? (
          <span className="shrink-0 text-sm text-text-accent" aria-hidden>
            ↗
          </span>
        ) : null}
      </div>
      <EvidenceLocator evidence={evidence} />
      <p className="line-clamp-2 text-xs text-text-secondary italic">“{evidence.sourceExcerpt}”</p>
      <EvidenceMeta evidence={evidence} />
    </>
  )

  if (source?.url) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open official source: ${source.title}`}
        onClick={(event) => event.stopPropagation()}
        className={cn(sharedClassName, interactiveClassName)}
      >
        {inner}
      </a>
    )
  }

  return <div className={sharedClassName}>{inner}</div>
}

function evidenceKey(evidence: RuleEvidence): string {
  // RuleEvidence has no natural primary key, but `sourceId + authorityRole +
  // locator.heading` is unique within an `ObligationRule.evidence[]` per the
  // current rule pack (verified by `packages/core/src/rules/index.test.ts`).
  return `${evidence.sourceId}::${evidence.authorityRole}::${evidence.locator.heading ?? ''}`
}

function AuthorityRoleBadge({ role }: { role: RuleEvidenceAuthorityRole }) {
  const className = {
    basis: 'bg-accent-tint text-text-accent',
    cross_check: 'bg-background-subtle text-text-secondary',
    watch: 'bg-severity-medium-tint text-severity-medium',
    early_warning: 'bg-severity-medium-tint text-severity-medium',
  }[role]
  return (
    <Badge
      className={cn(
        'h-[18px] shrink-0 rounded-sm border-transparent px-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.04em]',
        className,
      )}
    >
      {RULE_AUTHORITY_ROLE_LABEL[role]}
    </Badge>
  )
}

function EvidenceLocator({ evidence }: { evidence: RuleEvidence }) {
  const parts: string[] = []
  if (evidence.locator.heading) parts.push(evidence.locator.heading)
  if (evidence.locator.tableLabel) parts.push(`table: ${evidence.locator.tableLabel}`)
  if (evidence.locator.rowLabel) parts.push(`row: ${evidence.locator.rowLabel}`)
  if (evidence.locator.pdfPage !== undefined) parts.push(`p.${evidence.locator.pdfPage}`)
  if (parts.length === 0) return null
  return <p className="text-xs text-text-tertiary">{parts.join(' · ')}</p>
}

function EvidenceMeta({ evidence }: { evidence: RuleEvidence }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
      <span>retrieved {evidence.retrievedAt}</span>
      {evidence.sourceUpdatedOn ? (
        <>
          <span aria-hidden>·</span>
          <span>updated {evidence.sourceUpdatedOn}</span>
        </>
      ) : null}
    </div>
  )
}

function VerificationSection({ rule }: { rule: ObligationRule }) {
  return (
    <section className="flex flex-col gap-1.5 border-t border-divider-subtle pt-4">
      <SectionLabel>
        <Trans>Verification</Trans>
      </SectionLabel>
      <div className="grid grid-cols-[88px_1fr] gap-y-1 text-xs">
        <span className="text-text-tertiary">
          <Trans>Verified by</Trans>
        </span>
        <span className="font-mono text-text-secondary">{rule.verifiedBy}</span>
        <span className="text-text-tertiary">
          <Trans>Verified at</Trans>
        </span>
        <span className="font-mono text-text-secondary">{rule.verifiedAt}</span>
        <span className="text-text-tertiary">
          <Trans>Next review</Trans>
        </span>
        <span className="font-mono text-text-secondary">{rule.nextReviewOn}</span>
      </div>
    </section>
  )
}
