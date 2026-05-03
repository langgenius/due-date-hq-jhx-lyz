import { describe, expect, it } from 'vitest'
import { canCreateAdditionalFirm } from './index'

describe('firm creation entitlement', () => {
  it('allows the first owned active firm', () => {
    expect(canCreateAdditionalFirm([])).toBe(true)
  })

  it('blocks extra self-serve firms for Solo, Pro, and Team owners', () => {
    expect(canCreateAdditionalFirm([{ plan: 'solo' }])).toBe(false)
    expect(canCreateAdditionalFirm([{ plan: 'pro' }])).toBe(false)
    expect(canCreateAdditionalFirm([{ plan: 'team' }])).toBe(false)
  })

  it('allows additional firms for Firm-plan owners', () => {
    expect(canCreateAdditionalFirm([{ plan: 'firm' }])).toBe(true)
  })
})
