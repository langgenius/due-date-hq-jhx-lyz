import { describe, expect, it } from 'vitest'
import { applyDueDateOverlay, deriveOverlayDueDateMap } from './index'

describe('@duedatehq/core/overlay', () => {
  it('uses the latest active due-date overlay when present', () => {
    const base = new Date('2026-03-15T00:00:00.000Z')

    expect(
      applyDueDateOverlay(base, [
        {
          obligationId: 'obl_1',
          overrideDueDate: new Date('2026-06-15T00:00:00.000Z'),
          appliedAt: new Date('2026-04-20T00:00:00.000Z'),
        },
        {
          obligationId: 'obl_1',
          overrideDueDate: new Date('2026-10-15T00:00:00.000Z'),
          appliedAt: new Date('2026-04-21T00:00:00.000Z'),
        },
      ]),
    ).toEqual(new Date('2026-10-15T00:00:00.000Z'))
  })

  it('builds a latest-overlay map by obligation id', () => {
    const map = deriveOverlayDueDateMap([
      {
        obligationId: 'obl_1',
        overrideDueDate: new Date('2026-06-15T00:00:00.000Z'),
        appliedAt: new Date('2026-04-20T00:00:00.000Z'),
      },
      {
        obligationId: 'obl_2',
        overrideDueDate: new Date('2026-09-15T00:00:00.000Z'),
        appliedAt: new Date('2026-04-20T00:00:00.000Z'),
      },
      {
        obligationId: 'obl_1',
        overrideDueDate: new Date('2026-10-15T00:00:00.000Z'),
        appliedAt: new Date('2026-04-21T00:00:00.000Z'),
      },
    ])

    expect(map.get('obl_1')).toEqual(new Date('2026-10-15T00:00:00.000Z'))
    expect(map.get('obl_2')).toEqual(new Date('2026-09-15T00:00:00.000Z'))
  })
})
