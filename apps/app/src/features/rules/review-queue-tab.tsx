import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { CheckIcon, EyeIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { RuleBulkImpactPreview, RuleReviewTask } from '@duedatehq/contracts'
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

import {
  TableHeaderMultiFilter,
  type TableFilterOption,
} from '@/components/patterns/table-header-filter'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

import { formatEnumLabel, jurisdictionLabel } from './rules-console-model'
import {
  JurisdictionCode,
  QueryPanelState,
  SectionFrame,
  SectionLabel,
  TablePaginationFooter,
  ToneDot,
} from './rules-console-primitives'

const REVIEW_PAGE_SIZE = 25
const EMPTY_TASKS: RuleReviewTask[] = []

export function ReviewQueueTab() {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const [jurisdictionFilters, setJurisdictionFilters] = useState<string[]>([])
  const [openHeaderFilter, setOpenHeaderFilter] = useState<'jurisdiction' | null>(null)
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([])
  const [reviewNote, setReviewNote] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [preview, setPreview] = useState<RuleBulkImpactPreview | null>(null)

  const tasksQuery = useQuery(
    orpc.rules.listReviewTasks.queryOptions({ input: { status: 'open' } }),
  )
  const rows = useMemo(() => tasksQuery.data ?? EMPTY_TASKS, [tasksQuery.data])
  const filteredRows = useMemo(
    () =>
      rows.filter(
        (task) =>
          jurisdictionFilters.length === 0 || jurisdictionFilters.includes(task.rule.jurisdiction),
      ),
    [jurisdictionFilters, rows],
  )
  const selectedRows = filteredRows.filter((task) => selectedRuleIds.includes(task.ruleId))
  const selections = selectedRows.map((task) => ({
    ruleId: task.ruleId,
    expectedVersion: task.templateVersion,
  }))
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / REVIEW_PAGE_SIZE))
  const currentPageIndex = Math.min(pageIndex, pageCount - 1)
  const pageStartIndex = currentPageIndex * REVIEW_PAGE_SIZE
  const visibleRows = filteredRows.slice(pageStartIndex, pageStartIndex + REVIEW_PAGE_SIZE)
  const firstItemNumber = filteredRows.length > 0 ? pageStartIndex + 1 : 0
  const lastItemNumber = pageStartIndex + visibleRows.length
  const visibleSelected = visibleRows.filter((task) => selectedRuleIds.includes(task.ruleId))
  const allVisibleSelected = visibleRows.length > 0 && visibleSelected.length === visibleRows.length
  const jurisdictionOptions = useMemo(
    () => reviewFilterOptions(rows, (task) => task.rule.jurisdiction, jurisdictionLabel),
    [rows],
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
        setSelectedRuleIds([])
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

  if (tasksQuery.isLoading) {
    return <QueryPanelState state="loading" message={t`Loading rule review queue.`} />
  }

  if (tasksQuery.isError) {
    return <QueryPanelState state="error" message={t`Could not load rule review queue.`} />
  }

  function setHeaderFilterOpen(nextOpen: boolean) {
    setOpenHeaderFilter(nextOpen ? 'jurisdiction' : null)
  }

  function toggleRule(ruleId: string, checked: boolean) {
    setSelectedRuleIds((current) =>
      checked
        ? current.includes(ruleId)
          ? current
          : [...current, ruleId]
        : current.filter((id) => id !== ruleId),
    )
    setPreview(null)
  }

  function toggleVisible(checked: boolean) {
    const visibleIds = visibleRows.map((task) => task.ruleId)
    setSelectedRuleIds((current) =>
      checked
        ? Array.from(new Set([...current, ...visibleIds]))
        : current.filter((id) => !visibleIds.includes(id)),
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
    <div className="flex flex-col gap-4">
      <SectionFrame>
        <div className="grid grid-cols-2 divide-y divide-divider-regular sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <ReviewStat label={t`Open tasks`} value={filteredRows.length} />
          <ReviewStat label={t`Selected`} value={selectedRows.length} />
          <ReviewStat label={t`Ready`} value={preview?.acceptReadyCount ?? 0} />
          <ReviewStat label={t`Skipped`} value={preview?.skipped.length ?? 0} />
        </div>
      </SectionFrame>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionFrame>
          <Table>
            <TableHeader className="bg-background-subtle">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 px-3">
                  <input
                    type="checkbox"
                    aria-label={t`Select visible rules`}
                    checked={allVisibleSelected}
                    onChange={(event) => toggleVisible(event.target.checked)}
                    className="size-4"
                  />
                </TableHead>
                <TableHead className="w-[82px] px-3">
                  <TableHeaderMultiFilter
                    trigger="header"
                    label={t`JUR`}
                    open={openHeaderFilter === 'jurisdiction'}
                    onOpenChange={setHeaderFilterOpen}
                    options={jurisdictionOptions}
                    selected={jurisdictionFilters}
                    emptyLabel={t`No options`}
                    searchable
                    searchPlaceholder={t`Filter jurisdictions`}
                    onSelectedChange={(next) => {
                      setJurisdictionFilters(next)
                      setPageIndex(0)
                      setPreview(null)
                    }}
                  />
                </TableHead>
                <TableHead>RULE</TableHead>
                <TableHead className="w-[160px]">FORM</TableHead>
                <TableHead className="w-[170px]">ENTITY</TableHead>
                <TableHead className="w-[120px]">VERSION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((task) => (
                <ReviewQueueRow
                  key={`${task.ruleId}-${task.templateVersion}`}
                  task={task}
                  selected={selectedRuleIds.includes(task.ruleId)}
                  onSelectedChange={toggleRule}
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
      </div>
    </div>
  )
}

function ReviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2 px-5 py-4">
      <span className="text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
        {label}
      </span>
      <span className="font-mono text-2xl leading-none font-semibold tabular-nums text-text-primary">
        {value}
      </span>
    </div>
  )
}

function ReviewQueueRow({
  task,
  selected,
  onSelectedChange,
}: {
  task: RuleReviewTask
  selected: boolean
  onSelectedChange: (ruleId: string, checked: boolean) => void
}) {
  const { t } = useLingui()
  return (
    <TableRow className="h-10 hover:bg-state-base-hover">
      <TableCell className="px-3 py-2">
        <input
          type="checkbox"
          aria-label={t`Select rule ${task.rule.title}`}
          checked={selected}
          onChange={(event) => onSelectedChange(task.ruleId, event.target.checked)}
          className="size-4"
        />
      </TableCell>
      <TableCell className="py-2">
        <JurisdictionCode code={task.rule.jurisdiction} />
      </TableCell>
      <TableCell className="max-w-[360px] py-2">
        <span className="block truncate text-xs font-medium text-text-primary">
          {task.rule.title}
        </span>
        <span className="block truncate font-mono text-xs text-text-tertiary">{task.ruleId}</span>
      </TableCell>
      <TableCell className="py-2 text-xs text-text-secondary">{task.rule.formName}</TableCell>
      <TableCell className="py-2 text-xs text-text-secondary">
        {task.rule.entityApplicability.map(formatEnumLabel).join(', ')}
      </TableCell>
      <TableCell className="py-2 font-mono text-xs text-text-tertiary">
        v{task.templateVersion}
      </TableCell>
    </TableRow>
  )
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

function reviewFilterOptions<T extends string>(
  rows: readonly RuleReviewTask[],
  getValue: (task: RuleReviewTask) => T,
  getLabel: (value: T) => string,
): TableFilterOption[] {
  const counts = new Map<T, number>()
  for (const task of rows) {
    const value = getValue(task)
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: getLabel(value), count }))
    .toSorted((left, right) => left.label.localeCompare(right.label))
}
