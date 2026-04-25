import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { ChevronDownIcon, RefreshCwIcon, StarIcon } from 'lucide-react'

import type { MappingRow, MappingTarget } from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Button } from '@duedatehq/ui/components/ui/button'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@duedatehq/ui/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'
import { cn } from '@duedatehq/ui/lib/utils'

import type { MapperState } from './state'

const TARGETS: ReadonlyArray<{ value: MappingTarget; label: string }> = [
  { value: 'client.name', label: 'client.name' },
  { value: 'client.ein', label: 'client.ein' },
  { value: 'client.state', label: 'state' },
  { value: 'client.county', label: 'county' },
  { value: 'client.entity_type', label: 'entity_type' },
  { value: 'client.tax_types', label: 'tax_types' },
  { value: 'client.email', label: 'client.email' },
  { value: 'client.assignee_name', label: 'assignee_name' },
  { value: 'client.notes', label: 'notes' },
  { value: 'IGNORE', label: 'Ignore this column' },
]

interface Step2Props {
  mapping: MapperState
  /** Sample row data → header → first cell content for the Sample column. */
  sampleByHeader: Record<string, string>
  onUserEdit: (rows: MappingRow[]) => void
  onRerun: () => void
}

/**
 * Step 2 AI Mapping — pixel-perfect per [02-ux §5].
 *
 * Columns: Your column → DueDateHQ field · Confidence · Sample · Edit
 * EIN star is permanent, confidence three tiers (H/M/L), low-confidence rows
 * tinted, fallback banner up top.
 */
