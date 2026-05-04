import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CornerDownLeftIcon,
  RotateCcwIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  AnnualRolloverDisposition,
  AnnualRolloverOutput,
  ClientPublic,
  ObligationInstancePublic,
  ObligationGenerationPreview,
  RuleGenerationState,
  RuleGenerationPreviewInput,
  RuleSource,
} from '@duedatehq/contracts'
import { inferTaxTypes } from '@duedatehq/core/default-matrix'
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
import { rpcErrorMessage } from '@/lib/rpc-error'

import {
  formatEnumLabel,
  groupPreviewRows,
  isPreviewGenerationState,
  PREVIEW_ENTITY_OPTIONS,
  previewCalendarYearFromObligations,
  previewCalendarYearFromFormDates,
  previewCalendarYearToFormDates,
  previewFormValuesForClient,
  previewFormSchema,
  previewFormToInput,
  previewTaxTypesFromObligations,
  RULE_GENERATION_STATES,
  type PreviewFormValues,
} from './rules-console-model'
import { QueryPanelState, SectionFrame, ToneDot } from './rules-console-primitives'
import { SourceExternalLink } from './source-external-link'
import { useSourceLookup } from './use-source-lookup'

const CLIENT_LIST_LIMIT = 500
const TAX_YEAR_GRID_SIZE = 10
const ALL_ROLLOVER_CLIENTS = '__all_clients__'
const EMPTY_CLIENTS: ClientPublic[] = []
const EMPTY_OBLIGATIONS: ObligationInstancePublic[] = []

type PreviewReadyClient = ClientPublic & { state: RuleGenerationState }
type TaxTypeSource = 'obligations' | 'default_matrix'

function isPreviewReadyClient(client: ClientPublic): client is PreviewReadyClient {
  return isPreviewGenerationState(client.state)
}

function taxTypesForClient(
  client: PreviewReadyClient,
  obligations: readonly ObligationInstancePublic[],
): { taxTypes: string[]; source: TaxTypeSource } {
  const obligationTaxTypes = previewTaxTypesFromObligations(obligations)
  if (obligationTaxTypes.length > 0) {
    return { taxTypes: obligationTaxTypes, source: 'obligations' }
  }

  return {
    taxTypes: inferTaxTypes(client.entityType, client.state).taxTypes,
    source: 'default_matrix',
  }
}

export function GenerationPreviewTab() {
  const { t } = useLingui()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const clientsQuery = useQuery(
    orpc.clients.listByFirm.queryOptions({ input: { limit: CLIENT_LIST_LIMIT } }),
  )

  if (clientsQuery.isLoading) {
    return <QueryPanelState state="loading" message={t`Loading clients for preview.`} />
  }

  if (clientsQuery.isError) {
    return <QueryPanelState state="error" message={t`Could not load clients for preview.`} />
  }

  const clients = clientsQuery.data ?? EMPTY_CLIENTS
  const previewReadyClients = clients.filter(isPreviewReadyClient)
  const activeClient =
    (selectedClientId
      ? previewReadyClients.find((client) => client.id === selectedClientId)
      : null) ??
    previewReadyClients[0] ??
    null

  if (clients.length === 0) {
    return (
      <RulesPreviewEmptyState message={t`Create a client before running obligation preview.`} />
    )
  }

  if (!activeClient) {
    return (
      <RulesPreviewEmptyState
        message={t`Add a state to at least one client before running obligation preview.`}
      />
    )
  }

  return (
    <GenerationPreviewClientWorkbench
      key={activeClient.id}
      clients={clients}
      activeClient={activeClient}
      onSelectClient={setSelectedClientId}
    />
  )
}

