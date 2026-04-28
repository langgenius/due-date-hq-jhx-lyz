export type FirmPlan = 'solo' | 'firm' | 'pro'
export type FirmStatus = 'active' | 'suspended' | 'deleted'
export type FirmRole = 'owner' | 'manager' | 'preparer' | 'coordinator'
export type MemberStatus = 'active' | 'suspended'
export type InvitationStatus = 'pending' | 'expired' | 'canceled'

export type ClientEntityType =
  | 'llc'
  | 's_corp'
  | 'partnership'
  | 'c_corp'
  | 'sole_prop'
  | 'trust'
  | 'individual'
  | 'other'

export type ObligationStatus =
  | 'pending'
  | 'in_progress'
  | 'done'
  | 'waiting_on_client'
  | 'review'
  | 'not_applicable'

export type MigrationSource =
  | 'paste'
  | 'csv'
  | 'xlsx'
  | 'preset_taxdome'
  | 'preset_drake'
  | 'preset_karbon'
  | 'preset_quickbooks'
  | 'preset_file_in_time'

export type MigrationBatchStatus =
  | 'draft'
  | 'mapping'
  | 'reviewing'
  | 'applied'
  | 'reverted'
  | 'failed'

export type AiOutputKind =
  | 'brief'
  | 'tip'
  | 'summary'
  | 'ask_answer'
  | 'pulse_extract'
  | 'migration_map'
  | 'migration_normalize'

export type AuditActionCategory =
  | 'client'
  | 'obligation'
  | 'migration'
  | 'rules'
  | 'auth'
  | 'team'
  | 'pulse'
  | 'export'
  | 'ai'
  | 'system'

export type WorkboardSort = 'due_asc' | 'due_desc' | 'updated_desc'
export type DashboardSeverity = 'critical' | 'high' | 'medium' | 'neutral'

export interface TenantContext {
  readonly firmId: string
  readonly plan: FirmPlan
  readonly seatLimit: number
  readonly timezone: string
  readonly status: FirmStatus
  readonly ownerUserId: string
}

