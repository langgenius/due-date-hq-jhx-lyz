import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { ExternalLinkIcon } from 'lucide-react'

import type { RuleJurisdiction, RuleSource } from '@duedatehq/contracts'
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
  compactAcquisitionMethod,
  compactSourceType,
  countSourcesByHealth,
  filterSources,
  jurisdictionLabel,
  RULE_JURISDICTIONS,
  type SourceHealthFilter,
} from './rules-console-model'
import {
  FilterChips,
  HealthBadge,
  JurisdictionCode,
  QueryPanelState,
  SectionFrame,
  TableFooterBar,
} from './rules-console-primitives'

type JurisdictionFilter = 'ALL' | RuleJurisdiction

const DEFAULT_VISIBLE_SOURCE_ROWS = 12
const EMPTY_SOURCE_ROWS: RuleSource[] = []

export function SourcesTab() {
  const { t } = useLingui()
  const [healthFilter, setHealthFilter] = useState<SourceHealthFilter>('all')
  const [jurisdictionFilter, setJurisdictionFilter] = useState<JurisdictionFilter>('ALL')
  const [showAll, setShowAll] = useState(false)

  const queryInput = jurisdictionFilter === 'ALL' ? undefined : { jurisdiction: jurisdictionFilter }
  const sourcesQuery = useQuery(orpc.rules.listSources.queryOptions({ input: queryInput }))

  const rows = useMemo(() => sourcesQuery.data ?? EMPTY_SOURCE_ROWS, [sourcesQuery.data])
  const counts = useMemo(() => countSourcesByHealth(rows), [rows])
  const filteredRows = useMemo(() => filterSources(rows, healthFilter), [healthFilter, rows])
  const visibleRows = showAll ? filteredRows : filteredRows.slice(0, DEFAULT_VISIBLE_SOURCE_ROWS)

  const filterOptions = useMemo(
    () => [
      { value: 'all' as const, label: t`All`, count: counts.all },
      { value: 'healthy' as const, label: t`Healthy`, count: counts.healthy },
      { value: 'degraded' as const, label: t`Degraded`, count: counts.degraded },
      { value: 'failing' as const, label: t`Failing`, count: counts.failing },
      { value: 'paused' as const, label: t`Paused`, count: counts.paused },
    ],
    [counts, t],
  )

  if (sourcesQuery.isLoading) {
    return <QueryPanelState state="loading" message={t`Loading rule sources.`} />
  }

  if (sourcesQuery.isError) {
    return <QueryPanelState state="error" message={t`Could not load rule sources.`} />
  }

  const footerNote = t`Showing ${visibleRows.length} of ${filteredRows.length} · click any row to open the official source ↗`
  const showAllAction = t`Show all ${filteredRows.length} →`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <FilterChips
          options={filterOptions}
          value={healthFilter}
          onValueChange={(value) => {
            setHealthFilter(value)
            setShowAll(false)
          }}
        />
        <JurisdictionFilterSelect
          value={jurisdictionFilter}
          onValueChange={setJurisdictionFilter}
        />
      </div>
      <SectionFrame>
        {/*
          Column widths mirror Figma 219:2 (Sources table) 1:1 — the six
          right-hand columns sum to 408 px (50+78+78+78+82+42); SOURCE has no
          explicit width so it auto-fills the remaining ~470 px on the 880 px
          settings content column (Figma value = 472 px) and shrinks first on
          narrower viewports. `table-fixed` is what makes the column widths
          authoritative — without it `table-layout: auto` lets long values
          like "email_subscription" or NY Article 9-A titles widen the table
          past the SectionFrame after **Show all**. Body cells override the
          default `px-3` so badges and text sit flush at the Figma
          x-coordinates instead of being inset by cell padding.
        */}
        <Table className="table-fixed">
          <TableHeader className="bg-background-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">SOURCE</TableHead>
              <TableHead className="w-[50px] px-0">JUR</TableHead>
              <TableHead className="w-[78px] px-0">TYPE</TableHead>
              <TableHead className="w-[78px] px-0">CADENCE</TableHead>
              <TableHead className="w-[78px] px-0">METHOD</TableHead>
              <TableHead className="w-[82px] px-0">HEALTH</TableHead>
              <TableHead className="w-[42px] px-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((source) => (
              <SourceRow key={source.id} source={source} />
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

function JurisdictionFilterSelect({
  value,
  onValueChange,
}: {
  value: JurisdictionFilter
  onValueChange: (value: JurisdictionFilter) => void
}) {
  const { t } = useLingui()
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
          <SelectValue>{value === 'ALL' ? t`All` : jurisdictionLabel(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectItem value="ALL">{t`All`}</SelectItem>
            {RULE_JURISDICTIONS.map((jurisdiction) => (
              <SelectItem key={jurisdiction} value={jurisdiction}>
                {jurisdictionLabel(jurisdiction)}
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

function SourceRow({ source }: { source: RuleSource }) {
  const { t } = useLingui()

  // Keep every interactive affordance on this row pointed at the exact
  // RuleSource.url from the registry. The title and trailing icon are native
  // anchors; the row-level handler is only a larger mouse target.
  const openSource = useCallback(() => {
    if (typeof window === 'undefined') return
    window.open(source.url, '_blank', 'noopener,noreferrer')
  }, [source.url])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTableRowElement>) => {
      // Only handle Enter / Space when focus is on the row itself; trailing
      // anchor handles its own activation.
      if (event.target !== event.currentTarget) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openSource()
      }
    },
    [openSource],
  )

  const isManualReview = source.acquisitionMethod === 'manual_review'

  return (
    <TableRow
      role="link"
      tabIndex={-1}
      onClick={openSource}
      onKeyDown={handleKeyDown}
      className="h-10 cursor-pointer hover:bg-state-base-hover"
    >
      <TableCell className="px-4 py-1.5">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t`Open official source: ${source.title}`}
          onClick={(event) => event.stopPropagation()}
          className="block min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-state-accent-active-alt"
        >
          <span className="block truncate text-xs font-medium text-text-primary">
            {source.title}
          </span>
          <span className="block truncate font-mono text-xs text-text-tertiary">{source.id}</span>
        </a>
      </TableCell>
      <TableCell className="px-0 py-1.5">
        <JurisdictionCode code={source.jurisdiction} />
      </TableCell>
      <TableCell className="px-0 py-1.5 text-xs text-text-secondary">
        {compactSourceType(source.sourceType)}
      </TableCell>
      <TableCell className="px-0 py-1.5 text-xs text-text-secondary">
        {source.cadence.replace('_', '-')}
      </TableCell>
      <TableCell
        className={cn(
          'px-0 py-1.5 text-xs',
          isManualReview ? 'text-severity-medium' : 'text-text-secondary',
        )}
        title={
          isManualReview ? t`Manual review source · click to open the official page` : undefined
        }
      >
        {compactAcquisitionMethod(source.acquisitionMethod)}
      </TableCell>
      <TableCell className="px-0 py-1.5">
        <HealthBadge health={source.healthStatus} />
      </TableCell>
      <TableCell className="px-0 py-1.5 text-center">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t`Open official source: ${source.title}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex size-7 items-center justify-center rounded-md text-text-tertiary outline-none hover:bg-state-base-hover-alt hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-state-accent-active-alt"
        >
          <ExternalLinkIcon className="size-3.5" aria-hidden />
        </a>
      </TableCell>
    </TableRow>
  )
}
