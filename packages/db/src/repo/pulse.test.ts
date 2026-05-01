/* eslint-disable typescript-eslint/no-unsafe-type-assertion --
 * Focused Drizzle chain doubles only implement the query-builder methods used here.
 */
import { describe, expect, it, vi } from 'vitest'
import { makePulseOpsRepo, makePulseRepo, PulseRepoError } from './pulse'

const ALERT = {
  alertId: 'alert-1',
  pulseId: 'pulse-1',
  alertStatus: 'matched' as const,
  matchedCount: 1,
  needsReviewCount: 1,
  source: 'IRS Disaster Relief',
  sourceUrl: 'https://www.irs.gov/newsroom/tax-relief-in-disaster-situations',
  publishedAt: new Date('2026-04-15T17:00:00.000Z'),
  aiSummary: 'IRS CA storm relief',
  verbatimQuote: 'Individuals and businesses in Los Angeles County have until October 15, 2026.',
  parsedJurisdiction: 'CA',
  parsedCounties: ['Los Angeles County'],
  parsedForms: ['federal_1065', 'federal_1120s'],
  parsedEntityTypes: ['llc', 's_corp'],
  parsedOriginalDueDate: new Date('2026-03-15T00:00:00.000Z'),
  parsedNewDueDate: new Date('2026-10-15T00:00:00.000Z'),
  parsedEffectiveFrom: new Date('2026-04-15T00:00:00.000Z'),
  confidence: 0.94,
  pulseStatus: 'approved' as const,
  reviewedBy: 'user-1',
  reviewedAt: new Date('2026-04-15T18:00:00.000Z'),
  isSample: true,
}

const ELIGIBLE = {
  obligationId: 'oi-eligible',
  clientId: 'client-eligible',
  clientName: 'Arbor & Vale LLC',
  state: 'CA',
  county: 'Los Angeles',
  entityType: 'llc' as const,
  taxType: 'federal_1065',
  currentDueDate: new Date('2026-03-15T00:00:00.000Z'),
  status: 'pending' as const,
}

const NEEDS_REVIEW = {
  obligationId: 'oi-review',
  clientId: 'client-review',
  clientName: 'Bright Studio S-Corp',
  state: 'CA',
  county: null,
  entityType: 's_corp' as const,
  taxType: 'federal_1120s',
  currentDueDate: new Date('2026-03-15T00:00:00.000Z'),
  status: 'review' as const,
}

function selectChain(response: unknown[]) {
  const chain = response.slice() as unknown[] & {
    from: ReturnType<typeof vi.fn>
    innerJoin: ReturnType<typeof vi.fn>
    where: ReturnType<typeof vi.fn>
    orderBy: ReturnType<typeof vi.fn>
    limit: ReturnType<typeof vi.fn>
  }
  chain.from = vi.fn(() => chain)
  chain.innerJoin = vi.fn(() => chain)
  chain.where = vi.fn(() => chain)
  chain.orderBy = vi.fn(() => chain)
  chain.limit = vi.fn(async () => response)
  return chain
}

function fakeDb(selectResponses: unknown[][]) {
  const batchStatements: unknown[] = []
  const directStatements: unknown[] = []
  const db = {
    select: vi.fn(() => selectChain(selectResponses.shift() ?? [])),
    insert: vi.fn((table: unknown) => ({
      values: (value: unknown) => {
        const statement = { kind: 'insert', table, value }
        directStatements.push(statement)
        return statement
      },
    })),
    update: vi.fn((table: unknown) => ({
      set: (value: unknown) => ({
        where: () => {
          const statement = { kind: 'update', table, value }
          directStatements.push(statement)
          return statement
        },
      }),
    })),
    batch: vi.fn(async (statements: [unknown, ...unknown[]]) => {
      batchStatements.push(...statements)
      return []
    }),
  }
  return {
    db: db as unknown as Parameters<typeof makePulseRepo>[0],
    batchStatements,
    directStatements,
  }
}

