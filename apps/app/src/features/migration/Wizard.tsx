import { useCallback, useMemo, useReducer, useTransition } from 'react'
import { useNavigate } from 'react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { toast } from 'sonner'

import { parseTabular } from '@duedatehq/core/csv-parser'
import { inferTaxTypes, type EntityType } from '@duedatehq/core/default-matrix'
import type { MappingRow, NormalizationRow, MigrationSource } from '@duedatehq/contracts'

import { rpc } from '@/lib/rpc'

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

/**
 * Migration Copilot Wizard — entry point at /migration/new.
 *
 * The reducer holds UI state; side effects live here as React 19 transitions.
 * Each step's Continue handler runs the relevant migration.* RPC and then
 * updates the reducer with the server's authoritative payload.
 */
export function Wizard() {
  const { t } = useLingui()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE)
  const [isPending, startTransition] = useTransition()

  const handleStep1Continue = useCallback(() => {
    if (!state.intake.rawText.trim() || state.intake.rowCount === 0) return

    dispatch({ type: 'INTAKE_SUBMIT_ERROR', error: null })
    startTransition(async () => {
      try {
        const source: MigrationSource = state.intake.preset
          ? PRESET_TO_SOURCE[state.intake.preset]
          : 'paste'
        const batch = await rpc.migration.createBatch({
          source,
          presetUsed: state.intake.preset ?? null,
          rowCount: state.intake.rowCount,
        })
        dispatch({ type: 'BATCH_CREATED', batch })
        await rpc.migration.uploadRaw({
          batchId: batch.id,
          fileName: state.intake.fileName ?? 'paste.txt',
          contentType: state.intake.fileName?.endsWith('.tsv')
            ? 'text/tab-separated-values'
            : 'text/csv',
          sizeBytes: state.intake.rawText.length,
          inline: { kind: 'paste', text: state.intake.rawText },
        })

        const result = await rpc.migration.runMapper({ batchId: batch.id })
        dispatch({
          type: 'MAPPER_RESULT',
          rows: result.mappings,
          fallback: result.meta?.fallback ?? null,
        })
        dispatch({ type: 'GO_TO_STEP', step: 2 })
      } catch (err) {
        const description = errorMessage(err) ?? t`Please try again.`
        dispatch({ type: 'INTAKE_SUBMIT_ERROR', error: description })
        toast.error(t`Couldn't start the import`, { description })
      }
    })
  }, [state.intake, t])

  const handleStep2Continue = useCallback(() => {
    if (!state.batchId) return
    startTransition(async () => {
      try {
        await rpc.migration.confirmMapping({
          batchId: state.batchId!,
          mappings: state.mapping.rows,
        })
        dispatch({ type: 'NORMALIZE_LOADING' })
        const normalized = await rpc.migration.runNormalizer({ batchId: state.batchId! })
        dispatch({ type: 'NORMALIZE_RESULT', rows: normalized.normalizations })
        dispatch({ type: 'GO_TO_STEP', step: 3 })
      } catch (err) {
        toast.error(t`Couldn't save mapping`, {
          description: errorMessage(err) ?? t`Please try again.`,
        })
      }
    })
  }, [state.batchId, state.mapping.rows, t])

  const handleStep2Rerun = useCallback(() => {
    if (!state.batchId) return
    startTransition(async () => {
      dispatch({ type: 'MAPPER_LOADING' })
      try {
        const result = await rpc.migration.runMapper({ batchId: state.batchId! })
        dispatch({
          type: 'MAPPER_RESULT',
          rows: result.mappings,
          fallback: result.meta?.fallback ?? null,
        })
      } catch (err) {
        dispatch({
          type: 'MAPPER_ERROR',
          message: errorMessage(err) ?? t`Re-run failed.`,
        })
      }
    })
  }, [state.batchId, t])

  const handleStep3Continue = useCallback(() => {
    if (!state.batchId) return
    startTransition(async () => {
      try {
        await rpc.migration.confirmNormalization({
          batchId: state.batchId!,
          normalizations: state.normalize.rows,
        })
        const summary = await rpc.migration.applyDefaultMatrix({ batchId: state.batchId! })
        dispatch({ type: 'DRY_RUN_RESULT', summary })
        dispatch({ type: 'GO_TO_STEP', step: 4 })
      } catch (err) {
        toast.error(t`Couldn't apply Default Matrix`, {
          description: errorMessage(err) ?? t`Please try again.`,
        })
      }
    })
  }, [state.batchId, state.normalize.rows, t])

  const handleClose = useCallback(() => {
    void navigate('/')
  }, [navigate])

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
    return <Trans>Import &amp; Generate (Day 4)</Trans>
  }, [state.step])

  const canContinue = computeCanContinue(state)
  const onContinue =
    state.step === 1
      ? handleStep1Continue
      : state.step === 2
        ? handleStep2Continue
        : state.step === 3
          ? handleStep3Continue
          : () => {}
  const onBack =
    state.step > 1 ? () => dispatch({ type: 'GO_TO_STEP', step: prevStep(state.step) }) : undefined

  return (
    <WizardShell
      step={state.step}
      busy={isPending || state.isBusy}
      canContinue={canContinue && state.step !== 4}
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
  return false
}

function buildMatrixPreview(state: WizardState): MatrixApplicationView[] {
  if (!state.intake.rawText || state.normalize.rows.length === 0) return []

  // Re-parse the paste so we can group rows by (entity, state) pair.
  let parsed
  try {
    parsed = parseTabular(state.intake.rawText, { kind: 'paste' })
  } catch {
    return []
  }

  const headerToIndex = new Map<string, number>()
  parsed.headers.forEach((h, i) => headerToIndex.set(h, i))
  const entityHeader = state.mapping.rows.find(
    (r) => r.targetField === 'client.entity_type',
  )?.sourceHeader
  const stateHeader = state.mapping.rows.find((r) => r.targetField === 'client.state')?.sourceHeader
  const entityIdx = entityHeader ? headerToIndex.get(entityHeader) : undefined
  const stateIdx = stateHeader ? headerToIndex.get(stateHeader) : undefined

  const entityMap = new Map<string, string | null>()
  const stateMap = new Map<string, string | null>()
  for (const r of state.normalize.rows) {
    if (r.field === 'entity_type') entityMap.set(r.rawValue, r.normalizedValue)
    else if (r.field === 'state') stateMap.set(r.rawValue, r.normalizedValue)
  }

  const counts = new Map<string, { entity: string; state: string; count: number }>()
  for (const row of parsed.rows) {
    const rawEntity = entityIdx !== undefined ? (row[entityIdx] ?? '').trim() : ''
    const rawState = stateIdx !== undefined ? (row[stateIdx] ?? '').trim() : ''
    const entity = entityMap.get(rawEntity) ?? rawEntity.toLowerCase()
    const state = stateMap.get(rawState) ?? rawState.toUpperCase()
    if (!entity) continue
    const key = `${entity}::${state}`
    const existing = counts.get(key)
    if (existing) existing.count += 1
    else counts.set(key, { entity, state, count: 1 })
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

function errorMessage(err: unknown): string | null {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string') return message
  }
  return null
}
