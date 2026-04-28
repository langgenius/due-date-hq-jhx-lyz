import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { parseTabular } from '@duedatehq/core/csv-parser'
import { inferTaxTypes, type EntityType } from '@duedatehq/core/default-matrix'
import type {
  MappingRow,
  MigrationBatch,
  MigrationSource,
  NormalizationRow,
} from '@duedatehq/contracts'

import { rpcErrorMessage } from '@/lib/rpc-error'
import { orpc } from '@/lib/rpc'

import { Step1Intake } from './Step1Intake'
import { Step2Mapping } from './Step2Mapping'
import { Step3Normalize } from './Step3Normalize'
import { Step4Preview } from './Step4Preview'
import { WizardShell } from './WizardShell'
import {
  INITIAL_STATE,
  PRESET_TO_SOURCE,
  wizardReducer,
  type StepIndex,
  type WizardState,
} from './state'
import type { MatrixApplicationView } from './matrix-view'

interface WizardProps {
  open: boolean
  onClose: () => void
}

/**
 * Migration Copilot Wizard — controlled modal mounted once at the app shell.
 *
 * The reducer holds UI state; server mutations go through oRPC TanStack Query
 * mutationOptions so loading, errors, and cache invalidation use one project pattern.
 *
 * The wizard auto-resets when `open` flips to false so the next entry starts
 * from a clean Step 1 instead of resuming a half-finished draft.
 */
