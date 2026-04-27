import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'

import type { ObligationRule, RuleJurisdiction } from '@duedatehq/contracts'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'
import { cn } from '@duedatehq/ui/lib/utils'

import { orpc } from '@/lib/rpc'

import {
  countRulesByFilter,
  filterRules,
  RULE_JURISDICTIONS,
  type RuleLibraryFilter,
} from './rules-console-model'
import {
  FilterChips,
  JurisdictionCode,
  QueryPanelState,
  SectionFrame,
  TableFooterBar,
  ToneDot,
} from './rules-console-primitives'

type JurisdictionFilter = 'ALL' | RuleJurisdiction
type TierKey = ObligationRule['ruleTier']
type StatusKey = ObligationRule['status']

const DEFAULT_VISIBLE_RULE_ROWS = 13
const EMPTY_RULE_ROWS: ObligationRule[] = []

export function RuleLibraryTab() {
  const { t } = useLingui()
  const [libraryFilter, setLibraryFilter] = useState<RuleLibraryFilter>('all')
  const [jurisdictionFilter, setJurisdictionFilter] = useState<JurisdictionFilter>('ALL')
  const [showAll, setShowAll] = useState(false)

  const queryInput = {
    includeCandidates: true,
    ...(jurisdictionFilter === 'ALL' ? {} : { jurisdiction: jurisdictionFilter }),
  }
  const rulesQuery = useQuery(orpc.rules.listRules.queryOptions({ input: queryInput }))

  const rows = useMemo(() => rulesQuery.data ?? EMPTY_RULE_ROWS, [rulesQuery.data])
  const counts = useMemo(() => countRulesByFilter(rows), [rows])
  const filteredRows = useMemo(() => filterRules(rows, libraryFilter), [libraryFilter, rows])
  const visibleRows = showAll ? filteredRows : filteredRows.slice(0, DEFAULT_VISIBLE_RULE_ROWS)

  const filterOptions = useMemo(
    () => [
      { value: 'all' as const, label: t`All`, count: counts.all },
      { value: 'verified' as const, label: t`Verified`, count: counts.verified },
      { value: 'candidate' as const, label: t`Candidate`, count: counts.candidate },
      {
        value: 'applicability_review' as const,
        label: t`Applicability review`,
        count: counts.applicability_review,
      },
      { value: 'exception' as const, label: t`Exception`, count: counts.exception },
    ],
    [counts, t],
  )

  if (rulesQuery.isLoading) {
    return <QueryPanelState state="loading" message={t`Loading rule library.`} />
  }

  if (rulesQuery.isError) {
    return <QueryPanelState state="error" message={t`Could not load rule library.`} />
  }

  const footerNote = t`Showing ${visibleRows.length} of ${filteredRows.length} · candidate rows do not generate user reminders · warning flag = needs applicability review`
  const showAllAction = t`Show all ${filteredRows.length} →`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <FilterChips
          options={filterOptions}
          value={libraryFilter}
          onValueChange={(value) => {
            setLibraryFilter(value)
            setShowAll(false)
          }}
        />
        <JurisdictionFilterSelect
          value={jurisdictionFilter}
          onValueChange={setJurisdictionFilter}
        />
      </div>
      <SectionFrame>
        <Table>
          <TableHeader className="bg-background-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[52px]">JUR</TableHead>
              <TableHead>RULE ID</TableHead>
              <TableHead className="w-[170px]">ENTITY</TableHead>
              <TableHead className="w-[180px]">TIER</TableHead>
              <TableHead className="w-[120px]">STATUS</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((rule) => (
              <TableRow
                key={`${rule.id}-${rule.version}`}
                className={cn(
                  'h-9 hover:bg-transparent',
                  rule.status === 'candidate' && 'bg-accent-tint',
                )}
              >
                <TableCell className="py-2">
                  <JurisdictionCode code={rule.jurisdiction} />
                </TableCell>
                <TableCell className="max-w-[300px] py-2 font-mono text-sm font-medium">
                  <span className="block truncate">{rule.id}</span>
                </TableCell>
                <TableCell className="max-w-[168px] py-2 text-sm text-text-secondary">
                  <span className="block truncate">{rule.entityApplicability.join(', ')}</span>
                </TableCell>
                <TableCell className="py-2">
                  <TierBadge tier={rule.ruleTier} needsReview={rule.requiresApplicabilityReview} />
                </TableCell>
                <TableCell className="py-2">
                  <StatusCell status={rule.status} />
                </TableCell>
                <TableCell className="py-2 text-right text-sm text-text-disabled">›</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredRows.length > visibleRows.length ? (
          <TableFooterBar
            note={footerNote}
            action={showAllAction}
            onAction={() => setShowAll(true)}
          />
        ) : (
          <TableFooterBar note={footerNote} />
        )}
      </SectionFrame>
    </div>
  )
}

function StatusCell({ status }: { status: StatusKey }) {
  const { t } = useLingui()
  const label = useMemo<Record<StatusKey, string>>(
    () => ({
      verified: t`Verified`,
      candidate: t`Candidate`,
      deprecated: t`Deprecated`,
    }),
    [t],
  )
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
      <ToneDot tone={status === 'candidate' ? 'review' : 'success'} />
      {label[status]}
    </span>
  )
}

function TierBadge({ tier, needsReview }: { tier: TierKey; needsReview: boolean }) {
  const { t } = useLingui()
  const tierLabels = useMemo<Record<TierKey, string>>(
    () => ({
      basic: t`Basic`,
      annual_rolling: t`Annual rolling`,
      exception: t`Exception`,
      applicability_review: t`Applicability review`,
    }),
    [t],
  )
  const className = {
    basic: 'bg-background-subtle text-text-secondary',
    annual_rolling: 'bg-accent-tint text-text-accent',
    exception: 'bg-severity-critical-tint text-severity-critical',
    applicability_review: 'bg-severity-medium-tint text-severity-medium',
  }[tier]
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-2 rounded px-2 text-xs font-medium',
        className,
      )}
    >
      {tierLabels[tier]}
      {needsReview ? (
        <span className="text-severity-medium" aria-hidden>
          ⚠
        </span>
      ) : null}
    </span>
  )
}

function JurisdictionFilterSelect({
  value,
  onValueChange,
}: {
  value: JurisdictionFilter
  onValueChange: (value: JurisdictionFilter) => void
}) {
  const { t } = useLingui()
  const labels = useMemo<Record<JurisdictionFilter, string>>(
    () => ({
      ALL: t`All`,
      FED: t`Federal`,
      CA: t`California`,
      NY: t`New York`,
      TX: t`Texas`,
      FL: t`Florida`,
      WA: t`Washington`,
    }),
    [t],
  )
  return (
    <div className="flex shrink-0 items-center gap-2 text-sm text-text-tertiary">
      <span>
        <Trans>Jurisdiction:</Trans>
      </span>
      <Select
        value={value}
        onValueChange={(next) => {
          if (isJurisdictionFilter(next)) {
            onValueChange(next)
          }
        }}
      >
        <SelectTrigger size="sm" className="h-7 min-w-24 bg-transparent px-2 text-sm shadow-none">
          <SelectValue>{labels[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectItem value="ALL">{labels.ALL}</SelectItem>
            {RULE_JURISDICTIONS.map((jurisdiction) => (
              <SelectItem key={jurisdiction} value={jurisdiction}>
                {labels[jurisdiction]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

function isJurisdictionFilter(value: string | null): value is JurisdictionFilter {
  if (value === 'ALL') return true
  if (typeof value !== 'string') return false
  return (RULE_JURISDICTIONS as readonly string[]).includes(value)
}
