import { useMemo, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CornerDownLeftIcon,
} from 'lucide-react'

import type {
  ObligationGenerationPreview,
  RuleGenerationPreviewInput,
  RuleSource,
} from '@duedatehq/contracts'
import { Button } from '@duedatehq/ui/components/ui/button'
import { Input } from '@duedatehq/ui/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@duedatehq/ui/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'
import { cn } from '@duedatehq/ui/lib/utils'

import { ConceptLabel } from '@/features/concepts/concept-help'
import { orpc } from '@/lib/rpc'

import {
  DEFAULT_PREVIEW_FORM_VALUES,
  DEFAULT_PREVIEW_INPUT,
  formatEnumLabel,
  groupPreviewRows,
  PREVIEW_CLIENT_OPTIONS,
  previewCalendarYearFromFormDates,
  previewCalendarYearToFormDates,
  previewFormSchema,
  previewFormToInput,
  RULE_GENERATION_STATES,
  type PreviewFormValues,
} from './rules-console-model'
import { QueryPanelState, SectionFrame, ToneDot } from './rules-console-primitives'
import { SourceExternalLink } from './source-external-link'
import { useSourceLookup } from './use-source-lookup'

const ENTITY_OPTIONS = ['llc', 'partnership', 's_corp', 'c_corp'] as const
const TAX_YEAR_GRID_SIZE = 10

