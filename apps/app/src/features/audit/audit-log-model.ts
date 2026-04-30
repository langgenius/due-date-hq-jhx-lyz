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