export function Step2Mapping({ mapping, sampleByHeader, onUserEdit, onRerun }: Step2Props) {
  const { t } = useLingui()

  const lowConfCount = mapping.rows.filter(
    (r) => typeof r.confidence === 'number' && r.confidence < 0.8 && r.targetField !== 'IGNORE',
  ).length

  const avgConfidence =
    mapping.rows.length > 0
      ? Math.round(
          (mapping.rows
            .filter((r) => typeof r.confidence === 'number')
            .reduce((sum, r) => sum + (r.confidence ?? 0), 0) /
            Math.max(1, mapping.rows.filter((r) => typeof r.confidence === 'number').length)) *
            100,
        )
      : null

  const einDetected = mapping.rows.some(
    (r) =>
      r.targetField === 'client.ein' && typeof r.confidence === 'number' && r.confidence >= 0.8,
  )

  function updateRow(idx: number, patch: Partial<MappingRow>) {
    const next = mapping.rows.map((row, i) =>
      i === idx ? { ...row, ...patch, userOverridden: true } : row,
    )
    onUserEdit(next)
  }

  return (
    <div className="flex flex-col gap-4 py-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-text-primary">
          <Trans>AI mapped your columns — review and confirm</Trans>
        </h2>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            {avgConfidence !== null ? (
              <Trans>
                Average confidence <span className="font-mono tabular-nums">{avgConfidence}%</span>{' '}
                · EIN detected{' '}
                <span className="font-mono tabular-nums">{einDetected ? '100%' : '0%'}</span>
              </Trans>
            ) : (
              <Trans>Run the mapper to see confidence stats.</Trans>
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRerun}
            disabled={mapping.status === 'loading'}
          >
            <RefreshCwIcon data-icon="inline-start" />
            {mapping.rows.some((r) => r.userOverridden) ? (
              <Trans>Re-run AI with my overrides</Trans>
            ) : (
              <Trans>Re-run AI</Trans>
            )}
          </Button>
        </div>
      </div>

      {mapping.status === 'fallback' ? (
        <Alert role="alert" aria-live="assertive">
          <AlertTitle>
            <Trans>AI Mapper unavailable — using fallback</Trans>
          </AlertTitle>
          <AlertDescription>
            {mapping.fallback === 'preset' ? (
              <Trans>
                We couldn&apos;t reach AI. Using your preset default mapping — review and edit as
                needed.
              </Trans>
            ) : (
              <Trans>
                We couldn&apos;t reach AI and no preset was selected. Please map columns manually
                before continuing.
              </Trans>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      {mapping.errorBanner ? (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTitle>
            <Trans>Something went wrong</Trans>
          </AlertTitle>
          <AlertDescription>{mapping.errorBanner}</AlertDescription>
        </Alert>
      ) : null}

      {lowConfCount > 0 ? (
        <Alert role="status" aria-live="polite">
          <AlertTitle>
            <Plural
              value={lowConfCount}
              one="# column needs your review"
              other="# columns need your review"
            />
          </AlertTitle>
        </Alert>
      ) : null}

      {mapping.status === 'loading' ? (
        <div className="grid gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-3/4" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border-default">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">{t`Your column`}</TableHead>
                <TableHead aria-hidden className="w-[24px]">
                  →
                </TableHead>
                <TableHead className="w-[180px]">{t`DueDateHQ field`}</TableHead>
                <TableHead className="w-[120px]">{t`Confidence`}</TableHead>
                <TableHead>{t`Sample`}</TableHead>
                <TableHead className="w-[88px]" aria-hidden />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapping.rows.map((row, idx) => {
                const tier = confidenceTier(row.confidence, row.targetField)
                const sample = sampleByHeader[row.sourceHeader] ?? '—'
                return (
                  <TableRow
                    key={row.sourceHeader}
                    className={cn('h-9', tier === 'low' && 'bg-severity-medium-tint/40')}
                  >
                    <TableCell className="font-medium">{row.sourceHeader}</TableCell>
                    <TableCell aria-hidden className="text-text-muted">
                      →
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums text-text-primary">
                      <span className="inline-flex items-center gap-1">
                        {row.targetField === 'IGNORE' ? (
                          <span className="italic text-text-muted">⚠ IGNORED</span>
                        ) : (
                          <>
                            {row.targetField}
                            {row.targetField === 'client.ein' ? (
                              <StarIcon className="size-3 text-accent-default" aria-label="EIN" />
                            ) : null}
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ConfidenceBadge tier={tier} confidence={row.confidence} />
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums text-text-secondary">
                      {sample}
                    </TableCell>
                    <TableCell>
                      <EditPopover
                        current={row.targetField}
                        sourceHeader={row.sourceHeader}
                        onChange={(target) => updateRow(idx, { targetField: target })}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

type Tier = 'high' | 'medium' | 'low' | 'none'

function confidenceTier(c: number | null, target: MappingTarget): Tier {
  if (target === 'IGNORE') return 'none'
  if (c === null) return 'none'
  if (c >= 0.95) return 'high'
  if (c >= 0.8) return 'medium'
  return 'low'
}

function ConfidenceBadge({ tier, confidence }: { tier: Tier; confidence: number | null }) {
  if (tier === 'none' || confidence === null) {
    return <span className="text-xs text-text-muted">—</span>
  }
  const pct = Math.round(confidence * 100)
  const styles: Record<Exclude<Tier, 'none'>, string> = {
    high: 'bg-accent-tint text-accent-default border-accent-default',
    medium: 'bg-bg-subtle text-text-secondary border-border-default',
    low: 'bg-severity-medium-tint text-text-primary border-severity-medium-border',
  }
  const label: Record<Exclude<Tier, 'none'>, string> = {
    high: 'H',
    medium: 'M',
    low: 'L',
  }
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 font-mono text-[10px] tabular-nums',
        styles[tier],
      )}
    >
      <span>{pct}%</span>
      <span className="font-semibold">[{label[tier]}]</span>
    </span>
  )
}

interface EditPopoverProps {
  current: MappingTarget
  sourceHeader: string
  onChange: (next: MappingTarget) => void
}

function EditPopover({ current, sourceHeader, onChange }: EditPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="xs">
            <Trans>Edit</Trans>
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        }
      />
      <PopoverContent className="w-60 gap-2 p-2">
        <div className="px-2 pt-1 pb-2 text-xs text-text-secondary">
          <Trans>Map &quot;{sourceHeader}&quot; to…</Trans>
        </div>
        <ul role="listbox" className="flex flex-col gap-0.5">
          {TARGETS.map((target, i) => {
            const isSelected = current === target.value
            const isDivider = i === TARGETS.length - 1
            return (
              <li
                key={target.value}
                role={isDivider ? undefined : 'option'}
                aria-selected={isDivider ? undefined : isSelected}
                className={isDivider ? 'mt-1 border-t border-border-default pt-1' : undefined}
              >
                <button
                  type="button"
                  onClick={() => onChange(target.value)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs',
                    isSelected
                      ? 'bg-accent-tint text-accent-default'
                      : 'hover:bg-bg-subtle text-text-primary',
                  )}
                >
                  <span className="font-mono tabular-nums">{target.label}</span>
                  {isSelected ? <span aria-hidden>●</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