function GenerationPreviewClientWorkbench({
  clients,
  activeClient,
  onSelectClient,
}: {
  clients: readonly ClientPublic[]
  activeClient: PreviewReadyClient
  onSelectClient: (clientId: string) => void
}) {
  const { t } = useLingui()
  const obligationsQuery = useQuery(
    orpc.obligations.listByClient.queryOptions({ input: { clientId: activeClient.id } }),
  )

  if (obligationsQuery.isLoading) {
    return <QueryPanelState state="loading" message={t`Loading client tax types.`} />
  }

  if (obligationsQuery.isError) {
    return <QueryPanelState state="error" message={t`Could not load client tax types.`} />
  }

  const obligations = obligationsQuery.data ?? EMPTY_OBLIGATIONS
  const { taxTypes, source } = taxTypesForClient(activeClient, obligations)
  const defaultValues = previewFormValuesForClient({
    client: activeClient,
    taxTypes,
    calendarYear: previewCalendarYearFromObligations(obligations),
  })

  return (
    <div className="flex flex-col gap-6">
      <AnnualRolloverPanel clients={clients} />
      <GenerationPreviewForm
        key={`${activeClient.id}-${defaultValues.taxTypes}-${defaultValues.taxYearStart}`}
        clients={clients}
        defaultValues={defaultValues}
        taxTypeSource={source}
        onSelectClient={onSelectClient}
      />
    </div>
  )
}

