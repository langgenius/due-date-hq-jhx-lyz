import { describe, expect, it } from 'vitest'
import {
  categoryToInput,
  formatAuditJson,
  formatAuditEntityTypeLabel,
  getAuditEntityDisplay,
  humanizeAuditEntityType,
  isAuditCategoryOption,
  isAuditRange,
  shortenAuditId,
  summarizeAuditChange,
  type AuditEntityTypeLabels,
} from './audit-log-model'

describe('audit-log-model', () => {
  it('validates category and range options', () => {
    expect(isAuditCategoryOption('migration')).toBe(true)
    expect(isAuditCategoryOption('unknown')).toBe(false)
    expect(categoryToInput('all')).toBeUndefined()
    expect(categoryToInput('client')).toBe('client')
    expect(isAuditRange('7d')).toBe(true)
    expect(isAuditRange('90d')).toBe(false)
  })

  it('summarizes before/after changes', () => {
    expect(
      summarizeAuditChange({
        beforeJson: { status: 'pending', count: 1 },
        afterJson: { status: 'done', count: 1 },
      }),
    ).toBe('status: pending -> done')

    expect(summarizeAuditChange({ beforeJson: null, afterJson: null })).toBe(
      'No before/after payload',
    )
  })

  it('formats identifiers and JSON blocks', () => {
    expect(shortenAuditId('33333333-3333-4333-8333-333333333333')).toBe('33333333...3333')
    expect(formatAuditJson({ status: 'done' })).toContain('"status": "done"')
    expect(formatAuditJson({ createdAt: '2026-04-29T09:14:32.883Z' })).toMatch(
      /2026-04-\d{2} \d{2}:14:32 .+/,
    )
    expect(formatAuditJson(null)).toBe('null')
  })

  it('formats audit entity type labels for user-facing surfaces', () => {
    const labels = {
      auth: 'Authentication',
      auditEvidencePackage: 'Audit export package',
      client: 'Client',
      clientBatch: 'Client import batch',
      firm: 'Firm',
      member: 'Team member',
      memberInvitation: 'Member invitation',
      migrationBatch: 'Import batch',
      obligationBatch: 'Deadline batch',
      obligationInstance: 'Deadline',
      pulseApplication: 'Pulse application',
      pulseAlert: 'Pulse alert',
      rule: 'Rule',
      ruleSource: 'Rule source',
      workboardExport: 'Workboard export',
      workboardSavedView: 'Saved workboard view',
    } satisfies AuditEntityTypeLabels

    expect(formatAuditEntityTypeLabel('workboard_saved_view', labels)).toBe('Saved workboard view')
    expect(formatAuditEntityTypeLabel('obligation_instance', labels)).toBe('Deadline')
    expect(humanizeAuditEntityType('custom_ai_output')).toBe('Custom AI output')
  })

  it('derives audit entity display names from payloads', () => {
    expect(
      getAuditEntityDisplay(
        {
          entityId: '33333333-3333-4333-8333-333333333333',
          beforeJson: null,
          afterJson: { name: 'Pinned high-risk clients' },
        },
        'Saved workboard view',
      ),
    ).toEqual({
      primary: 'Pinned high-risk clients',
      secondary: 'Saved workboard view · 33333333...3333',
    })

    expect(
      getAuditEntityDisplay(
        {
          entityId: '33333333-3333-4333-8333-333333333333',
          beforeJson: null,
          afterJson: null,
        },
        'Deadline',
      ),
    ).toEqual({
      primary: 'Deadline',
      secondary: '33333333...3333',
    })
  })
})
