import { oc } from '@orpc/contract'
import * as z from 'zod'
import { EntityIdSchema, TenantIdSchema } from './shared/ids'

export const MigrationSourceSchema = z.enum([
  'paste',
  'csv',
  'xlsx',
  'preset_taxdome',
  'preset_drake',
  'preset_karbon',
  'preset_quickbooks',
  'preset_file_in_time',
])

export const MigrationBatchStatusSchema = z.enum([
  'draft',
  'mapping',
  'reviewing',
  'applied',
  'reverted',
  'failed',
])

export const MigrationBatchSchema = z.object({
  id: EntityIdSchema,
  firmId: TenantIdSchema,
  userId: TenantIdSchema,
  source: MigrationSourceSchema,
  rawInputR2Key: z.string().nullable(),
  mappingJson: z.unknown().nullable(),
  presetUsed: z.string().nullable(),
  rowCount: z.number().int().min(0),
  successCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0),
  aiGlobalConfidence: z.number().min(0).max(1).nullable(),
  status: MigrationBatchStatusSchema,
  appliedAt: z.iso.datetime().nullable(),
  revertExpiresAt: z.iso.datetime().nullable(),
  revertedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const MappingTargetSchema = z.enum([
  'client.name',
  'client.ein',
  'client.state',
  'client.county',
  'client.entity_type',
  'client.tax_types',
  'client.assignee_name',
  'client.email',
  'client.notes',
  'IGNORE',
])
export type MappingTarget = z.infer<typeof MappingTargetSchema>

export const MappingRowSchema = z.object({
  id: EntityIdSchema,
  batchId: EntityIdSchema,
  sourceHeader: z.string().min(1),
  targetField: MappingTargetSchema,
  confidence: z.number().min(0).max(1).nullable(),
  reasoning: z.string().nullable(),
  userOverridden: z.boolean(),
  model: z.string().nullable(),
  promptVersion: z.string().nullable(),
  createdAt: z.iso.datetime(),
})

export const NormalizationRowSchema = z.object({
  id: EntityIdSchema,
  batchId: EntityIdSchema,
  field: z.string().min(1),
  rawValue: z.string(),
  normalizedValue: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  model: z.string().nullable(),
  promptVersion: z.string().nullable(),
  reasoning: z.string().nullable(),
  userOverridden: z.boolean(),
  createdAt: z.iso.datetime(),
})

export const MigrationErrorSchema = z.object({
  id: EntityIdSchema,
  batchId: EntityIdSchema,
  rowIndex: z.number().int().min(0),
  rawRowJson: z.unknown().nullable(),
  errorCode: z.string().min(1),
  errorMessage: z.string().min(1),
  createdAt: z.iso.datetime(),
})

export const DryRunSummarySchema = z.object({
  batchId: EntityIdSchema,
  clientsToCreate: z.number().int().min(0),
  obligationsToCreate: z.number().int().min(0),
  skippedRows: z.number().int().min(0),
  errors: z.array(MigrationErrorSchema),
})

export const MigrationErrorStageSchema = z.enum(['mapping', 'normalize', 'matrix', 'all'])
export type MigrationErrorStage = z.infer<typeof MigrationErrorStageSchema>

export const MigrationListErrorsInputSchema = z.object({
  batchId: EntityIdSchema,
  stage: MigrationErrorStageSchema.default('all').optional(),
})
export type MigrationListErrorsInput = z.infer<typeof MigrationListErrorsInputSchema>

/**
 * Mapper fallback channel marker.
 * - `null` → AI returned a structured response, mappings reflect AI output.
 * - `'preset'` → AI was unavailable but the user picked a Preset Profile;
 *   mappings come from the preset template (no AI cost incurred).
 * - `'all_ignore'` → AI was unavailable and no Preset was picked;
 *   every column defaults to IGNORE, the user must override manually
 *   before Step 2 will accept Continue.
 *
 * Surfaced on `runMapper` / `confirmMapping` outputs so the UI fallback
 * banner ([02-ux §5.4]) and PostHog cost dashboards can react without
 * inspecting trace data.
 */
export const MapperFallbackSchema = z.enum(['preset', 'all_ignore']).nullable().optional()
export type MapperFallback = z.infer<typeof MapperFallbackSchema>

export const MapperRunOutputSchema = z.object({
  mappings: z.array(MappingRowSchema),
  meta: z
    .object({
      fallback: MapperFallbackSchema,
    })
    .optional(),
})
export type MapperRunOutput = z.infer<typeof MapperRunOutputSchema>

export const ApplyResultSchema = z.object({
  batchId: EntityIdSchema,
  clientCount: z.number().int().min(0),
  obligationCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0),
  revertibleUntil: z.iso.datetime(),
})

