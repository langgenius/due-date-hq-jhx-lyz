import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLingui } from '@lingui/react/macro'

import type { ObligationRule } from '@duedatehq/contracts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'
import { cn } from '@duedatehq/ui/lib/utils'

import {
  TableHeaderMultiFilter,
  type TableFilterOption,
} from '@/components/patterns/table-header-filter'
import { orpc } from '@/lib/rpc'

import { RuleDetailDrawer } from './rule-detail-drawer'
import {
  countRulesByFilter,
  filterRules,
  jurisdictionLabel,
  type RuleLibraryFilter,
} from './rules-console-model'
import {
  FilterChips,
  JurisdictionCode,
  QueryPanelState,
  SectionFrame,
  TablePaginationFooter,
  ToneDot,
} from './rules-console-primitives'

type RuleHeaderFilterId = 'jurisdiction' | 'entity' | 'tier' | 'status'
type TierKey = ObligationRule['ruleTier']
type StatusKey = ObligationRule['status']

const RULE_PAGE_SIZE = 25
const EMPTY_RULE_ROWS: ObligationRule[] = []

export function RuleLibraryTab() {
  const { t } = useLingui()
  const [libraryFilter, setLibraryFilter] = useState<RuleLibraryFilter>('all')
  const [jurisdictionFilters, setJurisdictionFilters] = useState<string[]>([])
  const [entityFilters, setEntityFilters] = useState<string[]>([])
  const [tierFilters, setTierFilters] = useState<string[]>([])
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [openHeaderFilter, setOpenHeaderFilter] = useState<RuleHeaderFilterId | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)

  const rulesQuery = useQuery(
    orpc.rules.listRules.queryOptions({ input: { includeCandidates: true } }),
  )

  const rows = useMemo(() => rulesQuery.data ?? EMPTY_RULE_ROWS, [rulesQuery.data])
  const counts = useMemo(() => countRulesByFilter(rows), [rows])
  const tierLabels = useRuleTierLabels()
  const statusLabels = useRuleStatusLabels()
  const filteredRows = useMemo(
    () =>
      filterRules(rows, libraryFilter).filter(
        (rule) =>
          matchesSelected(rule.jurisdiction, jurisdictionFilters) &&
          matchesAnySelected(rule.entityApplicability, entityFilters) &&
          matchesSelected(rule.ruleTier, tierFilters) &&
          matchesSelected(rule.status, statusFilters),
      ),
    [entityFilters, jurisdictionFilters, libraryFilter, rows, statusFilters, tierFilters],
  )
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / RULE_PAGE_SIZE))
  const currentPageIndex = Math.min(pageIndex, pageCount - 1)
  const pageStartIndex = currentPageIndex * RULE_PAGE_SIZE
  const visibleRows = filteredRows.slice(pageStartIndex, pageStartIndex + RULE_PAGE_SIZE)
  const firstItemNumber = filteredRows.length > 0 ? pageStartIndex + 1 : 0
  const lastItemNumber = pageStartIndex + visibleRows.length
  const selectedRule = useMemo(
    () => (selectedRuleId ? (rows.find((rule) => rule.id === selectedRuleId) ?? null) : null),
    [rows, selectedRuleId],
  )
  const jurisdictionOptions = useMemo(
    () => ruleFilterOptions(rows, (rule) => [rule.jurisdiction], jurisdictionLabel),
    [rows],
  )
  const entityOptions = useMemo(
    () =>
      ruleFilterOptions(
        rows,
        (rule) => rule.entityApplicability,
        (entity) => entity.replaceAll('_', ' '),
      ),
    [rows],
  )
  const tierOptions = useMemo(
    () =>
      ruleFilterOptions(
        rows,
        (rule) => [rule.ruleTier],
        (tier) => tierLabels[tier],
      ),
    [rows, tierLabels],
  )
  const statusOptions = useMemo(
    () =>
      ruleFilterOptions(
        rows,
        (rule) => [rule.status],
        (status) => statusLabels[status],
      ),
    [rows, statusLabels],
  )

  const handleRuleSelect = useCallback((rule: ObligationRule) => setSelectedRuleId(rule.id), [])
  const handleDrawerOpenChange = useCallback((open: boolean) => {
    if (!open) setSelectedRuleId(null)
  }, [])

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

  const emptyFilterLabel = t`No options`

  function setHeaderFilterOpen(filterId: RuleHeaderFilterId, nextOpen: boolean) {
    setOpenHeaderFilter((current) => (nextOpen ? filterId : current === filterId ? null : current))
  }

  function updateHeaderFilter(setter: (values: string[]) => void, values: string[]) {
    setter(values)
    setPageIndex(0)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <FilterChips
          options={filterOptions}
          value={libraryFilter}
          onValueChange={(value) => {
            setLibraryFilter(value)
            setPageIndex(0)
          }}
        />
      </div>
      <SectionFrame>
        <Table>
          <TableHeader className="bg-background-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[82px] px-3">
                <TableHeaderMultiFilter
                  trigger="header"
                  label={t`JUR`}
                  open={openHeaderFilter === 'jurisdiction'}
                  onOpenChange={(nextOpen) => setHeaderFilterOpen('jurisdiction', nextOpen)}
                  options={jurisdictionOptions}
                  selected={jurisdictionFilters}
                  emptyLabel={emptyFilterLabel}
                  searchable
                  searchPlaceholder={t`Filter jurisdictions`}
                  onSelectedChange={(next) => updateHeaderFilter(setJurisdictionFilters, next)}
                />
              </TableHead>
              <TableHead>RULE ID</TableHead>
              <TableHead className="w-[190px] px-3">
                <TableHeaderMultiFilter
                  trigger="header"
                  label={t`ENTITY`}
                  open={openHeaderFilter === 'entity'}
                  onOpenChange={(nextOpen) => setHeaderFilterOpen('entity', nextOpen)}
                  options={entityOptions}
                  selected={entityFilters}
                  emptyLabel={emptyFilterLabel}
                  onSelectedChange={(next) => updateHeaderFilter(setEntityFilters, next)}
                />
              </TableHead>
              <TableHead className="w-[210px] px-3">
                <TableHeaderMultiFilter
                  trigger="header"
                  label={t`TIER`}
                  open={openHeaderFilter === 'tier'}
                  onOpenChange={(nextOpen) => setHeaderFilterOpen('tier', nextOpen)}
                  options={tierOptions}
                  selected={tierFilters}
                  emptyLabel={emptyFilterLabel}
                  onSelectedChange={(next) => updateHeaderFilter(setTierFilters, next)}
                />
              </TableHead>
              <TableHead className="w-[140px] px-3">
                <TableHeaderMultiFilter
                  trigger="header"
                  label={t`STATUS`}
                  open={openHeaderFilter === 'status'}
                  onOpenChange={(nextOpen) => setHeaderFilterOpen('status', nextOpen)}
                  options={statusOptions}
                  selected={statusFilters}
                  emptyLabel={emptyFilterLabel}
                  onSelectedChange={(next) => updateHeaderFilter(setStatusFilters, next)}
                />
              </TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((rule) => (
              <RuleRow key={`${rule.id}-${rule.version}`} rule={rule} onSelect={handleRuleSelect} />
            ))}
          </TableBody>
        </Table>
        <TablePaginationFooter
          pageIndex={currentPageIndex}
          pageCount={pageCount}
          firstItemNumber={firstItemNumber}
          lastItemNumber={lastItemNumber}
          totalCount={filteredRows.length}
          onPreviousPage={() => setPageIndex(Math.max(0, currentPageIndex - 1))}
          onNextPage={() => setPageIndex(Math.min(pageCount - 1, currentPageIndex + 1))}
        />
      </SectionFrame>
      <RuleDetailDrawer
        rule={selectedRule}
        open={selectedRule !== null}
        onOpenChange={handleDrawerOpenChange}
      />
    </div>
  )
}