export function GenerationPreviewTab() {
  const { t } = useLingui()
  const [previewInput, setPreviewInput] =
    useState<RuleGenerationPreviewInput>(DEFAULT_PREVIEW_INPUT)

  const form = useForm<PreviewFormValues>({
    resolver: zodResolver(previewFormSchema),
    defaultValues: DEFAULT_PREVIEW_FORM_VALUES,
  })

  const previewQuery = useQuery(
    orpc.rules.previewObligations.queryOptions({
      input: previewInput,
    }),
  )

  const clientIdValue = form.watch('clientId')
  const entityTypeValue = form.watch('entityType')
  const stateValue = form.watch('state')
  const taxYearStart = form.watch('taxYearStart')
  const taxYearEnd = form.watch('taxYearEnd')
  const taxTypesValue = form.watch('taxTypes')
  const taxTypeChips = useMemo(
    () =>
      taxTypesValue
        .split(/[,\s]+/)
        .map((taxType) => taxType.trim())
        .filter(Boolean),
    [taxTypesValue],
  )

  const previewCalendarYear = previewCalendarYearFromFormDates({
    taxYearStart,
    taxYearEnd,
  })
  const taxYearInvalid = Boolean(
    form.formState.errors.taxYearStart || form.formState.errors.taxYearEnd,
  )

  const groups = useMemo(() => groupPreviewRows(previewQuery.data ?? []), [previewQuery.data])

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame className="px-4 py-4">
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => {
            setPreviewInput(previewFormToInput(values))
          })}
        >
          <div className="grid grid-cols-[220px_110px_110px_220px_120px] gap-3">
            <PreviewField label={t`CLIENT ID`}>
              <Select
                value={clientIdValue}
                onValueChange={(value) => {
                  const clientOption = PREVIEW_CLIENT_OPTIONS.find(
                    (option) => option.clientId === value,
                  )
                  if (!clientOption) return
                  form.setValue('clientId', clientOption.clientId, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  form.setValue('entityType', clientOption.entityType, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  form.setValue('state', clientOption.state, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  form.setValue('taxTypes', clientOption.taxTypes, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }}
              >
                <SelectTrigger
                  className="h-8 w-full rounded-md font-mono text-xs"
                  aria-invalid={Boolean(form.formState.errors.clientId)}
                >
                  <SelectValue>{clientIdValue}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PREVIEW_CLIENT_OPTIONS.map((option) => (
                      <SelectItem key={option.clientId} value={option.clientId}>
                        {option.clientId}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </PreviewField>
            <PreviewField label={t`ENTITY`}>
              <Select
                value={entityTypeValue}
                onValueChange={(value) => {
                  if (isEntityOption(value)) {
                    form.setValue('entityType', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                }}
              >
                <SelectTrigger className="h-8 w-full rounded-md text-xs">
                  <SelectValue>{previewEntityLabel(entityTypeValue)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ENTITY_OPTIONS.map((entity) => (
                      <SelectItem key={entity} value={entity}>
                        {previewEntityLabel(entity)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </PreviewField>
            <PreviewField label={t`STATE`}>
              <Select
                value={stateValue}
                onValueChange={(value) => {
                  if (isGenerationState(value)) {
                    form.setValue('state', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                }}
              >
                <SelectTrigger className="h-8 w-full rounded-md text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {RULE_GENERATION_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </PreviewField>
            <PreviewField label={t`TAX YEAR`} htmlFor="preview-tax-year">
              <TaxYearCalendarSelect
                id="preview-tax-year"
                value={previewCalendarYear}
                taxYearStart={taxYearStart}
                taxYearEnd={taxYearEnd}
                invalid={taxYearInvalid}
                onValueChange={(year) => {
                  const dates = previewCalendarYearToFormDates(year)
                  form.setValue('taxYearStart', dates.taxYearStart, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  form.setValue('taxYearEnd', dates.taxYearEnd, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }}
              />
            </PreviewField>
            <Button
              type="submit"
              variant="accent"
              className="self-end"
              disabled={previewQuery.isFetching}
            >
              {previewQuery.isFetching ? <Trans>Running…</Trans> : <Trans>Run preview</Trans>}
              <CornerDownLeftIcon data-icon="inline-end" aria-hidden />
            </Button>
          </div>

          <PreviewField label={t`TAX TYPES`} htmlFor="preview-tax-types">
            <div className="flex min-h-[56px] flex-wrap gap-1.5 rounded-md border border-divider-regular bg-background-subtle p-2">
              {taxTypeChips.length === 0 ? (
                <span className="text-xs text-text-tertiary">
                  <Trans>No tax types selected.</Trans>
                </span>
              ) : (
                taxTypeChips.map((taxType) => (
                  <span
                    key={taxType}
                    className="inline-flex h-6 items-center rounded border border-divider-regular bg-background-default px-2 font-mono text-[11px] text-text-secondary"
                  >
                    {taxType}
                  </span>
                ))
              )}
              <Input id="preview-tax-types" className="sr-only" {...form.register('taxTypes')} />
            </div>
          </PreviewField>
        </form>
      </SectionFrame>

      {previewQuery.isLoading ? (
        <QueryPanelState state="loading" message={t`Loading obligation preview.`} />
      ) : previewQuery.isError ? (
        <QueryPanelState state="error" message={t`Could not run obligation preview.`} />
      ) : (
        <PreviewResultsCard
          reminderReady={groups.reminderReady}
          requiresReview={groups.requiresReview}
        />
      )}
    </div>
  )
}

function TaxYearCalendarSelect({
  id,
  value,
  taxYearStart,
  taxYearEnd,
  invalid,
  onValueChange,
}: {
  id: string
  value: number
  taxYearStart: string
  taxYearEnd: string
  invalid: boolean
  onValueChange: (value: number) => void
}) {
  const { t } = useLingui()
  const [open, setOpen] = useState(false)
  const [gridStart, setGridStart] = useState(() => taxYearGridStart(value))
  const years = useMemo(
    () => Array.from({ length: TAX_YEAR_GRID_SIZE }, (_, index) => gridStart + index),
    [gridStart],
  )

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) setGridStart(taxYearGridStart(value))
  }

  function selectYear(year: number) {
    onValueChange(year)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={
          <button
            id={id}
            type="button"
            aria-label={t`Select tax year ${value}`}
            aria-expanded={open}
            aria-invalid={invalid || undefined}
            className={cn(
              'flex h-8 w-full items-center justify-between gap-2 rounded-md border border-transparent bg-components-input-bg-normal py-1 pr-2 pl-2.5 text-xs text-components-input-text-filled transition-colors outline-none',
              'hover:bg-components-input-bg-hover',
              'focus-visible:border-components-input-border-active focus-visible:bg-components-input-bg-active focus-visible:ring-2 focus-visible:ring-state-accent-active-alt',
              'aria-invalid:border-components-input-border-destructive aria-invalid:bg-components-input-bg-destructive aria-invalid:ring-2 aria-invalid:ring-state-destructive-active',
            )}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <CalendarDaysIcon className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
              <span className="truncate font-mono tabular-nums">{value}</span>
            </span>
            <ChevronDownIcon className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
          </button>
        }
      />
      <PopoverContent align="start" className="w-64 gap-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t`Previous years`}
            onClick={() => setGridStart((current) => current - TAX_YEAR_GRID_SIZE)}
          >
            <ChevronLeftIcon aria-hidden />
          </Button>
          <div className="font-mono text-xs font-medium text-text-secondary tabular-nums">
            {gridStart}–{gridStart + TAX_YEAR_GRID_SIZE - 1}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t`Next years`}
            onClick={() => setGridStart((current) => current + TAX_YEAR_GRID_SIZE)}
          >
            <ChevronRightIcon aria-hidden />
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {years.map((year) => (
            <Button
              key={year}
              type="button"
              variant={year === value ? 'accent' : 'ghost'}
              size="xs"
              aria-pressed={year === value}
              className="h-8 rounded-md px-0 font-mono text-xs tabular-nums"
              onClick={() => selectYear(year)}
            >
              {year}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-divider-subtle pt-3">
          <TaxYearDateSummary label={t`Filing year end`} value={taxYearEnd} />
          <TaxYearDateSummary label={t`Payment year start`} value={taxYearStart} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TaxYearDateSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-background-subtle px-2 py-1.5">
      <div className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
        {label}
      </div>
      <div className="truncate font-mono text-[11px] text-text-secondary">{value}</div>
    </div>
  )
}

function PreviewField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function taxYearGridStart(year: number): number {
  return Math.floor(year / TAX_YEAR_GRID_SIZE) * TAX_YEAR_GRID_SIZE
}

function previewEntityLabel(entity: PreviewFormValues['entityType']): string {
  return formatEnumLabel(entity).toUpperCase()
}

function isEntityOption(value: string | null): value is PreviewFormValues['entityType'] {
  if (typeof value !== 'string') return false
  return (ENTITY_OPTIONS as readonly string[]).includes(value)
}

function isGenerationState(value: string | null): value is PreviewFormValues['state'] {
  if (typeof value !== 'string') return false
  return (RULE_GENERATION_STATES as readonly string[]).includes(value)
}

function PreviewResultsCard({
  reminderReady,
  requiresReview,
}: {
  reminderReady: ObligationGenerationPreview[]
  requiresReview: ObligationGenerationPreview[]
}) {
  const { t } = useLingui()
  const sourceLookup = useSourceLookup()
  return (
    <SectionFrame>
      <PreviewGroupHeader
        tone="success"
        label={
          <ConceptLabel concept="reminderReady">
            {t`REMINDER READY — ${reminderReady.length} obligation, will fire 30 / 7 / 1-day reminders`}
          </ConceptLabel>
        }
      />
      {reminderReady.map((row) => (
        <PreviewResultRow
          key={`${row.ruleId}-${row.ruleVersion}-${row.period}`}
          row={row}
          sourceLookup={sourceLookup}
        />
      ))}
      <PreviewGroupHeader
        tone="review"
        label={
          <ConceptLabel concept="requiresReview">
            {t`REQUIRES REVIEW — ${requiresReview.length} items for CPA confirmation, never auto-reminded`}
          </ConceptLabel>
        }
      />
      {requiresReview.map((row) => (
        <PreviewResultRow
          key={`${row.ruleId}-${row.ruleVersion}-${row.period}`}
          row={row}
          sourceLookup={sourceLookup}
        />
      ))}
    </SectionFrame>
  )
}

function PreviewGroupHeader({ tone, label }: { tone: 'success' | 'review'; label: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center gap-2 border-b border-divider-regular bg-background-subtle px-4 py-1">
      <ToneDot tone={tone} />
      <span
        className={cn(
          'text-[11px] font-medium uppercase tracking-[0.08em]',
          tone === 'success' ? 'text-status-done' : 'text-status-review',
        )}
      >
        {label}
      </span>
    </div>
  )
}

function PreviewResultRow({
  row,
  sourceLookup,
}: {
  row: ObligationGenerationPreview
  sourceLookup: ReadonlyMap<string, RuleSource>
}) {
  const { t } = useLingui()
  const evidence = row.evidence[0]
  const evidenceSource = evidence ? sourceLookup.get(evidence.sourceId) : undefined
  const linkLabel = evidence?.summary ?? row.sourceIds[0] ?? t`Source`
  return (
    <div className="grid min-h-16 grid-cols-[128px_1fr_160px] gap-4 border-b border-divider-subtle px-4 py-3 last:border-b-0">
      <div className="flex flex-col gap-1">
        <span
          className={cn(
            'font-mono text-base leading-none font-bold tabular-nums',
            row.reminderReady ? 'text-text-primary' : 'text-text-disabled',
          )}
        >
          {row.dueDate ?? t`source`}
        </span>
        <span
          className={cn(
            'text-[11px] font-medium',
            row.reminderReady ? 'text-text-tertiary' : 'text-severity-medium',
          )}
        >
          {row.reminderReady ? <Trans>reminder ready</Trans> : <Trans>no reminder</Trans>}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-[13px] font-medium text-text-primary">
          {row.ruleTitle} · {row.formName}
        </span>
        <span className="truncate font-mono text-[11px] text-text-tertiary">
          {row.ruleId} v{row.ruleVersion} · {row.matchedTaxType} → {row.taxType}
        </span>
        {row.reviewReasons.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.reviewReasons.map((reason) => (
              <span
                key={reason}
                className="inline-flex h-[18px] items-center rounded-sm bg-severity-medium-tint px-1.5 font-mono text-[10px] text-severity-medium"
              >
                {reason}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex items-start justify-end pt-1">
        <SourceExternalLink
          source={evidenceSource}
          ariaLabel={evidenceSource ? t`Open official source: ${evidenceSource.title}` : undefined}
          showIcon={false}
          className="max-w-full truncate text-right text-[11px] text-text-accent"
        >
          <span className="truncate">{linkLabel}</span>
          <span aria-hidden className="ml-1 shrink-0">
            ↗
          </span>
        </SourceExternalLink>
      </div>
    </div>
  )
}
