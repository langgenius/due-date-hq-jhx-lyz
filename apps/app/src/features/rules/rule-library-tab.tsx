import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { CheckIcon, EyeIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { ObligationRule, RuleBulkImpactPreview, RuleReviewTask } from '@duedatehq/contracts'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'
import { Textarea } from '@duedatehq/ui/components/ui/textarea'
import { cn } from '@duedatehq/ui/lib/utils'

import {
  TableHeaderMultiFilter,
  type TableFilterOption,
} from '@/components/patterns/table-header-filter'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

import { RuleDetailDrawer } from './rule-detail-drawer'
import {
  countRulesByFilter,
  filterRules,
  formatEnumLabel,
  jurisdictionLabel,
  type RuleLibraryFilter,
} from './rules-console-model'
import {
  FilterChips,
  JurisdictionCode,
  QueryPanelState,
  SectionFrame,
  SectionLabel,
  TablePaginationFooter,
  ToneDot,
} from './rules-console-primitives'

type RuleHeaderFilterId = 'jurisdiction' | 'entity' | 'tier' | 'status'
type TierKey = ObligationRule['ruleTier']
type StatusKey = ObligationRule['status']

const RULE_PAGE_SIZE = 25
const EMPTY_RULE_ROWS: ObligationRule[] = []
const EMPTY_REVIEW_TASKS: RuleReviewTask[] = []

function ruleRowKey(rule: Pick<ObligationRule, 'id' | 'status' | 'version'>): string {
  return `${rule.id}:${rule.version}:${rule.status}`
}

function reviewTaskKey(input: Pick<RuleReviewTask, 'ruleId' | 'templateVersion'>): string {
  return `${input.ruleId}:${input.templateVersion}`
}

function reviewTaskKeyForRule(rule: Pick<ObligationRule, 'id' | 'version'>): string {
  return `${rule.id}:${rule.version}`
}

export function RuleLibraryTab() {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const [libraryFilter, setLibraryFilter] = useState<RuleLibraryFilter>('pending_review')
  const [jurisdictionFilters, setJurisdictionFilters] = useState<string[]>([])
  const [entityFilters, setEntityFilters] = useState<string[]>([])
  const [tierFilters, setTierFilters] = useState<string[]>([])
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [openHeaderFilter, setOpenHeaderFilter] = useState<RuleHeaderFilterId | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedRuleKey, setSelectedRuleKey] = useState<string | null>(null)
  const [selectedRuleKeys, setSelectedRuleKeys] = useState<string[]>([])
  const [reviewNote, setReviewNote] = useState('')
  const [preview, setPreview] = useState<RuleBulkImpactPreview | null>(null)

  const rulesQuery = useQuery(
    orpc.rules.listRules.queryOptions({ input: { includeCandidates: true } }),
  )
  const tasksQuery = useQuery(
    orpc.rules.listReviewTasks.queryOptions({ input: { status: 'open' } }),
  )

  const rows = useMemo(() => rulesQuery.data ?? EMPTY_RULE_ROWS, [rulesQuery.data])
  const reviewTasks = useMemo(() => tasksQuery.data ?? EMPTY_REVIEW_TASKS, [tasksQuery.data])
  const openTaskByRuleVersion = useMemo(
    () => new Map(reviewTasks.map((task) => [reviewTaskKey(task), task])),
    [reviewTasks],
  )
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
  const selectedRows = useMemo(
    () =>
      filteredRows.filter(
        (rule) =>
          selectedRuleKeys.includes(ruleRowKey(rule)) &&
          canBulkReviewRule(rule, openTaskByRuleVersion),
      ),
    [filteredRows, openTaskByRuleVersion, selectedRuleKeys],
  )
  const selections = selectedRows.map((rule) => ({
    ruleId: rule.id,
    expectedVersion:
      openTaskByRuleVersion.get(reviewTaskKeyForRule(rule))?.templateVersion ?? rule.version,
  }))
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / RULE_PAGE_SIZE))
  const currentPageIndex = Math.min(pageIndex, pageCount - 1)
  const pageStartIndex = currentPageIndex * RULE_PAGE_SIZE
  const visibleRows = filteredRows.slice(pageStartIndex, pageStartIndex + RULE_PAGE_SIZE)
  const firstItemNumber = filteredRows.length > 0 ? pageStartIndex + 1 : 0
  const lastItemNumber = pageStartIndex + visibleRows.length
  const visibleSelectableRows = visibleRows.filter((rule) =>
    canBulkReviewRule(rule, openTaskByRuleVersion),
  )
  const visibleSelectedRows = visibleSelectableRows.filter((rule) =>
    selectedRuleKeys.includes(ruleRowKey(rule)),
  )
  const allVisibleSelected =
    visibleSelectableRows.length > 0 && visibleSelectedRows.length === visibleSelectableRows.length
  const showBulkPanel =
    libraryFilter === 'pending_review' || selectedRows.length > 0 || preview !== null
  const selectedRule = useMemo(
    () =>
      selectedRuleKey ? (rows.find((rule) => ruleRowKey(rule) === selectedRuleKey) ?? null) : null,
    [rows, selectedRuleKey],
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

  const handleRuleSelect = useCallback(
    (rule: ObligationRule) => setSelectedRuleKey(ruleRowKey(rule)),
    [],
  )
  const handleDrawerOpenChange = useCallback((open: boolean) => {
    if (!open) setSelectedRuleKey(null)
  }, [])
  const clearBulkSelection = useCallback(() => {
    setSelectedRuleKeys([])
    setPreview(null)
  }, [])

  const filterOptions = useMemo(
    () => [
      {
        value: 'pending_review' as const,
        label: t`Needs review`,
        count: counts.pending_review,
      },
      { value: 'active' as const, label: t`Active`, count: counts.active },
      { value: 'all' as const, label: t`All`, count: counts.all },
      { value: 'rejected' as const, label: t`Rejected`, count: counts.rejected },
      { value: 'archived' as const, label: t`Archived`, count: counts.archived },
      {
        value: 'applicability_review' as const,
        label: t`Applicability review`,
        count: counts.applicability_review,
      },
      { value: 'exception' as const, label: t`Exception`, count: counts.exception },
    ],
    [counts, t],
  )

  const invalidateRules = () => {
    void queryClient.invalidateQueries({ queryKey: orpc.rules.key() })
    void queryClient.invalidateQueries({ queryKey: orpc.audit.key() })
  }

  const previewMutation = useMutation(
    orpc.rules.previewBulkRuleImpact.mutationOptions({
      onSuccess: (result) => setPreview(result),
      onError: (error) => {
        toast.error(t`Could not preview selected rules`, {
          description: rpcErrorMessage(error) ?? t`Check the selected rows and try again.`,
        })
      },
    }),
  )
  const bulkAcceptMutation = useMutation(
    orpc.rules.bulkAcceptTemplates.mutationOptions({
      onSuccess: (result) => {
        invalidateRules()
        setSelectedRuleKeys([])
        setReviewNote('')
        setPreview(null)
        toast.success(t`Rules accepted`, {
          description: t`${result.accepted.length} accepted · ${result.skipped.length} skipped.`,
        })
      },
      onError: (error) => {
        toast.error(t`Could not accept selected rules`, {
          description: rpcErrorMessage(error) ?? t`Add a review note and try again.`,
        })
      },
    }),
  )

  if (rulesQuery.isLoading || tasksQuery.isLoading) {
    return <QueryPanelState state="loading" message={t`Loading rule library.`} />
  }

  if (rulesQuery.isError || tasksQuery.isError) {
    return <QueryPanelState state="error" message={t`Could not load rule library.`} />
  }

  const emptyFilterLabel = t`No options`

  function setHeaderFilterOpen(filterId: RuleHeaderFilterId, nextOpen: boolean) {
    setOpenHeaderFilter((current) => (nextOpen ? filterId : current === filterId ? null : current))
  }

  function updateHeaderFilter(setter: (values: string[]) => void, values: string[]) {
    setter(values)
    setPageIndex(0)
    clearBulkSelection()
  }

  function updateLibraryFilter(value: RuleLibraryFilter) {
    setLibraryFilter(value)
    setPageIndex(0)
    clearBulkSelection()
  }

  function toggleRule(rowKey: string, checked: boolean) {
    setSelectedRuleKeys((current) =>
      checked
        ? current.includes(rowKey)
          ? current
          : [...current, rowKey]
        : current.filter((key) => key !== rowKey),
    )
    setPreview(null)
  }

  function toggleVisible(checked: boolean) {
    const visibleKeys = visibleSelectableRows.map(ruleRowKey)
    setSelectedRuleKeys((current) =>
      checked
        ? Array.from(new Set([...current, ...visibleKeys]))
        : current.filter((key) => !visibleKeys.includes(key)),
    )
    setPreview(null)
  }

  function runPreview() {
    if (selections.length === 0) {
      toast.error(t`Select at least one pending rule.`)
      return
    }
    previewMutation.mutate({ rules: selections })
  }

  function bulkAccept() {
    const note = reviewNote.trim()
    if (selections.length === 0) {
      toast.error(t`Select at least one pending rule.`)
      return
    }
    if (!note) {
      toast.error(t`Batch review note is required.`)
      return
    }
    bulkAcceptMutation.mutate({ rules: selections, reviewNote: note })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <FilterChips
          options={filterOptions}
          value={libraryFilter}
          onValueChange={updateLibraryFilter}
        />
      </div>
      <div className={cn('grid gap-4', showBulkPanel && 'xl:grid-cols-[minmax(0,1fr)_360px]')}>
        <SectionFrame>
          <Table>
            <TableHeader className="bg-background-subtle">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 px-3">
                  <input
                    type="checkbox"
                    aria-label={t`Select visible pending rules`}
                    checked={allVisibleSelected}
                    disabled={visibleSelectableRows.length === 0}
                    onChange={(event) => toggleVisible(event.target.checked)}
                    className="size-4 disabled:opacity-40"
                  />
                </TableHead>
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
                <TableHead>RULE</TableHead>
                <TableHead className="w-[160px]">FORM</TableHead>
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
                <TableHead className="w-[90px]">VERSION</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((rule) => (
                <RuleRow
                  key={ruleRowKey(rule)}
                  rule={rule}
                  reviewTask={openTaskByRuleVersion.get(reviewTaskKeyForRule(rule)) ?? null}
                  selected={
                    selectedRuleKeys.includes(ruleRowKey(rule)) &&
                    canBulkReviewRule(rule, openTaskByRuleVersion)
                  }
                  onSelectedChange={toggleRule}
                  onSelect={handleRuleSelect}
                />
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
        {showBulkPanel ? (
          <SectionFrame className="h-fit px-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <SectionLabel>
                  <Trans>BULK CONFIRM</Trans>
                </SectionLabel>
                <span className="font-mono text-xs text-text-tertiary">
                  <Trans>{selectedRows.length} selected</Trans>
                </span>
              </div>
              <BulkPreviewSummary preview={preview} />
              <label className="flex flex-col gap-1 text-xs text-text-tertiary">
                <span>
                  <Trans>Batch review note</Trans>
                </span>
                <Textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  className="min-h-24 text-xs"
                  placeholder={t`Accepted by practice owner/manager after reviewing source-backed templates.`}
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={runPreview}
                  disabled={previewMutation.isPending || selections.length === 0}
                >
                  <EyeIcon data-icon="inline-start" />
                  <Trans>Preview</Trans>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={bulkAccept}
                  disabled={bulkAcceptMutation.isPending || selections.length === 0}
                >
                  <CheckIcon data-icon="inline-start" />
                  <Trans>Accept selected</Trans>
                </Button>
              </div>
            </div>
          </SectionFrame>
        ) : null}
      </div>
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
  reviewTask,
  selected,
  onSelectedChange,
  onSelect,
}: {
  rule: ObligationRule
  reviewTask: RuleReviewTask | null
  selected: boolean
  onSelectedChange: (rowKey: string, checked: boolean) => void
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
      <TableCell className="px-3 py-2">
        <input
          type="checkbox"
          aria-label={t`Select rule ${rule.title}`}
          checked={selected}
          disabled={!reviewTask}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => onSelectedChange(ruleRowKey(rule), event.target.checked)}
          className="size-4 disabled:opacity-30"
        />
      </TableCell>
      <TableCell className="py-2">
        <JurisdictionCode code={rule.jurisdiction} />
      </TableCell>
      <TableCell className="max-w-[360px] py-2">
        <span className="block truncate text-xs font-medium text-text-primary">{rule.title}</span>
        <span className="block truncate font-mono text-xs text-text-tertiary">{rule.id}</span>
        {reviewTask ? (
          <span className="mt-0.5 inline-flex text-[11px] font-medium text-severity-medium">
            {reviewTask.reason === 'source_changed' ? t`Update available` : t`New template`}
          </span>
        ) : null}
      </TableCell>
      <TableCell className="py-2 text-xs text-text-secondary">{rule.formName}</TableCell>
      <TableCell className="max-w-[168px] py-2 text-xs text-text-secondary">
        <span className="block truncate">
          {rule.entityApplicability.map(formatEnumLabel).join(', ')}
        </span>
      </TableCell>
      <TableCell className="py-2">
        <TierBadge tier={rule.ruleTier} needsReview={rule.requiresApplicabilityReview} />
      </TableCell>
      <TableCell className="py-2">
        <StatusCell status={rule.status} />
      </TableCell>
      <TableCell className="py-2 font-mono text-xs text-text-tertiary">v{rule.version}</TableCell>
      <TableCell className="py-2 text-right text-xs text-text-tertiary">›</TableCell>
    </TableRow>
  )
}

function canBulkReviewRule(
  rule: ObligationRule,
  openTaskByRuleVersion: ReadonlyMap<string, RuleReviewTask>,
): boolean {
  return rule.status === 'pending_review' && openTaskByRuleVersion.has(reviewTaskKeyForRule(rule))
}

function BulkPreviewSummary({ preview }: { preview: RuleBulkImpactPreview | null }) {
  if (!preview) {
    return (
      <div className="rounded-md border border-divider-regular bg-background-subtle px-3 py-3 text-xs text-text-tertiary">
        <Trans>Preview selected rules before accepting them into production.</Trans>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-divider-regular bg-background-subtle px-3 py-3 text-xs">
      <div className="grid gap-2 text-text-secondary">
        <span>
          <Trans>
            {preview.acceptReadyCount} ready · {preview.estimatedObligationCount} estimated
            obligation matches
          </Trans>
        </span>
        <span>
          <Trans>{preview.sourceCount} sources involved</Trans>
        </span>
      </div>
      {preview.jurisdictionCounts.length > 0 ? (
        <PreviewList label={<Trans>Jurisdictions</Trans>} rows={preview.jurisdictionCounts} />
      ) : null}
      {preview.formCounts.length > 0 ? (
        <PreviewList label={<Trans>Forms</Trans>} rows={preview.formCounts} />
      ) : null}
      {preview.entityCounts.length > 0 ? (
        <PreviewList label={<Trans>Entities</Trans>} rows={preview.entityCounts} />
      ) : null}
      {preview.reviewReasonCounts.length > 0 ? (
        <PreviewList label={<Trans>Review reasons</Trans>} rows={preview.reviewReasonCounts} />
      ) : null}
      {preview.reviewReasonCounts.some((row) => row.key === 'source_changed') ? (
        <div className="flex items-start gap-2 text-severity-medium">
          <ToneDot tone="warning" />
          <span>
            <Trans>Source-changed rules should be checked against evidence before accepting.</Trans>
          </span>
        </div>
      ) : null}
      {preview.skipped.length > 0 ? (
        <div className="flex flex-col gap-1 text-severity-medium">
          <span className="inline-flex items-center gap-2 font-medium">
            <ToneDot tone="warning" />
            <Trans>Skipped</Trans>
          </span>
          <span>{preview.skipped.map((row) => row.reason).join(', ')}</span>
        </div>
      ) : null}
    </div>
  )
}

function PreviewList({
  label,
  rows,
}: {
  label: ReactNode
  rows: RuleBulkImpactPreview['jurisdictionCounts']
}) {
  return (
    <div className="flex flex-col gap-1 text-text-secondary">
      <span className="font-medium">{label}</span>
      <span>
        {rows
          .slice(0, 6)
          .map((row) => `${row.key} ${row.count}`)
          .join(' · ')}
      </span>
    </div>
  )
}

function StatusCell({ status }: { status: StatusKey }) {
  const label = useRuleStatusLabels()
  const tone =
    status === 'active' || status === 'verified'
      ? 'success'
      : status === 'rejected' || status === 'archived'
        ? 'disabled'
        : 'review'
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-text-primary">
      <ToneDot tone={tone} />
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
      active: t`Active`,
      pending_review: t`Pending review`,
      rejected: t`Rejected`,
      archived: t`Archived`,
      verified: t`Active`,
      candidate: t`Pending review`,
      deprecated: t`Deprecated`,
    }),
    [t],
  )
}
