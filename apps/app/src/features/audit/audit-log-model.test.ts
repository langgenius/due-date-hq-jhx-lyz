import { describe, expect, it } from 'vitest'
import {
  categoryToInput,
  formatAuditJson,
  isAuditCategoryOption,
  isAuditRange,
  shortenAuditId,
  summarizeAuditChange,
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
    expect(formatAuditJson(null)).toBe('null')
  })
})