const BatchIdInput = z.object({ batchId: EntityIdSchema })

export const migrationContract = oc.router({
  createBatch: oc
    .input(
      z.object({
        source: MigrationSourceSchema,
        rawInputR2Key: z.string().nullable().optional(),
        presetUsed: z.string().nullable().optional(),
        rowCount: z.number().int().min(0).optional(),
      }),
    )
    .output(MigrationBatchSchema),
  uploadRaw: oc
    .input(
      z.object({
        batchId: EntityIdSchema,
        fileName: z.string().min(1),
        contentType: z.string().min(1),
        sizeBytes: z.number().int().min(0),
        /**
         * Optional inline payload — Demo Sprint takes the paste / file body
         * directly through RPC (text or base64) and stashes it in
         * `migration_batch.mapping_json.rawInput`. Phase 0 swaps to a real
         * R2 signed PUT URL; the contract surface stays compatible because
         * `inline.kind` is the only required addition.
         *
         * When `inline` is omitted the server is expected to return a
         * pre-signed URL the client uploads to directly (not implemented in
         * Demo Sprint — see docs/dev-file/10 §H).
         */
        inline: z
          .object({
            kind: z.enum(['csv', 'tsv', 'paste', 'xlsx']),
            text: z.string().optional(),
            base64: z.string().optional(),
          })
          .optional(),
      }),
    )
    .output(z.object({ rawInputR2Key: z.string() })),
  runMapper: oc.input(BatchIdInput).output(MapperRunOutputSchema),
  confirmMapping: oc
    .input(z.object({ batchId: EntityIdSchema, mappings: z.array(MappingRowSchema) }))
    .output(MapperRunOutputSchema),
  runNormalizer: oc
    .input(BatchIdInput)
    .output(z.object({ normalizations: z.array(NormalizationRowSchema) })),
  confirmNormalization: oc
    .input(z.object({ batchId: EntityIdSchema, normalizations: z.array(NormalizationRowSchema) }))
    .output(z.object({ normalizations: z.array(NormalizationRowSchema) })),
  applyDefaultMatrix: oc.input(BatchIdInput).output(DryRunSummarySchema),
  dryRun: oc.input(BatchIdInput).output(DryRunSummarySchema),
  apply: oc.input(BatchIdInput).output(ApplyResultSchema),
  revert: oc.input(BatchIdInput).output(z.object({ revertedAt: z.iso.datetime() })),
  singleUndo: oc
    .input(z.object({ batchId: EntityIdSchema, clientId: EntityIdSchema }))
    .output(z.object({ revertedAt: z.iso.datetime() })),
  getBatch: oc.input(BatchIdInput).output(MigrationBatchSchema.nullable()),
  /**
   * Read-only list of `migration_error` rows for a batch.
   * `stage` lets the wizard surface only the errors relevant to the
   * current step (Step 2 mapping vs Step 4 dry-run summary). Stage
   * mapping is by errorCode prefix until per-stage tagging is added.
   */
  listErrors: oc
    .input(MigrationListErrorsInputSchema)
    .output(z.object({ errors: z.array(MigrationErrorSchema) })),
})

export type MigrationBatch = z.infer<typeof MigrationBatchSchema>
export type MigrationSource = z.infer<typeof MigrationSourceSchema>
export type MigrationBatchStatus = z.infer<typeof MigrationBatchStatusSchema>
export type MappingRow = z.infer<typeof MappingRowSchema>
export type NormalizationRow = z.infer<typeof NormalizationRowSchema>
export type MigrationError = z.infer<typeof MigrationErrorSchema>
export type DryRunSummary = z.infer<typeof DryRunSummarySchema>
export type ApplyResult = z.infer<typeof ApplyResultSchema>
export type MigrationContract = typeof migrationContract