function matchesSelected(value: string, selected: readonly string[]): boolean {
  return selected.length === 0 || selected.includes(value)
}

function matchesAnySelected(values: readonly string[], selected: readonly string[]): boolean {
  return selected.length === 0 || values.some((value) => selected.includes(value))
}

function ruleFilterOptions<T extends string>(
  rules: readonly ObligationRule[],
  getValues: (rule: ObligationRule) => readonly T[],
  getLabel: (value: T) => string,
): TableFilterOption[] {
  const counts = new Map<T, number>()
  for (const rule of rules) {
    for (const value of getValues(rule)) {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: getLabel(value), count }))
    .toSorted((left, right) => left.label.localeCompare(right.label))
}

function RuleRow({
  rule,
  onSelect,
}: {
  rule: ObligationRule
  onSelect: (rule: ObligationRule) => void
}) {
  const { t } = useLingui()
  const handleClick = useCallback(() => onSelect(rule), [onSelect, rule])
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect(rule)
      }
    },
    [onSelect, rule],
  )

  return (
    <TableRow
      role="button"
      tabIndex={0}
      aria-label={t`Open rule detail: ${rule.title}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="h-9 cursor-pointer outline-none hover:bg-state-base-hover focus-visible:bg-state-base-hover focus-visible:ring-2 focus-visible:ring-state-accent-active-alt focus-visible:ring-inset"
    >
      <TableCell className="py-2">
        <JurisdictionCode code={rule.jurisdiction} />
      </TableCell>
      <TableCell className="max-w-[300px] py-2 font-mono text-xs font-medium">
        <span className="block truncate">{rule.id}</span>
      </TableCell>
      <TableCell className="max-w-[168px] py-2 text-xs text-text-secondary">
        <span className="block truncate">{rule.entityApplicability.join(', ')}</span>
      </TableCell>
      <TableCell className="py-2">
        <TierBadge tier={rule.ruleTier} needsReview={rule.requiresApplicabilityReview} />
      </TableCell>
      <TableCell className="py-2">
        <StatusCell status={rule.status} />
      </TableCell>
      <TableCell className="py-2 text-right text-xs text-text-tertiary">›</TableCell>
    </TableRow>
  )
}

function StatusCell({ status }: { status: StatusKey }) {
  const label = useRuleStatusLabels()
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-text-primary">
      <ToneDot tone={status === 'candidate' ? 'review' : 'success'} />
      {label[status]}
    </span>
  )
}

function TierBadge({ tier, needsReview }: { tier: TierKey; needsReview: boolean }) {
  const tierLabels = useRuleTierLabels()
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

function useRuleTierLabels(): Record<TierKey, string> {
  const { t } = useLingui()
  return useMemo(
    () => ({
      basic: t`Basic`,
      annual_rolling: t`Annual rolling`,
      exception: t`Exception`,
      applicability_review: t`Applicability review`,
    }),
    [t],
  )
}

function useRuleStatusLabels(): Record<StatusKey, string> {
  const { t } = useLingui()
  return useMemo(
    () => ({
      verified: t`Verified`,
      candidate: t`Candidate`,
      deprecated: t`Deprecated`,
    }),
    [t],
  )
}