export function Wizard({ open, onClose }: WizardProps) {
  const { t } = useLingui()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE)

  useEffect(() => {
    if (!open) dispatch({ type: 'RESET' })
  }, [open])

  const invalidateMigration = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: orpc.migration.key() })
  }, [queryClient])

  const cacheBatch = useCallback(
    (batch: MigrationBatch) => {
      queryClient.setQueryData(
        orpc.migration.getBatch.queryKey({ input: { batchId: batch.id } }),
        batch,
      )
      invalidateMigration()
    },
    [invalidateMigration, queryClient],
  )

  const createBatchMutation = useMutation(
    orpc.migration.createBatch.mutationOptions({
      onSuccess: cacheBatch,
    }),
  )
  const uploadRawMutation = useMutation(
    orpc.migration.uploadRaw.mutationOptions({
      onSuccess: invalidateMigration,
    }),
  )
  const runMapperMutation = useMutation(
    orpc.migration.runMapper.mutationOptions({
      onSuccess: invalidateMigration,
    }),
  )
  const confirmMappingMutation = useMutation(
    orpc.migration.confirmMapping.mutationOptions({
      onSuccess: invalidateMigration,
    }),
  )
  const runNormalizerMutation = useMutation(
    orpc.migration.runNormalizer.mutationOptions({
      onSuccess: invalidateMigration,
    }),
  )
  const confirmNormalizationMutation = useMutation(
    orpc.migration.confirmNormalization.mutationOptions({
      onSuccess: invalidateMigration,
    }),
  )
  const applyDefaultMatrixMutation = useMutation(
    orpc.migration.applyDefaultMatrix.mutationOptions({
      onSuccess: invalidateMigration,
    }),
  )
  const applyMutation = useMutation(
    orpc.migration.apply.mutationOptions({
      onSuccess: () => {
        invalidateMigration()
        void queryClient.invalidateQueries({ queryKey: orpc.workboard.list.key() })
      },
    }),
  )
  const listErrorsMutation = useMutation(
    orpc.migration.listErrors.mutationOptions({
      // Best-effort population of state.errors so Step 2 can show
      // mapping-stage rows immediately and Step 4 can show all rows
      // without re-fetching. Failures are silent — the dryRun summary
      // already carries the same data as a fallback.
      onSuccess: (out) => {
        dispatch({ type: 'ERRORS_SET', errors: out.errors })
      },
    }),
  )

  const handleStep1Continue = useCallback(() => {
    const intake = state.intake
    if (!intake.rawText.trim() || intake.rowCount === 0) return

    dispatch({ type: 'INTAKE_SUBMIT_ERROR', error: null })
    const source: MigrationSource = intake.preset ? PRESET_TO_SOURCE[intake.preset] : 'paste'
    const handleError = (err: unknown) => {
      const description = rpcErrorMessage(err) ?? t`Please try again.`
      dispatch({ type: 'INTAKE_SUBMIT_ERROR', error: description })
      toast.error(t`Couldn't start the import`, { description })
    }

    createBatchMutation.mutate(
      {
        source,
        presetUsed: intake.preset ?? null,
        rowCount: intake.rowCount,
      },
      {
        onError: handleError,
        onSuccess: (batch) => {
          dispatch({ type: 'BATCH_CREATED', batch })
          uploadRawMutation.mutate(
            {
              batchId: batch.id,
              fileName: intake.fileName ?? 'paste.txt',
              contentType: intake.fileName?.endsWith('.tsv')
                ? 'text/tab-separated-values'
                : 'text/csv',
              sizeBytes: intake.rawText.length,
              inline: { kind: 'paste', text: intake.rawText },
            },
            {
              onError: handleError,
              onSuccess: () => {
                runMapperMutation.mutate(
                  { batchId: batch.id },
                  {
                    onError: handleError,
                    onSuccess: (result) => {
                      dispatch({
                        type: 'MAPPER_RESULT',
                        rows: result.mappings,
                        fallback: result.meta?.fallback ?? null,
                      })
                      dispatch({ type: 'GO_TO_STEP', step: 2 })
                      // Best-effort fetch of mapping-stage bad rows so Step 2 can
                      // show them inline (Day 3 acceptance). Failures here do not
                      // block the wizard.
                      listErrorsMutation.mutate({ batchId: batch.id, stage: 'mapping' })
                    },
                  },
                )
              },
            },
          )
        },
      },
    )
  }, [
    createBatchMutation,
    listErrorsMutation,
    runMapperMutation,
    state.intake,
    t,
    uploadRawMutation,
  ])

  const handleStep2Continue = useCallback(() => {
    const batchId = state.batchId
    if (!batchId) return

    const handleError = (err: unknown) => {
      toast.error(t`Couldn't save mapping`, {
        description: rpcErrorMessage(err) ?? t`Please try again.`,
      })
    }

    confirmMappingMutation.mutate(
      {
        batchId,
        mappings: state.mapping.rows,
      },
      {
        onError: handleError,
        onSuccess: () => {
          dispatch({ type: 'NORMALIZE_LOADING' })
          runNormalizerMutation.mutate(
            { batchId },
            {
              onError: handleError,
              onSuccess: (normalized) => {
                dispatch({ type: 'NORMALIZE_RESULT', rows: normalized.normalizations })
                dispatch({ type: 'GO_TO_STEP', step: 3 })
              },
            },
          )
        },
      },
    )
  }, [confirmMappingMutation, runNormalizerMutation, state.batchId, state.mapping.rows, t])

  const handleStep2Rerun = useCallback(() => {
    const batchId = state.batchId
    if (!batchId) return

    dispatch({ type: 'MAPPER_LOADING' })
    runMapperMutation.mutate(
      { batchId },
      {
        onError: (err) => {
          dispatch({
            type: 'MAPPER_ERROR',
            message: rpcErrorMessage(err) ?? t`Re-run failed.`,
          })
        },
        onSuccess: (result) => {
          dispatch({
            type: 'MAPPER_RESULT',
            rows: result.mappings,
            fallback: result.meta?.fallback ?? null,
          })
          listErrorsMutation.mutate({ batchId, stage: 'mapping' })
        },
      },
    )
  }, [listErrorsMutation, runMapperMutation, state.batchId, t])

  const handleStep3Continue = useCallback(() => {
    const batchId = state.batchId
    if (!batchId) return

    const handleError = (err: unknown) => {
      toast.error(t`Couldn't apply Default Matrix`, {
        description: rpcErrorMessage(err) ?? t`Please try again.`,
      })
    }

    confirmNormalizationMutation.mutate(
      {
        batchId,
        normalizations: state.normalize.rows,
      },
      {
        onError: handleError,
        onSuccess: () => {
          applyDefaultMatrixMutation.mutate(
            { batchId },
            {
              onError: handleError,
              onSuccess: (summary) => {
                dispatch({ type: 'DRY_RUN_RESULT', summary })
                dispatch({ type: 'GO_TO_STEP', step: 4 })
                listErrorsMutation.mutate({ batchId, stage: 'all' })
              },
            },
          )
        },
      },
    )
  }, [
    applyDefaultMatrixMutation,
    confirmNormalizationMutation,
    listErrorsMutation,
    state.batchId,
    state.normalize.rows,
    t,
  ])

  const handleStep4Apply = useCallback(() => {
    const batchId = state.batchId
    if (!batchId) return

    applyMutation.mutate(
      { batchId },
      {
        onError: (err) => {
          toast.error(t`Couldn't import clients`, {
            description: rpcErrorMessage(err) ?? t`Please try again.`,
          })
        },
        onSuccess: (result) => {
          toast.success(t`Import complete`, {
            description: t`${result.clientCount} clients · ${result.obligationCount} obligations`,
          })
          onClose()
          void navigate('/dashboard')
        },
      },
    )
  }, [applyMutation, navigate, onClose, state.batchId, t])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const matrixPreview = useMemo<MatrixApplicationView[]>(() => buildMatrixPreview(state), [state])

  const sampleByHeader = useMemo(() => {
    if (!state.intake.rawText) return {}
    try {
      const parsed = parseTabular(state.intake.rawText, { kind: 'paste' })
      const sample: Record<string, string> = {}
      const firstRow = parsed.rows[0] ?? []
      parsed.headers.forEach((h, i) => {
        sample[h] = (firstRow[i] ?? '').trim()
      })
      return sample
    } catch {
      return {}
    }
  }, [state.intake.rawText])

  const continueLabel = useMemo(() => {
    if (state.step !== 4) return undefined
    return <Trans>Import &amp; Generate</Trans>
  }, [state.step])

  const canContinue = computeCanContinue(state)
  const onContinue =
    state.step === 1
      ? handleStep1Continue
      : state.step === 2
        ? handleStep2Continue
        : state.step === 3
          ? handleStep3Continue
          : handleStep4Apply
  const onBack =
    state.step > 1 ? () => dispatch({ type: 'GO_TO_STEP', step: prevStep(state.step) }) : undefined
  const isMutating =
    createBatchMutation.isPending ||
    uploadRawMutation.isPending ||
    runMapperMutation.isPending ||
    confirmMappingMutation.isPending ||
    runNormalizerMutation.isPending ||
    confirmNormalizationMutation.isPending ||
    applyDefaultMatrixMutation.isPending ||
    applyMutation.isPending

  return (
    <WizardShell
      open={open}
      step={state.step}
      busy={isMutating || state.isBusy}
      canContinue={canContinue}
      continueLabel={continueLabel}
      onContinue={onContinue}
      onBack={onBack}
      onClose={handleClose}
    >
      {state.step === 1 ? (
        <Step1Intake
          intake={state.intake}
          onText={(text, fileName) => dispatch({ type: 'INTAKE_TEXT', text, fileName })}
          onPreset={(preset) => dispatch({ type: 'INTAKE_PRESET', preset })}
          onParsed={(args) => dispatch({ type: 'INTAKE_PARSED', ...args })}
          onParseError={(error) => dispatch({ type: 'INTAKE_PARSE_ERROR', error })}
        />
      ) : null}

      {state.step === 2 ? (
        <Step2Mapping
          mapping={state.mapping}
          sampleByHeader={sampleByHeader}
          errors={state.errors}
          onUserEdit={(rows: MappingRow[]) => dispatch({ type: 'MAPPER_USER_EDIT', rows })}
          onRerun={handleStep2Rerun}
        />
      ) : null}

      {state.step === 3 ? (
        <Step3Normalize
          normalize={state.normalize}
          matrix={matrixPreview}
          onUserEdit={(rows: NormalizationRow[]) => dispatch({ type: 'NORMALIZE_USER_EDIT', rows })}
          onToggleApplyToAll={(key, value) =>
            dispatch({ type: 'NORMALIZE_TOGGLE_APPLY_TO_ALL', key, value })
          }
        />
      ) : null}

      {state.step === 4 ? <Step4Preview summary={state.dryRun.summary} /> : null}
    </WizardShell>
  )
}

