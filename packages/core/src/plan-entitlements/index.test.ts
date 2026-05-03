import { describe, expect, it } from 'vitest'
import {
  activePracticeLimitForPlan,
  getPlanEntitlements,
  isBillingPlan,
  planAiDailyRunLimit,
  planAiTier,
  planHasFeature,
  planSeatLimit,
} from './index'

describe('plan entitlements', () => {
  it('defines the seat and active practice limits for each plan', () => {
    expect(planSeatLimit('solo')).toBe(1)
    expect(planSeatLimit('pro')).toBe(3)
    expect(planSeatLimit('team')).toBe(10)
    expect(planSeatLimit('firm')).toBe(10)

    expect(activePracticeLimitForPlan('solo')).toBe(1)
    expect(activePracticeLimitForPlan('pro')).toBe(1)
    expect(activePracticeLimitForPlan('team')).toBe(1)
    expect(activePracticeLimitForPlan('firm')).toBeNull()
  })

  it('keeps Pro and Team on the same practice AI tier', () => {
    expect(planAiTier('solo')).toBe('basic')
    expect(planAiTier('pro')).toBe('practice')
    expect(planAiTier('team')).toBe('practice')
    expect(planAiTier('firm')).toBe('enterprise')
    expect(planAiTier('team')).toBe(planAiTier('pro'))
  })

  it('uses higher aggregate fair-use limits without changing the Team AI tier', () => {
    expect(planAiDailyRunLimit('team')).toBeGreaterThan(planAiDailyRunLimit('pro'))
    expect(planAiTier('team')).toBe(planAiTier('pro'))
  })

  it('separates team operations from practice AI', () => {
    expect(planHasFeature('pro', 'sharedDeadlineOperations')).toBe(true)
    expect(planHasFeature('pro', 'teamManagerOperations')).toBe(false)
    expect(planHasFeature('pro', 'productionMigrationAi')).toBe(true)
    expect(planHasFeature('pro', 'priorityPulseMatching')).toBe(false)
    expect(planHasFeature('pro', 'guidedMigrationReview')).toBe(false)
    expect(planHasFeature('pro', 'auditExport')).toBe(false)
    expect(planHasFeature('team', 'teamManagerOperations')).toBe(true)
    expect(planHasFeature('team', 'priorityPulseMatching')).toBe(true)
    expect(planHasFeature('team', 'guidedMigrationReview')).toBe(true)
    expect(planHasFeature('team', 'auditExport')).toBe(true)
    expect(planHasFeature('team', 'customAi')).toBe(false)
    expect(planHasFeature('firm', 'customAi')).toBe(true)
  })

  it('narrows plan strings', () => {
    expect(isBillingPlan('solo')).toBe(true)
    expect(isBillingPlan('firm')).toBe(true)
    expect(isBillingPlan('enterprise')).toBe(false)
  })

  it('returns stable plan labels', () => {
    expect(getPlanEntitlements('firm').label).toBe('Enterprise')
  })
})