describe('makePulseRepo', () => {
  it('matches eligible clients and marks missing county rows as needs_review', async () => {
    const { db } = fakeDb([
      [ALERT],
      [
        ELIGIBLE,
        NEEDS_REVIEW,
        {
          ...ELIGIBLE,
          obligationId: 'oi-orange',
          clientId: 'client-orange',
          clientName: 'Orange County LLC',
          county: 'Orange',
        },
      ],
      [],
      [],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    const detail = await repo.getDetail('alert-1')

    expect(detail.affectedClients.map((row) => [row.obligationId, row.matchStatus])).toEqual([
      ['oi-eligible', 'eligible'],
      ['oi-review', 'needs_review'],
    ])
    expect(detail.affectedClients[1]!.reason).toContain('county is missing')
  })

  it('marks base-date matches with active overlays as already applied', async () => {
    const { db } = fakeDb([
      [ALERT],
      [ELIGIBLE],
      [
        {
          obligationId: 'oi-eligible',
          overrideDueDate: new Date('2026-10-15T00:00:00.000Z'),
          appliedAt: new Date('2026-04-15T18:30:00.000Z'),
        },
      ],
      [],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    const detail = await repo.getDetail('alert-1')

    expect(detail.affectedClients).toHaveLength(1)
    expect(detail.affectedClients[0]).toMatchObject({
      obligationId: 'oi-eligible',
      currentDueDate: new Date('2026-10-15T00:00:00.000Z'),
      matchStatus: 'already_applied',
    })
  })

  it('keeps source-revoked alerts visible in detail for history review', async () => {
    const { db } = fakeDb([[{ ...ALERT, pulseStatus: 'source_revoked' }], [], []])
    const repo = makePulseRepo(db, 'firm-1')

    const detail = await repo.getDetail('alert-1')

    expect(detail.alert.sourceStatus).toBe('source_revoked')
  })

  it('batch-applies due date overlays with applications, evidence, audit, and outbox', async () => {
    const { db, batchStatements } = fakeDb([
      [ALERT],
      [ELIGIBLE],
      [],
      [],
      [ELIGIBLE],
      [],
      [],
      [{ email: 'owner@example.com' }],
      [{ ...ALERT, matchedCount: 0 }],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    const result = await repo.apply({
      alertId: 'alert-1',
      obligationIds: ['oi-eligible'],
      userId: 'user-1',
      now: new Date('2026-04-15T18:30:00.000Z'),
    })

    expect(result.appliedCount).toBe(1)
    expect(result.auditIds).toHaveLength(1)
    expect(result.evidenceIds).toHaveLength(1)
    expect(result.applicationIds).toHaveLength(1)
    expect(result.revertExpiresAt.toISOString()).toBe('2026-04-16T18:30:00.000Z')
    expect(batchStatements).toHaveLength(7)
    expect(batchStatements.filter((statement) => isKind(statement, 'insert'))).toHaveLength(6)
    expect(batchStatements.filter((statement) => isKind(statement, 'update'))).toHaveLength(1)
  })

  it('rejects apply when the requested obligation was already applied', async () => {
    const { db } = fakeDb([
      [ALERT],
      [],
      [
        {
          id: 'app-1',
          obligationId: 'oi-eligible',
          clientId: 'client-eligible',
          clientName: 'Arbor & Vale LLC',
          state: 'CA',
          county: 'Los Angeles',
          entityType: 'llc',
          taxType: 'federal_1065',
          currentDueDate: new Date('2026-10-15T00:00:00.000Z'),
          status: 'pending',
          appliedAt: new Date('2026-04-15T18:30:00.000Z'),
          revertedAt: null,
          beforeDueDate: new Date('2026-03-15T00:00:00.000Z'),
          afterDueDate: new Date('2026-10-15T00:00:00.000Z'),
        },
      ],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    await expect(
      repo.apply({
        alertId: 'alert-1',
        obligationIds: ['oi-eligible'],
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'conflict' } satisfies Partial<PulseRepoError>)
  })

  it('rejects apply when the selected obligation due date changed before write', async () => {
    const { db, batchStatements } = fakeDb([
      [ALERT],
      [ELIGIBLE],
      [],
      [],
      [
        {
          ...ELIGIBLE,
          currentDueDate: new Date('2026-03-16T00:00:00.000Z'),
        },
      ],
      [],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    await expect(
      repo.apply({
        alertId: 'alert-1',
        obligationIds: ['oi-eligible'],
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'conflict' } satisfies Partial<PulseRepoError>)
    expect(batchStatements).toHaveLength(0)
  })

  it('rejects apply when a fresh active application already exists', async () => {
    const { db, batchStatements } = fakeDb([
      [ALERT],
      [ELIGIBLE],
      [],
      [],
      [ELIGIBLE],
      [],
      [{ obligationId: 'oi-eligible' }],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    await expect(
      repo.apply({
        alertId: 'alert-1',
        obligationIds: ['oi-eligible'],
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'conflict' } satisfies Partial<PulseRepoError>)
    expect(batchStatements).toHaveLength(0)
  })

  it('rejects apply when the selected obligation needs county review', async () => {
    const { db, batchStatements } = fakeDb([[ALERT], [NEEDS_REVIEW], [], []])
    const repo = makePulseRepo(db, 'firm-1')

    await expect(
      repo.apply({
        alertId: 'alert-1',
        obligationIds: ['oi-review'],
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'conflict' } satisfies Partial<PulseRepoError>)
    expect(batchStatements).toHaveLength(0)
  })

  it('applies a needs_review obligation after explicit confirmation', async () => {
    const { db, batchStatements } = fakeDb([
      [ALERT],
      [NEEDS_REVIEW],
      [],
      [],
      [NEEDS_REVIEW],
      [],
      [],
      [{ email: 'manager@example.com' }],
      [{ ...ALERT, matchedCount: 1, needsReviewCount: 0 }],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    const result = await repo.apply({
      alertId: 'alert-1',
      obligationIds: ['oi-review'],
      confirmedObligationIds: ['oi-review'],
      userId: 'user-1',
      now: new Date('2026-04-15T18:30:00.000Z'),
    })

    expect(result.appliedCount).toBe(1)
    expect(batchStatements).toHaveLength(7)
    expect(batchStatements.filter((statement) => isKind(statement, 'update'))).toHaveLength(1)
  })

  it('rejects apply with no eligible candidates when selections are outside the alert', async () => {
    const { db, batchStatements } = fakeDb([[ALERT], [], []])
    const repo = makePulseRepo(db, 'firm-1')

    await expect(
      repo.apply({
        alertId: 'alert-1',
        obligationIds: ['oi-outside-alert'],
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'no_eligible' } satisfies Partial<PulseRepoError>)
    expect(batchStatements).toHaveLength(0)
  })

  it('reopens the alert as matched after a successful undo', async () => {
    const appliedAlert = {
      ...ALERT,
      alertStatus: 'applied' as const,
      matchedCount: 0,
      needsReviewCount: 0,
    }
    const application = {
      id: 'app-1',
      obligationId: 'oi-eligible',
      clientId: 'client-eligible',
      appliedAt: new Date('2026-04-15T18:30:00.000Z'),
      beforeDueDate: new Date('2026-03-15T00:00:00.000Z'),
      afterDueDate: new Date('2026-10-15T00:00:00.000Z'),
      currentDueDate: new Date('2026-10-15T00:00:00.000Z'),
    }
    const { db, batchStatements } = fakeDb([
      [appliedAlert],
      [application],
      [
        {
          id: 'oea-1',
          obligationId: 'oi-eligible',
          exceptionRuleId: 'exception-1',
          overrideDueDate: new Date('2026-10-15T00:00:00.000Z'),
        },
      ],
      [{ ...appliedAlert, alertStatus: 'matched' as const }],
      [ELIGIBLE],
      [],
      [{ ...application, revertedAt: new Date('2026-04-15T19:00:00.000Z') }],
      [],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    const result = await repo.revert({
      alertId: 'alert-1',
      userId: 'user-1',
      now: new Date('2026-04-15T19:00:00.000Z'),
    })

    expect(result.revertedCount).toBe(1)
    expect(result.alert).toMatchObject({
      status: 'matched',
      matchedCount: 1,
      needsReviewCount: 0,
    })
    expect(
      batchStatements.some((statement) => statementHasValue(statement, { status: 'matched' })),
    ).toBe(true)
  })

  it('reactivates a historical reverted alert for re-apply', async () => {
    const revertedAlert = {
      ...ALERT,
      alertStatus: 'reverted' as const,
      matchedCount: 0,
      needsReviewCount: 0,
    }
    const revertedApplication = {
      id: 'app-1',
      obligationId: 'oi-eligible',
      clientId: 'client-eligible',
      clientName: 'Arbor & Vale LLC',
      state: 'CA',
      county: 'Los Angeles',
      entityType: 'llc' as const,
      taxType: 'federal_1065',
      currentDueDate: new Date('2026-03-15T00:00:00.000Z'),
      status: 'pending' as const,
      appliedAt: new Date('2026-04-15T18:30:00.000Z'),
      revertedAt: new Date('2026-04-15T19:00:00.000Z'),
      beforeDueDate: new Date('2026-03-15T00:00:00.000Z'),
      afterDueDate: new Date('2026-10-15T00:00:00.000Z'),
    }
    const { db, batchStatements } = fakeDb([
      [revertedAlert],
      [{ ...revertedAlert, alertStatus: 'matched' as const }],
      [ELIGIBLE],
      [],
      [revertedApplication],
      [],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    const result = await repo.reactivate({
      alertId: 'alert-1',
      userId: 'user-1',
      now: new Date('2026-04-15T19:10:00.000Z'),
    })

    expect(result.alert).toMatchObject({
      status: 'matched',
      matchedCount: 1,
      needsReviewCount: 0,
    })
    expect(
      batchStatements.some((statement) => statementHasValue(statement, { status: 'matched' })),
    ).toBe(true)
    expect(
      batchStatements.some((statement) =>
        statementHasValue(statement, { action: 'pulse.reactivate' }),
      ),
    ).toBe(true)
  })

  it('rejects revert when the active overlay no longer matches Pulse apply', async () => {
    const { db, batchStatements } = fakeDb([
      [ALERT],
      [
        {
          id: 'app-1',
          obligationId: 'oi-eligible',
          clientId: 'client-eligible',
          appliedAt: new Date('2026-04-15T18:30:00.000Z'),
          beforeDueDate: new Date('2026-03-15T00:00:00.000Z'),
          afterDueDate: new Date('2026-10-15T00:00:00.000Z'),
          currentDueDate: new Date('2026-03-15T00:00:00.000Z'),
        },
      ],
      [
        {
          id: 'oea-1',
          obligationId: 'oi-eligible',
          exceptionRuleId: 'exception-1',
          overrideDueDate: new Date('2026-10-16T00:00:00.000Z'),
        },
      ],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    await expect(
      repo.revert({
        alertId: 'alert-1',
        userId: 'user-1',
        now: new Date('2026-04-15T19:00:00.000Z'),
      }),
    ).rejects.toMatchObject({ code: 'conflict' } satisfies Partial<PulseRepoError>)
    expect(batchStatements).toHaveLength(0)
  })

  it('rejects revert after the 24h window expires', async () => {
    const { db, batchStatements } = fakeDb([
      [ALERT],
      [
        {
          id: 'app-1',
          obligationId: 'oi-eligible',
          clientId: 'client-eligible',
          appliedAt: new Date('2026-04-15T18:30:00.000Z'),
          beforeDueDate: new Date('2026-03-15T00:00:00.000Z'),
          afterDueDate: new Date('2026-10-15T00:00:00.000Z'),
        },
      ],
    ])
    const repo = makePulseRepo(db, 'firm-1')

    await expect(
      repo.revert({
        alertId: 'alert-1',
        userId: 'user-1',
        now: new Date('2026-04-16T18:30:01.000Z'),
      }),
    ).rejects.toMatchObject({ code: 'revert_expired' } satisfies Partial<PulseRepoError>)
    expect(batchStatements).toHaveLength(0)
  })
})

describe('makePulseOpsRepo', () => {
  it('does not write synthetic ops actor ids into user foreign keys', async () => {
    const approvedPulse = {
      id: 'pulse-approve',
      status: 'approved' as const,
      parsedForms: [],
      parsedEntityTypes: [],
    }
    const approveDb = fakeDb([[], [approvedPulse], [approvedPulse], []])
    await makePulseOpsRepo(approveDb.db).approvePulse({
      pulseId: 'pulse-approve',
      reviewedBy: 'ops-web',
    })

    const rejectDb = fakeDb([[{ id: 'pulse-reject', status: 'pending_review' }], [], []])
    await makePulseOpsRepo(rejectDb.db).rejectPulse({
      pulseId: 'pulse-reject',
      reviewedBy: 'ops-web',
    })

    const quarantineDb = fakeDb([[{ id: 'pulse-quarantine', status: 'pending_review' }], [], []])
    await makePulseOpsRepo(quarantineDb.db).quarantinePulse({
      pulseId: 'pulse-quarantine',
      actorId: 'ops-web',
    })

    const revokeDb = fakeDb([[], [{ id: 'pulse-revoke', status: 'approved' }], []])
    await makePulseOpsRepo(revokeDb.db).revokeSourcePulses({
      sourceId: 'irs.disaster',
      actorId: 'ops-web',
    })

    for (const statements of [
      approveDb.directStatements,
      rejectDb.directStatements,
      quarantineDb.directStatements,
      revokeDb.directStatements,
    ]) {
      expect(
        statements.find((statement) => statementHasValue(statement, { reviewedBy: null })),
      ).toBeTruthy()
    }
  })
})

function isKind(statement: unknown, kind: 'insert' | 'update'): boolean {
  return (
    typeof statement === 'object' &&
    statement !== null &&
    (statement as { kind?: string }).kind === kind
  )
}

function statementHasValue(statement: unknown, expected: Record<string, unknown>): boolean {
  if (typeof statement !== 'object' || statement === null) return false
  const value = (statement as { value?: unknown }).value
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.entries(expected).every(
    ([key, item]) => (value as Record<string, unknown>)[key] === item,
  )
}