export interface FirmMembershipRow {
  id: string
  name: string
  slug: string
  plan: FirmPlan
  seatLimit: number
  timezone: string
  status: FirmStatus
  role: FirmRole
  ownerUserId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface FirmUpdateInput {
  name: string
  timezone: string
}

export interface MemberRow {
  id: string
  organizationId: string
  userId: string
  name: string
  email: string
  image: string | null
  role: FirmRole
  status: MemberStatus
  createdAt: Date
}

export interface InvitationRow {
  id: string
  organizationId: string
  email: string
  role: Exclude<FirmRole, 'owner'>
  status: InvitationStatus
  inviterId: string
  expiresAt: Date
  createdAt: Date
}

export interface SeatUsage {
  activeMembers: number
  pendingInvitations: number
  usedSeats: number
  seatLimit: number
}

export interface AuditEventInput {
  firmId: string
  actorId: string | null
  entityType: string
  entityId: string
  action: string
  before?: unknown
  after?: unknown
  reason?: string
  ipHash?: string
  userAgentHash?: string
}

export interface AuditEventRow {
  id: string
  firmId: string
  actorId: string | null
  entityType: string
  entityId: string
  action: string
  beforeJson: unknown
  afterJson: unknown
  reason: string | null
  ipHash: string | null
  userAgentHash: string | null
  createdAt: Date
}

export interface EvidenceInput {
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
  appliedAt?: Date
  appliedBy?: string | null
}

export interface EvidenceLinkRow {
  id: string
  firmId: string
  obligationInstanceId: string | null
  aiOutputId: string | null
  sourceType: string
  sourceId: string | null
  sourceUrl: string | null
  verbatimQuote: string | null
  rawValue: string | null
  normalizedValue: string | null
  confidence: number | null
  model: string | null
  matrixVersion: string | null
  verifiedAt: Date | null
  verifiedBy: string | null
  appliedAt: Date
  appliedBy: string | null
}

export interface ClientRow {
  id: string
  firmId: string
  name: string
  ein: string | null
  state: string | null
  county: string | null
  entityType: ClientEntityType
  email: string | null
  notes: string | null
  assigneeName: string | null
  migrationBatchId: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ClientCreateInput {
  id?: string
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

export interface ObligationInstanceRow {
  id: string
  firmId: string
  clientId: string
  taxType: string
  taxYear: number | null
  baseDueDate: Date
  currentDueDate: Date
  status: ObligationStatus
  migrationBatchId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ObligationCreateInput {
  id?: string
  clientId: string
  taxType: string
  taxYear?: number | null
  baseDueDate: Date
  currentDueDate?: Date
  status?: ObligationStatus
  migrationBatchId?: string | null
}

export interface AiTraceInput {
  promptVersion: string
  model: string | null
  latencyMs: number
  guardResult: string
  inputHash: string
  refusalCode?: string | null
  tokens?: {
    input?: number
    output?: number
  }
  costUsd?: number
}

export interface RecordAiRunInput {
  userId: string
  kind: AiOutputKind
  inputContextRef: string
  trace: AiTraceInput
  outputText?: string | null
  citations?: unknown
  errorMsg?: string | null
}

export interface DashboardLoadInput {
  asOfDate: string
  windowDays?: number
  topLimit?: number
}

export interface DashboardEvidenceRow {
  id: string
  obligationInstanceId: string | null
  aiOutputId: string | null
  sourceType: string
  sourceId: string | null
  sourceUrl: string | null
  verbatimQuote: string | null
  rawValue: string | null
  normalizedValue: string | null
  confidence: number | null
  model: string | null
  appliedAt: Date
}

export interface DashboardTopRow {
  obligationId: string
  clientId: string
  clientName: string
  taxType: string
  currentDueDate: Date
  status: ObligationStatus
  severity: DashboardSeverity
  evidenceCount: number
  primaryEvidence: DashboardEvidenceRow | null
}

export interface DashboardLoadResult {
  asOfDate: string
  windowDays: number
  summary: {
    openObligationCount: number
    dueThisWeekCount: number
    needsReviewCount: number
    evidenceGapCount: number
  }
  topRows: DashboardTopRow[]
}

export interface WorkboardListInput {
  status?: ObligationStatus[]
  search?: string
  sort?: WorkboardSort
  cursor?: string | null
  limit?: number
}

export interface WorkboardListRow extends ObligationInstanceRow {
  clientName: string
}

export interface WorkboardListResult {
  rows: WorkboardListRow[]
  nextCursor: string | null
}

export interface AuditListInput {
  search?: string
  category?: AuditActionCategory
  action?: string
  actorId?: string
  entityType?: string
  entityId?: string
  range?: '24h' | '7d' | '30d' | 'all'
  cursor?: string | null
  limit?: number
}

export interface AuditListRow extends AuditEventRow {
  actorLabel: string | null
}

export interface AuditListResult {
  rows: AuditListRow[]
  nextCursor: string | null
}

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

export interface PulseAlertRow {
  id: string
  pulseId: string
  status: 'matched' | 'partially_applied' | 'applied' | 'dismissed' | 'snoozed' | 'reverted'
  title: string
  source: string
  sourceUrl: string
  summary: string
  publishedAt: Date
  matchedCount: number
  needsReviewCount: number
  confidence: number
  isSample: boolean
}

export interface PulseAffectedClientRow {
  obligationId: string
  clientId: string
  clientName: string
  state: string | null
  county: string | null
  entityType: ClientEntityType
  taxType: string
  currentDueDate: Date
  newDueDate: Date
  status: ObligationStatus
  matchStatus: 'eligible' | 'needs_review' | 'already_applied' | 'reverted'
  reason: string | null
}

export interface PulseDetailRow {
  alert: PulseAlertRow
  jurisdiction: string
  counties: string[]
  forms: string[]
  entityTypes: ClientEntityType[]
  originalDueDate: Date
  newDueDate: Date
  effectiveFrom: Date | null
  sourceExcerpt: string
  reviewedAt: Date | null
  affectedClients: PulseAffectedClientRow[]
}

export interface PulseSeedInput {
  pulseId?: string
  alertId?: string
  source: string
  sourceUrl: string
  rawR2Key?: string | null
  publishedAt: Date
  aiSummary: string
  verbatimQuote: string
  parsedJurisdiction: string
  parsedCounties: string[]
  parsedForms: string[]
  parsedEntityTypes: ClientEntityType[]
  parsedOriginalDueDate: Date
  parsedNewDueDate: Date
  parsedEffectiveFrom?: Date | null
  confidence: number
  reviewedBy?: string | null
  reviewedAt?: Date
  requiresHumanReview?: boolean
  isSample?: boolean
  matchedCount?: number
  needsReviewCount?: number
}

export interface PulseApplyInput {
  alertId: string
  obligationIds: string[]
  userId: string
  now?: Date
}

export interface PulseAlertActionInput {
  alertId: string
  userId: string
  now?: Date
}

export interface PulseApplyResult {
  alert: PulseAlertRow
  appliedCount: number
  auditIds: string[]
  evidenceIds: string[]
  applicationIds: string[]
  emailOutboxId: string
  revertExpiresAt: Date
}

export interface PulseDismissResult {
  alert: PulseAlertRow
  auditId: string
}

export interface PulseRevertResult {
  alert: PulseAlertRow
  revertedCount: number
  auditIds: string[]
  evidenceIds: string[]
}

export interface FirmsRepo {
  listMine(userId: string): Promise<FirmMembershipRow[]>
  findActiveForUser(userId: string, firmId: string): Promise<FirmMembershipRow | undefined>
  updateProfile(firmId: string, input: FirmUpdateInput): Promise<void>
  softDelete(firmId: string): Promise<void>
  setActiveSession(sessionId: string, userId: string, firmId: string | null): Promise<void>
  writeAudit(event: AuditEventInput): Promise<{ id: string }>
}

export interface MembersRepo {
  listMembers(firmId: string): Promise<MemberRow[]>
  listInvitations(firmId: string, now?: Date): Promise<InvitationRow[]>
  findMembership(firmId: string, userId: string): Promise<MemberRow | undefined>
  findMember(firmId: string, memberId: string): Promise<MemberRow | undefined>
  findMemberByEmail(firmId: string, email: string): Promise<MemberRow | undefined>
  findInvitation(
    firmId: string,
    invitationId: string,
    now?: Date,
  ): Promise<InvitationRow | undefined>
  findPendingInvitationByEmail(
    firmId: string,
    email: string,
    now?: Date,
  ): Promise<InvitationRow | undefined>
  seatLimit(firmId: string): Promise<number>
  seatUsage(firmId: string, now?: Date): Promise<SeatUsage>
  updateRole(firmId: string, memberId: string, role: Exclude<FirmRole, 'owner'>): Promise<void>
  setMemberStatus(firmId: string, memberId: string, status: MemberStatus): Promise<void>
  writeAudit(event: AuditEventInput): Promise<{ id: string }>
}

export interface AiRepo {
  readonly firmId: string
  recordRun(input: RecordAiRunInput): Promise<{ aiOutputId: string; llmLogId: string }>
}

export interface ClientsRepo {
  readonly firmId: string
  create(input: ClientCreateInput): Promise<{ id: string }>
  createBatch(inputs: ClientCreateInput[]): Promise<{ ids: string[] }>
  findById(id: string): Promise<ClientRow | undefined>
  listByFirm(opts?: { includeDeleted?: boolean; limit?: number }): Promise<ClientRow[]>
  listByBatch(batchId: string): Promise<ClientRow[]>
  softDelete(id: string): Promise<void>
  deleteByBatch(batchId: string): Promise<number>
}

export interface ObligationsRepo {
  readonly firmId: string
  createBatch(inputs: ObligationCreateInput[]): Promise<{ ids: string[] }>
  findById(id: string): Promise<ObligationInstanceRow | undefined>
  listByClient(clientId: string): Promise<ObligationInstanceRow[]>
  listByBatch(batchId: string): Promise<ObligationInstanceRow[]>
  updateDueDate(id: string, newDate: Date): Promise<void>
  updateStatus(id: string, status: ObligationStatus): Promise<void>
  deleteByBatch(batchId: string): Promise<number>
}

export interface DashboardRepo {
  readonly firmId: string
  load(input: DashboardLoadInput): Promise<DashboardLoadResult>
}

export interface WorkboardRepo {
  readonly firmId: string
  list(input?: WorkboardListInput): Promise<WorkboardListResult>
}

export interface EvidenceRepo {
  readonly firmId: string
  write(input: Omit<EvidenceInput, 'firmId'>): Promise<{ id: string }>
  writeBatch(inputs: Array<Omit<EvidenceInput, 'firmId'>>): Promise<{ ids: string[] }>
  listByObligation(obligationInstanceId: string): Promise<EvidenceLinkRow[]>
}

export interface AuditRepo {
  readonly firmId: string
  write(event: Omit<AuditEventInput, 'firmId'>): Promise<{ id: string }>
  writeBatch(events: Array<Omit<AuditEventInput, 'firmId'>>): Promise<{ ids: string[] }>
  listByFirm(opts?: { action?: string; actorId?: string; limit?: number }): Promise<AuditEventRow[]>
  list(input?: AuditListInput): Promise<AuditListResult>
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

export interface PulseRepo {
  readonly firmId: string
  createSeedAlert(input: PulseSeedInput): Promise<{ pulseId: string; alertId: string }>
  listAlerts(opts?: { limit?: number }): Promise<PulseAlertRow[]>
  getDetail(alertId: string): Promise<PulseDetailRow>
  apply(input: PulseApplyInput): Promise<PulseApplyResult>
  dismiss(input: PulseAlertActionInput): Promise<PulseDismissResult>
  revert(input: PulseAlertActionInput): Promise<PulseRevertResult>
}

export interface ScopedRepo {
  readonly firmId: string
  readonly ai: AiRepo
  readonly clients: ClientsRepo
  readonly dashboard: DashboardRepo
  readonly obligations: ObligationsRepo
  readonly workboard: WorkboardRepo
  readonly pulse: PulseRepo
  readonly migration: MigrationRepo
  readonly evidence: EvidenceRepo
  readonly audit: AuditRepo
}
