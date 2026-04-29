import { describe, expect, it } from 'vitest'
import { composeWorkloadLoad, type WorkloadRawRow } from './workload'

function row(over: Partial<WorkloadRawRow> = {}): WorkloadRawRow {
  return {
    obligationId: over.obligationId ?? crypto.randomUUID(),
    currentDueDate: over.currentDueDate ?? new Date('2026-04-15T00:00:00.000Z'),
    status: over.status ?? 'pending',
    assigneeName: 'assigneeName' in over ? (over.assigneeName ?? null) : 'Sarah',
  }
}

describe('composeWorkloadLoad', () => {
  it('aggregates open obligation pressure by assignee label', () => {
    const result = composeWorkloadLoad(
      [
        row({ assigneeName: 'Sarah', currentDueDate: new Date('2026-04-10T00:00:00.000Z') }),
        row({
          assigneeName: 'Sarah',
          status: 'waiting_on_client',
          currentDueDate: new Date('2026-04-20T00:00:00.000Z'),
        }),
        row({
          assigneeName: 'Jim',
          status: 'review',
          currentDueDate: new Date('2026-04-13T00:00:00.000Z'),
        }),
      ],
      { asOfDate: '2026-04-12', windowDays: 7 },
    )

    expect(result.summary).toEqual({
      open: 3,
      dueSoon: 1,
      overdue: 1,
      waiting: 1,
      review: 1,
      unassigned: 0,
    })
    expect(result.rows[0]).toMatchObject({ ownerLabel: 'Sarah', open: 2, loadScore: 100 })
    expect(result.rows[1]).toMatchObject({ ownerLabel: 'Jim', review: 1, loadScore: 50 })
  })

  it('keeps blank owner labels in the unassigned row', () => {
    const result = composeWorkloadLoad(
      [
        row({ assigneeName: null }),
        row({ assigneeName: '   ', currentDueDate: new Date('2026-04-11T00:00:00.000Z') }),
      ],
      { asOfDate: '2026-04-12', windowDays: 7 },
    )

    expect(result.summary.unassigned).toBe(2)
    expect(result.rows).toEqual([
      expect.objectContaining({
        id: 'unassigned',
        ownerLabel: 'Unassigned',
        kind: 'unassigned',
        open: 2,
        overdue: 1,
        loadScore: 100,
      }),
    ])
  })
})
