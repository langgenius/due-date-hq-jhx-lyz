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
  | 'extended'
  | 'paid'
  | 'waiting_on_client'
  | 'review'
  | 'not_applicable'

export type ObligationReadiness = 'ready' | 'waiting' | 'needs_review'

export type ExposureStatus = 'ready' | 'needs_input' | 'unsupported'

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
export type WorkboardOwnerFilter = 'unassigned'
export type WorkboardDueFilter = 'overdue'
export type WorkboardReadiness = ObligationReadiness
export type DashboardSeverity = 'critical' | 'high' | 'medium' | 'neutral'
export type DashboardDueBucket = 'overdue' | 'today' | 'next_7_days' | 'next_30_days' | 'long_term'
export type DashboardEvidenceFilter = 'needs' | 'linked'
export type DashboardBriefScope = 'firm' | 'me'
export type DashboardBriefStatus = 'pending' | 'ready' | 'failed' | 'stale'
export type WorkloadOwnerKind = 'assignee' | 'unassigned'
