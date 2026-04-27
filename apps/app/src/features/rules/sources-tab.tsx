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
        <Table>
          <TableHeader className="bg-background-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead>SOURCE</TableHead>
              <TableHead className="w-[52px]">JUR</TableHead>
              <TableHead className="w-[84px]">TYPE</TableHead>
              <TableHead className="w-[92px]">CADENCE</TableHead>
              <TableHead className="w-[80px]">METHOD</TableHead>
              <TableHead className="w-[98px]">HEALTH</TableHead>
              <TableHead className="w-8" />
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

function SourceRow({ source }: { source: RuleSource }) {
  const { t } = useLingui()

  // The whole row is a click target for mouse users — opens the official
  // page in a new tab. Keyboard / screen-reader users tab to the trailing
  // <a> instead, which carries the canonical aria-label and href.
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
      <TableCell className="max-w-[440px] py-1.5">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-text-primary">{source.title}</span>
          <span className="truncate font-mono text-xs text-text-tertiary">{source.id}</span>
        </div>
      </TableCell>
      <TableCell className="py-1.5">
        <JurisdictionCode code={source.jurisdiction} />
      </TableCell>
      <TableCell className="py-1.5 text-sm text-text-secondary">
        {compactSourceType(source.sourceType)}
      </TableCell>
      <TableCell className="py-1.5 text-sm text-text-secondary">
        {source.cadence.replace('_', '-')}
      </TableCell>
      <TableCell
        className={cn(
          'py-1.5 text-sm',
          isManualReview ? 'text-severity-medium' : 'text-text-secondary',
        )}
        title={
          isManualReview ? t`Manual review source · click to open the official page` : undefined
        }
      >
        {compactAcquisitionMethod(source.acquisitionMethod)}
      </TableCell>
      <TableCell className="py-1.5">
        <HealthBadge health={source.healthStatus} />
      </TableCell>
      <TableCell className="py-1.5 text-right">
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
