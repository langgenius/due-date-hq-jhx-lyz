import { oc } from '@orpc/contract'
import { z } from 'zod'

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
  id: z.string().uuid(),
  firmId: z.string().uuid(),
  userId: z.string().uuid(),
  source: MigrationSourceSchema,
  rawInputR2Key: z.string().nullable(),
  mappingJson: z.unknown().nullable(),
  presetUsed: z.string().nullable(),
  rowCount: z.number().int().min(0),
  successCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0),
  aiGlobalConfidence: z.number().min(0).max(1).nullable(),
  status: MigrationBatchStatusSchema,
  appliedAt: z.string().datetime().nullable(),
  revertExpiresAt: z.string().datetime().nullable(),
  revertedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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

export const MappingRowSchema = z.object({
  id: z.string().uuid(),
  batchId: z.string().uuid(),
  sourceHeader: z.string().min(1),
  targetField: MappingTargetSchema,
  confidence: z.number().min(0).max(1).nullable(),
  reasoning: z.string().nullable(),
  userOverridden: z.boolean(),
  model: z.string().nullable(),
  promptVersion: z.string().nullable(),
  createdAt: z.string().datetime(),
})

export const NormalizationRowSchema = z.object({
  id: z.string().uuid(),
  batchId: z.string().uuid(),
  field: z.string().min(1),
  rawValue: z.string(),
  normalizedValue: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  model: z.string().nullable(),
  promptVersion: z.string().nullable(),
  reasoning: z.string().nullable(),
  userOverridden: z.boolean(),
  createdAt: z.string().datetime(),
})

export const MigrationErrorSchema = z.object({
  id: z.string().uuid(),
  batchId: z.string().uuid(),
  rowIndex: z.number().int().min(0),
  rawRowJson: z.unknown().nullable(),
  errorCode: z.string().min(1),
  errorMessage: z.string().min(1),
  createdAt: z.string().datetime(),
})

export const DryRunSummarySchema = z.object({
  batchId: z.string().uuid(),
  clientsToCreate: z.number().int().min(0),
  obligationsToCreate: z.number().int().min(0),
  skippedRows: z.number().int().min(0),
  errors: z.array(MigrationErrorSchema),
})

export const ApplyResultSchema = z.object({
  batchId: z.string().uuid(),
  clientCount: z.number().int().min(0),
  obligationCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0),
  revertibleUntil: z.string().datetime(),
})

const BatchIdInput = z.object({ batchId: z.string().uuid() })

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
        batchId: z.string().uuid(),
        fileName: z.string().min(1),
        contentType: z.string().min(1),
        sizeBytes: z.number().int().min(0),
      }),
    )
    .output(z.object({ rawInputR2Key: z.string() })),
  runMapper: oc.input(BatchIdInput).output(z.object({ mappings: z.array(MappingRowSchema) })),
  confirmMapping: oc
    .input(z.object({ batchId: z.string().uuid(), mappings: z.array(MappingRowSchema) }))
    .output(z.object({ mappings: z.array(MappingRowSchema) })),
  runNormalizer: oc
    .input(BatchIdInput)
    .output(z.object({ normalizations: z.array(NormalizationRowSchema) })),
  confirmNormalization: oc
    .input(
      z.object({ batchId: z.string().uuid(), normalizations: z.array(NormalizationRowSchema) }),
    )
    .output(z.object({ normalizations: z.array(NormalizationRowSchema) })),
  applyDefaultMatrix: oc.input(BatchIdInput).output(DryRunSummarySchema),
  dryRun: oc.input(BatchIdInput).output(DryRunSummarySchema),
  apply: oc.input(BatchIdInput).output(ApplyResultSchema),
  revert: oc.input(BatchIdInput).output(z.object({ revertedAt: z.string().datetime() })),
  singleUndo: oc
    .input(z.object({ batchId: z.string().uuid(), clientId: z.string().uuid() }))
    .output(z.object({ revertedAt: z.string().datetime() })),
  getBatch: oc.input(BatchIdInput).output(MigrationBatchSchema.nullable()),
})

export type MigrationBatch = z.infer<typeof MigrationBatchSchema>
export type MappingRow = z.infer<typeof MappingRowSchema>
export type NormalizationRow = z.infer<typeof NormalizationRowSchema>
export type MigrationError = z.infer<typeof MigrationErrorSchema>
export type DryRunSummary = z.infer<typeof DryRunSummarySchema>
export type ApplyResult = z.infer<typeof ApplyResultSchema>
export type MigrationContract = typeof migrationContract
