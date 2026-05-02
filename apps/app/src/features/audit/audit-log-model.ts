import type { AuditActionCategory, AuditEventPublic, AuditRange } from '@duedatehq/contracts'
import { formatDateTimeWithTimezone } from '@/lib/utils'

export const AUDIT_CATEGORY_OPTIONS = [
  'all',
  'client',
  'obligation',
  'migration',
  'rules',
  'auth',
  'team',
  'pulse',
  'export',
  'ai',
  'system',
] as const
export type AuditCategoryOption = (typeof AUDIT_CATEGORY_OPTIONS)[number]

export const AUDIT_RANGE_OPTIONS = ['24h', '7d', '30d', 'all'] as const satisfies readonly [
  AuditRange,
  AuditRange,
  AuditRange,
  AuditRange,
]

export function isAuditCategoryOption(value: string): value is AuditCategoryOption {
  return AUDIT_CATEGORY_OPTIONS.some((option) => option === value)
}

export function isAuditRange(value: string): value is AuditRange {
  return AUDIT_RANGE_OPTIONS.some((option) => option === value)
}

export function categoryToInput(category: AuditCategoryOption): AuditActionCategory | undefined {
  return category === 'all' ? undefined : category
}

export function shortenAuditId(id: string): string {
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}...${id.slice(-4)}`
}

export type AuditEntityTypeLabels = {
  auth: string
  auditEvidencePackage: string
  client: string
  clientBatch: string
  firm: string
  member: string
  memberInvitation: string
  migrationBatch: string
  obligationBatch: string
  obligationInstance: string
  pulseApplication: string
  pulseAlert: string
  rule: string
  ruleSource: string
  workboardExport: string
  workboardSavedView: string
}

const AUDIT_ENTITY_TYPE_LABEL_KEYS = {
  auth: 'auth',
  audit_evidence_package: 'auditEvidencePackage',
  client: 'client',
  client_batch: 'clientBatch',
  firm: 'firm',
  member: 'member',
  member_invitation: 'memberInvitation',
  migration_batch: 'migrationBatch',
  obligation: 'obligationInstance',
  obligation_batch: 'obligationBatch',
  obligation_instance: 'obligationInstance',
  obligation_rule: 'rule',
  pulse_alert: 'pulseAlert',
  pulse_application: 'pulseApplication',
  pulse_firm_alert: 'pulseAlert',
  rule_source: 'ruleSource',
  workboard_export: 'workboardExport',
  workboard_saved_view: 'workboardSavedView',
} as const satisfies Record<string, keyof AuditEntityTypeLabels>

const AUDIT_ENTITY_TYPE_ACRONYMS = new Set(['ai', 'api', 'd1', 'id', 'ip', 'ua', 'url', 'utc'])
type KnownAuditEntityType = keyof typeof AUDIT_ENTITY_TYPE_LABEL_KEYS

function isKnownAuditEntityType(entityType: string): entityType is KnownAuditEntityType {
  return entityType in AUDIT_ENTITY_TYPE_LABEL_KEYS
}

export function humanizeAuditEntityType(entityType: string): string {
  const normalized = entityType.replace(/[._-]+/g, ' ').trim()
  if (!normalized) return entityType

  return normalized
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase()
      if (AUDIT_ENTITY_TYPE_ACRONYMS.has(lower)) return lower.toUpperCase()
      return index === 0 ? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}` : lower
    })
    .join(' ')
}

export function formatAuditEntityTypeLabel(
  entityType: string,
  labels: AuditEntityTypeLabels,
): string {
  if (!isKnownAuditEntityType(entityType)) return humanizeAuditEntityType(entityType)
  return labels[AUDIT_ENTITY_TYPE_LABEL_KEYS[entityType]]
}

const AUDIT_ENTITY_NAME_KEYS = [
  'name',
  'title',
  'label',
  'displayName',
  'clientName',
  'firmName',
  'memberName',
  'email',
  'pulseId',
  'obligationId',
  'migrationBatchId',
] as const

function readStringField(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readEntityName(record: Record<string, unknown> | null): string | null {
  for (const key of AUDIT_ENTITY_NAME_KEYS) {
    const value = readStringField(record, key)
    if (value) return value
  }
  return null
}

export function getAuditEntityDisplay(
  event: Pick<AuditEventPublic, 'entityId' | 'beforeJson' | 'afterJson'>,
  entityTypeLabel: string,
): { primary: string; secondary: string } {
  const before = readRecord(event.beforeJson)
  const after = readRecord(event.afterJson)
  const entityName = readEntityName(after) ?? readEntityName(before)

  if (entityName) {
    return {
      primary: entityName,
      secondary: `${entityTypeLabel} · ${shortenAuditId(event.entityId)}`,
    }
  }

  return {
    primary: entityTypeLabel,
    secondary: shortenAuditId(event.entityId),
  }
}

export type AuditSummaryLabels = {
  empty: string
  object: string
  noPayload: string
  created: string
  beforeOnly: string
  noChange: string
}

const DEFAULT_AUDIT_SUMMARY_LABELS: AuditSummaryLabels = {
  empty: 'empty',
  object: 'object',
  noPayload: 'No before/after payload',
  created: 'Created snapshot',
  beforeOnly: 'Before snapshot only',
  noChange: 'No field-level change detected',
}

const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/

function formatStringValue(value: string): string {
  return ISO_DATETIME_PATTERN.test(value) ? formatDateTimeWithTimezone(value) : value
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return Object.fromEntries(Object.entries(value))
}

function stringifyScalar(value: unknown, labels: AuditSummaryLabels): string {
  if (value === null) return 'null'
  if (value === undefined) return labels.empty
  if (typeof value === 'string') return formatStringValue(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return labels.object
}

function formatAuditJsonValue(value: unknown): unknown {
  if (typeof value === 'string') return formatStringValue(value)
  if (Array.isArray(value)) return value.map(formatAuditJsonValue)
  const record = readRecord(value)
  if (record) {
    return Object.fromEntries(
      Object.entries(record).map(([key, entry]) => [key, formatAuditJsonValue(entry)]),
    )
  }
  return value
}

export function summarizeAuditChange(
  event: Pick<AuditEventPublic, 'beforeJson' | 'afterJson'>,
  labels: AuditSummaryLabels = DEFAULT_AUDIT_SUMMARY_LABELS,
) {
  const before = readRecord(event.beforeJson)
  const after = readRecord(event.afterJson)
  if (!before && !after) return labels.noPayload

  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  const changes = [...keys]
    .filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))
    .slice(0, 3)
    .map(
      (key) =>
        `${key}: ${stringifyScalar(before?.[key], labels)} -> ${stringifyScalar(after?.[key], labels)}`,
    )

  if (changes.length > 0) return changes.join('; ')
  if (!before && after) return labels.created
  if (before && !after) return labels.beforeOnly
  return labels.noChange
}

export function formatAuditJson(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  return JSON.stringify(formatAuditJsonValue(value), null, 2)
}