export function AnnualRolloverPanel({ clients }: { clients: readonly ClientPublic[] }) {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const defaults = useMemo(() => defaultAnnualRolloverYears(), [])
  const [sourceFilingYear, setSourceFilingYear] = useState(defaults.sourceFilingYear)
  const [targetFilingYear, setTargetFilingYear] = useState(defaults.targetFilingYear)
  const [selectedClientId, setSelectedClientId] = useState(ALL_ROLLOVER_CLIENTS)
  const [previewInput, setPreviewInput] = useState(() =>
    annualRolloverInput(defaults.sourceFilingYear, defaults.targetFilingYear, selectedClientId),
  )
  const currentInput = annualRolloverInput(sourceFilingYear, targetFilingYear, selectedClientId)
  const yearsValid = targetFilingYear === sourceFilingYear + 1
  const previewQuery = useQuery({
    ...orpc.obligations.previewAnnualRollover.queryOptions({ input: previewInput }),
    enabled: previewInput.targetFilingYear === previewInput.sourceFilingYear + 1,
  })
  const createMutation = useMutation(
    orpc.obligations.createAnnualRollover.mutationOptions({
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: orpc.obligations.key() })
        void queryClient.invalidateQueries({ queryKey: orpc.workboard.list.key() })
        void queryClient.invalidateQueries({ queryKey: orpc.workboard.facets.key() })
        void queryClient.invalidateQueries({ queryKey: orpc.dashboard.load.key() })
        void queryClient.invalidateQueries({ queryKey: orpc.audit.key() })
        setPreviewInput(currentInput)
        toast.success(t`Annual rollover generated`, {
          description: t`${result.summary.createdCount} obligations created.`,
        })
      },
      onError: (error) => {
        toast.error(t`Could not generate annual rollover`, {
          description: rpcErrorMessage(error) ?? t`Try previewing again before generating.`,
        })
      },
    }),
  )

  const result = createMutation.data ?? previewQuery.data
  const createdIds = rolloverCreatedIds(result)
  const createCandidateCount =
    (result?.summary.willCreateCount ?? 0) + (result?.summary.reviewCount ?? 0)
  const canGenerate = yearsValid && createCandidateCount > 0 && !createMutation.isPending
  const selectedClientLabel =
    selectedClientId === ALL_ROLLOVER_CLIENTS
      ? t`All clients`
      : (clients.find((client) => client.id === selectedClientId)?.name ?? t`Unknown`)

  function runPreview() {
    if (!yearsValid) {
      toast.error(t`Target filing year must be the next year after source filing year.`)
      return
    }
    createMutation.reset()
    setPreviewInput(currentInput)
  }

  function generate() {
    if (!canGenerate) return
    createMutation.mutate(currentInput)
  }

  return (
    <SectionFrame className="px-4 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <RotateCcwIcon className="size-4 text-text-tertiary" aria-hidden />
              <span>
                <Trans>Annual rollover</Trans>
              </span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              <Trans>
                Preview closed source-year obligations, then create next-year obligations from
                verified rules.
              </Trans>
            </p>
          </div>
          {createdIds.length > 0 ? (
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              render={<Link to={workboardHref(createdIds[0]!)} />}
            >
              <Trans>Open first created obligation</Trans>
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-[140px_140px_minmax(220px,1fr)_auto_auto] gap-3">
          <PreviewField label={t`SOURCE FILING YEAR`} htmlFor="annual-source-year">
            <Input
              id="annual-source-year"
              type="number"
              min={1900}
              max={2100}
              value={sourceFilingYear}
              aria-invalid={!yearsValid}
              className="h-8 font-mono text-xs tabular-nums"
              onChange={(event) => {
                const next = boundedYear(event.currentTarget.value, sourceFilingYear, 1900, 2100)
                setSourceFilingYear(next)
                setTargetFilingYear(next + 1)
              }}
            />
          </PreviewField>
          <PreviewField label={t`TARGET FILING YEAR`} htmlFor="annual-target-year">
            <Input
              id="annual-target-year"
              type="number"
              min={1901}
              max={2101}
              value={targetFilingYear}
              aria-invalid={!yearsValid}
              className="h-8 font-mono text-xs tabular-nums"
              onChange={(event) =>
                setTargetFilingYear(
                  boundedYear(event.currentTarget.value, targetFilingYear, 1901, 2101),
                )
              }
            />
          </PreviewField>
          <PreviewField label={t`CLIENT FILTER`}>
            <Select
              value={selectedClientId}
              onValueChange={(value) => {
                if (value) setSelectedClientId(value)
              }}
            >
              <SelectTrigger className="h-8 w-full rounded-md text-xs">
                <SelectValue>{selectedClientLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL_ROLLOVER_CLIENTS}>
                    <Trans>All clients</Trans>
                  </SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <span className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate">{client.name}</span>
                        <span className="font-mono text-[11px] text-text-tertiary">
                          {client.state ?? t`No state`}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </PreviewField>
          <Button
            type="button"
            variant="secondary"
            className="self-end"
            disabled={previewQuery.isFetching}
            onClick={runPreview}
          >
            {previewQuery.isFetching ? <Trans>Previewing…</Trans> : <Trans>Preview</Trans>}
          </Button>
          <Button
            type="button"
            variant="accent"
            className="self-end"
            disabled={!canGenerate}
            onClick={generate}
          >
            {createMutation.isPending ? <Trans>Generating…</Trans> : <Trans>Generate</Trans>}
          </Button>
        </div>

        {!yearsValid ? (
          <p className="text-xs text-severity-medium">
            <Trans>Target filing year must be exactly one year after the source filing year.</Trans>
          </p>
        ) : null}

        {previewQuery.isLoading ? (
          <QueryPanelState state="loading" message={t`Loading annual rollover preview.`} />
        ) : previewQuery.isError ? (
          <QueryPanelState state="error" message={t`Could not run annual rollover preview.`} />
        ) : result ? (
          <AnnualRolloverResults result={result} />
        ) : null}
      </div>
    </SectionFrame>
  )
}

function GenerationPreviewForm({
  clients,
  defaultValues,
  taxTypeSource,
  onSelectClient,
}: {
  clients: readonly ClientPublic[]
  defaultValues: PreviewFormValues
  taxTypeSource: TaxTypeSource
  onSelectClient: (clientId: string) => void
}) {
  const { t } = useLingui()
  const [previewInput, setPreviewInput] = useState<RuleGenerationPreviewInput>(() =>
    previewFormToInput(defaultValues),
  )

  const form = useForm<PreviewFormValues>({
    resolver: zodResolver(previewFormSchema),
    defaultValues,
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
  const selectedClientLabel =
    clients.find((client) => client.id === clientIdValue)?.name ?? clientIdValue

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
            <PreviewField label={t`CLIENT`}>
              <Select
                value={clientIdValue}
                onValueChange={(value) => {
                  const client = clients.find((item) => item.id === value)
                  if (!client || !isPreviewReadyClient(client)) return
                  onSelectClient(client.id)
                }}
              >
                <SelectTrigger
                  className="h-8 w-full rounded-md font-mono text-xs"
                  aria-invalid={Boolean(form.formState.errors.clientId)}
                >
                  <SelectValue>{selectedClientLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {clients.map((client) => (
                      <SelectItem
                        key={client.id}
                        value={client.id}
                        disabled={!isPreviewReadyClient(client)}
                      >
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="truncate">{client.name}</span>
                          <span className="font-mono text-[11px] text-text-tertiary">
                            {client.state ?? t`Needs state`} ·{' '}
                            {previewEntityLabel(client.entityType)}
                          </span>
                        </span>
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
                    {PREVIEW_ENTITY_OPTIONS.map((entity) => (
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
            <span className="text-xs text-text-tertiary">
              {taxTypeSource === 'obligations' ? (
                <Trans>Tax types from existing obligations.</Trans>
              ) : (
                <Trans>Tax types inferred from the Default Matrix.</Trans>
              )}
            </span>
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

function RulesPreviewEmptyState({ message }: { message: string }) {
  return (
    <SectionFrame className="px-4 py-6">
      <p className="text-sm text-text-secondary">{message}</p>
    </SectionFrame>
  )
}

function AnnualRolloverResults({ result }: { result: AnnualRolloverOutput }) {
  const { t } = useLingui()

  return (
    <div className="overflow-hidden rounded-md border border-divider-regular">
      <div className="grid grid-cols-7 gap-0 border-b border-divider-regular bg-background-subtle">
        <RolloverMetric label={t`Seeds`} value={result.summary.seedObligationCount} />
        <RolloverMetric label={t`Clients`} value={result.summary.clientCount} />
        <RolloverMetric label={t`Will create`} value={result.summary.willCreateCount} />
        <RolloverMetric label={t`Review`} value={result.summary.reviewCount} />
        <RolloverMetric label={t`Duplicates`} value={result.summary.duplicateCount} />
        <RolloverMetric label={t`Skipped`} value={result.summary.skippedCount} />
        <RolloverMetric label={t`Created`} value={result.summary.createdCount} />
      </div>
      <div className="max-h-[420px] overflow-auto">
        <div className="grid min-w-[920px] grid-cols-[132px_180px_160px_96px_120px_1fr_120px] border-b border-divider-regular bg-background-default px-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
          <span>
            <Trans>Status</Trans>
          </span>
          <span>
            <Trans>Client</Trans>
          </span>
          <span>
            <Trans>Tax type</Trans>
          </span>
          <span>
            <Trans>Due date</Trans>
          </span>
          <span>
            <Trans>Target</Trans>
          </span>
          <span>
            <Trans>Rule / reason</Trans>
          </span>
          <span className="text-right">
            <Trans>Workboard</Trans>
          </span>
        </div>
        {result.rows.length === 0 ? (
          <div className="px-3 py-4 text-sm text-text-secondary">
            <Trans>No closed source-year obligations matched this rollover preview.</Trans>
          </div>
        ) : (
          result.rows.map((row, index) => {
            const obligationId = row.createdObligationId ?? row.duplicateObligationId
            return (
              <div
                key={`${row.clientId}-${row.taxType}-${row.preview?.ruleId ?? 'missing'}-${row.preview?.period ?? index}`}
                className="grid min-h-12 min-w-[920px] grid-cols-[132px_180px_160px_96px_120px_1fr_120px] items-center gap-0 border-b border-divider-subtle px-3 py-2 text-xs last:border-b-0"
              >
                <span>
                  <RolloverDispositionBadge disposition={row.disposition} />
                </span>
                <span className="min-w-0 truncate text-text-primary">{row.clientName}</span>
                <span className="min-w-0 truncate font-mono text-[11px] text-text-secondary">
                  {row.taxType}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-text-secondary">
                  {row.preview?.dueDate ?? '—'}
                </span>
                <span className="text-text-secondary">
                  {row.targetStatus ? targetStatusLabel(row.targetStatus, t) : '—'}
                </span>
                <span className="min-w-0 truncate text-text-tertiary">
                  {row.preview
                    ? `${row.preview.ruleTitle} · ${row.preview.period}`
                    : skippedReasonLabel(row.skippedReason, t)}
                </span>
                <span className="flex justify-end">
                  {obligationId ? (
                    <Button
                      nativeButton={false}
                      variant="ghost"
                      size="xs"
                      render={<Link to={workboardHref(obligationId)} />}
                    >
                      <Trans>Open</Trans>
                    </Button>
                  ) : (
                    <span className="text-text-disabled">—</span>
                  )}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function RolloverMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 border-r border-divider-subtle px-3 py-2 last:border-r-0">
      <div className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
        {label}
      </div>
      <div className="font-mono text-lg font-semibold tabular-nums text-text-primary">{value}</div>
    </div>
  )
}

function RolloverDispositionBadge({ disposition }: { disposition: AnnualRolloverDisposition }) {
  const { t } = useLingui()
  const labels: Record<AnnualRolloverDisposition, string> = {
    will_create: t`Will create`,
    review: t`Review`,
    duplicate: t`Duplicate`,
    missing_verified_rule: t`Missing rule`,
    missing_due_date: t`Missing due date`,
  }
  return (
    <span
      className={cn(
        'inline-flex h-6 max-w-full items-center rounded border px-2 text-[11px] font-medium',
        disposition === 'will_create' && 'border-status-done/20 bg-status-done/10 text-status-done',
        disposition === 'review' &&
          'border-status-review/20 bg-status-review/10 text-status-review',
        disposition === 'duplicate' &&
          'border-divider-regular bg-background-subtle text-text-muted',
        disposition === 'missing_verified_rule' &&
          'border-severity-medium/20 bg-severity-medium-tint text-severity-medium',
        disposition === 'missing_due_date' &&
          'border-severity-medium/20 bg-severity-medium-tint text-severity-medium',
      )}
    >
      <span className="truncate">{labels[disposition]}</span>
    </span>
  )
}

function defaultAnnualRolloverYears(): { sourceFilingYear: number; targetFilingYear: number } {
  const targetFilingYear = new Date().getFullYear() + 1
  return { sourceFilingYear: targetFilingYear - 1, targetFilingYear }
}

function annualRolloverInput(
  sourceFilingYear: number,
  targetFilingYear: number,
  selectedClientId: string,
) {
  return {
    sourceFilingYear,
    targetFilingYear,
    ...(selectedClientId === ALL_ROLLOVER_CLIENTS ? {} : { clientIds: [selectedClientId] }),
  }
}

function boundedYear(raw: string, fallback: number, min: number, max: number): number {
  const next = Number(raw)
  if (!Number.isInteger(next)) return fallback
  return Math.min(Math.max(next, min), max)
}

function workboardHref(obligationId: string): string {
  return `/workboard?${new URLSearchParams({ obligation: obligationId }).toString()}`
}

function rolloverCreatedIds(result: AnnualRolloverOutput | undefined): string[] {
  return (
    result?.rows.flatMap((row) => (row.createdObligationId ? [row.createdObligationId] : [])) ?? []
  )
}

function targetStatusLabel(status: 'pending' | 'review', t: ReturnType<typeof useLingui>['t']) {
  return status === 'pending' ? t`Pending` : t`Review`
}

function skippedReasonLabel(reason: string | null, t: ReturnType<typeof useLingui>['t']): string {
  if (reason === 'client_state_missing') return t`Client state missing`
  if (reason === 'client_not_found') return t`Client not found`
  if (reason === 'no_verified_rule_for_target_year') return t`No verified target-year rule`
  if (reason === 'target_obligation_already_exists') return t`Target obligation already exists`
  if (reason === 'verified_rule_has_no_concrete_due_date') return t`No concrete due date`
  return reason ?? t`No rule matched`
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
  return (PREVIEW_ENTITY_OPTIONS as readonly string[]).includes(value)
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