function computeCanContinue(state: WizardState): boolean {
  if (state.step === 1) {
    return state.intake.rowCount > 0 && state.intake.parseError === null
  }
  if (state.step === 2) {
    // At least one column must map to something other than IGNORE.
    return state.mapping.rows.some((r) => r.targetField !== 'IGNORE')
  }
  if (state.step === 3) {
    // Every normalized value must be non-empty (user fills in needs_review).
    return state.normalize.rows.every(
      (r) => r.normalizedValue !== null && r.normalizedValue.length > 0,
    )
  }
  if (state.step === 4) {
    return state.dryRun.summary !== null && state.dryRun.summary.clientsToCreate > 0
  }
  return false
}

function buildMatrixPreview(wizardState: WizardState): MatrixApplicationView[] {
  if (!wizardState.intake.rawText || wizardState.normalize.rows.length === 0) return []

  // Re-parse the paste so we can group rows by (entity, state) pair.
  let parsed
  try {
    parsed = parseTabular(wizardState.intake.rawText, { kind: 'paste' })
  } catch {
    return []
  }

  const headerToIndex = new Map<string, number>()
  parsed.headers.forEach((h, i) => headerToIndex.set(h, i))
  const entityHeader = wizardState.mapping.rows.find(
    (r) => r.targetField === 'client.entity_type',
  )?.sourceHeader
  const stateHeader = wizardState.mapping.rows.find(
    (r) => r.targetField === 'client.state',
  )?.sourceHeader
  const entityIdx = entityHeader ? headerToIndex.get(entityHeader) : undefined
  const stateIdx = stateHeader ? headerToIndex.get(stateHeader) : undefined

  const entityMap = new Map<string, string | null>()
  const stateMap = new Map<string, string | null>()
  for (const r of wizardState.normalize.rows) {
    if (r.field === 'entity_type') entityMap.set(r.rawValue, r.normalizedValue)
    else if (r.field === 'state') stateMap.set(r.rawValue, r.normalizedValue)
  }

  const counts = new Map<string, { entity: string; state: string; count: number }>()
  for (const row of parsed.rows) {
    const rawEntity = entityIdx !== undefined ? (row[entityIdx] ?? '').trim() : ''
    const rawState = stateIdx !== undefined ? (row[stateIdx] ?? '').trim() : ''
    const entity = entityMap.get(rawEntity) ?? rawEntity.toLowerCase()
    const normalizedState = stateMap.get(rawState) ?? rawState.toUpperCase()
    if (!entity) continue
    const key = `${entity}::${normalizedState}`
    const existing = counts.get(key)
    if (existing) existing.count += 1
    else counts.set(key, { entity, state: normalizedState, count: 1 })
  }

  const out: MatrixApplicationView[] = []
  for (const cell of counts.values()) {
    if (!isEntityType(cell.entity)) continue
    const result = inferTaxTypes(cell.entity, cell.state)
    out.push({
      entityType: cell.entity,
      state: cell.state,
      taxTypes: [...result.taxTypes],
      needsReview: result.needsReview,
      confidence: result.confidence,
      matrixVersion: result.matrixVersion,
      appliedClientCount: cell.count,
    })
  }
  return out
}

function isEntityType(value: string): value is EntityType {
  return (
    value === 'llc' ||
    value === 's_corp' ||
    value === 'partnership' ||
    value === 'c_corp' ||
    value === 'sole_prop' ||
    value === 'trust' ||
    value === 'individual' ||
    value === 'other'
  )
}

function prevStep(step: StepIndex): StepIndex {
  if (step === 4) return 3
  if (step === 3) return 2
  return 1
}
