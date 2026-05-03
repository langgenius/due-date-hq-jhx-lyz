import { describe, expect, it } from 'vitest'
import {
  aiBudgetLimit,
  SOLO_MIGRATION_ONBOARDING_DAILY_LIMIT,
  SOLO_MIGRATION_STANDARD_DAILY_LIMIT,
} from './budget'

describe('aiBudgetLimit', () => {
  it('gives Solo migration onboarding credit during the first practice week', () => {
    expect(
      aiBudgetLimit({
        plan: 'solo',
        taskKind: 'migration',
        firmCreatedAt: new Date('2026-05-01T00:00:00.000Z'),
        now: new Date('2026-05-06T23:59:59.000Z'),
        migrationOnboardingCompleted: false,
      }),
    ).toBe(SOLO_MIGRATION_ONBOARDING_DAILY_LIMIT)
  })

  it('moves Solo migration to the standard cap after first successful import', () => {
    expect(
      aiBudgetLimit({
        plan: 'solo',
        taskKind: 'migration',
        firmCreatedAt: new Date('2026-05-01T00:00:00.000Z'),
        now: new Date('2026-05-03T00:00:00.000Z'),
        migrationOnboardingCompleted: true,
      }),
    ).toBe(SOLO_MIGRATION_STANDARD_DAILY_LIMIT)
  })

  it('moves Solo migration to the standard cap after the onboarding window', () => {
    expect(
      aiBudgetLimit({
        plan: 'solo',
        taskKind: 'migration',
        firmCreatedAt: new Date('2026-05-01T00:00:00.000Z'),
        now: new Date('2026-05-08T00:00:00.000Z'),
        migrationOnboardingCompleted: false,
      }),
    ).toBe(SOLO_MIGRATION_STANDARD_DAILY_LIMIT)
  })

  it('keeps non-migration Solo tasks and paid plans on their plan caps', () => {
    expect(aiBudgetLimit({ plan: 'solo', taskKind: 'brief' })).toBe(5)
    expect(aiBudgetLimit({ plan: 'pro', taskKind: 'migration' })).toBe(50)
    expect(aiBudgetLimit({ plan: 'team', taskKind: 'migration' })).toBe(150)
  })
})
