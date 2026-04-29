import type {
  ClientEntityType,
  MigrationBatchStatus,
  MigrationSource,
  ObligationStatus,
} from './shared'

export interface MigrationBatchRow {
  id: string
  firmId: string
  userId: string
  source: MigrationSource
  rawInputR2Key: string | null
  mappingJson: unknown
  presetUsed: string | null
  rowCount: number
  successCount: number
  skippedCount: number
  aiGlobalConfidence: number | null
  status: MigrationBatchStatus
  appliedAt: Date | null
  revertExpiresAt: Date | null
  revertedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface MigrationMappingRow {
  id: string
  batchId: string
  sourceHeader: string
  targetField: string
  confidence: number | null
  reasoning: string | null
  userOverridden: boolean
  model: string | null
  promptVersion: string | null
  createdAt: Date
}

export interface MigrationNormalizationRow {
  id: string
  batchId: string
  field: string
  rawValue: string
  normalizedValue: string | null
  confidence: number | null
  model: string | null
  promptVersion: string | null
  reasoning: string | null
  userOverridden: boolean
  createdAt: Date
}

export interface MigrationErrorRow {
  id: string
  batchId: string
  rowIndex: number
  rawRowJson: unknown
  errorCode: string
  errorMessage: string
  createdAt: Date
}

export interface CreateBatchInput {
  id?: string
  userId: string
  source: MigrationSource
  rawInputR2Key?: string | null
  presetUsed?: string | null
  rowCount?: number
}

export interface UpdateBatchPatch {
  status?: MigrationBatchStatus
  mappingJson?: unknown
  presetUsed?: string | null
  rowCount?: number
  successCount?: number
  skippedCount?: number
  aiGlobalConfidence?: number | null
  appliedAt?: Date
  revertExpiresAt?: Date
  revertedAt?: Date
}

export interface MigrationMappingInput {
  sourceHeader: string
  targetField: string
  confidence?: number | null
  reasoning?: string | null
  userOverridden?: boolean
  model?: string | null
  promptVersion?: string | null
}

export interface MigrationNormalizationInput {
  field: string
  rawValue: string
  normalizedValue?: string | null
  confidence?: number | null
  model?: string | null
  promptVersion?: string | null
  reasoning?: string | null
  userOverridden?: boolean
}

export interface MigrationErrorInput {
  rowIndex: number
  rawRowJson?: unknown
  errorCode: string
  errorMessage: string
}

export interface CommitClientInput {
  id: string
  firmId: string
  name: string
  ein?: string | null
  state?: string | null
  county?: string | null
  entityType: ClientEntityType
  email?: string | null
  notes?: string | null
  assigneeName?: string | null
  migrationBatchId?: string | null
}

export interface CommitObligationInput {
  id: string
  firmId: string
  clientId: string
  taxType: string
  taxYear?: number | null
  baseDueDate: Date
  currentDueDate: Date
  status: ObligationStatus
  migrationBatchId?: string | null
}

export interface CommitEvidenceInput {
  id: string
  firmId: string
  obligationInstanceId?: string | null
  aiOutputId?: string | null
  sourceType: string
  sourceId?: string | null
  sourceUrl?: string | null
  verbatimQuote?: string | null
  rawValue?: string | null
  normalizedValue?: string | null
  confidence?: number | null
  model?: string | null
  matrixVersion?: string | null
  verifiedAt?: Date | null
  verifiedBy?: string | null
  appliedAt: Date
  appliedBy?: string | null
}

export interface CommitAuditInput {
  id: string
  firmId: string
  actorId: string | null
  entityType: string
  entityId: string
  action: string
  beforeJson?: unknown
  afterJson?: unknown
  reason?: string | null
  ipHash?: string | null
  userAgentHash?: string | null
}

export interface CommitImportInput {
  batchId: string
  clients: CommitClientInput[]
  obligations: CommitObligationInput[]
  evidence: CommitEvidenceInput[]
  audits: CommitAuditInput[]
  successCount: number
  skippedCount: number
  appliedAt: Date
  revertExpiresAt: Date
}

export interface RevertImportInput {
  batchId: string
  userId: string
  revertedAt: Date
}

export interface SingleUndoImportInput extends RevertImportInput {
  clientId: string
}

export interface MigrationRepo {
  readonly firmId: string
  createBatch(input: CreateBatchInput): Promise<{ id: string }>
  updateBatch(id: string, patch: UpdateBatchPatch): Promise<void>
  getBatch(id: string): Promise<MigrationBatchRow | undefined>
  getActiveDraftBatch(): Promise<MigrationBatchRow | undefined>
  listByFirm(opts?: { limit?: number }): Promise<MigrationBatchRow[]>
  listMappings(batchId: string): Promise<MigrationMappingRow[]>
  listNormalizations(batchId: string): Promise<MigrationNormalizationRow[]>
  listErrors(batchId: string): Promise<MigrationErrorRow[]>
  createMappings(batchId: string, mappings: MigrationMappingInput[]): Promise<number>
  createNormalizations(
    batchId: string,
    normalizations: MigrationNormalizationInput[],
  ): Promise<number>
  createErrors(batchId: string, errors: MigrationErrorInput[]): Promise<number>
  commitImport(input: CommitImportInput): Promise<void>
  revertImport(input: RevertImportInput): Promise<{ clientCount: number; obligationCount: number }>
  singleUndoImport(
    input: SingleUndoImportInput,
  ): Promise<{ clientCount: number; obligationCount: number }>
}
